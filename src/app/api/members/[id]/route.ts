import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"

// GET /api/members/[id]
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await prisma.member.findUnique({ where: { id: Number(id) } })

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }
  return NextResponse.json({ member })
}

// PUT /api/members/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formData = await request.formData()

    const existing = await prisma.member.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const data: Record<string, string | null> = {}

    for (const field of ["name", "role", "type", "title", "bio", "rank"] as const) {
      const value = formData.get(field) as string | null
      if (value !== null) data[field] = value || null
    }
    // name and role should not be null
    if (data.name === null) delete data.name
    if (data.role === null) delete data.role

    // Handle image uploads
    const imageFile = formData.get("image") as File | null
    if (imageFile && imageFile.size > 0) {
      if (existing.image) await deleteFile(existing.image)
      data.image = await saveFile(imageFile, "members")
    }

    const nameCardFile = formData.get("nameCard") as File | null
    if (nameCardFile && nameCardFile.size > 0) {
      if (existing.nameCard) await deleteFile(existing.nameCard)
      data.nameCard = await saveFile(nameCardFile, "namecards")
    }

    // Allow clearing image/nameCard
    if (formData.get("removeImage") === "true") {
      if (existing.image) await deleteFile(existing.image)
      data.image = null
    }
    if (formData.get("removeNameCard") === "true") {
      if (existing.nameCard) await deleteFile(existing.nameCard)
      data.nameCard = null
    }

    const member = await prisma.member.update({
      where: { id: Number(id) },
      data,
    })

    return NextResponse.json({ member, message: "Member updated successfully" })
  } catch (error) {
    console.error("Failed to update member:", error)
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
  }
}

// DELETE /api/members/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.member.findUnique({ where: { id: Number(id) } })

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Clean up uploaded files
    if (existing.image) await deleteFile(existing.image)
    if (existing.nameCard) await deleteFile(existing.nameCard)

    await prisma.member.delete({ where: { id: Number(id) } })

    return NextResponse.json({ message: "Member deleted successfully" })
  } catch (error) {
    console.error("Failed to delete member:", error)
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 })
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

async function deleteFile(publicPath: string) {
  try {
    const filepath = path.join(process.cwd(), "public", publicPath)
    await unlink(filepath)
  } catch {
    // File may not exist, ignore
  }
}
