import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function GET() {
  const activities = await prisma.activity.findMany({ orderBy: { sortIndex: "asc" } })
  return NextResponse.json({ activities })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const imageFile = formData.get("image") as File | null

    if (!title || !imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: "Title and image are required" }, { status: 400 })
    }

    const imagePath = await saveFile(imageFile)
    const maxSort = await prisma.activity.aggregate({ _max: { sortIndex: true } })
    const sortIndex = (maxSort._max.sortIndex ?? -1) + 1

    const activity = await prisma.activity.create({
      data: { title, description: description || null, image: imagePath, sortIndex },
    })

    return NextResponse.json({ activity, message: "Activity created" }, { status: 201 })
  } catch (error) {
    console.error("Failed to create activity:", error)
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
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
