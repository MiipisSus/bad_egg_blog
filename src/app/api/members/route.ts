import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// GET /api/members
export async function GET() {
  const members = await prisma.member.findMany({
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ members })
}

// POST /api/members (multipart/form-data)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const name = formData.get("name") as string
    const role = formData.get("role") as string
    const bio = formData.get("bio") as string | null

    if (!name || !role) {
      return NextResponse.json({ error: "name and role are required" }, { status: 400 })
    }

    // Handle image uploads
    const imageFile = formData.get("image") as File | null
    const nameCardFile = formData.get("nameCard") as File | null

    let imagePath: string | null = null
    let nameCardPath: string | null = null

    if (imageFile && imageFile.size > 0) {
      imagePath = await saveFile(imageFile, "members")
    }
    if (nameCardFile && nameCardFile.size > 0) {
      nameCardPath = await saveFile(nameCardFile, "namecards")
    }

    const member = await prisma.member.create({
      data: {
        name,
        role,
        bio: bio || null,
        image: imagePath,
        nameCard: nameCardPath,
      },
    })

    return NextResponse.json({ member, message: "Member created successfully" }, { status: 201 })
  } catch (error) {
    console.error("Failed to create member:", error)
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 })
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
