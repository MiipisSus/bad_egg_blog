"use client"

import { useState, useEffect, useCallback } from "react"
import type { Member } from "@/types/member"
import { Pencil, Trash2, Plus, X, Upload, GripVertical, CreditCard } from "lucide-react"
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

const ROLE_OPTIONS = ["一郎", "二郎", "三郎", "四郎", "五郎"] as const
const LEADER_ROLES = ["一郎", "二郎", "三郎"]
const PRIORITY_ROLES = ["四郎", "五郎"]

type Tab = "all" | "leaders" | "community"

interface MemberForm {
  name: string
  role: string
  bio: string
  image: File | null
  nameCard: File | null
}

const emptyForm: MemberForm = {
  name: "",
  role: ROLE_OPTIONS[0],
  bio: "",
  image: null,
  nameCard: null,
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("all")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<MemberForm>(emptyForm)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [nameCardPreview, setNameCardPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropField, setCropField] = useState<"image" | "nameCard">("image")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const fetchMembers = useCallback(async () => {
    const res = await fetch("/api/members")
    const data = await res.json()
    setMembers(data.members)
    setLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // Derived lists
  const leaders = members.filter((m) => LEADER_ROLES.includes(m.role))
  const priorityMembers = members
    .filter((m) => PRIORITY_ROLES.includes(m.role))
    .sort((a, b) => PRIORITY_ROLES.indexOf(a.role) - PRIORITY_ROLES.indexOf(b.role))
  const regularMembers = members
    .filter((m) => !LEADER_ROLES.includes(m.role) && !PRIORITY_ROLES.includes(m.role))
    .sort((a, b) => a.id - b.id)
  const communityMembers = [...priorityMembers, ...regularMembers]

  const displayMembers = tab === "leaders" ? leaders : tab === "community" ? communityMembers : members

  // Drag end handler for leaders
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = leaders.findIndex((m) => m.id === active.id)
    const newIndex = leaders.findIndex((m) => m.id === over.id)
    const reordered = arrayMove(leaders, oldIndex, newIndex)

    // Optimistic update
    const newMembers = members.map((m) => {
      const leaderIdx = reordered.findIndex((l) => l.id === m.id)
      if (leaderIdx >= 0) return { ...m, sortIndex: leaderIdx }
      return m
    })
    // Re-sort: leaders by new sortIndex, then community
    const newLeaders = newMembers.filter((m) => LEADER_ROLES.includes(m.role)).sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
    const rest = newMembers.filter((m) => !LEADER_ROLES.includes(m.role))
    setMembers([...newLeaders, ...rest])

    // Persist
    const ids = reordered.map((m) => m.id)
    const res = await fetch("/api/members/sort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })

    if (res.ok) {
      setMessage({ text: "排序已儲存", type: "success" })
    } else {
      setMessage({ text: "Failed to save sort order", type: "error" })
      fetchMembers() // rollback
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setImagePreview(null)
    setNameCardPreview(null)
    setShowModal(true)
  }

  function openEdit(member: Member) {
    setEditingId(member.id)
    setForm({
      name: member.name,
      role: member.role,
      bio: member.bio || "",
      image: null,
      nameCard: null,
    })
    setImagePreview(member.image || null)
    setNameCardPreview(member.nameCard || null)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData()
    formData.append("name", form.name)
    formData.append("role", form.role)
    formData.append("bio", form.bio)
    if (form.image) formData.append("image", form.image)
    if (form.nameCard) formData.append("nameCard", form.nameCard)

    const url = editingId ? `/api/members/${editingId}` : "/api/members"
    const method = editingId ? "PUT" : "POST"

    const res = await fetch(url, { method, body: formData })
    const data = await res.json()
    setSaving(false)

    if (res.ok) {
      setMessage({ text: data.message, type: "success" })
      setShowModal(false)
      fetchMembers()
    } else {
      setMessage({ text: data.error || "Operation failed", type: "error" })
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此成員？")) return

    const res = await fetch(`/api/members/${id}`, { method: "DELETE" })
    const data = await res.json()

    if (res.ok) {
      setMessage({ text: data.message, type: "success" })
      fetchMembers()
    } else {
      setMessage({ text: data.error || "刪除失敗", type: "error" })
    }
  }

  function handleFileChange(field: "image" | "nameCard", file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      setCropField(field)
      setCropSrc(src)
    }
    reader.readAsDataURL(file)
  }

  function handleCropConfirm(blob: Blob) {
    const file = new File([blob], `${cropField}.png`, { type: "image/png" })
    setForm((prev) => ({ ...prev, [cropField]: file }))
    const url = URL.createObjectURL(blob)
    if (cropField === "image") setImagePreview(url)
    else setNameCardPreview(url)
    setCropSrc(null)
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "全部", count: members.length },
    { key: "leaders", label: "幹部", count: leaders.length },
    { key: "community", label: "一般成員", count: communityMembers.length },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">成員管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">{members.length} 位成員</p>
        </div>
        <button
          onClick={openCreate}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4" />
          新增
        </button>
      </div>

      {/* Toast - fixed floating */}
      {message && (
        <div className={`fixed top-6 right-6 z-100 rounded-lg px-5 py-3 text-sm font-medium shadow-lg backdrop-blur-md ${message.type === "success" ? "bg-green-100/70 text-green-800" : "bg-red-100/70 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`cursor-pointer px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-muted-foreground">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="mt-8 text-muted-foreground">載入中...</p>
      ) : tab === "leaders" ? (
        /* Leaders tab: drag-and-drop */
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={leaders.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="w-10 px-2 py-3" />
                    <th className="px-4 py-3 text-left font-medium">圖片</th>
                    <th className="px-4 py-3 text-left font-medium">遊戲 ID</th>
                    <th className="px-4 py-3 text-left font-medium">職位</th>
                    <th className="px-4 py-3 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">尚無成員。</td></tr>
                  ) : (
                    leaders.map((member) => (
                      <SortableRow key={member.id} member={member} onEdit={openEdit} onDelete={handleDelete} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SortableContext>
          <p className="mt-2 text-xs text-muted-foreground">拖曳列以重新排序幹部，變更將自動儲存。</p>
        </DndContext>
      ) : (
        /* All / Community tab: static table */
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">圖片</th>
                <th className="px-4 py-3 text-left font-medium">遊戲 ID</th>
                <th className="px-4 py-3 text-left font-medium">階級</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {displayMembers.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">尚無成員。</td></tr>
              ) : (
                displayMembers.map((member) => (
                  <tr key={member.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      {member.image ? (
                        <img src={member.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">N/A</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{member.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{member.role}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(member)} className="mr-2 cursor-pointer text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(member.id)} className="cursor-pointer text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal with preview */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-background shadow-xl">
            {/* Left: Form */}
            <div className="flex-1 overflow-y-auto p-6">
              <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 cursor-pointer text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold">{editingId ? "編輯成員" : "新增成員"}</h2>

              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium">遊戲 ID *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">職位 *</label>
                  <select
                    required
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">簡介</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Photo</label>
                  <div className="mt-1 flex items-center gap-3">
                    {imagePreview && (
                      <div className="group/img relative h-16 w-16 overflow-hidden border border-border">
                        <img src={imagePreview} alt="" className="h-full w-full object-cover transition-[filter] duration-200 group-hover/img:brightness-50" />
                        <button
                          type="button"
                          onClick={() => { setCropField("image"); setCropSrc(imagePreview) }}
                          className="absolute inset-0 flex cursor-pointer items-center justify-center text-[10px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover/img:opacity-100"
                        >
                          裁切
                        </button>
                      </div>
                    )}
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground/40">
                      <Upload className="h-4 w-4" />
                      選擇檔案
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange("image", e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {LEADER_ROLES.includes(form.role)
                      ? "建議圖片比例 16:9（如 1600×900），橫式顯示效果最佳。"
                      : "建議圖片比例 1:1（如 800×800），正方形顯示效果最佳。"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Name Card</label>
                  <div className="mt-1 flex items-center gap-3">
                    {nameCardPreview && (
                      <div className="group/img relative h-16 w-24 overflow-hidden border border-border">
                        <img src={nameCardPreview} alt="" className="h-full w-full object-cover transition-[filter] duration-200 group-hover/img:brightness-50" />
                        <button
                          type="button"
                          onClick={() => { setCropField("nameCard"); setCropSrc(nameCardPreview) }}
                          className="absolute inset-0 flex cursor-pointer items-center justify-center text-[10px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover/img:opacity-100"
                        >
                          裁切
                        </button>
                      </div>
                    )}
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground/40">
                      <Upload className="h-4 w-4" />
                      選擇檔案
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange("nameCard", e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 cursor-pointer rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                >
                  {saving ? "儲存中..." : editingId ? "更新" : "建立"}
                </button>
              </form>
            </div>

            {/* Right: Live Preview */}
            <div className="flex w-72 flex-col items-center justify-center gap-6 border-l border-border bg-muted/30 p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Preview</p>

              {/* Leader style preview */}
              {LEADER_ROLES.includes(form.role) ? (
                <div className="relative h-64 w-48 overflow-hidden bg-white p-1.5 shadow-md" style={{ transform: "rotate(-2deg)" }}>
                  <div className="relative h-full w-full overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="" className="absolute inset-0 h-full w-full object-cover object-left" />
                    ) : (
                      <div className="absolute inset-0 bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
                      <span className="mb-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-medium text-foreground shadow-sm">
                        {form.role || "Role"}
                      </span>
                      <span
                        className="text-center text-sm font-bold"
                        style={{
                          transform: "rotate(-3deg)",
                          textShadow: "-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white",
                          color: "#1e293b",
                        }}
                      >
                        {form.name || "Name"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Community polaroid style preview */
                <div style={{ transform: "rotate(-3deg)" }}>
                  <div className="w-44 bg-white p-1.5 pb-8 shadow-md">
                    <div className="relative aspect-square overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-bold text-muted-foreground">
                          {form.name ? form.name.charAt(0) : "?"}
                        </div>
                      )}
                      {nameCardPreview && (
                        <CreditCard className="absolute top-1.5 right-1.5 h-4 w-4 text-white drop-shadow-md" />
                      )}
                    </div>
                    <p className="mt-2 text-center text-xs font-semibold text-slate-700">
                      {form.name || "Name"}
                    </p>
                    <p className="mt-1 text-center text-xs text-slate-400">
                      {form.role || "Role"}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-center text-[10px] text-muted-foreground">
                {LEADER_ROLES.includes(form.role) ? "Leader accordion style" : "Polaroid card style"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Crop modal */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          defaultAspect={
            cropField === "image"
              ? LEADER_ROLES.includes(form.role) ? 16 / 9 : 1
              : undefined
          }
          onCrop={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  )
}

// ─── Sortable Row for Leaders ─────────────────────────────────────
function SortableRow({ member, onEdit, onDelete }: { member: Member; onEdit: (m: Member) => void; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: member.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border last:border-0 bg-background">
      <td className="px-2 py-3">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-4 py-3">
        {member.image ? (
          <img src={member.image} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">N/A</div>
        )}
      </td>
      <td className="px-4 py-3 font-medium">{member.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{member.role}</td>
      <td className="px-4 py-3 text-right">
        <button onClick={() => onEdit(member)} className="mr-2 cursor-pointer text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => onDelete(member.id)} className="cursor-pointer text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </td>
    </tr>
  )
}
