import { WebSocketServer, WebSocket } from "ws"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

const PORT = 3001
const CANVAS_W = 200
const CANVAS_H = 200
const PIXEL_COUNT = CANVAS_W * CANVAS_H
const DATA_FILE = join(__dirname, "canvas-data.bin")

// 3 bytes per pixel (R, G, B) — no alpha needed
const canvasData = new Uint8Array(PIXEL_COUNT * 3)

// Initialize: white background
function initCanvas() {
  if (existsSync(DATA_FILE)) {
    const saved = readFileSync(DATA_FILE)
    if (saved.length === canvasData.length) {
      canvasData.set(saved)
      console.log(`Loaded canvas state from ${DATA_FILE}`)
      return
    }
  }
  canvasData.fill(255) // all white
  console.log("Initialized fresh canvas (200x200)")
}

// Periodic save
function saveCanvas() {
  writeFileSync(DATA_FILE, canvasData)
}

initCanvas()
setInterval(saveCanvas, 30000) // save every 30s

const wss = new WebSocketServer({ host: "0.0.0.0", port: PORT })
const clients = new Set<WebSocket>()

wss.on("connection", (ws) => {
  clients.add(ws)
  console.log(`Client connected (total: ${clients.size})`)

  // Send full canvas state on connect
  // Format: [type=0 (init), width(2 bytes), height(2 bytes), ...pixelData]
  const header = Buffer.alloc(5)
  header[0] = 0 // type: init
  header.writeUInt16BE(CANVAS_W, 1)
  header.writeUInt16BE(CANVAS_H, 3)
  const initBuf = Buffer.concat([header, Buffer.from(canvasData)])
  ws.send(initBuf)

  ws.on("message", (raw) => {
    const msg = raw as Buffer
    if (msg.length < 1) return

    const type = msg[0]

    if (type === 1) {
      // Pixel update: [type=1, x(2), y(2), r, g, b]
      if (msg.length < 8) return
      const x = msg.readUInt16BE(1)
      const y = msg.readUInt16BE(3)
      const r = msg[5], g = msg[6], b = msg[7]

      if (x >= CANVAS_W || y >= CANVAS_H) return

      const idx = (y * CANVAS_W + x) * 3
      canvasData[idx] = r
      canvasData[idx + 1] = g
      canvasData[idx + 2] = b

      // Broadcast to ALL clients (including sender for confirmation)
      const broadcast = Buffer.alloc(8)
      broadcast[0] = 1
      broadcast.writeUInt16BE(x, 1)
      broadcast.writeUInt16BE(y, 3)
      broadcast[5] = r
      broadcast[6] = g
      broadcast[7] = b

      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(broadcast)
        }
      }
    }
  })

  ws.on("close", () => {
    clients.delete(ws)
    console.log(`Client disconnected (total: ${clients.size})`)
  })
})

console.log(`WebSocket server running on ws://localhost:${PORT}`)

// Graceful shutdown
process.on("SIGINT", () => {
  saveCanvas()
  console.log("Canvas saved. Shutting down.")
  process.exit(0)
})
