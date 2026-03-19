import { Hero } from "@/components/frontend/hero"
import { AdventureTimeline } from "@/components/frontend/adventure-timeline"
import { Activities } from "@/components/frontend/activities"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero />
        <AdventureTimeline />
        <Activities />
      </main>
    </div>
  )
}
