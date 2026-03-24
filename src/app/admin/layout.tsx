"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LogOut } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [username, setUsername] = useState("")

  // Skip auth check on login page
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage) {
      setAuthenticated(true) // don't block login page
      return
    }

    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setAuthenticated(true)
          setUsername(data.username)
        } else {
          router.replace("/admin/login")
        }
      })
      .catch(() => router.replace("/admin/login"))
  }, [isLoginPage, router])

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.replace("/admin/login")
  }

  // Login page renders without sidebar
  if (isLoginPage) return <>{children}</>

  // Loading state
  if (authenticated === null) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
      >
        <p className="text-muted-foreground">載入中...</p>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      <aside className="flex w-64 flex-col border-r border-border bg-sidebar p-6">
        <h2 className="text-lg font-bold text-sidebar-foreground">Greetings, <br></br> {username}</h2>
        <nav className="mt-6 flex flex-1 flex-col gap-4">
          <a
            href="/admin"
            className={`text-sm transition-colors ${pathname === "/admin" ? "font-medium text-sidebar-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}`}
          >
            儀表板
          </a>
          <a
            href="/admin/hero"
            className={`text-sm transition-colors ${pathname === "/admin/hero" ? "font-medium text-sidebar-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}`}
          >
            首頁橫幅
          </a>
          <a
            href="/admin/timeline"
            className={`text-sm transition-colors ${pathname === "/admin/timeline" ? "font-medium text-sidebar-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}`}
          >
            時間線
          </a>
          <a
            href="/admin/activities"
            className={`text-sm transition-colors ${pathname === "/admin/activities" ? "font-medium text-sidebar-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}`}
          >
            社團特色
          </a>
          <a
            href="/admin/members"
            className={`text-sm transition-colors ${pathname === "/admin/members" ? "font-medium text-sidebar-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}`}
          >
            成員
          </a>
          
          <a
            href="/admin/gallery"
            className={`text-sm transition-colors ${pathname === "/admin/gallery" ? "font-medium text-sidebar-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}`}
          >
            畫廊
          </a>
          <a
            href="/admin/guestbook"
            className={`text-sm transition-colors ${pathname === "/admin/guestbook" ? "font-medium text-sidebar-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}`}
          >
            簽到簿
          </a>
        </nav>

        {/* Bottom: user & logout */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-sidebar-foreground/70">{username}</span>
            <button
              onClick={handleLogout}
              className="cursor-pointer text-sidebar-foreground/50 transition-colors hover:text-red-500"
              title="登出"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
