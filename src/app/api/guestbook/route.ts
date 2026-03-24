import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// GET /api/guestbook — returns all sticky notes grouped by page
export async function GET() {
  const notes = await prisma.stickyNote.findMany({
    orderBy: [{ page: "asc" }, { createdAt: "asc" }],
  })
  return NextResponse.json({ notes })
}

// POST /api/guestbook — create a new sticky note
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const imageFile = formData.get("image") as File | null
    const posX = parseFloat(formData.get("posX") as string) || 80
    const posY = parseFloat(formData.get("posY") as string) || 60
    const zIndex = parseInt(formData.get("zIndex") as string) || 1
    const page = parseInt(formData.get("page") as string) || 0
    const author = (formData.get("author") as string) || null
    const color = (formData.get("color") as string) || "#ffffff"
    const visitorId = formData.get("visitorId") as string

    if (!visitorId) {
      return NextResponse.json({ error: "visitorId is required" }, { status: 400 })
    }
    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: "image is required" }, { status: 400 })
    }

    // Save transparent PNG
    const imagePath = await saveFile(imageFile, "guestbook")

    // Get IP address
    const forwarded = request.headers.get("x-forwarded-for")
    const ipAddress = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null

    const note = await prisma.stickyNote.create({
      data: {
        image: imagePath,
        posX,
        posY,
        zIndex,
        page,
        author: author || null,
        color,
        visitorId,
        ipAddress,
      },
    })

    return NextResponse.json({ note, message: "Note created" }, { status: 201 })
  } catch (error) {
    console.error("Failed to create sticky note:", error)
    return NextResponse.json({ error: "Failed to create sticky note" }, { status: 500 })
  }
}

async function saveFile(file: File, subDir: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir)
  await mkdir(uploadDir, { recursive: true })

  const ext = path.extname(file.name) || ".png"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  const filepath = path.join(uploadDir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return `/uploads/${subDir}/${filename}`
}
