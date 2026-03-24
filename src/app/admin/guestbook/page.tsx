"use client"

import { useState, useEffect, useCallback } from "react"
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react"

interface StickyNote {
  id: number
  image: string
  posX: number
  posY: number
  zIndex: number
  page: number
  author: string | null
  color: string
  visitorId: string
  ipAddress: string | null
  createdAt: string
}

export default function AdminGuestbookPage() {
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/guestbook")
    const data = await res.json()
    setNotes(data.notes)
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])
  useEffect(() => {
    if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t) }
  }, [message])

  // Group notes by page
  const pages = notes.reduce<Record<number, StickyNote[]>>((acc, note) => {
    if (!acc[note.page]) acc[note.page] = []
    acc[note.page].push(note)
    return acc
  }, {})
  const pageNumbers = Object.keys(pages).map(Number).sort((a, b) => a - b)
  const totalPages = pageNumbers.length || 1
  const displayPage = pageNumbers[currentPage] ?? 0
  const pageNotes = pages[displayPage] || []

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此便利貼？")) return
    try {
      const res = await fetch(`/api/guestbook/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setMessage({ text: "已刪除", type: "success" })
      fetchNotes()
    } catch {
      setMessage({ text: "刪除失敗", type: "error" })
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">簽到簿管理</h1>
      </div>

      {/* Toast */}
      {message && (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm font-medium text-white ${message.type === "success" ? "bg-green-500/80" : "bg-red-500/80"}`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="mb-4 rounded-lg border bg-gray-50 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{notes.length}</div>
            <div className="text-xs text-gray-500">總便利貼數</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{pageNumbers.length}</div>
            <div className="text-xs text-gray-500">頁數</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{new Set(notes.map((n) => n.visitorId)).size}</div>
            <div className="text-xs text-gray-500">訪客數</div>
          </div>
        </div>
      </div>

      {/* Page switcher */}
      {totalPages > 1 && (
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => setCurrentPage((p) => (p - 1 + totalPages) % totalPages)}
            className="rounded p-1 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600">
            第 {currentPage + 1} / {totalPages} 頁
          </span>
          <button
            onClick={() => setCurrentPage((p) => (p + 1) % totalPages)}
            className="rounded p-1 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">載入中...</p>
      ) : notes.length === 0 ? (
        <p className="text-gray-500">尚無便利貼</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">預覽</th>
                <th className="px-4 py-3 font-medium">作者</th>
                <th className="px-4 py-3 font-medium">顏色</th>
                <th className="px-4 py-3 font-medium">位置</th>
                <th className="px-4 py-3 font-medium">Visitor ID</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">建立時間</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pageNotes.map((note) => (
                <tr key={note.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div
                      className="h-16 w-16 rounded border"
                      style={{ backgroundColor: note.color }}
                    >
                      <img
                        src={note.image}
                        alt="sticky note"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">{note.author || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded border" style={{ backgroundColor: note.color }} />
                      <span className="text-xs text-gray-500">{note.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    ({Math.round(note.posX)}, {Math.round(note.posY)})
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{note.visitorId.slice(0, 12)}...</code>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{note.ipAddress || "-"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleString("zh-TW")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
