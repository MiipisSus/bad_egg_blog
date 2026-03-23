import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { unlink } from "fs/promises"
import path from "path"

// DELETE /api/hero-banners/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const banner = await prisma.heroBanner.findUnique({ where: { id: Number(id) } })

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 })
    }

    // Delete file
    try {
      await unlink(path.join(process.cwd(), "public", banner.image))
    } catch { /* file may not exist */ }

    await prisma.heroBanner.delete({ where: { id: Number(id) } })

    return NextResponse.json({ message: "Banner deleted" })
  } catch (error) {
    console.error("Failed to delete banner:", error)
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 })
  }
}
