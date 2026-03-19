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

const MAX_HISTORY = 10

// ─── Component ──────────────────────────────────────────────────────
export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  function DrawingCanvas({ width, height, brushColor, brushRadius, backgroundColor }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)
    const lastPoint = useRef<{ x: number; y: number } | null>(null)
    const lastOutsideClient = useRef<{ x: number; y: number } | null>(null)

    // Keep brushColor/brushRadius in refs so window listeners always read latest
    const brushColorRef = useRef(brushColor)
    const brushRadiusRef = useRef(brushRadius)
    useEffect(() => { brushColorRef.current = brushColor }, [brushColor])
    useEffect(() => { brushRadiusRef.current = brushRadius }, [brushRadius])

    // History for undo/redo
    const historyRef = useRef<ImageData[]>([])
    const redoStackRef = useRef<ImageData[]>([])
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    const getCtx = useCallback(() => canvasRef.current?.getContext("2d") ?? null, [])

    const saveState = useCallback(() => {
      const ctx = getCtx()
      if (!ctx) return
      const data = ctx.getImageData(0, 0, width, height)
      historyRef.current.push(data)
      if (historyRef.current.length > MAX_HISTORY + 1) historyRef.current.shift()
      redoStackRef.current = []
      setCanUndo(historyRef.current.length > 1)
      setCanRedo(false)
    }, [getCtx, width, height])

    const fillBackground = useCallback(() => {
      const ctx = getCtx()
      if (!ctx) return
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
    }, [getCtx, backgroundColor, width, height])

    // Init
    useEffect(() => {
      fillBackground()
      const ctx = getCtx()
      if (ctx) {
        historyRef.current = [ctx.getImageData(0, 0, width, height)]
        setCanUndo(false)
        setCanRedo(false)
      }
    }, [fillBackground, getCtx, width, height])

    // Convert client coords to canvas coords; null if outside
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

    // Same as above but clamped to edge (for exit compensation)
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

    const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
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

    // ── Pointer down on canvas: start drawing ──
    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      isDrawing.current = true
      const point = toCanvasPoint(e.clientX, e.clientY)
      if (!point) return
      lastPoint.current = point

      // Draw a dot for single click
      const ctx = getCtx()
      if (ctx) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, brushRadiusRef.current, 0, Math.PI * 2)
        ctx.fillStyle = brushColorRef.current
        ctx.fill()
      }
    }, [toCanvasPoint, getCtx])

    // ── Window pointermove ──
    useEffect(() => {
      const handleMove = (e: PointerEvent) => {
        if (!isDrawing.current) return

        const point = toCanvasPoint(e.clientX, e.clientY)

        if (point === null) {
          // Outside canvas: draw to edge on first exit, then track outside position
          if (lastPoint.current) {
            const edgePoint = toClampedPoint(e.clientX, e.clientY)
            drawLine(lastPoint.current, edgePoint)
            lastPoint.current = null
          }
          lastOutsideClient.current = { x: e.clientX, y: e.clientY }
          return
        }

        // Inside canvas
        if (lastPoint.current) {
          // Normal drawing
          drawLine(lastPoint.current, point)
        } else if (lastOutsideClient.current) {
          // Just re-entered: use last outside coords to find the edge entry point
          const edgePoint = toClampedPoint(lastOutsideClient.current.x, lastOutsideClient.current.y)
          drawLine(edgePoint, point)
          lastOutsideClient.current = null
        }
        lastPoint.current = point
      }

      window.addEventListener("pointermove", handleMove)
      return () => window.removeEventListener("pointermove", handleMove)
    }, [toCanvasPoint, toClampedPoint, drawLine])

    // ── Window pointerup: stop drawing anywhere ──
    useEffect(() => {
      const handleUp = () => {
        if (!isDrawing.current) return
        isDrawing.current = false
        lastPoint.current = null
        saveState()
      }

      window.addEventListener("pointerup", handleUp)
      return () => window.removeEventListener("pointerup", handleUp)
    }, [saveState])


    // Undo
    const undo = useCallback(() => {
      const ctx = getCtx()
      if (!ctx || historyRef.current.length <= 1) return
      const current = historyRef.current.pop()!
      redoStackRef.current.push(current)
      if (redoStackRef.current.length > MAX_HISTORY) redoStackRef.current.shift()
      const prev = historyRef.current[historyRef.current.length - 1]
      ctx.putImageData(prev, 0, 0)
      setCanUndo(historyRef.current.length > 1)
      setCanRedo(true)
    }, [getCtx])

    // Redo
    const redo = useCallback(() => {
      const ctx = getCtx()
      if (!ctx || redoStackRef.current.length === 0) return
      const next = redoStackRef.current.pop()!
      historyRef.current.push(next)
      ctx.putImageData(next, 0, 0)
      setCanUndo(historyRef.current.length > 1)
      setCanRedo(redoStackRef.current.length > 0)
    }, [getCtx])

    // Clear
    const clear = useCallback(() => {
      fillBackground()
      saveState()
    }, [fillBackground, saveState])

    // Get data URL
    const getDataURL = useCallback((bgColor: string) => {
      const canvas = canvasRef.current
      if (!canvas) return ""
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) return ""
      tempCtx.fillStyle = bgColor
      tempCtx.fillRect(0, 0, width, height)
      tempCtx.drawImage(canvas, 0, 0)
      return tempCanvas.toDataURL("image/png")
    }, [width, height])

    // Keyboard shortcuts
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
