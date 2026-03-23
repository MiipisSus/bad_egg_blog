"use client"

import { useState, useEffect, useCallback } from "react"
import { Pencil, Trash2, Plus, X, Upload, GripVertical, ImageIcon } from "lucide-react"
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface TimelineItem {
  id: number
  title: string
  date: string | null
  image: string | null
  sortIndex: number
}

interface ItemForm {
  title: string
  date: string
  image: File | null
}

const emptyForm: ItemForm = { title: "", date: "", image: null }

export default function AdminTimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ItemForm>(emptyForm)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/timeline")
    const data = await res.json()
    setItems(data.items)
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => {
    if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t) }
  }, [message])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setImagePreview(null)
    setShowModal(true)
  }

  function openEdit(item: TimelineItem) {
    setEditingId(item.id)
    setForm({ title: item.title, date: item.date || "", image: null })
    setImagePreview(item.image)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData()
    formData.append("title", form.title)
    formData.append("date", form.date)
    if (form.image) formData.append("image", form.image)

    const url = editingId ? `/api/timeline/${editingId}` : "/api/timeline"
    const method = editingId ? "PUT" : "POST"
    const res = await fetch(url, { method, body: formData })
    const data = await res.json()
    setSaving(false)

    if (res.ok) {
      setMessage({ text: data.message, type: "success" })
      setShowModal(false)
      fetchItems()
    } else {
      setMessage({ text: data.error || "Failed", type: "error" })
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除？")) return
    const res = await fetch(`/api/timeline/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (res.ok) { setMessage({ text: data.message, type: "success" }); fetchItems() }
    else setMessage({ text: data.error || "Delete failed", type: "error" })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)

    const res = await fetch("/api/timeline/sort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((i) => i.id) }),
    })

    if (res.ok) setMessage({ text: "Sort order saved", type: "success" })
    else { setMessage({ text: "Failed to save sort order", type: "error" }); fetchItems() }
  }

  function handleFileChange(file: File | null) {
    setForm((p) => ({ ...p, image: file }))
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      {/* Toast */}
      {message && (
        <div className={`fixed top-6 right-6 z-100 rounded-lg px-5 py-3 text-sm font-medium shadow-lg backdrop-blur-md ${message.type === "success" ? "bg-green-100/70 text-green-800" : "bg-red-100/70 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} milestones — drag to reorder</p>
        </div>
        <button onClick={openCreate} className="flex cursor-pointer items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
          <Plus className="h-4 w-4" /> Add Milestone
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No milestones yet.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-6 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="w-10 px-2 py-3" />
                    <th className="w-8 px-2 py-3 text-center font-medium">#</th>
                    <th className="px-4 py-3 text-left font-medium">Image</th>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <SortableRow key={item.id} item={item} index={index} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6 shadow-xl">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 cursor-pointer text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold">{editingId ? "Edit Milestone" : "Add Milestone"}</h2>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date</label>
                <div className="mt-1 flex gap-1.5">
                  {[
                    { label: "Today", value: new Date().toISOString().slice(0, 10) },
                    { label: "Yesterday", value: new Date(Date.now() - 86400000).toISOString().slice(0, 10) },
                    { label: "This Month", value: new Date().toISOString().slice(0, 7) },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, date: btn.value }))}
                      className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                        form.date === btn.value
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                <input
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  placeholder="e.g. 2024-03 or 2024-03-15"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <p className="mt-1 text-xs text-muted-foreground">Flexible: full date (2024-03-15) or month only (2024-03)</p>
              </div>

              <div>
                <label className="text-sm font-medium">Image (optional)</label>
                <div className="mt-1 flex items-center gap-3">
                  {imagePreview && <img src={imagePreview} alt="" className="h-16 w-20 rounded-lg object-cover" />}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground/40">
                    <Upload className="h-4 w-4" /> Choose file
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              <button type="submit" disabled={saving} className="mt-2 cursor-pointer rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SortableRow({ item, index, onEdit, onDelete }: { item: TimelineItem; index: number; onEdit: (i: TimelineItem) => void; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border last:border-0 bg-background">
      <td className="px-2 py-3">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-2 py-3 text-center text-muted-foreground">{index + 1}</td>
      <td className="px-4 py-3">
        {item.image ? (
          <img src={item.image} alt="" className="h-10 w-14 rounded object-cover" />
        ) : (
          <div className="flex h-10 w-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground">—</div>
        )}
      </td>
      <td className="px-4 py-3 font-medium">{item.title}</td>
      <td className="px-4 py-3 text-muted-foreground">{item.date || "—"}</td>
      <td className="px-4 py-3 text-right">
        <button onClick={() => onEdit(item)} className="mr-2 cursor-pointer text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => onDelete(item.id)} className="cursor-pointer text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </td>
    </tr>
  )
}
