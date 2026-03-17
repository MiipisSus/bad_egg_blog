import { NextRequest, NextResponse } from "next/server"
import { mockAllMembers, mockLeaders, mockCommunityMembers } from "@/lib/mockData"

// GET /api/members
// Query params: ?type=leaders | community | all (default: all)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") ?? "all"

  let data
  switch (type) {
    case "leaders":
      data = mockLeaders
      break
    case "community":
      data = mockCommunityMembers
      break
    default:
      data = mockAllMembers
  }

  return NextResponse.json({ members: data })
}
