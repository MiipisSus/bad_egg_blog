import { Hero } from "@/components/frontend/hero"
import { Members } from "@/components/frontend/members"
import { Activities } from "@/components/frontend/activities"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero />
        <Members />
        <Activities />
      </main>
    </div>
  )
}
