"use client"

import { useRef, useEffect, useState, useCallback } from "react"

// Use current hostname so mobile/LAN devices can connect
const WS_URL = typeof window !== "undefined"
  ? `ws://${window.location.hostname}:3001`
  : "ws://localhost:3001"

const PALETTE = [
  "#FFFFFF", "#E4E4E4", "#888888", "#222222",
  "#FFA7D1", "#E50000", "#E59500", "#A06A42",
  "#E5D900", "#94E044", "#02BE01", "#00D3DD",
  "#0083C7", "#0000EA", "#CF6EE4", "#820080",
]

interface ViewTransform {
  x: number  // pan offset in screen px
  y: number
  scale: number
}

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pixelDataRef = useRef<Uint8Array | null>(null)
  const canvasSizeRef = useRef({ w: 0, h: 0 })
  const viewRef = useRef<ViewTransform>({ x: 0, y: 0, scale: 4 })
  const containerRef = useRef<HTMLDivElement>(null)
  const dprRef = useRef(1)
  const isPanningRef = useRef(false)
  const isDrawingRef = useRef(false)
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const spaceDownRef = useRef(false)
  const rafRef = useRef<number>(0)
  const dirtyRef = useRef(true)

  const [connected, setConnected] = useState(false)
  const [selectedColor, setSelectedColor] = useState(3) // black
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null)
  const [onlineCount, setOnlineCount] = useState(0)

  // ─── Full canvas redraw ───
  const drawFullCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const data = pixelDataRef.current
    if (!canvas || !data) return

    const ctx = canvas.getContext("2d")!
    const { w, h } = canvasSizeRef.current
    const view = viewRef.current
    const dpr = dprRef.current

    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.translate(view.x, view.y)
    ctx.scale(view.scale, view.scale)

    // Create ImageData from pixel buffer
    const imgData = ctx.createImageData(w, h)
    for (let i = 0; i < w * h; i++) {
      imgData.data[i * 4] = data[i * 3]
      imgData.data[i * 4 + 1] = data[i * 3 + 1]
      imgData.data[i * 4 + 2] = data[i * 3 + 2]
      imgData.data[i * 4 + 3] = 255
    }

    // Draw to offscreen then scale
    const offscreen = new OffscreenCanvas(w, h)
    const offCtx = offscreen.getContext("2d")!
    offCtx.putImageData(imgData, 0, 0)
    ctx.drawImage(offscreen, 0, 0)

    // Grid lines when zoomed in enough
    if (view.scale >= 8) {
      ctx.strokeStyle = "rgba(0,0,0,0.08)"
      ctx.lineWidth = 1 / view.scale
      for (let x = 0; x <= w; x++) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y <= h; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
    }

    ctx.restore()
  }, [])

  // ─── Render loop (only when dirty) ───
  useEffect(() => {
    function loop() {
      if (dirtyRef.current) {
        drawFullCanvas()
        dirtyRef.current = false
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [drawFullCanvas])

  // ─── Resize canvas with DPR ───
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const dpr = window.devicePixelRatio || 1
      dprRef.current = dpr

      const rect = container.getBoundingClientRect()
      const cssW = rect.width
      const cssH = rect.height

      // Set drawing buffer size (sharp on Retina)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)

      // Set CSS display size
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`

      dirtyRef.current = true
    }
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])

  // ─── WebSocket connection ───
  useEffect(() => {
    let disposed = false

    function connect() {
      if (disposed) return
      const ws = new WebSocket(WS_URL)
      ws.binaryType = "arraybuffer"
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onerror = () => { /* onclose handles reconnect */ }
      ws.onclose = () => {
        setConnected(false)
        if (!disposed) setTimeout(connect, 2000)
      }

      ws.onmessage = (event) => {
        const buf = new Uint8Array(event.data as ArrayBuffer)
        const type = buf[0]

        if (type === 0) {
          // Init: full canvas state — COPY the data, don't reference the buffer
          const w = (buf[1] << 8) | buf[2]
          const h = (buf[3] << 8) | buf[4]
          canvasSizeRef.current = { w, h }
          pixelDataRef.current = new Uint8Array(buf.slice(5))

          // Center canvas using CSS dimensions
          const canvas = canvasRef.current
          if (canvas) {
            const rect = canvas.getBoundingClientRect()
            const scale = viewRef.current.scale
            viewRef.current.x = (rect.width - w * scale) / 2
            viewRef.current.y = (rect.height - h * scale) / 2
          }
          dirtyRef.current = true
        } else if (type === 1) {
          // Single pixel update
          const x = (buf[1] << 8) | buf[2]
          const y = (buf[3] << 8) | buf[4]
          const r = buf[5], g = buf[6], b = buf[7]

          const data = pixelDataRef.current
          if (!data) return
          const { w } = canvasSizeRef.current
          const idx = (y * w + x) * 3
          data[idx] = r
          data[idx + 1] = g
          data[idx + 2] = b
          dirtyRef.current = true
        }
      }
    }

    connect()
    return () => { disposed = true; wsRef.current?.close() }
  }, [])

  // ─── Screen coords → pixel coords ───
  const screenToPixel = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    // Convert client coords to CSS-space coords relative to canvas
    const sx = clientX - rect.left
    const sy = clientY - rect.top
    const view = viewRef.current
    const { w, h } = canvasSizeRef.current
    const px = Math.floor((sx - view.x) / view.scale)
    const py = Math.floor((sy - view.y) / view.scale)
    if (px < 0 || py < 0 || px >= w || py >= h) return null
    return { x: px, y: py }
  }, [])

  // ─── Send pixel to server ───
  const sendPixel = useCallback((x: number, y: number, color: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    // Parse hex color
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)

    const buf = new Uint8Array(8)
    buf[0] = 1 // type: pixel
    buf[1] = (x >> 8) & 0xff
    buf[2] = x & 0xff
    buf[3] = (y >> 8) & 0xff
    buf[4] = y & 0xff
    buf[5] = r
    buf[6] = g
    buf[7] = b

    ws.send(buf)
  }, [])

  // ─── Bresenham line: send all pixels between two points ───
  const drawLine = useCallback((x0: number, y0: number, x1: number, y1: number, color: string) => {
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    let cx = x0, cy = y0

    while (true) {
      sendPixel(cx, cy, color)
      if (cx === x1 && cy === y1) break
      const e2 = 2 * err
      if (e2 > -dy) { err -= dy; cx += sx }
      if (e2 < dx) { err += dx; cy += sy }
    }
  }, [sendPixel])

  // ─── Mouse handlers ───
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || spaceDownRef.current) {
      isPanningRef.current = true
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
      return
    }

    if (e.button === 0 && !spaceDownRef.current) {
      const pixel = screenToPixel(e.clientX, e.clientY)
      if (pixel) {
        sendPixel(pixel.x, pixel.y, PALETTE[selectedColor])
        isDrawingRef.current = true
        lastPixelRef.current = pixel
      }
    }
  }, [screenToPixel, sendPixel, selectedColor])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current) {
      const dx = e.clientX - lastMouseRef.current.x
      const dy = e.clientY - lastMouseRef.current.y
      viewRef.current.x += dx
      viewRef.current.y += dy
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
      dirtyRef.current = true
      return
    }

    const pixel = screenToPixel(e.clientX, e.clientY)
    setHoverCoord(pixel)

    // Drag drawing: interpolate line from last pixel to current
    if (isDrawingRef.current && pixel && lastPixelRef.current) {
      const last = lastPixelRef.current
      if (pixel.x !== last.x || pixel.y !== last.y) {
        drawLine(last.x, last.y, pixel.x, pixel.y, PALETTE[selectedColor])
        lastPixelRef.current = pixel
      }
    }
  }, [screenToPixel, drawLine, selectedColor])

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false
    isDrawingRef.current = false
    lastPixelRef.current = null
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const view = viewRef.current
    const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    const newScale = Math.min(80, Math.max(1, view.scale * zoomFactor))

    // Zoom toward cursor (in CSS-space relative to canvas)
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    view.x = mx - (mx - view.x) * (newScale / view.scale)
    view.y = my - (my - view.y) * (newScale / view.scale)
    view.scale = newScale

    dirtyRef.current = true
  }, [])

  // ─── Keyboard: space for pan mode ───
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space") { spaceDownRef.current = true; e.preventDefault() }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") { spaceDownRef.current = false }
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center bg-neutral-900 py-8">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className={`rounded-full px-3 py-1 text-xs font-medium ${connected ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"}`}>
          {connected ? "Connected" : "Reconnecting..."}
        </div>
        {hoverCoord && (
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            ({hoverCoord.x}, {hoverCoord.y})
          </div>
        )}
      </div>

      {/* Canvas container — 90% width, 600px height */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border border-white/10"
        style={{ width: "90vw", maxWidth: "1400px", height: "600px" }}
      >
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 ${spaceDownRef.current || isPanningRef.current ? "cursor-grab" : "cursor-crosshair"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Color palette */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5 rounded-xl bg-white/5 p-3">
        {PALETTE.map((color, i) => (
          <button
            key={color}
            onClick={() => setSelectedColor(i)}
            className={`h-8 w-8 cursor-pointer rounded-md border-2 transition-transform ${
              selectedColor === i ? "scale-110 border-white shadow-lg" : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Help */}
      <div className="mt-3 text-center text-xs text-white/40">
        Click/drag to draw · Scroll to zoom · Space + drag to pan
      </div>
    </div>
  )
}
