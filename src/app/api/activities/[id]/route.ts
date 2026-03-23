import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.activity.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const formData = await request.formData()
    const title = formData.get("title") as string | null
    const description = formData.get("description") as string | null
    const imageFile = formData.get("image") as File | null

    const data: Record<string, string | null> = {}
    if (title !== null) data.title = title
    if (description !== null) data.description = description || null

    if (imageFile && imageFile.size > 0) {
      await deleteFile(existing.image)
      data.image = await saveFile(imageFile)
    }

    const activity = await prisma.activity.update({ where: { id: Number(id) }, data })
    return NextResponse.json({ activity, message: "Activity updated" })
  } catch (error) {
    console.error("Failed to update activity:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.activity.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await deleteFile(existing.image)
    await prisma.activity.delete({ where: { id: Number(id) } })
    return NextResponse.json({ message: "Activity deleted" })
  } catch (error) {
    console.error("Failed to delete activity:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

async function saveFile(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "activities")
  await mkdir(uploadDir, { recursive: true })
  const ext = path.extname(file.name) || ".png"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))
  return `/uploads/activities/${filename}`
}

async function deleteFile(publicPath: string) {
  try { await unlink(path.join(process.cwd(), "public", publicPath)) } catch { /* ignore */ }
}
