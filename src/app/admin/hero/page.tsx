"use client"

import { useState, useEffect, useCallback } from "react"
import { Trash2, Plus, Upload, GripVertical, ImageIcon, Crop } from "lucide-react"
import { ImageCropper } from "@/components/admin/image-cropper"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Banner {
  id: number
  image: string
  sortIndex: number
}

export default function AdminHeroPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [recropId, setRecropId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const fetchBanners = useCallback(async () => {
    const res = await fetch("/api/hero-banners")
    const data = await res.json()
    setBanners(data.banners)
    setLoading(false)
  }, [])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  function handleFileSelect(file: File) {
    setRecropId(null)
    const reader = new FileReader()
    reader.onload = (e) => setCropSrc(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleRecrop(banner: Banner) {
    setRecropId(banner.id)
    setCropSrc(banner.image)
  }

  async function handleCropConfirm(blob: Blob) {
    const editingId = recropId
    setCropSrc(null)
    setRecropId(null)
    setUploading(true)
    const formData = new FormData()
    formData.append("image", blob, "banner.png")

    const url = editingId ? `/api/hero-banners/${editingId}` : "/api/hero-banners"
    const method = editingId ? "PATCH" : "POST"

    const res = await fetch(url, { method, body: formData })
    const data = await res.json()
    setUploading(false)

    if (res.ok) {
      setMessage({ text: data.message || "已更新", type: "success" })
      fetchBanners()
    } else {
      setMessage({ text: data.error || "上傳失敗", type: "error" })
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此 Banner？")) return

    const res = await fetch(`/api/hero-banners/${id}`, { method: "DELETE" })
    const data = await res.json()

    if (res.ok) {
      setMessage({ text: data.message, type: "success" })
      fetchBanners()
    } else {
      setMessage({ text: data.error || "刪除失敗", type: "error" })
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = banners.findIndex((b) => b.id === active.id)
    const newIndex = banners.findIndex((b) => b.id === over.id)
    const reordered = arrayMove(banners, oldIndex, newIndex)

    setBanners(reordered)

    const res = await fetch("/api/hero-banners/sort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((b) => b.id) }),
    })

    if (res.ok) {
      setMessage({ text: "排序已儲存", type: "success" })
    } else {
      setMessage({ text: "Failed to save sort order", type: "error" })
      fetchBanners()
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
          <h1 className="text-2xl font-bold">首頁橫幅</h1>
          <p className="mt-1 text-sm text-muted-foreground">{banners.length} 張橫幅 — 拖曳以重新排序</p>
        </div>
        <label className={`flex cursor-pointer items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <Plus className="h-4 w-4" />
          {uploading ? "上傳中..." : "新增"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
              e.target.value = ""
            }}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">建議圖片比例 3:2（如 1920×1280），橫式全幅顯示效果最佳。</p>

      {/* Banner List */}
      {loading ? (
        <p className="mt-8 text-muted-foreground">載入中...</p>
      ) : banners.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">尚無橫幅，請上傳一張。</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-6 flex flex-col gap-3">
              {banners.map((banner, index) => (
                <SortableBannerRow
                  key={banner.id}
                  banner={banner}
                  index={index}
                  onDelete={handleDelete}
                  onRecrop={handleRecrop}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Crop modal */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          defaultAspect={3 / 2}
          onCrop={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  )
}

function SortableBannerRow({ banner, index, onDelete, onRecrop }: { banner: Banner; index: number; onDelete: (id: number) => void; onRecrop: (banner: Banner) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 rounded-lg border border-border bg-background p-3"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
        <GripVertical className="h-5 w-5" />
      </button>

      <span className="w-8 text-center text-sm font-medium text-muted-foreground">#{index + 1}</span>

      <div className="group/img relative h-20 w-36 shrink-0 overflow-hidden rounded-md border border-border">
        <img src={banner.image} alt={`Banner ${index + 1}`} className="h-full w-full object-cover transition-[filter] duration-200 group-hover/img:brightness-50" />
        <button
          onClick={() => onRecrop(banner)}
          className="absolute inset-0 flex cursor-pointer items-center justify-center text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover/img:opacity-100"
        >
          <Crop className="h-4 w-4" />
        </button>
      </div>

      <p className="flex-1 truncate text-sm text-muted-foreground">{banner.image}</p>

      <button
        onClick={() => onDelete(banner.id)}
        className="cursor-pointer text-muted-foreground hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
