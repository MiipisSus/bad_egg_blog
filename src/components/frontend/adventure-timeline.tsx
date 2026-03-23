"use client"

import { useRef, useMemo, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { MapPin } from "lucide-react"

const MACARON_COLORS = ["bg-mint", "bg-lavender", "bg-peach", "bg-cream", "bg-coral"]
const MACARON_TEXT_COLORS = ["text-mint", "text-lavender", "text-peach", "text-cream", "text-coral"]

interface Milestone {
  id: number
  title: string
  date?: string | null
  image?: string | null
}

const ROTATION_SEEDS = [-3.5, 2.8, -1.2, 4.1, -2.5, 1.9]

function formatDate(dateStr: string): string {
  // Month-only: "2024-03"
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [y, m] = dateStr.split("-")
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { year: "numeric", month: "long" })
  }
  // Full date: "2024-03-15"
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

export function AdventureTimeline() {
  const [milestones, setMilestones] = useState<Milestone[]>([])

  useEffect(() => {
    fetch("/api/timeline")
      .then((res) => res.json())
      .then((data) => setMilestones(data.items))
      .catch(() => {})
  }, [])

  const rotations = useMemo(
    () => milestones.map((_: Milestone, i: number) => ROTATION_SEEDS[i % ROTATION_SEEDS.length]),
    [milestones]
  )

  if (milestones.length === 0) return null

  return (
    <section className="bg-cream/30 py-24">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-20 text-center"
        >
          <span className="inline-block rounded-full bg-mint/40 px-5 py-2 text-sm font-medium text-foreground">
            Our Journey
          </span>
          <h2 className="mt-4 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Adventure Timeline
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            Every great story has its milestones — here are ours
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative mx-auto max-w-5xl">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 border-l-2 border-dashed border-peach/60" />

          {milestones.map((milestone, index) => (
            <TimelineItem
              key={milestone.id}
              milestone={milestone}
              index={index}
              rotation={rotations[index]}
              isLeft={index % 2 === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface TimelineItemProps {
  milestone: Milestone
  index: number
  rotation: number
  isLeft: boolean
}

function TimelineItem({ milestone, index, rotation, isLeft }: TimelineItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const colorIndex = index % MACARON_COLORS.length
  const dotColor = MACARON_COLORS[colorIndex]
  const textColor = MACARON_TEXT_COLORS[colorIndex]

  return (
    <div
      ref={ref}
      className={`relative mb-20 flex items-center ${isLeft ? "flex-row" : "flex-row-reverse"}`}
    >
      {/* Center dot */}
      <div className="absolute left-1/2 z-10 -translate-x-1/2">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className={`flex h-10 w-10 items-center justify-center rounded-full ${dotColor} shadow-md`}
        >
          <MapPin className="h-5 w-5 text-white" />
        </motion.div>
      </div>

      {/* Content side */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
        className={`w-1/2 ${isLeft ? "pr-16 text-right" : "pl-16 text-left"}`}
      >
        {/* Date */}
        {milestone.date && (
          <span className={`text-sm font-semibold ${textColor}`}>
            {formatDate(milestone.date)}
          </span>
        )}

        {/* Title */}
        <h3 className="mt-1 text-2xl font-bold text-[#5c4033]">
          {milestone.title}
        </h3>
      </motion.div>

      {/* Photo side */}
      {milestone.image && (
        <motion.div
          initial={{ opacity: 0, y: 80, rotate: 0 }}
          animate={
            isInView
              ? { opacity: 1, y: 0, rotate: rotation }
              : { opacity: 0, y: 80, rotate: 0 }
          }
          transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.35 }}
          className={`w-1/2 ${isLeft ? "pl-16" : "pr-16"} ${isLeft ? "flex justify-start" : "flex justify-end"}`}
        >
          <div className="w-56 bg-white p-2 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <div className="overflow-hidden border border-slate-100">
              <img
                src={milestone.image}
                alt={milestone.title}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty spacer when no image */}
      {!milestone.image && <div className="w-1/2" />}
    </div>
  )
}
