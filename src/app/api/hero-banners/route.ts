import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// GET /api/hero-banners
export async function GET() {
  const banners = await prisma.heroBanner.findMany({
    orderBy: { sortIndex: "asc" },
  })
  return NextResponse.json({ banners })
}

// POST /api/hero-banners (multipart/form-data)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File | null

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    const imagePath = await saveFile(imageFile)

    // Set sortIndex to be last
    const maxSort = await prisma.heroBanner.aggregate({ _max: { sortIndex: true } })
    const sortIndex = (maxSort._max.sortIndex ?? -1) + 1

    const banner = await prisma.heroBanner.create({
      data: { image: imagePath, sortIndex },
    })

    return NextResponse.json({ banner, message: "Banner added" }, { status: 201 })
  } catch (error) {
    console.error("Failed to create banner:", error)
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 })
  }
}

async function saveFile(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "banners")
  await mkdir(uploadDir, { recursive: true })

  const ext = path.extname(file.name) || ".png"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  const filepath = path.join(uploadDir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return `/uploads/banners/${filename}`
}
