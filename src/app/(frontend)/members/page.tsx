import { LeadershipSection } from "@/components/frontend/leadership-section"
import { CommunitySection } from "@/components/frontend/community-section"

export default function MembersPage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <LeadershipSection />
        <CommunitySection />
      </main>
    </div>
  )
}
