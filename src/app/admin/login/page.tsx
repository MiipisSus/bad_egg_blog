"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      router.push("/admin")
      router.refresh()
    } else {
      setError(data.error || "帳號或密碼錯誤")
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-muted/30"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      <div className="w-full max-w-sm rounded-xl bg-background p-8 shadow-lg">
        <h1 className="text-center text-xl font-bold">管理員登入</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">登入以管理您的網站</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-red-100/70 px-4 py-2.5 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">帳號</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="text-sm font-medium">密碼</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 cursor-pointer rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {loading ? "載入中..." : "登入"}
          </button>
        </form>
      </div>
    </div>
  )
}
