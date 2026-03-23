"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, X } from "lucide-react"
import type { Member } from "@/types/member"

const ROTATION_SEEDS = [-3.2, 2.1, -1.5, 4.0, -2.8, 1.7, -0.5, 3.3, -4.1, 2.5, -1.9, 3.8]

interface CommunitySectionProps {
  members: Member[]
}

export function CommunitySection({ members }: CommunitySectionProps) {
  const [nameCardUrl, setNameCardUrl] = useState<string | null>(null)

  const rotations = useMemo(
    () => members.map((_, i) => ROTATION_SEEDS[i % ROTATION_SEEDS.length]),
    [members]
  )

  if (members.length === 0) return null

  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6">
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

        <div className="mx-auto max-w-6xl grid grid-cols-2 justify-items-center gap-4 md:grid-cols-4">
          {members.map((member, index) => (
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
  member: Member
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
      <div className={`w-full bg-white p-2 pb-10 shadow-md transition-shadow duration-300 ${hovered ? "shadow-xl" : ""}`}>
        <div className="relative aspect-square overflow-hidden">
          {member.image ? (
            <img
              src={member.image}
              alt={member.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-3xl font-bold text-muted-foreground">
              {member.name.charAt(0)}
            </div>
          )}
          {member.nameCard && (
            <CreditCard className="absolute top-2 right-2 h-5 w-5 text-white drop-shadow-md" />
          )}
        </div>

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
