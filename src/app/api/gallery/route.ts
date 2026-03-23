import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// GET /api/gallery — newest first
export async function GET() {
  const albums = await prisma.galleryAlbum.findMany({
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { sortIndex: "asc" } } },
  })
  return NextResponse.json({ albums })
}

// POST /api/gallery — create album with multiple images
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const date = formData.get("date") as string | null
    const imageFiles = formData.getAll("images") as File[]

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (!imageFiles.length || !imageFiles[0].size) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 })
    }

    const imagePaths: string[] = []
    for (const file of imageFiles) {
      if (file.size > 0) {
        imagePaths.push(await saveFile(file))
      }
    }

    const album = await prisma.galleryAlbum.create({
      data: {
        title,
        description: description || null,
        date: date || null,
        images: {
          create: imagePaths.map((p, i) => ({ path: p, sortIndex: i })),
        },
      },
      include: { images: true },
    })

    return NextResponse.json({ album, message: "Album created" }, { status: 201 })
  } catch (error) {
    console.error("Failed to create album:", error)
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 })
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
