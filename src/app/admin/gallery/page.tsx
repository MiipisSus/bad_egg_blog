"use client"

import { useState, useEffect, useCallback } from "react"
import { Pencil, Trash2, Plus, X, Upload, ImageIcon, Images, Crop } from "lucide-react"
import { ImageCropper } from "@/components/admin/image-cropper"

interface GalleryImage {
  id: number
  path: string
  sortIndex: number
}

interface Album {
  id: number
  title: string
  description: string | null
  date: string | null
  images: GalleryImage[]
  createdAt: string
}

interface AlbumForm {
  title: string
  description: string
  date: string
  newImages: File[]
  removeImageIds: number[]
}

const emptyForm: AlbumForm = { title: "", description: "", date: "", newImages: [], removeImageIds: [] }

export default function AdminGalleryPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [form, setForm] = useState<AlbumForm>(emptyForm)
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropTarget, setCropTarget] = useState<{ type: "new"; index: number } | { type: "existing"; imgId: number } | null>(null)

  const fetchAlbums = useCallback(async () => {
    const res = await fetch("/api/gallery")
    const data = await res.json()
    setAlbums(data.albums)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAlbums() }, [fetchAlbums])
  useEffect(() => {
    if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t) }
  }, [message])

  function openCreate() {
    setEditingAlbum(null)
    setForm(emptyForm)
    setNewImagePreviews([])
    setShowModal(true)
  }

  function openEdit(album: Album) {
    setEditingAlbum(album)
    setForm({ title: album.title, description: album.description || "", date: album.date || "", newImages: [], removeImageIds: [] })
    setNewImagePreviews([])
    setShowModal(true)
  }

  function handleNewImages(files: FileList | null) {
    if (!files) return
    const fileArr = Array.from(files)
    setForm((p) => ({ ...p, newImages: [...p.newImages, ...fileArr] }))

    for (const file of fileArr) {
      const reader = new FileReader()
      reader.onload = (e) => setNewImagePreviews((prev) => [...prev, e.target?.result as string])
      reader.readAsDataURL(file)
    }
  }

  function toggleRemoveImage(imgId: number) {
    setForm((p) => ({
      ...p,
      removeImageIds: p.removeImageIds.includes(imgId)
        ? p.removeImageIds.filter((id) => id !== imgId)
        : [...p.removeImageIds, imgId],
    }))
  }

  function handleGalleryCropConfirm(blob: Blob) {
    if (!cropTarget) return
    if (cropTarget.type === "new") {
      const file = new File([blob], "cropped.png", { type: "image/png" })
      const url = URL.createObjectURL(blob)
      setForm((p) => {
        const newImages = [...p.newImages]
        newImages[cropTarget.index] = file
        return { ...p, newImages }
      })
      setNewImagePreviews((p) => {
        const updated = [...p]
        updated[cropTarget.index] = url
        return updated
      })
    }
    // For existing images, we'd need a server-side re-upload — skip for now
    setCropSrc(null)
    setCropTarget(null)
  }

  function removeNewImage(index: number) {
    setForm((p) => ({
      ...p,
      newImages: p.newImages.filter((_, i) => i !== index),
    }))
    setNewImagePreviews((p) => p.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData()
    formData.append("title", form.title)
    formData.append("description", form.description)
    formData.append("date", form.date)
    for (const file of form.newImages) {
      formData.append("images", file)
    }
    if (editingAlbum && form.removeImageIds.length) {
      formData.append("removeImageIds", form.removeImageIds.join(","))
    }

    const url = editingAlbum ? `/api/gallery/${editingAlbum.id}` : "/api/gallery"
    const method = editingAlbum ? "PUT" : "POST"
    const res = await fetch(url, { method, body: formData })
    const data = await res.json()
    setSaving(false)

    if (res.ok) {
      setMessage({ text: data.message, type: "success" }); setShowModal(false); fetchAlbums()
    } else {
      setMessage({ text: data.error || "Failed", type: "error" })
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此相簿及所有照片？")) return
    const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (res.ok) { setMessage({ text: data.message, type: "success" }); fetchAlbums() }
    else setMessage({ text: data.error || "刪除失敗", type: "error" })
  }

  return (
    <div>
      {message && (
        <div className={`fixed top-6 right-6 z-100 rounded-lg px-5 py-3 text-sm font-medium shadow-lg backdrop-blur-md ${message.type === "success" ? "bg-green-100/70 text-green-800" : "bg-red-100/70 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">畫廊管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">{albums.length} 相簿</p>
        </div>
        <button onClick={openCreate} className="flex cursor-pointer items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
          <Plus className="h-4 w-4" /> 新增
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-muted-foreground">載入中...</p>
      ) : albums.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">尚無相簿。</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">縮圖</th>
                <th className="px-4 py-3 text-left font-medium">標題</th>
                <th className="px-4 py-3 text-left font-medium">張照片</th>
                <th className="px-4 py-3 text-left font-medium">日期</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {albums.map((album) => (
                <tr key={album.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    {album.images.length > 0 ? (
                      <div className="flex gap-0.5">
                        {album.images.slice(0, 3).map((img) => (
                          <img key={img.id} src={img.path} alt="" className="h-10 w-14 rounded object-cover" />
                        ))}
                        {album.images.length > 3 && (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                            +{album.images.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-10 w-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground">—</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{album.title}</p>
                    {album.description && <p className="mt-0.5 max-w-50 truncate text-xs text-muted-foreground">{album.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{album.images.length}</td>
                  <td className="px-4 py-3 text-muted-foreground">{album.date || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(album)} className="mr-2 cursor-pointer text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(album.id)} className="cursor-pointer text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6 shadow-xl">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 cursor-pointer text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold">{editingAlbum ? "編輯相簿" : "新增相簿"}</h2>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium">標題 *</label>
                <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
              </div>

              <div>
                <label className="text-sm font-medium">內文</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
              </div>

              <div>
                <label className="text-sm font-medium">日期</label>
                <div className="mt-1 flex gap-1.5">
                  {[
                    { label: "今天", value: new Date().toISOString().slice(0, 10) },
                    { label: "昨天", value: new Date(Date.now() - 86400000).toISOString().slice(0, 10) },
                    { label: "本月", value: new Date().toISOString().slice(0, 7) },
                  ].map((btn) => (
                    <button key={btn.label} type="button" onClick={() => setForm((p) => ({ ...p, date: btn.value }))}
                      className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${form.date === btn.value ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
                    >{btn.label}</button>
                  ))}
                </div>
                <input value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} placeholder="e.g. 2024-03 or 2024-03-15" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20" />
              </div>

              {/* Existing images (edit mode) */}
              {editingAlbum && editingAlbum.images.length > 0 && (
                <div>
                  <label className="text-sm font-medium">目前照片</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editingAlbum.images.filter((img) => !form.removeImageIds.includes(img.id)).map((img) => (
                      <div key={img.id} className="group/img relative h-20 w-20 overflow-hidden border border-border">
                        <img src={img.path} alt="" className="h-full w-full object-cover transition-[filter] duration-200 group-hover/img:brightness-50" />
                        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 transition-opacity duration-200 group-hover/img:opacity-100">
                          <button type="button" onClick={() => { setCropTarget({ type: "existing", imgId: img.id }); setCropSrc(img.path) }} className="cursor-pointer text-white hover:text-white/80">
                            <Crop className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => toggleRemoveImage(img.id)} className="cursor-pointer text-red-400 hover:text-red-300">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New images */}
              <div>
                <label className="text-sm font-medium">
                  {editingAlbum ? "新增更多照片" : "照片 *"}
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {newImagePreviews.map((src, i) => (
                    <div key={i} className="group/img relative h-20 w-20 overflow-hidden border border-border">
                      <img src={src} alt="" className="h-full w-full object-cover transition-[filter] duration-200 group-hover/img:brightness-50" />
                      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 transition-opacity duration-200 group-hover/img:opacity-100">
                        <button type="button" onClick={() => { setCropTarget({ type: "new", index: i }); setCropSrc(src) }} className="cursor-pointer text-white hover:text-white/80">
                          <Crop className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => removeNewImage(i)} className="cursor-pointer text-red-400 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border text-muted-foreground hover:border-foreground/40">
                    <Upload className="h-5 w-5" />
                    <span className="mt-1 text-[10px]">選擇檔案</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleNewImages(e.target.files)} />
                  </label>
                </div>
              </div>

              <button type="submit" disabled={saving} className="mt-2 cursor-pointer rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50">
                {saving ? "儲存中..." : editingAlbum ? "更新" : "建立"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Crop modal */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onCrop={handleGalleryCropConfirm}
          onCancel={() => { setCropSrc(null); setCropTarget(null) }}
        />
      )}
    </div>
  )
}
