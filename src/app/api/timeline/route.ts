import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// GET /api/timeline
export async function GET() {
  const items = await prisma.timeline.findMany({
    orderBy: { sortIndex: "asc" },
  })
  return NextResponse.json({ items })
}

// POST /api/timeline
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const title = formData.get("title") as string
    const date = formData.get("date") as string | null
    const imageFile = formData.get("image") as File | null

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    let imagePath: string | null = null
    if (imageFile && imageFile.size > 0) {
      imagePath = await saveFile(imageFile)
    }

    const maxSort = await prisma.timeline.aggregate({ _max: { sortIndex: true } })
    const sortIndex = (maxSort._max.sortIndex ?? -1) + 1

    const item = await prisma.timeline.create({
      data: { title, date: date || null, image: imagePath, sortIndex },
    })

    return NextResponse.json({ item, message: "Timeline item created" }, { status: 201 })
  } catch (error) {
    console.error("Failed to create timeline item:", error)
    return NextResponse.json({ error: "Failed to create timeline item" }, { status: 500 })
  }
}

async function saveFile(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "timeline")
  await mkdir(uploadDir, { recursive: true })
  const ext = path.extname(file.name) || ".png"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  const filepath = path.join(uploadDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)
  return `/uploads/timeline/${filename}`
}
