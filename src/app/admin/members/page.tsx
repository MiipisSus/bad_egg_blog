"use client"

import { useState, useEffect, useCallback } from "react"
import type { Member } from "@/types/member"
import { Pencil, Trash2, Plus, X, Upload } from "lucide-react"

const ROLE_OPTIONS = ["一郎", "二郎", "三郎", "四郎", "五郎"] as const

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
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<MemberForm>(emptyForm)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [nameCardPreview, setNameCardPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const fetchMembers = useCallback(async () => {
    const res = await fetch("/api/members")
    const data = await res.json()
    setMembers(data.members)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

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
    if (!confirm("Are you sure you want to delete this member?")) return

    const res = await fetch(`/api/members/${id}`, { method: "DELETE" })
    const data = await res.json()

    if (res.ok) {
      setMessage({ text: data.message, type: "success" })
      fetchMembers()
    } else {
      setMessage({ text: data.error || "Delete failed", type: "error" })
    }
  }

  function handleFileChange(field: "image" | "nameCard", file: File | null) {
    setForm((prev) => ({ ...prev, [field]: file }))
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (field === "image") setImagePreview(e.target?.result as string)
        else setNameCardPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">{members.length} members total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {/* Toast message */}
      {message && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Image</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    {member.image ? (
                      <img src={member.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{member.role}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(member)} className="mr-2 cursor-pointer text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(member.id)} className="cursor-pointer text-muted-foreground hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No members yet. Click &quot;Add Member&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6 shadow-xl">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 cursor-pointer text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold">{editingId ? "Edit Member" : "Add Member"}</h2>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="text-sm font-medium">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              {/* Role (enum select) */}
              <div>
                <label className="text-sm font-medium">Role *</label>
                <select
                  required
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="text-sm font-medium">Photo</label>
                <div className="mt-1 flex items-center gap-3">
                  {imagePreview && (
                    <img src={imagePreview} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground/40">
                    <Upload className="h-4 w-4" />
                    Choose file
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange("image", e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              {/* NameCard upload */}
              <div>
                <label className="text-sm font-medium">Name Card</label>
                <div className="mt-1 flex items-center gap-3">
                  {nameCardPreview && (
                    <img src={nameCardPreview} alt="" className="h-16 w-24 rounded-lg object-cover" />
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground/40">
                    <Upload className="h-4 w-4" />
                    Choose file
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange("nameCard", e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="mt-2 cursor-pointer rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Member" : "Create Member"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
