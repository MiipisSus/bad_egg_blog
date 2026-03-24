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
  mode?: "draw" | "fill"  // "draw" = pen/eraser, "fill" = paint bucket
}

type Stroke =
  | { type: "draw"; points: { x: number; y: number }[]; color: string; radius: number }
  | { type: "fill"; x: number; y: number; color: string }

const MAX_HISTORY = 10

// ─── Flood Fill (Uint32 scanline + 1px dilation) ────────────────────
function parseColor(color: string): number {
  const tmp = document.createElement("canvas")
  tmp.width = tmp.height = 1
  const ctx = tmp.getContext("2d")!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const d = ctx.getImageData(0, 0, 1, 1).data
  // Pack as ABGR for little-endian Uint32Array
  return (d[3] << 24) | (d[2] << 16) | (d[1] << 8) | d[0]
}

function floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string, w: number, h: number, tolerance = 32) {
  const sx = Math.round(startX)
  const sy = Math.round(startY)
  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return

  const imageData = ctx.getImageData(0, 0, w, h)
  const buf32 = new Uint32Array(imageData.data.buffer)
  const data = imageData.data // still needed for per-channel tolerance check

  const fillPacked = parseColor(fillColor)
  const targetIdx = sy * w + sx
  const targetPacked = buf32[targetIdx]

  if (targetPacked === fillPacked) return

  // Extract target RGBA for tolerance comparison
  const tR = data[targetIdx * 4]
  const tG = data[targetIdx * 4 + 1]
  const tB = data[targetIdx * 4 + 2]
  const tA = data[targetIdx * 4 + 3]

  // Extract fill RGBA for dilation blending
  const fR = fillPacked & 0xff
  const fG = (fillPacked >> 8) & 0xff
  const fB = (fillPacked >> 16) & 0xff
  const fA = (fillPacked >> 24) & 0xff

  const total = w * h
  // 0=unvisited, 1=filled, 2=boundary (not matching)
  const state = new Uint8Array(total)

  function matches(idx: number): boolean {
    const i = idx * 4
    return (
      Math.abs(data[i] - tR) <= tolerance &&
      Math.abs(data[i + 1] - tG) <= tolerance &&
      Math.abs(data[i + 2] - tB) <= tolerance &&
      Math.abs(data[i + 3] - tA) <= tolerance
    )
  }

  // ── BFS scanline fill ──
  const queue: number[] = [sx, sy]  // flat pairs [x, y, x, y, ...]
  let qi = 0

  while (qi < queue.length) {
    const qx = queue[qi++]
    const qy = queue[qi++]
    const qIdx = qy * w + qx

    if (state[qIdx]) continue
    if (!matches(qIdx)) { state[qIdx] = 2; continue }

    // Scanline: expand left/right
    let left = qx
    let right = qx

    while (left > 0 && !state[qy * w + left - 1] && matches(qy * w + left - 1)) left--
    while (right < w - 1 && !state[qy * w + right + 1] && matches(qy * w + right + 1)) right++

    for (let x = left; x <= right; x++) {
      const idx = qy * w + x
      buf32[idx] = fillPacked
      state[idx] = 1

      if (qy > 0 && !state[idx - w]) { queue.push(x, qy - 1) }
      if (qy < h - 1 && !state[idx + w]) { queue.push(x, qy + 1) }
    }
  }

  // ── 1px dilation: fill anti-aliased edge pixels adjacent to filled area ──
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      if (state[idx] === 1) continue // already filled

      // Check 4-connected neighbors for any filled pixel
      const hasFilledNeighbor =
        (x > 0 && state[idx - 1] === 1) ||
        (x < w - 1 && state[idx + 1] === 1) ||
        (y > 0 && state[idx - w] === 1) ||
        (y < h - 1 && state[idx + w] === 1)

      if (!hasFilledNeighbor) continue

      // Blend: lerp toward fill color based on how close this pixel is to the target
      const i = idx * 4
      const dist = Math.max(
        Math.abs(data[i] - tR),
        Math.abs(data[i + 1] - tG),
        Math.abs(data[i + 2] - tB),
      )
      // Closer to target = more fill, farther = less fill (keeps line edges sharp)
      const blend = Math.max(0, 1 - dist / 255)
      data[i]     = Math.round(data[i]     + (fR - data[i]) * blend)
      data[i + 1] = Math.round(data[i + 1] + (fG - data[i + 1]) * blend)
      data[i + 2] = Math.round(data[i + 2] + (fB - data[i + 2]) * blend)
      data[i + 3] = Math.round(data[i + 3] + (fA - data[i + 3]) * blend)
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

// ─── Component ──────────────────────────────────────────────────────
export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  function DrawingCanvas({ width, height, brushColor, brushRadius, backgroundColor, mode = "draw" }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDrawing = useRef(false)
    const lastOutsideClient = useRef<{ x: number; y: number } | null>(null)

    // ── Cursor state ──
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)

    // ── Stroke data (the source of truth) ──
    const strokesRef = useRef<Stroke[]>([])
    const currentStrokeRef = useRef<Stroke | null>(null)

    // ── Undo/Redo: store stroke count snapshots ──
    const historyRef = useRef<number[]>([0])
    const redoStackRef = useRef<Stroke[]>([])
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // Keep brush props in refs for window listeners
    const brushColorRef = useRef(brushColor)
    const brushRadiusRef = useRef(brushRadius)
    const modeRef = useRef(mode)
    useEffect(() => { brushColorRef.current = brushColor }, [brushColor])
    useEffect(() => { brushRadiusRef.current = brushRadius }, [brushRadius])
    useEffect(() => { modeRef.current = mode }, [mode])

    const getCtx = useCallback(() => canvasRef.current?.getContext("2d") ?? null, [])

    // ── Replay a single stroke onto ctx ──
    const replayStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
      if (stroke.type === "fill") {
        floodFill(ctx, stroke.x, stroke.y, stroke.color, width, height)
        return
      }
      // type === "draw"
      if (stroke.points.length === 0) return
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
    }, [width, height])

    // ── Render everything from stroke data ──
    const render = useCallback(() => {
      const ctx = getCtx()
      if (!ctx) return

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)

      const allStrokes = [...strokesRef.current]
      if (currentStrokeRef.current) allStrokes.push(currentStrokeRef.current)

      for (const stroke of allStrokes) {
        replayStroke(ctx, stroke)
      }
    }, [getCtx, width, height, backgroundColor, replayStroke])

    useEffect(() => { render() }, [render])

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

    // ── Cursor position relative to container ──
    const toCursorPos = useCallback((clientX: number, clientY: number) => {
      const container = containerRef.current
      if (!container) return null
      const rect = container.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) return null
      return { x, y }
    }, [])

    // ── Draw the latest segment incrementally ──
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

    // ── Commit stroke to history ──
    const commitStroke = useCallback((stroke: Stroke) => {
      strokesRef.current.push(stroke)
      historyRef.current.push(strokesRef.current.length)
      if (historyRef.current.length > MAX_HISTORY + 1) historyRef.current.shift()
      redoStackRef.current = []
      setCanUndo(historyRef.current.length > 1)
      setCanRedo(false)
    }, [])

    // ── Pointer down ──
    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault()

      const point = toCanvasPoint(e.clientX, e.clientY)
      if (!point) return

      if (modeRef.current === "fill") {
        // Paint bucket: immediate flood fill
        const ctx = getCtx()
        if (!ctx) return
        floodFill(ctx, point.x, point.y, brushColorRef.current, width, height)
        commitStroke({ type: "fill", x: point.x, y: point.y, color: brushColorRef.current })
        return
      }

      // Draw mode
      isDrawing.current = true
      lastOutsideClient.current = null

      currentStrokeRef.current = {
        type: "draw",
        points: [point],
        color: brushColorRef.current,
        radius: brushRadiusRef.current,
      }

      const ctx = getCtx()
      if (ctx) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, brushRadiusRef.current, 0, Math.PI * 2)
        ctx.fillStyle = brushColorRef.current
        ctx.fill()
      }
    }, [toCanvasPoint, getCtx, width, height, commitStroke])

    // ── Pointer move (window): track stroke + cursor ──
    useEffect(() => {
      const handleMove = (e: PointerEvent) => {
        // Update cursor position
        const cp = toCursorPos(e.clientX, e.clientY)
        setCursorPos(cp)

        if (!isDrawing.current || !currentStrokeRef.current || currentStrokeRef.current.type !== "draw") return

        const point = toCanvasPoint(e.clientX, e.clientY)

        if (point === null) {
          const pts = currentStrokeRef.current.points
          if (pts.length > 0) {
            const edgePoint = toClampedPoint(e.clientX, e.clientY)
            drawSegment(pts[pts.length - 1], edgePoint)
            currentStrokeRef.current.points.push(edgePoint)
          }
          lastOutsideClient.current = { x: e.clientX, y: e.clientY }
          return
        }

        const pts = currentStrokeRef.current.points
        if (lastOutsideClient.current) {
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
    }, [toCanvasPoint, toClampedPoint, toCursorPos, drawSegment])

    // ── Pointer up (window) ──
    useEffect(() => {
      const handleUp = () => {
        if (!isDrawing.current) return
        isDrawing.current = false
        lastOutsideClient.current = null

        if (currentStrokeRef.current && currentStrokeRef.current.type === "draw" && currentStrokeRef.current.points.length > 0) {
          commitStroke(currentStrokeRef.current)
          currentStrokeRef.current = null
        }
      }

      window.addEventListener("pointerup", handleUp)
      return () => window.removeEventListener("pointerup", handleUp)
    }, [commitStroke])

    // ── Undo ──
    const undo = useCallback(() => {
      if (historyRef.current.length <= 1) return
      historyRef.current.pop()
      const targetLen = historyRef.current[historyRef.current.length - 1]
      while (strokesRef.current.length > targetLen) {
        redoStackRef.current.push(strokesRef.current.pop()!)
      }
      setCanUndo(historyRef.current.length > 1)
      setCanRedo(true)
      render()
    }, [render])

    // ── Redo ──
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

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)

      for (const stroke of strokesRef.current) {
        replayStroke(ctx, stroke)
      }

      return tempCanvas.toDataURL("image/png")
    }, [width, height, replayStroke])

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

    // ── Cursor circle size (display pixels, not canvas pixels) ──
    const cursorDisplaySize = (() => {
      const canvas = canvasRef.current
      if (!canvas) return brushRadius * 2
      const rect = canvas.getBoundingClientRect()
      const scale = rect.width / width
      return brushRadius * 2 * scale
    })()

    return (
      <div
        ref={containerRef}
        className="relative"
        onMouseLeave={() => setCursorPos(null)}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block w-full"
          style={{
            touchAction: "none",
            aspectRatio: `${width}/${height}`,
            cursor: mode === "fill" ? "crosshair" : "none",
          }}
          onPointerDown={handlePointerDown}
        />
        {/* Custom cursor circle for pen/eraser — double ring for visibility on any background */}
        {mode === "draw" && cursorPos && (
          <div
            className="pointer-events-none absolute rounded-full"
            style={{
              width: cursorDisplaySize,
              height: cursorDisplaySize,
              left: cursorPos.x - cursorDisplaySize / 2,
              top: cursorPos.y - cursorDisplaySize / 2,
              boxShadow: "0 0 0 1px rgba(255,255,255,0.8), 0 0 0 2px rgba(0,0,0,0.5)",
            }}
          />
        )}
      </div>
    )
  }
)
