"use client"

import { motion } from "framer-motion"
import { User } from "lucide-react"

const communityMembers = [
  { id: 1, name: "Emma Thompson", role: "Designer", bgColor: "bg-peach" },
  { id: 2, name: "Liam Johnson", role: "Developer", bgColor: "bg-lavender" },
  { id: 3, name: "Olivia Davis", role: "Photographer", bgColor: "bg-coral" },
  { id: 4, name: "Noah Wilson", role: "Writer", bgColor: "bg-cream" },
  { id: 5, name: "Ava Martinez", role: "Artist", bgColor: "bg-mint" },
  { id: 6, name: "William Brown", role: "Musician", bgColor: "bg-peach" },
  { id: 7, name: "Sophia Taylor", role: "Animator", bgColor: "bg-lavender" },
  { id: 8, name: "James Anderson", role: "Filmmaker", bgColor: "bg-coral" },
  { id: 9, name: "Isabella Thomas", role: "Illustrator", bgColor: "bg-cream" },
  { id: 10, name: "Benjamin Lee", role: "Sculptor", bgColor: "bg-mint" },
  { id: 11, name: "Mia White", role: "Dancer", bgColor: "bg-peach" },
  { id: 12, name: "Lucas Harris", role: "Chef", bgColor: "bg-lavender" },
]

export function CommunitySection() {

  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-peach/40 px-5 py-2 text-sm font-medium text-foreground">
            Community
          </span>
          <h2 className="mt-4 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Community Members
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            The talented individuals who bring our community to life
          </p>
        </div>

        {/* Large Grid - 3 or 4 columns */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {communityMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface MemberCardProps {
  member: (typeof communityMembers)[0]
}

function MemberCard({ member }: MemberCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`group relative cursor-pointer overflow-hidden ${member.bgColor}`}
      style={{ borderRadius: "32px" }}
    >
      {/* Soft inner glow */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-shadow duration-300 group-hover:shadow-[inset_0_0_50px_rgba(255,255,255,0.4),0_20px_50px_rgba(0,0,0,0.15)]"
        style={{
          boxShadow: "inset 0 0 40px rgba(255,255,255,0.25)",
          borderRadius: "32px",
        }}
      />

      {/* Card Content */}
      <div className="flex aspect-[4/5] flex-col items-center justify-center p-6">
        {/* Avatar */}
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/50 shadow-md transition-transform duration-300 group-hover:scale-105">
          <User className="h-12 w-12 text-foreground/60" />
        </div>

        {/* Name */}
        <h3 className="text-center text-xl font-bold text-foreground">{member.name}</h3>

        {/* Role Badge */}
        <span className="mt-3 inline-block rounded-full bg-white/50 px-4 py-1.5 text-sm font-medium text-foreground/80">
          {member.role}
        </span>
      </div>
    </motion.div>
  )
}
