"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Crown, Shield, Star, Heart, Twitter, Instagram, Linkedin } from "lucide-react"

const officers = [
  {
    id: 1,
    name: "Alexandra Chen",
    role: "Guild Master",
    icon: Crown,
    bgColor: "bg-mint",
    overlayColor: "bg-mint/90",
    bio: "Alexandra has been leading our community for 3 years with passion and dedication. She specializes in community building and strategic planning.",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 2,
    name: "Marcus Rivera",
    role: "Deputy Leader",
    icon: Shield,
    bgColor: "bg-lavender",
    overlayColor: "bg-lavender/90",
    bio: "Marcus brings 5 years of experience in team coordination. He ensures smooth operations and supports all club initiatives.",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 3,
    name: "Sophie Williams",
    role: "Events Director",
    icon: Star,
    bgColor: "bg-coral",
    overlayColor: "bg-coral/90",
    bio: "Sophie is the creative force behind all our memorable events. Her attention to detail makes every gathering special.",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 4,
    name: "James Park",
    role: "Community Lead",
    icon: Heart,
    bgColor: "bg-peach",
    overlayColor: "bg-peach/90",
    bio: "James focuses on member engagement and building meaningful connections within our community.",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
]

export function Members() {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <section id="members" className="relative w-full">
      {/* Section Header */}
      <div className="px-6 py-12 text-center md:px-12 md:py-16">
        <span className="inline-block rounded-full bg-lavender/60 px-4 py-1.5 text-sm font-medium text-foreground">
          Our Team
        </span>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Meet the Officers
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Hover over a card to learn more about our dedicated leaders
        </p>
      </div>

      {/* Asymmetrical Grid: 1 Large Left + 3 Small Right */}
      <div className="w-full">
        <div className="grid h-[85vh] w-full grid-cols-1 md:grid-cols-2">
          {/* Left: Large Card (First Officer) */}
          <OfficerCard
            officer={officers[0]}
            isHovered={hoveredId === officers[0].id}
            onHover={() => setHoveredId(officers[0].id)}
            onLeave={() => setHoveredId(null)}
            isLarge
          />

          {/* Right: 3 Small Cards Stacked */}
          <div className="grid h-full grid-rows-3">
            {officers.slice(1).map((officer) => (
              <OfficerCard
                key={officer.id}
                officer={officer}
                isHovered={hoveredId === officer.id}
                onHover={() => setHoveredId(officer.id)}
                onLeave={() => setHoveredId(null)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

interface OfficerCardProps {
  officer: (typeof officers)[0]
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
  isLarge?: boolean
}

function OfficerCard({ officer, isHovered, onHover, onLeave, isLarge }: OfficerCardProps) {
  const Icon = officer.icon

  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative h-full w-full cursor-pointer overflow-hidden ${officer.bgColor}`}
      style={{
        boxShadow: "inset 0 2px 20px rgba(255,255,255,0.3), 0 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      {/* Default State: Photo + Name */}
      <div className={`flex h-full flex-col items-center justify-center p-6 ${isLarge ? "gap-6" : "gap-3"}`}>
        {/* Avatar */}
        <div
          className={`flex items-center justify-center rounded-full bg-white/40 backdrop-blur-sm ${
            isLarge ? "h-28 w-28 md:h-32 md:w-32" : "h-14 w-14 md:h-16 md:w-16"
          }`}
          style={{
            boxShadow: "inset 0 2px 10px rgba(255,255,255,0.5), 0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <Icon className={`text-foreground ${isLarge ? "h-12 w-12 md:h-14 md:w-14" : "h-6 w-6 md:h-8 md:w-8"}`} />
        </div>

        {/* Name */}
        <h3 className={`font-semibold text-foreground ${isLarge ? "text-xl md:text-2xl" : "text-base md:text-lg"}`}>
          {officer.name}
        </h3>
      </div>

      {/* Hover State: Overlay with Details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`absolute inset-0 flex flex-col items-center justify-center ${officer.overlayColor} backdrop-blur-sm`}
        style={{
          pointerEvents: isHovered ? "auto" : "none",
        }}
      >
        <div className={`flex flex-col items-center text-center ${isLarge ? "gap-4 p-8" : "gap-2 p-4"}`}>
          {/* Avatar */}
          <div
            className={`flex items-center justify-center rounded-full bg-white/40 ${
              isLarge ? "h-20 w-20 md:h-24 md:w-24" : "h-12 w-12"
            }`}
            style={{
              boxShadow: "inset 0 2px 10px rgba(255,255,255,0.5), 0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <Icon className={`text-foreground ${isLarge ? "h-10 w-10 md:h-12 md:w-12" : "h-5 w-5"}`} />
          </div>

          {/* Name & Role */}
          <div>
            <h3 className={`font-bold text-foreground ${isLarge ? "text-xl md:text-2xl" : "text-base"}`}>
              {officer.name}
            </h3>
            <p className={`text-foreground/70 ${isLarge ? "text-sm md:text-base" : "text-xs"}`}>{officer.role}</p>
          </div>

          {/* Bio */}
          <p
            className={`max-w-xs text-pretty leading-relaxed text-foreground/80 ${
              isLarge ? "text-sm md:text-base" : "line-clamp-2 text-xs"
            }`}
          >
            {officer.bio}
          </p>

          {/* Social Links */}
          <div className={`flex ${isLarge ? "gap-3" : "gap-2"}`}>
            <a
              href={officer.social.twitter}
              className={`flex items-center justify-center rounded-full bg-white/40 transition-colors hover:bg-white/60 ${
                isLarge ? "h-10 w-10" : "h-7 w-7"
              }`}
              style={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <Twitter className={`text-foreground ${isLarge ? "h-4 w-4" : "h-3 w-3"}`} />
            </a>
            <a
              href={officer.social.instagram}
              className={`flex items-center justify-center rounded-full bg-white/40 transition-colors hover:bg-white/60 ${
                isLarge ? "h-10 w-10" : "h-7 w-7"
              }`}
              style={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <Instagram className={`text-foreground ${isLarge ? "h-4 w-4" : "h-3 w-3"}`} />
            </a>
            <a
              href={officer.social.linkedin}
              className={`flex items-center justify-center rounded-full bg-white/40 transition-colors hover:bg-white/60 ${
                isLarge ? "h-10 w-10" : "h-7 w-7"
              }`}
              style={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <Linkedin className={`text-foreground ${isLarge ? "h-4 w-4" : "h-3 w-3"}`} />
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
