import { Hero } from "@/components/frontend/hero"
import { AdventureTimeline } from "@/components/frontend/adventure-timeline"
import { Activities } from "@/components/frontend/activities"
import { JoinSection } from "@/components/frontend/join-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero />
        <AdventureTimeline />
        <Activities />
        <JoinSection />
      </main>
    </div>
  )
}
