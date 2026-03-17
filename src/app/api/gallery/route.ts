import { NextResponse } from "next/server"
import { mockGalleryPhotos } from "@/lib/mockData"

export async function GET() {
  return NextResponse.json(mockGalleryPhotos)
}
