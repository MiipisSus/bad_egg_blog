import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// POST /api/hero-banners/sort
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 })
    }

    for (let i = 0; i < ids.length; i++) {
      await prisma.heroBanner.update({
        where: { id: ids[i] },
        data: { sortIndex: i },
      })
    }

    return NextResponse.json({ message: "Sort order updated" })
  } catch (error) {
    console.error("Failed to update sort order:", error)
    return NextResponse.json({ error: "Failed to update sort order" }, { status: 500 })
  }
}
