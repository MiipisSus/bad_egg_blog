"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Eraser, Check, X, ChevronLeft, ChevronRight, Undo2, Redo2, Pipette, PaintBucket, Menu, MessageCircle } from "lucide-react"
import Link from "next/link"
import { DrawingCanvas, type DrawingCanvasRef } from "./drawing-canvas"

// ─── Types ──────────────────────────────────────────────────────────
type NoteShape = "square" | "circle" | "heart"
type NoteType = "drawing" | "bubble"

interface StickyNote {
  id: number
  image: string
  author: string
  color: string
  position: { x: number; y: number }
  zIndex: number
  page: number
  shape: NoteShape
  noteType: NoteType
  text: string | null
  visitorId: string
  createdAt: number
}

// ─── Shape clip-paths ───────────────────────────────────────────────
const SHAPE_CLIPS: Record<NoteShape, string | undefined> = {
  square: undefined,
  circle: "circle(50% at 50% 50%)",
  heart: "url(#heart-clip)",
}

// Heart SVG path (from heart.svg 122.88x107.41, normalized to objectBoundingBox)
const HEART_SVG_PATH = "M 0.4950,0.1600 C 0.5602,0.0823 0.6059,0.0151 0.7063,0.0020 C 0.8949,-0.0228 1.0683,0.1980 0.9731,0.4154 C 0.9460,0.4773 0.8908,0.5510 0.8298,0.6232 C 0.7628,0.7025 0.6886,0.7803 0.6367,0.8392 L 0.4951,0.9999 L 0.3781,0.8711 C 0.2373,0.7159 0.0077,0.5207 0.0002,0.2788 C -0.0051,0.1094 0.1117,0.0008 0.2462,0.0028 C 0.3663,0.0047 0.4168,0.0730 0.4950,0.1600 Z"

// Heart path for canvas clipping (pixel coords, same normalized data)
function heartPath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath()
  ctx.moveTo(0.4950*w, 0.1600*h)
  ctx.bezierCurveTo(0.5602*w, 0.0823*h, 0.6059*w, 0.0151*h, 0.7063*w, 0.0020*h)
  ctx.bezierCurveTo(0.8949*w, -0.0228*h, 1.0683*w, 0.1980*h, 0.9731*w, 0.4154*h)
  ctx.bezierCurveTo(0.9460*w, 0.4773*h, 0.8908*w, 0.5510*h, 0.8298*w, 0.6232*h)
  ctx.bezierCurveTo(0.7628*w, 0.7025*h, 0.6886*w, 0.7803*h, 0.6367*w, 0.8392*h)
  ctx.lineTo(0.4951*w, 0.9999*h)
  ctx.lineTo(0.3781*w, 0.8711*h)
  ctx.bezierCurveTo(0.2373*w, 0.7159*h, 0.0077*w, 0.5207*h, 0.0002*w, 0.2788*h)
  ctx.bezierCurveTo(-0.0051*w, 0.1094*h, 0.1117*w, 0.0008*h, 0.2462*w, 0.0028*h)
  ctx.bezierCurveTo(0.3663*w, 0.0047*h, 0.4168*w, 0.0730*h, 0.4950*w, 0.1600*h)
  ctx.closePath()
}

// Clip canvas output to shape, returns PNG blob
async function applyShapeClip(dataUrl: string, shape: NoteShape): Promise<Blob> {
  if (shape === "square") {
    const res = await fetch(dataUrl)
    return res.blob()
  }

  // Heart aspect ratio from SVG: 645:585
  const HEART_RATIO = 645 / 585

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const srcW = img.width
      const srcH = img.height
      // For heart: output is wider than tall
      const outW = shape === "heart" ? srcW : srcW
      const outH = shape === "heart" ? Math.round(srcW / HEART_RATIO) : srcH
      const canvas = document.createElement("canvas")
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext("2d")!

      // Apply clip path
      ctx.save()
      if (shape === "circle") {
        ctx.beginPath()
        ctx.arc(outW / 2, outH / 2, Math.min(outW, outH) / 2, 0, Math.PI * 2)
        ctx.closePath()
      } else if (shape === "heart") {
        heartPath(ctx, outW, outH)
      }
      ctx.clip()
      // Draw source centered/scaled to fit
      ctx.drawImage(img, 0, 0, srcW, srcH, 0, 0, outW, outH)
      ctx.restore()

      canvas.toBlob((blob) => resolve(blob!), "image/png")
    }
    img.src = dataUrl
  })
}

// ─── Visitor ID ─────────────────────────────────────────────────────
function getVisitorId(): string {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem("guestbook_visitor_id")
  if (!id) {
    id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
    })
    localStorage.setItem("guestbook_visitor_id", id)
  }
  return id
}

// ─── Constants ──────────────────────────────────────────────────────
const PAGE_SOFT_LIMIT = 10  // "追加畫布" becomes available after this
const PAGE_HARD_LIMIT = 15  // absolute max per page

const STICKY_RAW_COLORS = [
  "#ffffff",
  "#36c9d1",
  "#a3dbcf",
  "#f4baa5",
  "#f8e8cb",
  "#f0917e",
]

// ─── Main Component ─────────────────────────────────────────────────
export function Guestbook() {
  // Each page has a stable numeric ID stored in DB
  const [pages, setPages] = useState<StickyNote[][]>([[]])
  const [pageIds, setPageIds] = useState<number[]>([0]) // stable page IDs matching pages array
  const pageIdCounter = useRef(0)
  const zIndexCounter = useRef(1)
  const [currentPage, setCurrentPage] = useState(0) // index into pages/pageIds arrays
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBubbleModalOpen, setIsBubbleModalOpen] = useState(false)
  const [bubbleText, setBubbleText] = useState("")
  const [bubbleColor, setBubbleColor] = useState(STICKY_RAW_COLORS[1])
  const [authorName, setAuthorName] = useState(() => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem("guestbook_author") || ""
  })
  const [selectedColor, setSelectedColor] = useState(STICKY_RAW_COLORS[0])
  const [selectedShape, setSelectedShape] = useState<NoteShape>("square")
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const canvasRef = useRef<DrawingCanvasRef | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null)

  // ─── Outline canvas RAF loop ───
  useEffect(() => {
    let rafId: number
    const OUTLINE_WIDTH = 3

    function drawOutline() {
      const canvas = outlineCanvasRef.current
      const board = boardRef.current
      if (!canvas || !board) {
        rafId = requestAnimationFrame(drawOutline)
        return
      }

      const boardRect = board.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = boardRect.width
      const h = boardRect.height

      // Resize canvas if needed
      const targetW = Math.round(w * dpr)
      const targetH = Math.round(h * dpr)
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW
        canvas.height = targetH
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
      }

      const ctx = canvas.getContext("2d")!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // Query all sticky note elements
      const noteEls = board.querySelectorAll("[data-sticky-note]")
      if (noteEls.length === 0) {
        rafId = requestAnimationFrame(drawOutline)
        return
      }

      // Helper: draw enlarged shape (for pass 1)
      function drawEnlarged(el: Element, x: number, y: number, rw: number, rh: number) {
        const shape = el.getAttribute("data-note-shape") || "square"
        if (shape === "bubble") {
          ctx.beginPath()
          ctx.roundRect(x, y, rw, rh, [16, 16, 16, 0])
          ctx.fill()
        } else {
          // square: simple rect
          ctx.fillRect(x, y, rw, rh)
        }
      }

      // Helper: cut out original shape (for pass 2)
      function drawOriginal(el: Element, x: number, y: number, rw: number, rh: number) {
        const shape = el.getAttribute("data-note-shape") || "square"
        if (shape === "bubble") {
          ctx.beginPath()
          ctx.roundRect(x, y, rw, rh, [16, 16, 16, 0])
          ctx.fill()
        } else {
          ctx.fillRect(x, y, rw, rh)
        }
      }

      // ── Shapes that use enlarge+cutout (square, bubble) ──
      const rectNotes: Element[] = []
      const strokeNotes: Element[] = [] // circle, heart — use stroke instead

      noteEls.forEach((el) => {
        const shape = el.getAttribute("data-note-shape") || "square"
        if (shape === "circle" || shape === "heart") {
          strokeNotes.push(el)
        } else {
          rectNotes.push(el)
        }
      })

      // Pass 1: draw enlarged rects
      ctx.fillStyle = "#ffffff"
      ctx.globalCompositeOperation = "source-over"
      rectNotes.forEach((el) => {
        const r = el.getBoundingClientRect()
        drawEnlarged(
          el,
          r.left - boardRect.left - OUTLINE_WIDTH,
          r.top - boardRect.top - OUTLINE_WIDTH,
          r.width + OUTLINE_WIDTH * 2,
          r.height + OUTLINE_WIDTH * 2,
        )
      })

      // Pass 2: cut out original rects
      ctx.globalCompositeOperation = "destination-out"
      rectNotes.forEach((el) => {
        const r = el.getBoundingClientRect()
        drawOriginal(
          el,
          r.left - boardRect.left,
          r.top - boardRect.top,
          r.width,
          r.height,
        )
      })

      // Pass 3: stroke-based outline for circle/heart (uniform thickness)
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = OUTLINE_WIDTH * 2
      strokeNotes.forEach((el) => {
        const r = el.getBoundingClientRect()
        const x = r.left - boardRect.left
        const y = r.top - boardRect.top
        const shape = el.getAttribute("data-note-shape")
        if (shape === "circle") {
          ctx.beginPath()
          ctx.ellipse(x + r.width / 2, y + r.height / 2, r.width / 2, r.height / 2, 0, 0, Math.PI * 2)
          ctx.stroke()
        } else if (shape === "heart") {
          ctx.save()
          ctx.translate(x, y)
          heartPath(ctx, r.width, r.height)
          ctx.stroke()
          ctx.restore()
        }
      })

      ctx.globalCompositeOperation = "source-over"
      rafId = requestAnimationFrame(drawOutline)
    }

    rafId = requestAnimationFrame(drawOutline)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Fetch notes from API on mount
  useEffect(() => {
    fetch("/api/guestbook")
      .then((res) => res.json())
      .then((data) => {
        const apiNotes: StickyNote[] = (data.notes || []).map((n: Record<string, unknown>) => ({
          id: n.id as number,
          image: n.image as string,
          author: (n.author as string) || "",
          color: (n.color as string) || "#ffffff",
          position: { x: n.posX as number, y: n.posY as number },
          zIndex: n.zIndex as number,
          page: n.page as number,
          shape: (n.shape as NoteShape) || "square",
          noteType: (n.noteType as NoteType) || "drawing",
          text: (n.text as string) || null,
          visitorId: n.visitorId as string,
          createdAt: new Date(n.createdAt as string).getTime(),
        }))

        // Group by page number
        const pageMap: Record<number, StickyNote[]> = {}
        for (const note of apiNotes) {
          if (!pageMap[note.page]) pageMap[note.page] = []
          pageMap[note.page].push(note)
          if (note.zIndex > zIndexCounter.current) zIndexCounter.current = note.zIndex
        }

        const pageNums = Object.keys(pageMap).map(Number).sort((a, b) => b - a)
        if (pageNums.length === 0) {
          setPages([[]])
          setPageIds([0])
          pageIdCounter.current = 0
        } else {
          setPages(pageNums.map((p) => pageMap[p]))
          setPageIds(pageNums)
          pageIdCounter.current = Math.max(...pageNums)
        }
      })
      .catch(() => {})
  }, [])

  // pages[0] = newest, pages[last] = oldest. Dots: left = newest, right = oldest.
  const totalPages = pages.length
  const pageNotes = pages[currentPage] ?? []

  // "追加畫布" available when newest page (pages[0]) has >= PAGE_SOFT_LIMIT
  const canAddPage = pages[0].length >= PAGE_SOFT_LIMIT

  const handleAddPage = useCallback(() => {
    pageIdCounter.current += 1
    const newPageId = pageIdCounter.current
    setPages((prev) => [[], ...prev])
    setPageIds((prev) => [newPageId, ...prev])
    setCurrentPage(0) // navigate to new page (index 0)
  }, [])

  const handleSave = useCallback(async () => {
    if (!canvasRef.current) return

    if (pages[currentPage].length >= PAGE_HARD_LIMIT) {
      setHint("該頁便利貼數已達上限（15張），請切換到其他頁面或追加新畫布！")
      setTimeout(() => setHint(null), 3000)
      return
    }

    const dataUrl = canvasRef.current.getDataURL(selectedColor)

    // Apply shape clipping for non-square shapes
    const blob = await applyShapeClip(dataUrl, selectedShape)

    zIndexCounter.current += 1
    const visitorId = getVisitorId()

    const formData = new FormData()
    formData.append("image", blob, "sticker.png")
    formData.append("posX", "80")
    formData.append("posY", "60")
    formData.append("zIndex", String(zIndexCounter.current))
    formData.append("page", String(pageIds[currentPage]))
    formData.append("author", authorName.trim())
    formData.append("color", selectedColor)
    formData.append("shape", selectedShape)
    formData.append("noteType", "drawing")
    formData.append("visitorId", visitorId)

    try {
      const apiRes = await fetch("/api/guestbook", { method: "POST", body: formData })
      if (!apiRes.ok) throw new Error()
      const data = await apiRes.json()
      const note = data.note

      const newNote: StickyNote = {
        id: note.id,
        image: note.image,
        author: note.author || "",
        color: note.color,
        position: { x: note.posX, y: note.posY },
        zIndex: note.zIndex,
        page: note.page,
        shape: note.shape || "square",
        noteType: note.noteType || "drawing",
        text: note.text || null,
        visitorId: note.visitorId,
        createdAt: new Date(note.createdAt).getTime(),
      }

      setPages((prev) => {
        const updated = [...prev]
        updated[currentPage] = [...updated[currentPage], newNote]
        return updated
      })
    } catch {
      setHint("儲存失敗，請稍後再試")
      setTimeout(() => setHint(null), 3000)
    }

    setIsModalOpen(false)
    if (authorName.trim()) localStorage.setItem("guestbook_author", authorName.trim())
    setSelectedColor(STICKY_RAW_COLORS[0])
    setSelectedShape("square")
  }, [authorName, selectedColor, selectedShape, currentPage, pages, pageIds])

  const handleDragEnd = useCallback((noteId: number, newX: number, newY: number) => {
    zIndexCounter.current += 1
    const newZ = zIndexCounter.current
    setPages((prev) =>
      prev.map((page) =>
        page.map((n) => (n.id === noteId ? { ...n, position: { x: newX, y: newY }, zIndex: newZ } : n))
      )
    )
    setDraggedId(null)
    fetch(`/api/guestbook/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posX: newX, posY: newY, zIndex: newZ }),
    }).catch(() => {})
  }, [])

  const handleDelete = useCallback((noteId: number) => {
    const visitorId = getVisitorId()
    setPages((prev) =>
      prev.map((page) => page.filter((n) => n.id !== noteId))
    )
    fetch(`/api/guestbook/${noteId}?visitorId=${visitorId}`, {
      method: "DELETE",
    }).catch(() => {})
  }, [])

  const handleClear = () => {
    canvasRef.current?.clear()
  }

  const handleBubbleSave = useCallback(async () => {
    if (!bubbleText.trim()) return

    if (pages[currentPage].length >= PAGE_HARD_LIMIT) {
      setHint("該頁便利貼數已達上限（15張），請切換到其他頁面或追加新畫布！")
      setTimeout(() => setHint(null), 3000)
      return
    }

    zIndexCounter.current += 1
    const visitorId = getVisitorId()

    const formData = new FormData()
    formData.append("posX", "80")
    formData.append("posY", "60")
    formData.append("zIndex", String(zIndexCounter.current))
    formData.append("page", String(pageIds[currentPage]))
    formData.append("author", authorName.trim())
    formData.append("color", bubbleColor)
    formData.append("shape", "square")
    formData.append("noteType", "bubble")
    formData.append("text", bubbleText.trim())
    formData.append("visitorId", visitorId)

    try {
      const apiRes = await fetch("/api/guestbook", { method: "POST", body: formData })
      if (!apiRes.ok) throw new Error()
      const data = await apiRes.json()
      const note = data.note

      const newNote: StickyNote = {
        id: note.id,
        image: "",
        author: note.author || "",
        color: note.color,
        position: { x: note.posX, y: note.posY },
        zIndex: note.zIndex,
        page: note.page,
        shape: "square",
        noteType: "bubble",
        text: note.text,
        visitorId: note.visitorId,
        createdAt: new Date(note.createdAt).getTime(),
      }

      setPages((prev) => {
        const updated = [...prev]
        updated[currentPage] = [...updated[currentPage], newNote]
        return updated
      })
    } catch {
      setHint("儲存失敗，請稍後再試")
      setTimeout(() => setHint(null), 3000)
    }

    setIsBubbleModalOpen(false)
    setBubbleText("")
    if (authorName.trim()) localStorage.setItem("guestbook_author", authorName.trim())
  }, [bubbleText, bubbleColor, authorName, currentPage, pages, pageIds])

  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* ── Club name (top-left) ── */}
      <Link
        href="/"
        className="fixed top-4 left-6 z-60 text-xl font-bold tracking-tight text-white/80 transition-colors hover:text-white"
      >
        CLUB NAME
      </Link>

      {/* ── Menu icon (top-right) ── */}
      <button
        onClick={() => setNavOpen((v) => !v)}
        className="fixed top-4 right-4 z-60 flex h-10 w-10 cursor-pointer items-center justify-center text-white backdrop-blur-md"
      >
        <Menu className="h-6 w-6 transition-all duration-200 hover:size-7" />
      </button>

      {/* ── Full-height sidebar nav (slides from right) ── */}
      <AnimatePresence>
        {navOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-60 bg-black/40"
              onClick={() => setNavOpen(false)}
            />
            {/* Sidebar — w-1/4, min-w-50 for adjustability */}
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-60 flex w-1/4 min-w-50 flex-col bg-white/10 backdrop-blur-xl"
            >
              {/* Close button */}
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setNavOpen(false)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white/60"
                >
                  <X className="h-6 w-6 transition-all duration-200 hover:size-7" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex flex-1 flex-col gap-1 px-4">
                {[
                  { label: "首頁", href: "/" },
                  { label: "成員", href: "/members" },
                  { label: "畫廊", href: "/gallery" },
                  { label: "簽到簿", href: "/sign-book" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-4 py-3 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* ── Hint toast (fixed top-center) ── */}
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 z-60 -translate-x-1/2"
          >
            <div className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg">
              {hint}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heart clip-path definition */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <clipPath id="heart-clip" clipPathUnits="objectBoundingBox">
            <path d={HEART_SVG_PATH} />
          </clipPath>
        </defs>
      </svg>

      {/* ── Full-screen Blackboard ── */}
      <div
        ref={boardRef}
        className="relative h-full w-full"
        style={{
          backgroundColor: "#122018",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Outline canvas — behind everything */}
        <canvas ref={outlineCanvasRef} className="pointer-events-none absolute inset-0" />

        {/* Chalk dust lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 41px)",
          }}
        />

        {/* Sticky Notes for current page */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative h-full w-full"
          >
            {pageNotes.map((note, index) => (
              <DraggableStickyNote
                key={note.id}
                note={note}
                index={index}
                boardRef={boardRef}
                isOwned={note.visitorId === getVisitorId()}
                isDragging={draggedId === note.id}
                onDragStart={() => setDraggedId(note.id)}
                onDragEnd={handleDragEnd}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Fixed bottom control bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center px-6 backdrop-blur-md">
        {/* Left spacer */}
        <div className="flex flex-1" />

        {/* Pagination dots — centered */}
        <div className={`flex items-center gap-2 ${totalPages <= 1 ? "invisible" : ""}`}>
          <button
            onClick={() => setCurrentPage((p) => (p - 1 + totalPages) % totalPages)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`h-2.5 w-2.5 cursor-pointer rounded-full transition-all ${
                i === currentPage ? "scale-125 bg-white" : "bg-white/30"
              }`}
            />
          ))}
          <button
            onClick={() => setCurrentPage((p) => (p + 1) % totalPages)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Right side — buttons */}
        <div className="flex flex-1 items-center justify-end gap-3">
          <button
            onClick={handleAddPage}
            disabled={!canAddPage}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            追加畫布
          </button>

          <button
            onClick={() => {
              if (pages[currentPage].length >= PAGE_HARD_LIMIT) {
                setHint("該頁便利貼數已達上限（15張），請切換到其他頁面或追加新畫布！")
                setTimeout(() => setHint(null), 3000)
                return
              }
              setIsModalOpen(true)
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/90 px-5 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
          >
            <Plus className="h-4 w-4" />
            便利貼
          </button>

          <button
            onClick={() => {
              if (pages[currentPage].length >= PAGE_HARD_LIMIT) {
                setHint("該頁便利貼數已達上限（15張），請切換到其他頁面或追加新畫布！")
                setTimeout(() => setHint(null), 3000)
                return
              }
              setIsBubbleModalOpen(true)
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <MessageCircle className="h-4 w-4" />
            留言
          </button>
        </div>
      </div>

      {/* Drawing Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <DrawingModal
            canvasRef={canvasRef}
            authorName={authorName}
            selectedColor={selectedColor}
            selectedShape={selectedShape}
            onAuthorChange={setAuthorName}
            onColorChange={setSelectedColor}
            onShapeChange={setSelectedShape}
            onClear={handleClear}
            onSave={handleSave}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Bubble Modal */}
      <AnimatePresence>
        {isBubbleModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10000 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-80 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <button
                onClick={() => setIsBubbleModalOpen(false)}
                className="absolute top-3 right-3 cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-base font-semibold text-slate-800">留言氣泡</h3>

              {/* Bubble color */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-slate-500">顏色：</span>
                {STICKY_RAW_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBubbleColor(color)}
                    className={`h-6 w-6 cursor-pointer rounded-full border-2 transition-transform ${
                      bubbleColor === color ? "scale-110 border-slate-800" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Author */}
              <input
                type="text"
                placeholder="你的名字（選填）"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />

              {/* Message */}
              <textarea
                placeholder="寫下你想說的話..."
                value={bubbleText}
                onChange={(e) => setBubbleText(e.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                autoFocus
              />

              {/* Preview */}
              <div className="mt-3 flex justify-center">
                <div
                  className="relative max-w-50 rounded-2xl rounded-bl-none px-4 py-3 text-sm text-slate-800 shadow-md"
                  style={{ backgroundColor: bubbleColor }}
                >
                  {bubbleText || "預覽..."}
                  {authorName && (
                    <p className="mt-1 text-[10px] text-slate-500">— {authorName}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleBubbleSave}
                disabled={!bubbleText.trim()}
                className="mt-4 w-full cursor-pointer rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                送出
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Draggable Sticky Note ──────────────────────────────────────────
interface DraggableStickyNoteProps {
  note: StickyNote
  index: number
  boardRef: React.RefObject<HTMLDivElement | null>
  isOwned: boolean
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: (id: number, x: number, y: number) => void
  onDelete: (id: number) => void
}

function DraggableStickyNote({ note, index, boardRef, isOwned, isDragging, onDragStart, onDragEnd, onDelete }: DraggableStickyNoteProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const offset = useRef({ x: 0, y: 0 })
  const pos = useRef({ x: note.position.x, y: note.position.y })

  // Sync position from props when not dragging
  useEffect(() => {
    pos.current = { x: note.position.x, y: note.position.y }
  }, [note.position.x, note.position.y])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!elRef.current || !boardRef.current) return
    e.preventDefault()
    e.stopPropagation()
    dragging.current = true
    onDragStart()

    const rect = elRef.current.getBoundingClientRect()
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    elRef.current.setPointerCapture(e.pointerId)
  }, [boardRef, onDragStart])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !elRef.current || !boardRef.current) return
    e.preventDefault()

    const boardRect = boardRef.current.getBoundingClientRect()
    let newX = e.clientX - boardRect.left - offset.current.x
    let newY = e.clientY - boardRect.top - offset.current.y

    // Clamp within board
    newX = Math.max(0, Math.min(newX, boardRect.width - 224))
    newY = Math.max(0, Math.min(newY, boardRect.height - 224))

    pos.current = { x: newX, y: newY }
    elRef.current.style.left = `${newX}px`
    elRef.current.style.top = `${newY}px`
  }, [boardRef])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    dragging.current = false
    elRef.current?.releasePointerCapture(e.pointerId)
    onDragEnd(note.id, pos.current.x, pos.current.y)
  }, [note.id, onDragEnd])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isOwned) return
    setContextMenuPos({ x: e.clientX, y: e.clientY })
    setShowContextMenu(true)
  }, [isOwned])

  // Close context menu on click anywhere
  useEffect(() => {
    if (!showContextMenu) return
    const close = () => setShowContextMenu(false)
    window.addEventListener("pointerdown", close)
    return () => window.removeEventListener("pointerdown", close)
  }, [showContextMenu])

  return (
    <motion.div
      ref={elRef}
      initial={{ opacity: 0, y: -60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 16,
        delay: index * 0.05,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={handleContextMenu}
      className="group absolute cursor-grab select-none active:cursor-grabbing"
      style={{
        left: note.position.x,
        top: note.position.y,
        zIndex: isDragging ? 9999 : note.zIndex,
        touchAction: "none",
      }}
    >
      {note.noteType === "bubble" ? (
        /* ── Bubble note ── */
        <div className="pointer-events-none max-w-64">
          <div
            data-sticky-note
            data-note-shape="bubble"
            className="relative rounded-2xl rounded-bl-none px-5 py-4 shadow-lg"
            style={{ backgroundColor: note.color }}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800" style={{ fontFamily: "var(--font-huninn)" }}>{note.text}</p>
            {note.author && (
              <p className="mt-2 text-[11px] text-slate-500">— {note.author}</p>
            )}
          </div>
          {/* Info on hover */}
          <div className="mt-2 whitespace-nowrap text-center text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {new Date(note.createdAt).toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/-/g, "/")}
          </div>
        </div>
      ) : (
        /* ── Drawing note ── */
        <div
          className="pointer-events-none relative"
          style={{
            width: note.shape === "heart" ? "18rem" : "16rem",
            height: note.shape === "heart" ? "17rem" : "16rem",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))",
          }}
        >
          <div
            data-sticky-note
            data-note-shape={note.shape}
            className="relative h-full w-full overflow-hidden"
            style={{
              clipPath: SHAPE_CLIPS[note.shape] || undefined,
              backgroundColor: note.color,
            }}
          >
            {note.image ? (
              <img
                src={note.image}
                alt={`${note.author}'s doodle`}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-2xl opacity-20">✏️</span>
              </div>
            )}
          </div>

          {/* Info on hover */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-3 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {note.author && <span>{note.author} · </span>}
            {new Date(note.createdAt).toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/-/g, "/")}
          </div>
        </div>
      )}

      {/* Right-click context menu — fixed to viewport */}
      {showContextMenu && (
        <div
          className="fixed z-9999 whitespace-nowrap rounded-lg bg-neutral-800 shadow-xl"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          <button
            onPointerDown={(e) => {
              e.stopPropagation()
              setShowContextMenu(false)
              onDelete(note.id)
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
            刪除
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ─── Brush size presets ──────────────────────────────────────────────
const PEN_SIZES = [1, 2, 4, 8]
const ERASER_SIZES = [8, 16, 24, 36]

// ─── Default brush colors ────────────────────────────────────────────
// Customize: add/remove colors here, grid auto-fills into BRUSH_COLORS_COLS columns
const BRUSH_COLORS_COLS = 2
const BRUSH_COLORS = [
  "#333333", "#666666", "#e74c3c", "#e67e22", "#f1c40f",
  "#2ecc71", "#1abc9c", "#3498db", "#9b59b6", "#e84393",
  "#ffffff",
]

// ─── Drawing Modal ──────────────────────────────────────────────────
interface DrawingModalProps {
  canvasRef: React.MutableRefObject<DrawingCanvasRef | null>
  authorName: string
  selectedColor: string
  selectedShape: NoteShape
  onAuthorChange: (name: string) => void
  onColorChange: (color: string) => void
  onShapeChange: (shape: NoteShape) => void
  onClear: () => void
  onSave: () => void
  onClose: () => void
}

const SHAPE_OPTIONS: { value: NoteShape; label: string; icon: string }[] = [
  { value: "square", label: "正方形", icon: "⬜" },
  { value: "circle", label: "圓形", icon: "⭕" },
  { value: "heart", label: "愛心", icon: "💗" },
]

function DrawingModal({
  canvasRef,
  authorName,
  selectedColor,
  selectedShape,
  onAuthorChange,
  onColorChange,
  onShapeChange,
  onClear,
  onSave,
  onClose,
}: DrawingModalProps) {
  const [brushColor, setBrushColor] = useState(BRUSH_COLORS[0])
  const [customColor, setCustomColor] = useState("#ff6600")
  const [activeTool, setActiveTool] = useState<"pen" | "eraser" | "fill" | "text">("pen")
  const [penSize, setPenSize] = useState(2)
  const [eraserSize, setEraserSize] = useState(12)
  const [textSize, setTextSize] = useState(24)
  const [textBold, setTextBold] = useState(false)

  // Undo/redo is handled inside DrawingCanvas, we just read state from ref
  const canUndo = canvasRef.current?.canUndo ?? false
  const canRedo = canvasRef.current?.canRedo ?? false

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-10000 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content: Canvas + Toolbar side by side */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative z-10 flex items-start gap-4"
      >
        {/* Canvas area */}
        <div className="flex flex-col gap-3">
          {/* Sticky note color picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">便利貼顏色：</span>
            {STICKY_RAW_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`h-7 w-7 cursor-pointer rounded border-2 shadow-md transition-transform ${
                  selectedColor === color ? "scale-110 border-white" : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            {/* Custom sticky note color */}
            <div className="relative h-7 w-7">
              <label
                className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded border-2 shadow-md transition-transform ${
                  !STICKY_RAW_COLORS.includes(selectedColor) ? "scale-110 border-white" : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: !STICKY_RAW_COLORS.includes(selectedColor) ? selectedColor : "#ccc" }}
                title="自選便利貼顏色"
              >
                <Pipette className="h-3.5 w-3.5 text-white/70" />
                <input
                  type="color"
                  value={!STICKY_RAW_COLORS.includes(selectedColor) ? selectedColor : "#ffcccc"}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>

          {/* Shape selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">形狀：</span>
            {SHAPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onShapeChange(opt.value)}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded text-lg transition-transform ${
                  selectedShape === opt.value ? "scale-110 bg-white/20" : "hover:scale-105 hover:bg-white/10"
                }`}
                title={opt.label}
              >
                {opt.icon}
              </button>
            ))}
          </div>

          {/* Author name input */}
          <input
            type="text"
            placeholder="你的名字（選填）"
            value={authorName}
            onChange={(e) => onAuthorChange(e.target.value)}
            className="w-full rounded-sm bg-white/90 px-4 py-2 text-sm shadow-lg outline-none backdrop-blur-sm focus:ring-2 focus:ring-white/50"
          />

          {/* Canvas */}
          <div className="overflow-hidden shadow-2xl">
            <div style={{ clipPath: SHAPE_CLIPS[selectedShape] }}>
            <DrawingCanvas
              ref={canvasRef}
              width={550}
              height={550}
              brushRadius={activeTool === "eraser" ? eraserSize : penSize}
              brushColor={activeTool === "eraser" ? selectedColor : brushColor}
              backgroundColor={selectedColor}
              mode={activeTool === "text" ? "text" : activeTool === "fill" ? "fill" : "draw"}
              textSize={textSize}
              textBold={textBold}
            />
            </div>
          </div>
        </div>

        {/* Right toolbar */}
        <div className="flex flex-col items-center gap-4 self-stretch">
          {/* Close */}
          <button
            onClick={onClose}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-lg backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="h-px w-10 bg-white/20" />

          {/* Pen & Eraser - one row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTool("pen")}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all ${
                activeTool === "pen" ? "bg-white text-slate-800 scale-110" : "bg-white/60 text-slate-500 hover:bg-white/80"
              }`}
              title="畫筆"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
              </svg>
            </button>
            <button
              onClick={() => setActiveTool("eraser")}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all ${
                activeTool === "eraser" ? "bg-white text-slate-800 scale-110" : "bg-white/60 text-slate-500 hover:bg-white/80"
              }`}
              title="橡皮擦"
            >
              <Eraser className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveTool("fill")}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all ${
                activeTool === "fill" ? "bg-white text-slate-800 scale-110" : "bg-white/60 text-slate-500 hover:bg-white/80"
              }`}
              title="油漆桶"
            >
              <PaintBucket className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveTool("text")}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all ${
                activeTool === "text" ? "bg-white text-slate-800 scale-110" : "bg-white/60 text-slate-500 hover:bg-white/80"
              }`}
              title="文字"
            >
              <span className="text-base font-bold">T</span>
            </button>
          </div>

          {/* Size presets for pen/eraser, text controls for text tool */}
          {activeTool === "text" ? (
            <div className="flex items-center gap-2">
              <select
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
                className="h-8 cursor-pointer rounded bg-white/30 px-2 text-xs text-white outline-none"
              >
                {[16, 20, 24, 32, 40, 48, 64].map((s) => (
                  <option key={s} value={s} className="text-black">{s}px</option>
                ))}
              </select>
              <button
                onClick={() => setTextBold((v) => !v)}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded text-sm font-bold transition-all ${
                  textBold ? "bg-white text-slate-800" : "bg-white/30 text-white hover:bg-white/50"
                }`}
                title="粗體"
              >
                B
              </button>
            </div>
          ) : (
            <div className={`flex items-center gap-2 ${activeTool === "fill" ? "invisible" : ""}`}>
              {(activeTool === "pen" ? PEN_SIZES : ERASER_SIZES).map((size) => {
                const currentSize = activeTool === "pen" ? penSize : eraserSize
                const setSize = activeTool === "pen" ? setPenSize : setEraserSize
              const dotSize = Math.max(6, Math.min(size * 2, 24))
              return (
                <button
                  key={size}
                  onClick={() => setSize(size)}
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all ${
                    currentSize === size ? "bg-white/90 scale-110" : "bg-white/30 hover:bg-white/50"
                  }`}
                  title={`${size}px`}
                >
                  <span
                    className="rounded-full bg-slate-700"
                    style={{ width: dotSize, height: dotSize }}
                  />
                </button>
              )
            })}
          </div>
          )}

          {/* Color grid - BRUSH_COLORS_COLS per row */}
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${BRUSH_COLORS_COLS}, 1.75rem)` }}
          >
            {BRUSH_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => { setBrushColor(color); setActiveTool("pen") }}
                className={`h-7 w-7 cursor-pointer rounded-full border-2 shadow-md transition-transform ${
                  brushColor === color && activeTool === "pen" ? "scale-110 border-white" : "border-transparent hover:scale-105"
                } ${color === "#ffffff" ? "ring-1 ring-slate-300" : ""}`}
                style={{ backgroundColor: color }}
              />
            ))}

            {/* Custom color picker */}
            <div className="relative h-7 w-7">
              <label
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/60 shadow-md transition-colors hover:bg-white/80"
                title="自選顏色"
              >
                <Pipette className="h-4 w-4 text-slate-500" />
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value)
                    setBrushColor(e.target.value)
                    setActiveTool("pen")
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>

          {/* Undo & Redo - one row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => canvasRef.current?.undo()}
              disabled={!canUndo}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/60 text-slate-500 shadow-lg transition-colors hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-30"
              title="回退 (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => canvasRef.current?.redo()}
              disabled={!canRedo}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/60 text-slate-500 shadow-lg transition-colors hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-30"
              title="復原 (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* Clear - text button */}
          <button
            onClick={onClear}
            className="cursor-pointer text-xs font-medium text-red-400 transition-colors hover:text-red-300"
          >
            清除畫板
          </button>

          <div className="flex-1" />

          {/* Save button */}
          <button
            onClick={onSave}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-mint px-6 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-mint/80"
            title="完成"
          >
            <Check className="h-4 w-4" />
            完成
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
