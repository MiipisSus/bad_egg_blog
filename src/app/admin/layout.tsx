export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* Sidebar placeholder */}
      <aside className="w-64 border-r border-border bg-sidebar p-6">
        <h2 className="text-lg font-bold text-sidebar-foreground">Admin</h2>
        <nav className="mt-6 flex flex-col gap-2">
          <a href="/admin" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
            Dashboard
          </a>
          <a href="/admin/members" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
            Members
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
