"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, X } from "lucide-react"

const communityMembers = [
  { id: 1, name: "Emma Thompson", role: "Designer", image: "https://picsum.photos/seed/member1/400/500", nameCard: "https://picsum.photos/seed/mcard1/600/350" },
  { id: 2, name: "Liam Johnson", role: "Developer", image: "https://picsum.photos/seed/member2/400/500" },
  { id: 3, name: "Olivia Davis", role: "Photographer", image: "https://picsum.photos/seed/member3/400/500", nameCard: "https://picsum.photos/seed/mcard3/600/350" },
  { id: 4, name: "Noah Wilson", role: "Writer", image: "https://picsum.photos/seed/member4/400/500" },
  { id: 5, name: "Ava Martinez", role: "Artist", image: "https://picsum.photos/seed/member5/400/500", nameCard: "https://picsum.photos/seed/mcard5/600/350" },
  { id: 6, name: "William Brown", role: "Musician", image: "https://picsum.photos/seed/member6/400/500" },
  { id: 7, name: "Sophia Taylor", role: "Animator", image: "https://picsum.photos/seed/member7/400/500" },
  { id: 8, name: "James Anderson", role: "Filmmaker", image: "https://picsum.photos/seed/member8/400/500", nameCard: "https://picsum.photos/seed/mcard8/600/350" },
  { id: 9, name: "Isabella Thomas", role: "Illustrator", image: "https://picsum.photos/seed/member9/400/500" },
  { id: 10, name: "Benjamin Lee", role: "Sculptor", image: "https://picsum.photos/seed/member10/400/500" },
  { id: 11, name: "Mia White", role: "Dancer", image: "https://picsum.photos/seed/member11/400/500", nameCard: "https://picsum.photos/seed/mcard11/600/350" },
  { id: 12, name: "Lucas Harris", role: "Chef", image: "https://picsum.photos/seed/member12/400/500" },
]

// Stable random rotations seeded per index
const ROTATION_SEEDS = [-3.2, 2.1, -1.5, 4.0, -2.8, 1.7, -0.5, 3.3, -4.1, 2.5, -1.9, 3.8]

export function CommunitySection() {
  const [nameCardUrl, setNameCardUrl] = useState<string | null>(null)

  const rotations = useMemo(
    () => communityMembers.map((_, i) => ROTATION_SEEDS[i % ROTATION_SEEDS.length]),
    []
  )

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

        {/* Polaroid Wall */}
        <div className="mx-auto max-w-6xl grid grid-cols-2 justify-items-center gap-4 md:grid-cols-4">
          {communityMembers.map((member, index) => (
            <PolaroidCard
              key={member.id}
              member={member}
              rotation={rotations[index]}
              onNameCardClick={setNameCardUrl}
            />
          ))}
        </div>
      </div>

      {/* Name Card Modal */}
      <AnimatePresence>
        {nameCardUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setNameCardUrl(null)}
          >
            <button
              onClick={() => setNameCardUrl(null)}
              className="absolute top-6 right-6 cursor-pointer text-white transition-transform hover:scale-110"
            >
              <X className="h-8 w-8" />
            </button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              src={nameCardUrl}
              alt="Name Card"
              className="max-h-[70vh] max-w-[90vw] object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

interface PolaroidCardProps {
  member: (typeof communityMembers)[0]
  rotation: number
  onNameCardClick: (url: string) => void
}

function PolaroidCard({ member, rotation, onNameCardClick }: PolaroidCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="cursor-pointer transition-all duration-300 ease-out"
      style={{
        transform: `rotate(${hovered ? 0 : rotation}deg) scale(${hovered ? 1.1 : 1})`,
        zIndex: hovered ? 50 : 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => member.nameCard && onNameCardClick(member.nameCard)}
    >
      {/* Polaroid frame */}
      <div className={`w-full bg-white p-2 pb-10 shadow-md transition-shadow duration-300 ${hovered ? "shadow-xl" : ""}`}>
        {/* Photo */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={member.image}
            alt={member.name}
            className="h-full w-full object-cover"
          />
          {/* Name card icon */}
          {member.nameCard && (
            <CreditCard className="absolute top-2 right-2 h-5 w-5 text-white drop-shadow-md" />
          )}
        </div>

        {/* Name in bottom white area */}
        <p className="mt-3 text-center text-sm font-semibold text-slate-700">
          {member.name}
        </p>
        <p className="mt-3 text-center text-sm font-semibold text-slate-400">
          {member.role}
        </p>
      </div>
    </div>
  )
}
