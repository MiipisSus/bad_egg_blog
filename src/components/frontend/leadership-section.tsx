"use client"

import { useState } from "react"
import { motion } from "framer-motion"

const leaders = [
  {
    id: 1,
    name: "Alexandra Chen",


    bgColor: "bg-mint",
    image: "https://picsum.photos/seed/leader1/800/1200",
    bio: "Alexandra has been leading our community for 3 years with passion and dedication. She specializes in community building, strategic planning, and fostering meaningful connections among members.",
    rank: "Executive Leader",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 2,
    name: "Marcus Rivera",


    bgColor: "bg-lavender",
    image: "https://picsum.photos/seed/leader2/800/1200",
    bio: "Marcus brings 5 years of experience in team coordination. He ensures smooth operations and supports all club initiatives with unwavering commitment.",
    rank: "Senior Executive",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 3,
    name: "Sophie Williams",


    bgColor: "bg-coral",
    image: "https://picsum.photos/seed/leader3/800/1200",
    bio: "Sophie is the creative force behind all our memorable events. Her attention to detail and innovative ideas make every gathering special.",
    rank: "Director",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 4,
    name: "James Park",


    bgColor: "bg-peach",
    image: "https://picsum.photos/seed/leader4/800/1200",
    bio: "James focuses on member engagement and building meaningful connections within our community. He ensures every member feels valued.",
    rank: "Director",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 5,
    name: "Emily Nakamura",


    bgColor: "bg-cream",
    image: "https://picsum.photos/seed/leader5/800/1200",
    bio: "Emily leads the visual identity of our community. Her creative vision transforms every project into something beautiful and memorable.",
    rank: "Director",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
]

export function LeadershipSection() {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <section className="flex min-h-[95vh] flex-col bg-cream/50 pt-20">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mt-12 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Meet Our Leaders
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            The dedicated individuals guiding our community forward
          </p>
        </div>
      </div>

      {/* Horizontal Accordion - full width */}
      <div className="flex flex-1 w-full overflow-hidden">
          {leaders.map((leader) => {
            const isHovered = hoveredId === leader.id

            return (
              <motion.div
                key={leader.id}
                onMouseEnter={() => setHoveredId(leader.id)}
                onMouseLeave={() => setHoveredId(null)}
                animate={{
                  flex: isHovered ? 5 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                }}
                className={`relative cursor-pointer overflow-hidden ${leader.bgColor}`}
                
              >
                {/* Full-cover background image with dark overlay */}
                <img
                  src={leader.image}
                  alt={leader.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 transition-opacity duration-300" />

                {/* Soft inner glow */}
                <div
                  className="pointer-events-none absolute inset-0 z-10"
                  style={{
                    boxShadow: "inset 0 0 60px rgba(255,255,255,0.1), inset 0 -30px 80px rgba(0,0,0,0.1)",
                  }}
                />

                {/* Collapsed State */}
                <motion.div
                  animate={{ opacity: isHovered ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-12"
                >
                  <span className="mb-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                    {leader.rank}
                  </span>
                  <span className="text-center text-xl font-bold tracking-wide text-white drop-shadow-md">
                    {leader.name}
                  </span>
                </motion.div>

                {/* Expanded State - Image left, details right */}
                <motion.div
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: isHovered ? 0.1 : 0 }}
                  className="absolute inset-0 z-20 flex"
                >
                  {/* Left: Photo - image shows through with lighter overlay */}
                  <div className="relative w-1/2">
                    <div className="absolute inset-0 bg-black/10" />
                  </div>

                  {/* Right: Details - transparent bg, white text */}
                  <div className="flex w-1/2 flex-col justify-center p-8">
                    {/* Rank Badge */}
                    <div className="mb-4">
                      <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                        {leader.rank}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="text-2xl font-bold text-white">
                      {leader.name}
                    </h3>

                    {/* Bio */}
                    <p className="mt-4 text-sm leading-relaxed text-white/80">
                      {leader.bio}
                    </p>

                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

    </section>
  )
}
