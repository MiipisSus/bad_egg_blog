import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// GET /api/admin/me — check if logged in
export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true, username: session.value })
}
