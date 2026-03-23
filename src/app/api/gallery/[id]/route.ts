import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"

// PUT /api/gallery/[id] — update album info + add new images
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const albumId = Number(id)
    const existing = await prisma.galleryAlbum.findUnique({ where: { id: albumId }, include: { images: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const formData = await request.formData()
    const title = formData.get("title") as string | null
    const description = formData.get("description") as string | null
    const date = formData.get("date") as string | null
    const newImageFiles = formData.getAll("images") as File[]
    const removeImageIds = formData.get("removeImageIds") as string | null // comma-separated IDs

    const data: Record<string, string | null> = {}
    if (title !== null) data.title = title
    if (description !== null) data.description = description || null
    if (date !== null) data.date = date || null

    // Remove specific images
    if (removeImageIds) {
      const ids = removeImageIds.split(",").map(Number).filter(Boolean)
      for (const imgId of ids) {
        const img = existing.images.find((i) => i.id === imgId)
        if (img) {
          await deleteFile(img.path)
          await prisma.galleryImage.delete({ where: { id: imgId } })
        }
      }
    }

    // Add new images
    if (newImageFiles.length && newImageFiles[0].size > 0) {
      const currentMax = existing.images.length
      for (let i = 0; i < newImageFiles.length; i++) {
        if (newImageFiles[i].size > 0) {
          const p = await saveFile(newImageFiles[i])
          await prisma.galleryImage.create({
            data: { path: p, sortIndex: currentMax + i, albumId },
          })
        }
      }
    }

    const album = await prisma.galleryAlbum.update({
      where: { id: albumId },
      data,
      include: { images: { orderBy: { sortIndex: "asc" } } },
    })

    return NextResponse.json({ album, message: "Album updated" })
  } catch (error) {
    console.error("Failed to update album:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

// DELETE /api/gallery/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.galleryAlbum.findUnique({
      where: { id: Number(id) },
      include: { images: true },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Delete all image files
    for (const img of existing.images) {
      await deleteFile(img.path)
    }

    // Cascade deletes images
    await prisma.galleryAlbum.delete({ where: { id: Number(id) } })
    return NextResponse.json({ message: "Album deleted" })
  } catch (error) {
    console.error("Failed to delete album:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

async function saveFile(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "gallery")
  await mkdir(uploadDir, { recursive: true })
  const ext = path.extname(file.name) || ".png"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))
  return `/uploads/gallery/${filename}`
}

async function deleteFile(publicPath: string) {
  try { await unlink(path.join(process.cwd(), "public", publicPath)) } catch { /* ignore */ }
}
