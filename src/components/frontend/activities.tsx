"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const activities = [
  {
    id: 1,
    title: "Annual Creative Showcase",
    description: "Our flagship event bringing together artists, designers, and creators to share their work with the community.",
    color: "bg-mint",
  },
  {
    id: 2,
    title: "Weekend Workshop Series",
    description: "Hands-on sessions where members learn new skills from industry professionals and fellow enthusiasts.",
    color: "bg-lavender",
  },
  {
    id: 3,
    title: "Community Meetups",
    description: "Casual gatherings fostering connections and meaningful conversations among our diverse members.",
    color: "bg-coral",
  },
  {
    id: 4,
    title: "Collaborative Projects",
    description: "Team initiatives where members work together on impactful creative and community-driven projects.",
    color: "bg-peach",
  },
]

export function Activities() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeActivity = activities[activeIndex]

  return (
    <section id="activities" className="relative w-full bg-cream py-20 md:py-32">
      {/* Section Header */}
      <div className="px-6 pb-16 text-center md:px-12 md:pb-20">
        <span className="inline-block rounded-full bg-coral/40 px-5 py-2 text-sm font-medium text-foreground">
          What We Do
        </span>
        <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          Club Activities
        </h2>
      </div>

      {/* Content: Left Dots + Right Image */}
      <div className="flex min-h-[65vh] w-full items-stretch px-6 md:px-12">
        {/* Left Side: Vertical Decorative Elements */}
        <div className="flex w-12 flex-col items-center justify-center md:w-20">
          <ul className="flex flex-col items-center gap-0">
            {activities.map((activity, index) => (
              <li key={activity.id} className="flex flex-col items-center">
                {/* Geometric Shape - Dot */}
                <button
                  onClick={() => setActiveIndex(index)}
                  className="group relative flex items-center justify-center"
                >
                  <motion.div
                    animate={{
                      scale: activeIndex === index ? 1.2 : 0.8,
                      opacity: activeIndex === index ? 1 : 0.35,
                    }}
                    whileHover={{ scale: 1, opacity: 0.8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`relative h-3 w-3 rounded-full ${activity.color} transition-colors duration-300`}
                  >
                    {/* Active Glow Effect */}
                    {activeIndex === index && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.6, scale: 2.5 }}
                        className={`absolute inset-0 rounded-full ${activity.color} blur-md`}
                      />
                    )}
                  </motion.div>
                </button>
                
                {/* Connector Line (vertical dash) */}
                {index < activities.length - 1 && (
                  <div className="my-4 h-10 w-px bg-border/50 md:my-5 md:h-12" />
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side: Large Image Container */}
        <div className="relative flex-1 overflow-hidden rounded-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeActivity.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`relative h-full w-full ${activeActivity.color}`}
            >
              {/* Subtle Pattern for Visual Interest */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-4 gap-4 opacity-15 md:gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="h-12 w-12 rounded-2xl bg-white/60 md:h-20 md:w-20" 
                    />
                  ))}
                </div>
              </div>

              {/* Backdrop Blur Text Box - Bottom Left */}
              <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto md:max-w-lg">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                  className="rounded-2xl bg-white/70 p-5 shadow-lg backdrop-blur-md md:rounded-3xl md:p-8"
                >
                  <h3 className="text-lg font-semibold text-foreground md:text-2xl">
                    {activeActivity.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:mt-3 md:text-base">
                    {activeActivity.description}
                  </p>
                  
                  {/* Activity Number Indicator */}
                  <div className="mt-4 flex items-center gap-3 md:mt-5">
                    <span className="text-xs font-semibold text-foreground/70">
                      {String(activeIndex + 1).padStart(2, "0")}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {String(activities.length).padStart(2, "0")}
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
