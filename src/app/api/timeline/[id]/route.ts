import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"

// PUT /api/timeline/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.timeline.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const formData = await request.formData()
    const title = formData.get("title") as string | null
    const date = formData.get("date") as string | null
    const imageFile = formData.get("image") as File | null
    const removeImage = formData.get("removeImage") === "true"

    const data: Record<string, string | null> = {}
    if (title !== null) data.title = title
    if (date !== null) data.date = date || null

    if (imageFile && imageFile.size > 0) {
      if (existing.image) await deleteFile(existing.image)
      data.image = await saveFile(imageFile)
    } else if (removeImage && existing.image) {
      await deleteFile(existing.image)
      data.image = null
    }

    const item = await prisma.timeline.update({ where: { id: Number(id) }, data })
    return NextResponse.json({ item, message: "Timeline item updated" })
  } catch (error) {
    console.error("Failed to update timeline item:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

// DELETE /api/timeline/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.timeline.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (existing.image) await deleteFile(existing.image)
    await prisma.timeline.delete({ where: { id: Number(id) } })

    return NextResponse.json({ message: "Timeline item deleted" })
  } catch (error) {
    console.error("Failed to delete timeline item:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

async function saveFile(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "timeline")
  await mkdir(uploadDir, { recursive: true })
  const ext = path.extname(file.name) || ".png"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))
  return `/uploads/timeline/${filename}`
}

async function deleteFile(publicPath: string) {
  try { await unlink(path.join(process.cwd(), "public", publicPath)) } catch { /* ignore */ }
}
