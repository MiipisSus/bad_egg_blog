"use client"

import { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react"

// ─── Types ──────────────────────────────────────────────────────────
export interface DrawingCanvasRef {
  clear: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  getDataURL: (bgColor: string) => string
}

interface DrawingCanvasProps {
  width: number
  height: number
  brushColor: string
  brushRadius: number
  backgroundColor: string
}

interface Stroke {
  points: { x: number; y: number }[]
  color: string
  radius: number
}

const MAX_HISTORY = 10

// ─── Component ──────────────────────────────────────────────────────
export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  function DrawingCanvas({ width, height, brushColor, brushRadius, backgroundColor }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)
    const lastOutsideClient = useRef<{ x: number; y: number } | null>(null)

    // ── Stroke data (the source of truth) ──
    const strokesRef = useRef<Stroke[]>([])
    const currentStrokeRef = useRef<Stroke | null>(null)

    // ── Undo/Redo: store stroke count snapshots ──
    const historyRef = useRef<number[]>([0]) // [0] = initial empty state
    const redoStackRef = useRef<Stroke[]>([]) // strokes removed by undo
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // Keep brush props in refs for window listeners
    const brushColorRef = useRef(brushColor)
    const brushRadiusRef = useRef(brushRadius)
    useEffect(() => { brushColorRef.current = brushColor }, [brushColor])
    useEffect(() => { brushRadiusRef.current = brushRadius }, [brushRadius])

    const getCtx = useCallback(() => canvasRef.current?.getContext("2d") ?? null, [])

    // ── Render everything from stroke data ──
    const render = useCallback(() => {
      const ctx = getCtx()
      if (!ctx) return

      // 1. Clear
      ctx.clearRect(0, 0, width, height)

      // 2. Background layer
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)

      // 3. Drawing layer: replay all strokes
      const allStrokes = [...strokesRef.current]
      if (currentStrokeRef.current) allStrokes.push(currentStrokeRef.current)

      for (const stroke of allStrokes) {
        if (stroke.points.length === 0) continue

        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.radius * 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        if (stroke.points.length === 1) {
          // Single dot
          ctx.beginPath()
          ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.radius, 0, Math.PI * 2)
          ctx.fillStyle = stroke.color
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
          }
          ctx.stroke()
        }
      }
    }, [getCtx, width, height, backgroundColor])

    // Re-render when backgroundColor changes
    useEffect(() => {
      render()
    }, [render])

    // ── Coordinate helpers ──
    const toCanvasPoint = useCallback((clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const scaleX = width / rect.width
      const scaleY = height / rect.height
      const x = (clientX - rect.left) * scaleX
      const y = (clientY - rect.top) * scaleY
      if (x < 0 || x > width || y < 0 || y > height) return null
      return { x, y }
    }, [width, height])

    const toClampedPoint = useCallback((clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const scaleX = width / rect.width
      const scaleY = height / rect.height
      return {
        x: Math.max(0, Math.min((clientX - rect.left) * scaleX, width)),
        y: Math.max(0, Math.min((clientY - rect.top) * scaleY, height)),
      }
    }, [width, height])

    // ── Draw the latest segment incrementally (for performance during active drawing) ──
    const drawSegment = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
      const ctx = getCtx()
      if (!ctx) return
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.strokeStyle = brushColorRef.current
      ctx.lineWidth = brushRadiusRef.current * 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.stroke()
    }, [getCtx])

    // ── Pointer down: start new stroke ──
    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      isDrawing.current = true
      lastOutsideClient.current = null

      const point = toCanvasPoint(e.clientX, e.clientY)
      if (!point) return

      currentStrokeRef.current = {
        points: [point],
        color: brushColorRef.current,
        radius: brushRadiusRef.current,
      }

      // Draw dot immediately
      const ctx = getCtx()
      if (ctx) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, brushRadiusRef.current, 0, Math.PI * 2)
        ctx.fillStyle = brushColorRef.current
        ctx.fill()
      }
    }, [toCanvasPoint, getCtx])

    // ── Pointer move (window): track stroke ──
    useEffect(() => {
      const handleMove = (e: PointerEvent) => {
        if (!isDrawing.current || !currentStrokeRef.current) return

        const point = toCanvasPoint(e.clientX, e.clientY)

        if (point === null) {
          // Exiting: draw to clamped edge
          const pts = currentStrokeRef.current.points
          if (pts.length > 0) {
            const edgePoint = toClampedPoint(e.clientX, e.clientY)
            drawSegment(pts[pts.length - 1], edgePoint)
            currentStrokeRef.current.points.push(edgePoint)
          }
          lastOutsideClient.current = { x: e.clientX, y: e.clientY }
          return
        }

        // Inside canvas
        const pts = currentStrokeRef.current.points
        if (lastOutsideClient.current) {
          // Re-entering: draw from edge to current point
          const edgePoint = toClampedPoint(lastOutsideClient.current.x, lastOutsideClient.current.y)
          currentStrokeRef.current.points.push(edgePoint)
          drawSegment(edgePoint, point)
          lastOutsideClient.current = null
        } else if (pts.length > 0) {
          drawSegment(pts[pts.length - 1], point)
        }

        currentStrokeRef.current.points.push(point)
      }

      window.addEventListener("pointermove", handleMove)
      return () => window.removeEventListener("pointermove", handleMove)
    }, [toCanvasPoint, toClampedPoint, drawSegment])

    // ── Pointer up (window): finish stroke ──
    useEffect(() => {
      const handleUp = () => {
        if (!isDrawing.current) return
        isDrawing.current = false
        lastOutsideClient.current = null

        if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
          strokesRef.current.push(currentStrokeRef.current)
          currentStrokeRef.current = null

          // Save history
          historyRef.current.push(strokesRef.current.length)
          if (historyRef.current.length > MAX_HISTORY + 1) historyRef.current.shift()
          redoStackRef.current = []
          setCanUndo(historyRef.current.length > 1)
          setCanRedo(false)
        }
      }

      window.addEventListener("pointerup", handleUp)
      return () => window.removeEventListener("pointerup", handleUp)
    }, [])

    // ── Undo: remove last stroke ──
    const undo = useCallback(() => {
      if (historyRef.current.length <= 1) return
      historyRef.current.pop()
      const targetLen = historyRef.current[historyRef.current.length - 1]
      // Move removed strokes to redo stack
      while (strokesRef.current.length > targetLen) {
        redoStackRef.current.push(strokesRef.current.pop()!)
      }
      setCanUndo(historyRef.current.length > 1)
      setCanRedo(true)
      render()
    }, [render])

    // ── Redo: restore last undone stroke ──
    const redo = useCallback(() => {
      if (redoStackRef.current.length === 0) return
      strokesRef.current.push(redoStackRef.current.pop()!)
      historyRef.current.push(strokesRef.current.length)
      setCanUndo(historyRef.current.length > 1)
      setCanRedo(redoStackRef.current.length > 0)
      render()
    }, [render])

    // ── Clear ──
    const clear = useCallback(() => {
      strokesRef.current = []
      currentStrokeRef.current = null
      historyRef.current = [0]
      redoStackRef.current = []
      setCanUndo(false)
      setCanRedo(false)
      render()
    }, [render])

    // ── Export ──
    const getDataURL = useCallback((bgColor: string) => {
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = width
      tempCanvas.height = height
      const ctx = tempCanvas.getContext("2d")
      if (!ctx) return ""

      // Background
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)

      // Replay strokes
      for (const stroke of strokesRef.current) {
        if (stroke.points.length === 0) continue
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.radius * 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        if (stroke.points.length === 1) {
          ctx.beginPath()
          ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.radius, 0, Math.PI * 2)
          ctx.fillStyle = stroke.color
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
          }
          ctx.stroke()
        }
      }

      return tempCanvas.toDataURL("image/png")
    }, [width, height])

    // ── Keyboard shortcuts ──
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
          e.preventDefault()
          undo()
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
          e.preventDefault()
          redo()
        }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [undo, redo])

    // ── Expose ref ──
    useImperativeHandle(ref, () => ({
      clear,
      undo,
      redo,
      canUndo,
      canRedo,
      getDataURL,
    }), [clear, undo, redo, canUndo, canRedo, getDataURL])

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block w-full cursor-crosshair"
        style={{ touchAction: "none", aspectRatio: `${width}/${height}` }}
        onPointerDown={handlePointerDown}
      />
    )
  }
)
