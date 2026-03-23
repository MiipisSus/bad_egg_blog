"use client"

import { useState, useEffect } from "react"
import { LeadershipSection } from "@/components/frontend/leadership-section"
import { CommunitySection } from "@/components/frontend/community-section"
import type { Member } from "@/types/member"

const LEADER_ROLES = ["一郎", "二郎", "三郎"]

export default function MembersPage() {
  const [leaders, setLeaders] = useState<Member[]>([])
  const [community, setCommunity] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => {
        const all: Member[] = data.members
        setLeaders(all.filter((m) => LEADER_ROLES.includes(m.role)))
        setCommunity(all.filter((m) => !LEADER_ROLES.includes(m.role)))
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main>
        <LeadershipSection members={leaders} />
        <CommunitySection members={community} />
      </main>
    </div>
  )
}
