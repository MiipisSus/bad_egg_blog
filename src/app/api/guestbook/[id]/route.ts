import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { unlink } from "fs/promises"
import path from "path"

// PATCH /api/guestbook/:id — update position/zIndex
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { posX, posY, zIndex } = body

    const data: Record<string, number> = {}
    if (posX !== undefined) data.posX = posX
    if (posY !== undefined) data.posY = posY
    if (zIndex !== undefined) data.zIndex = zIndex

    const note = await prisma.stickyNote.update({
      where: { id: parseInt(id) },
      data,
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error("Failed to update sticky note:", error)
    return NextResponse.json({ error: "Failed to update sticky note" }, { status: 500 })
  }
}

// DELETE /api/guestbook/:id — delete (checks visitorId or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const visitorId = searchParams.get("visitorId")
    const isAdmin = request.cookies.get("admin_session")?.value

    const note = await prisma.stickyNote.findUnique({
      where: { id: parseInt(id) },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    // Only the owner (by visitorId) or admin can delete
    if (!isAdmin && note.visitorId !== visitorId) {
      return NextResponse.json({ error: "Not authorized to delete this note" }, { status: 403 })
    }

    // Delete image file
    if (note.image) {
      const filePath = path.join(process.cwd(), "public", note.image)
      try {
        await unlink(filePath)
      } catch {
        // File may not exist, ignore
      }
    }

    await prisma.stickyNote.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: "Note deleted" })
  } catch (error) {
    console.error("Failed to delete sticky note:", error)
    return NextResponse.json({ error: "Failed to delete sticky note" }, { status: 500 })
  }
}
