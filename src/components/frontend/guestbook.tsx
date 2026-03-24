"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Eraser, Check, X, ChevronLeft, ChevronRight, Undo2, Redo2, Pipette, PaintBucket, Menu } from "lucide-react"
import Link from "next/link"
import { DrawingCanvas, type DrawingCanvasRef } from "./drawing-canvas"

// ─── Types ──────────────────────────────────────────────────────────
interface StickyNote {
  id: number
  image: string        // server image path or base64
  author: string
  color: string
  position: { x: number; y: number }
  zIndex: number
  page: number
  visitorId: string
  createdAt: number
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
const PAGE_SOFT_LIMIT = 1  // "追加畫布" becomes available after this
const PAGE_HARD_LIMIT = 1  // absolute max per page

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
  const [authorName, setAuthorName] = useState("")
  const [selectedColor, setSelectedColor] = useState(STICKY_RAW_COLORS[0])
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const canvasRef = useRef<DrawingCanvasRef | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

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

    // Convert base64 to Blob for upload
    const res = await fetch(dataUrl)
    const blob = await res.blob()

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
    setAuthorName("")
    setSelectedColor(STICKY_RAW_COLORS[0])
  }, [authorName, selectedColor, currentPage, pages])

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
        </div>
      </div>

      {/* Drawing Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <DrawingModal
            canvasRef={canvasRef}
            authorName={authorName}
            selectedColor={selectedColor}
            onAuthorChange={setAuthorName}
            onColorChange={setSelectedColor}
            onClear={handleClear}
            onSave={handleSave}
            onClose={() => setIsModalOpen(false)}
          />
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
      <div
        className={`pointer-events-none relative h-56 w-56 p-3 shadow-2xl transition-shadow duration-200 ${
          isDragging ? "shadow-[0_20px_60px_rgba(0,0,0,0.4)]" : ""
        }`}
        style={{ backgroundColor: note.color }}
      >
        {/* Tape effect */}
        <div className="absolute -top-3 left-1/2 h-6 w-12 -translate-x-1/2 bg-white/30" />

        {/* Doodle content */}
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

        {/* Info on hover */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-3 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {note.author && <span>{note.author} · </span>}
          {new Date(note.createdAt).toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/-/g, "/")}
        </div>
      </div>

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
  onAuthorChange: (name: string) => void
  onColorChange: (color: string) => void
  onClear: () => void
  onSave: () => void
  onClose: () => void
}

function DrawingModal({
  canvasRef,
  authorName,
  selectedColor,
  onAuthorChange,
  onColorChange,
  onClear,
  onSave,
  onClose,
}: DrawingModalProps) {
  const [brushColor, setBrushColor] = useState(BRUSH_COLORS[0])
  const [customColor, setCustomColor] = useState("#ff6600")
  const [activeTool, setActiveTool] = useState<"pen" | "eraser" | "fill">("pen")
  const [penSize, setPenSize] = useState(2)
  const [eraserSize, setEraserSize] = useState(12)

  // Undo/redo is handled inside DrawingCanvas, we just read state from ref
  const canUndo = canvasRef.current?.canUndo ?? false
  const canRedo = canvasRef.current?.canRedo ?? false

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
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
            <DrawingCanvas
              ref={canvasRef}
              width={550}
              height={550}
              brushRadius={activeTool === "eraser" ? eraserSize : penSize}
              brushColor={activeTool === "eraser" ? selectedColor : brushColor}
              backgroundColor={selectedColor}
              mode={activeTool === "fill" ? "fill" : "draw"}
            />
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
          </div>

          {/* Size presets (hidden for fill tool) */}
          {activeTool !== "fill" && <div className="flex items-center gap-2">
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
          </div>}

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
