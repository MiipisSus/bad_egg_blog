"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Eraser, Check, X, ChevronLeft, ChevronRight, Undo2, Redo2, Pipette } from "lucide-react"
// @ts-expect-error -- react-canvas-draw has no type definitions
import CanvasDraw from "react-canvas-draw"

// ─── Types ──────────────────────────────────────────────────────────
interface StickyNote {
  id: number
  imageData: string
  author: string
  color: string
  position: { x: number; y: number }
}

// ─── Constants ──────────────────────────────────────────────────────
const NOTES_PER_PAGE = 8

const STICKY_COLORS = [
  "bg-mint/80",
  "bg-lavender/80",
  "bg-peach/80",
  "bg-cream/80",
  "bg-coral/80",
]

const STICKY_RAW_COLORS = [
  "#36c9d1",
  "#a3dbcf",
  "#f4baa5",
  "#f8e8cb",
  "#f0917e",
]

// ─── Mock Data ──────────────────────────────────────────────────────
const INITIAL_NOTES: StickyNote[] = [
  { id: 1, imageData: "", author: "Alice", color: STICKY_COLORS[0], position: { x: 40, y: 30 } },
  { id: 2, imageData: "", author: "Bob", color: STICKY_COLORS[1], position: { x: 220, y: 50 } },
  { id: 3, imageData: "", author: "Charlie", color: STICKY_COLORS[2], position: { x: 450, y: 20 } },
  { id: 4, imageData: "", author: "Diana", color: STICKY_COLORS[3], position: { x: 650, y: 60 } },
  { id: 5, imageData: "", author: "Eve", color: STICKY_COLORS[4], position: { x: 100, y: 250 } },
  { id: 6, imageData: "", author: "Frank", color: STICKY_COLORS[0], position: { x: 350, y: 280 } },
  { id: 7, imageData: "", author: "Grace", color: STICKY_COLORS[2], position: { x: 550, y: 240 } },
  { id: 8, imageData: "", author: "Henry", color: STICKY_COLORS[1], position: { x: 780, y: 270 } },
  { id: 9, imageData: "", author: "Ivy", color: STICKY_COLORS[3], position: { x: 60, y: 50 } },
  { id: 10, imageData: "", author: "Jack", color: STICKY_COLORS[4], position: { x: 300, y: 80 } },
]

// ─── Main Component ─────────────────────────────────────────────────
export function Guestbook() {
  const [notes, setNotes] = useState<StickyNote[]>(INITIAL_NOTES)
  const [myNoteIds, setMyNoteIds] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [authorName, setAuthorName] = useState("")
  const [selectedColor, setSelectedColor] = useState(0)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const canvasRef = useRef<CanvasDraw | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE))
  const pageNotes = notes.slice(currentPage * NOTES_PER_PAGE, (currentPage + 1) * NOTES_PER_PAGE)

  const handleSave = useCallback(() => {
    if (!canvasRef.current) return

    const imageData = canvasRef.current.getDataURL("png", false, "#ffffff00") as string

    const newNote: StickyNote = {
      id: Date.now(),
      imageData,
      author: authorName.trim() || "Anonymous",
      color: STICKY_COLORS[selectedColor],
      position: { x: 80, y: 60 },
    }

    // API: POST /api/guestbook
    setMyNoteIds((prev) => new Set(prev).add(newNote.id))
    setNotes((prev) => [newNote, ...prev])
    setCurrentPage(0)
    setIsModalOpen(false)
    setAuthorName("")
    setSelectedColor(0)
  }, [authorName, selectedColor])

  const handleDragEnd = useCallback((noteId: number, newX: number, newY: number) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, position: { x: newX, y: newY } } : n))
    )
    setDraggedId(null)
    // API: PATCH /api/guestbook/:id { position: { x: newX, y: newY } }
  }, [])

  const handleClear = () => {
    canvasRef.current?.clear()
  }

  return (
    <section className="min-h-screen pt-24 pb-12">
      {/* Section Header */}
      <div className="container mx-auto px-6 pb-10 text-center">
        <span className="inline-block rounded-full bg-lavender/40 px-5 py-2 text-sm font-medium text-foreground">
          Guestbook
        </span>
        <h2 className="mt-4 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          塗鴉簽到簿
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
          Leave your mark — doodle, draw, or write something fun!
        </p>
      </div>

      {/* Toolbar above blackboard */}
      <div className="container mx-auto relative flex items-center justify-center px-6 pb-4 md:px-12">
        {/* Pagination dots - centered */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => (p - 1 + totalPages) % totalPages)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-foreground/50 transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`h-2.5 w-2.5 cursor-pointer rounded-full transition-all ${
                  i === currentPage ? "scale-125 bg-foreground" : "bg-foreground/30"
                }`}
              />
            ))}
            <button
              onClick={() => setCurrentPage((p) => (p + 1) % totalPages)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-foreground/50 transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Add button - right side */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute right-6 flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/80 md:right-12"
        >
          <Plus className="h-4 w-4" />
          新增簽到
        </button>
      </div>

      {/* Blackboard */}
      <div>
        <div
          ref={boardRef}
          className="relative h-[90vh] w-full overflow-hidden"
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
                  isOwned={myNoteIds.has(note.id)}
                  isDragging={draggedId === note.id}
                  onDragStart={() => setDraggedId(note.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </motion.div>
          </AnimatePresence>

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
    </section>
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
}

function DraggableStickyNote({ note, index, boardRef, isOwned, isDragging, onDragStart, onDragEnd }: DraggableStickyNoteProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const pos = useRef({ x: note.position.x, y: note.position.y })

  // Sync position from props when not dragging
  useEffect(() => {
    pos.current = { x: note.position.x, y: note.position.y }
  }, [note.position.x, note.position.y])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isOwned || !elRef.current || !boardRef.current) return
    e.preventDefault()
    e.stopPropagation()
    dragging.current = true
    onDragStart()

    const rect = elRef.current.getBoundingClientRect()
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    elRef.current.setPointerCapture(e.pointerId)
  }, [isOwned, boardRef, onDragStart])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !elRef.current || !boardRef.current) return
    e.preventDefault()

    const boardRect = boardRef.current.getBoundingClientRect()
    let newX = e.clientX - boardRect.left - offset.current.x
    let newY = e.clientY - boardRect.top - offset.current.y

    // Clamp within board
    newX = Math.max(0, Math.min(newX, boardRect.width - 176))
    newY = Math.max(0, Math.min(newY, boardRect.height - 176))

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
      className={`group absolute select-none ${isOwned ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{
        left: note.position.x,
        top: note.position.y,
        zIndex: isDragging ? 100 : 1,
        touchAction: "none",
      }}
    >
      <div
        className={`pointer-events-none relative h-44 w-44 ${note.color} p-3 shadow-2xl transition-shadow duration-200 ${
          isDragging ? "shadow-[0_20px_60px_rgba(0,0,0,0.4)]" : ""
        }`}
      >
        {/* Tape effect */}
        <div className="absolute -top-3 left-1/2 h-6 w-12 -translate-x-1/2 bg-white/30" />

        {/* Doodle content */}
        {note.imageData ? (
          <img
            src={note.imageData}
            alt={`${note.author}'s doodle`}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-2xl opacity-20">✏️</span>
          </div>
        )}

        {/* Author name on hover */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-3 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {note.author}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Default brush colors ────────────────────────────────────────────
const BRUSH_COLORS = ["#333333", "#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#ffffff"]

// ─── Drawing Modal ──────────────────────────────────────────────────
interface DrawingModalProps {
  canvasRef: React.MutableRefObject<CanvasDraw | null>
  authorName: string
  selectedColor: number
  onAuthorChange: (name: string) => void
  onColorChange: (index: number) => void
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
  const [activeTool, setActiveTool] = useState<"pen" | "eraser">("pen")

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Canvas area */}
        <div className="flex flex-col gap-3">
          {/* Sticky note color picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">便利貼顏色：</span>
            {STICKY_RAW_COLORS.map((color, i) => (
              <button
                key={color}
                onClick={() => onColorChange(i)}
                className={`h-7 w-7 cursor-pointer rounded border-2 shadow-md transition-transform ${
                  selectedColor === i ? "scale-110 border-white" : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Author name input */}
          <input
            type="text"
            placeholder="你的名字（選填）"
            value={authorName}
            onChange={(e) => onAuthorChange(e.target.value)}
            className="w-full rounded-lg bg-white/90 px-4 py-2 text-sm shadow-lg outline-none backdrop-blur-sm focus:ring-2 focus:ring-white/50"
          />

          {/* Canvas */}
          <div className="overflow-hidden rounded-lg shadow-2xl">
            <CanvasDraw
              ref={canvasRef}
              brushRadius={activeTool === "eraser" ? 12 : 2}
              brushColor={activeTool === "eraser" ? "#ffffff" : brushColor}
              lazyRadius={0}
              canvasWidth={560}
              canvasHeight={400}
              backgroundColor="#ffffff"
              hideGrid
            />
          </div>
        </div>

        {/* Right toolbar - two rows */}
        <div className="flex flex-col items-center justify-between self-stretch">
          {/* Top: Close */}
          <button
            onClick={onClose}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-lg backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Middle: Tools split into two columns */}
          <div className="flex gap-3">
            {/* Column 1: Tools */}
            <div className="flex flex-col items-center gap-2.5">
              {/* Pen */}
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

              {/* Eraser */}
              <button
                onClick={() => setActiveTool("eraser")}
                className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all ${
                  activeTool === "eraser" ? "bg-white text-slate-800 scale-110" : "bg-white/60 text-slate-500 hover:bg-white/80"
                }`}
                title="橡皮擦"
              >
                <Eraser className="h-5 w-5" />
              </button>

              {/* Undo */}
              <button
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/60 text-slate-500 shadow-lg transition-colors hover:bg-white/80"
                title="回退"
              >
                <Undo2 className="h-4 w-4" />
              </button>

              {/* Redo */}
              <button
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/60 text-slate-500 shadow-lg transition-colors hover:bg-white/80"
                title="復原"
              >
                <Redo2 className="h-4 w-4" />
              </button>

              {/* Clear */}
              <button
                onClick={onClear}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/60 text-red-400 shadow-lg transition-colors hover:bg-white/80 hover:text-red-500"
                title="清除全部"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Column 2: Colors */}
            <div className="flex flex-col items-center gap-2">
              {BRUSH_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => { setBrushColor(color); setActiveTool("pen") }}
                  className={`h-7 w-7 cursor-pointer rounded-full border-2 shadow-md transition-transform ${
                    brushColor === color && activeTool === "pen" ? "scale-110 border-white" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}

              {/* Custom color picker */}
              <div className="relative">
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
          </div>

          {/* Bottom: Save */}
          <button
            onClick={onSave}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#122018] text-white shadow-lg transition-colors hover:bg-[#1a3025]"
            title="完成"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
