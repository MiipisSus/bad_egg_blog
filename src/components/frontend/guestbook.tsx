"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Eraser, Check, X, ChevronLeft, ChevronRight } from "lucide-react"
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

      {/* Blackboard */}
      <div className="container mx-auto px-4 md:px-6">
        <div
          ref={boardRef}
          className="relative h-[80vh] w-full overflow-hidden rounded-xl"
          style={{
            backgroundColor: "#122018",
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
            boxShadow: "inset 0 0 80px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {/* Chalk dust lines */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 41px)",
            }}
          />

          {/* Add button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute top-6 right-6 z-30 flex cursor-pointer items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <Plus className="h-4 w-4" />
            新增簽到
          </button>

          {/* Page indicator */}
          <div className="absolute top-6 left-6 z-30 text-sm text-white/40">
            {currentPage + 1} / {totalPages}
          </div>

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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`h-2.5 w-2.5 cursor-pointer rounded-full transition-all ${
                    i === currentPage ? "scale-125 bg-white/80" : "bg-white/30"
                  }`}
                />
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
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
    newX = Math.max(0, Math.min(newX, boardRect.width - 144))
    newY = Math.max(0, Math.min(newY, boardRect.height - 144))

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
        className={`pointer-events-none relative h-36 w-36 ${note.color} p-3 shadow-2xl transition-shadow duration-200 ${
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-[90vw] max-w-lg rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer text-slate-400 transition-colors hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="mb-4 text-xl font-bold text-slate-800">留下你的塗鴉</h3>

        {/* Author name input */}
        <input
          type="text"
          placeholder="你的名字（選填）"
          value={authorName}
          onChange={(e) => onAuthorChange(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-mint"
        />

        {/* Sticky note color picker */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-slate-500">便利貼顏色：</span>
          {STICKY_RAW_COLORS.map((color, i) => (
            <button
              key={color}
              onClick={() => onColorChange(i)}
              className={`h-7 w-7 cursor-pointer rounded-full border-2 transition-transform ${
                selectedColor === i ? "scale-110 border-slate-800" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Canvas */}
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <CanvasDraw
            ref={canvasRef}
            brushRadius={2}
            brushColor="#333"
            lazyRadius={0}
            canvasWidth={440}
            canvasHeight={300}
            backgroundColor="#ffffff"
            hideGrid
          />
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={onClear}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Eraser className="h-4 w-4" />
            清除
          </button>
          <button
            onClick={onSave}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#122018] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a3025]"
          >
            <Check className="h-4 w-4" />
            完成
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
