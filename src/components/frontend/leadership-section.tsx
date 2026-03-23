"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, X } from "lucide-react"
import type { Member } from "@/types/member"

function useRandomRotations(count: number, range: number) {
  return useMemo(() => {
    const seed = [1.7, -0.8, 2.1, -1.5, 0.9]
    return Array.from({ length: count }, (_, i) => seed[i % seed.length] * (range / 2))
  }, [count, range])
}

interface LeadershipSectionProps {
  members: Member[]
}

export function LeadershipSection({ members }: LeadershipSectionProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [nameCardUrl, setNameCardUrl] = useState<string | null>(null)
  const rotations = useRandomRotations(members.length, 3)

  if (members.length === 0) return null

  return (
    <section className="flex min-h-[95vh] flex-col bg-cream/50 pt-20">
      <div className="container mx-auto px-6">
        <div className="mb-12 text-center">
          <h2 className="mt-12 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Meet Our Leaders
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            The dedicated individuals guiding our community forward
          </p>
        </div>
      </div>

      <div className="flex flex-1 w-full py-4 overflow-x-clip">
        {members.map((leader, index) => {
          const isHovered = hoveredId === leader.id
          const rotation = rotations[index]

          return (
            <motion.div
              key={leader.id}
              onMouseEnter={() => setHoveredId(leader.id)}
              onMouseLeave={() => setHoveredId(null)}
              animate={{
                flex: isHovered ? 5 : 1,
                rotate: isHovered ? 0 : rotation,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="relative cursor-pointer overflow-hidden bg-white p-2 shadow-sm"
              onClick={() => leader.nameCard && setNameCardUrl(leader.nameCard)}
            >
              <div className="relative h-full w-full overflow-hidden">
                {leader.image ? (
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted" />
                )}
                <div className="absolute inset-0 bg-black/40 transition-opacity duration-300" />

                {/* Collapsed State */}
                <motion.div
                  animate={{ opacity: isHovered ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-12"
                >
                  <span className="mb-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-foreground shadow-sm">
                    {leader.role}
                  </span>
                  <span
                    className="relative -mb-2 text-center text-xl font-bold tracking-wide text-white"
                    style={{
                      transform: "rotate(-3deg)",
                      textShadow: "-2px -2px 0 white, 2px -2px 0 white, -2px 2px 0 white, 2px 2px 0 white, 0 -2px 0 white, 0 2px 0 white, -2px 0 0 white, 2px 0 0 white",
                      color: "#1e293b",
                    }}
                  >
                    {leader.name}
                  </span>
                </motion.div>

                {/* Expanded State */}
                <motion.div
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: isHovered ? 0.1 : 0 }}
                  className="absolute inset-0 z-20 flex"
                >
                  <div className="relative w-1/2">
                    <div className="absolute inset-0 bg-black/10" />
                  </div>

                  <div className="relative flex w-1/2 flex-col justify-center p-8">
                    {leader.nameCard && (
                      <CreditCard className="absolute top-4 right-4 h-6 w-6 text-white drop-shadow-md" />
                    )}
                    <div className="mb-4">
                      <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-foreground shadow-sm">
                        {leader.role}
                      </span>
                    </div>

                    <h3
                      className="text-2xl font-bold"
                      style={{
                        transform: "rotate(-3deg) translateX(-1rem)",
                        textShadow: "-2px -2px 0 white, 2px -2px 0 white, -2px 2px 0 white, 2px 2px 0 white, 0 -2px 0 white, 0 2px 0 white, -2px 0 0 white, 2px 0 0 white",
                        color: "#1e293b",
                      }}
                    >
                      {leader.name}
                    </h3>

                    {leader.bio && (
                      <p className="mt-4 text-sm font-bold leading-relaxed text-white/90">
                        {leader.bio}
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )
        })}
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
