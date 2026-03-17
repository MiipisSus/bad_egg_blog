"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Crown, Shield, Star, Heart, Sparkles, Twitter, Instagram, Linkedin, User } from "lucide-react"

const leaders = [
  {
    id: 1,
    name: "Alexandra Chen",
    role: "Guild Master",
    title: "President & Founder",
    icon: Crown,
    bgColor: "bg-mint",
    bio: "Alexandra has been leading our community for 3 years with passion and dedication. She specializes in community building, strategic planning, and fostering meaningful connections among members.",
    rank: "Executive Leader",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 2,
    name: "Marcus Rivera",
    role: "Deputy Leader",
    title: "Vice President",
    icon: Shield,
    bgColor: "bg-lavender",
    bio: "Marcus brings 5 years of experience in team coordination. He ensures smooth operations and supports all club initiatives with unwavering commitment.",
    rank: "Senior Executive",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 3,
    name: "Sophie Williams",
    role: "Events Director",
    title: "Head of Events",
    icon: Star,
    bgColor: "bg-coral",
    bio: "Sophie is the creative force behind all our memorable events. Her attention to detail and innovative ideas make every gathering special.",
    rank: "Director",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 4,
    name: "James Park",
    role: "Community Lead",
    title: "Head of Engagement",
    icon: Heart,
    bgColor: "bg-peach",
    bio: "James focuses on member engagement and building meaningful connections within our community. He ensures every member feels valued.",
    rank: "Director",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 5,
    name: "Emily Nakamura",
    role: "Creative Director",
    title: "Head of Design",
    icon: Sparkles,
    bgColor: "bg-cream",
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
            const Icon = leader.icon

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
                {/* Soft inner glow */}
                <div
                  className="pointer-events-none absolute inset-0 z-10"
                  style={{
                    boxShadow: "inset 0 0 60px rgba(255,255,255,0.3), inset 0 -30px 80px rgba(0,0,0,0.05)",
                    
                  }}
                />

                {/* Collapsed State - Vertical Name */}
                <motion.div
                  animate={{ opacity: isHovered ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex flex-col items-center justify-between py-8"
                >
                  {/* Top Icon */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/40">
                    <Icon className="h-7 w-7 text-foreground/70" />
                  </div>

                  {/* Vertical Name */}
                  <div
                    className="flex flex-1 items-center justify-center"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                  >
                    <span className="text-xl font-bold tracking-wide text-foreground/90">
                      {leader.name}
                    </span>
                  </div>

                  {/* Bottom Avatar Hint */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/30">
                    <User className="h-10 w-10 text-foreground/50" />
                  </div>
                </motion.div>

                {/* Expanded State - Full Content */}
                <motion.div
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: isHovered ? 0.1 : 0 }}
                  className="absolute inset-0 flex"
                >
                  {/* Left: Photo Area */}
                  <div className="flex w-2/5 flex-col items-center justify-center bg-white/20 p-6">
                    <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-white/50 shadow-lg">
                      <User className="h-16 w-16 text-foreground/60" />
                    </div>
                    <h3 className="mt-4 text-center text-2xl font-bold text-foreground">
                      {leader.name}
                    </h3>
                    <p className="mt-1 text-center text-sm font-medium text-foreground/70">
                      {leader.title}
                    </p>
                  </div>

                  {/* Right: Details */}
                  <div className="flex w-3/5 flex-col justify-center p-8">
                    {/* Rank Badge */}
                    <div className="mb-4 flex items-center gap-2">
                      <Icon className="h-5 w-5 text-foreground/80" />
                      <span className="rounded-full bg-white/40 px-4 py-1.5 text-sm font-semibold text-foreground">
                        {leader.rank}
                      </span>
                    </div>

                    {/* Role */}
                    <h4 className="text-lg font-semibold text-foreground/90">{leader.role}</h4>

                    {/* Bio */}
                    <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                      {leader.bio}
                    </p>

                    {/* Social Icons */}
                    <div className="mt-6 flex gap-3">
                      <a
                        href={leader.social.twitter}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/40 text-foreground transition-all hover:scale-110 hover:bg-white/60"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                      <a
                        href={leader.social.instagram}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/40 text-foreground transition-all hover:scale-110 hover:bg-white/60"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                      <a
                        href={leader.social.linkedin}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/40 text-foreground transition-all hover:scale-110 hover:bg-white/60"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

    </section>
  )
}
