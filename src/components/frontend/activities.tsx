"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

function useSwipe(onLeft: () => void, onRight: () => void, threshold = 50) {
  const startX = useRef(0)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }, [])
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - startX.current
    if (diff < -threshold) onLeft()
    else if (diff > threshold) onRight()
  }, [onLeft, onRight, threshold])
  return { onTouchStart, onTouchEnd }
}

const MACARON_COLORS = ["bg-mint", "bg-lavender", "bg-coral", "bg-peach", "bg-cream"]

interface ActivityData {
  id: number
  title: string
  description: string | null
  image: string
}

export function Activities() {
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    fetch("/api/activities")
      .then((res) => res.json())
      .then((data) => { if (data.activities?.length) setActivities(data.activities) })
      .catch(() => {})
  }, [])

  const activeActivity = activities[activeIndex]

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (activities.length <= 1) return
    timerRef.current = setInterval(() => {
      setDirection(1)
      setActiveIndex((prev) => (prev + 1) % activities.length)
    }, 5000)
  }, [activities.length])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resetTimer])

  const handleDotClick = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1)
    setActiveIndex(index)
    resetTimer()
  }

  const goNext = useCallback(() => {
    setDirection(1)
    setActiveIndex((prev) => (prev + 1) % activities.length)
    resetTimer()
  }, [activities.length, resetTimer])

  const goPrev = useCallback(() => {
    setDirection(-1)
    setActiveIndex((prev) => (prev - 1 + activities.length) % activities.length)
    resetTimer()
  }, [activities.length, resetTimer])

  const activitySwipe = useSwipe(goNext, goPrev)

  if (activities.length === 0 || !activeActivity) return null

  return (
    <section id="activities" className="relative w-full bg-cream py-20 md:py-32">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="px-6 pb-16 text-center md:px-12 md:pb-20"
      >
        <span className="inline-block rounded-full bg-coral/40 px-5 py-2 text-sm font-medium text-foreground">
          What We Do
        </span>
        <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          Club Activities
        </h2>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
        className="flex w-[85dvw] flex-col items-stretch px-6 mx-auto md:min-h-[80vh] md:flex-row md:px-12"
      >
        {/* Desktop: Left Side Vertical Dots */}
        <div className="hidden w-20 flex-col items-center justify-center md:flex">
          <ul className="flex flex-col items-center gap-0">
            {activities.map((activity, index) => (
              <li key={activity.id} className="flex flex-col items-center">
                <button
                  onClick={() => handleDotClick(index)}
                  className="group relative flex h-10 w-10 cursor-pointer items-center justify-center"
                >
                  <motion.div
                    animate={{
                      scale: activeIndex === index ? 1.2 : 0.8,
                      opacity: activeIndex === index ? 1 : 0.35,
                    }}
                    whileHover={{ scale: 1, opacity: 0.8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`relative h-3 w-3 rounded-full ${MACARON_COLORS[index % MACARON_COLORS.length]} transition-colors duration-300`}
                  >
                    {activeIndex === index && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.6, scale: 2.5 }}
                        className={`absolute inset-0 rounded-full ${MACARON_COLORS[index % MACARON_COLORS.length]} blur-md`}
                      />
                    )}
                  </motion.div>
                </button>
                {index < activities.length - 1 && (
                  <div className="my-5 h-12 w-px bg-border/50" />
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Image Container */}
        <div className="relative aspect-[4/3] w-full bg-white p-3 shadow-md md:aspect-auto md:flex-1" {...activitySwipe}>
          <div className="relative h-full w-full overflow-hidden border border-slate-100">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={activeActivity.id}
                custom={direction}
                variants={{
                  enter: (d: number) => ({
                    // Mobile: left/right, Desktop: top/bottom
                    x: typeof window !== "undefined" && window.innerWidth < 768 ? (d > 0 ? "100%" : "-100%") : 0,
                    y: typeof window !== "undefined" && window.innerWidth < 768 ? 0 : (d > 0 ? "100%" : "-100%"),
                  }),
                  center: { x: 0, y: 0 },
                  exit: (d: number) => ({
                    x: typeof window !== "undefined" && window.innerWidth < 768 ? (d > 0 ? "-100%" : "100%") : 0,
                    y: typeof window !== "undefined" && window.innerWidth < 768 ? 0 : (d > 0 ? "-100%" : "100%"),
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className={`absolute inset-0 ${MACARON_COLORS[activeIndex % MACARON_COLORS.length]}`}
              >
                <img
                  src={activeActivity.image}
                  alt={activeActivity.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />

                {/* Text Box */}
                <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto md:max-w-lg">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.35 }}
                    className="rounded-2xl bg-white/70 p-4 shadow-lg backdrop-blur-md md:rounded-3xl md:p-8"
                  >
                    <h3 className="text-base font-semibold text-foreground md:text-2xl">
                      {activeActivity.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground md:mt-3 md:text-base" style={{ fontFamily: "var(--font-huninn)" }}>
                      {activeActivity.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3 md:mt-5">
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

        {/* Mobile: Horizontal Dots below image */}
        <div className="flex items-center justify-center gap-3 py-4 md:hidden">
          {activities.map((activity, index) => (
            <button
              key={activity.id}
              onClick={() => handleDotClick(index)}
              className="relative flex h-8 w-8 cursor-pointer items-center justify-center"
            >
              <motion.div
                animate={{
                  scale: activeIndex === index ? 1.3 : 0.8,
                  opacity: activeIndex === index ? 1 : 0.35,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`h-3 w-3 rounded-full ${MACARON_COLORS[index % MACARON_COLORS.length]}`}
              >
                {activeIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.6, scale: 2.5 }}
                    className={`absolute inset-0 rounded-full ${MACARON_COLORS[index % MACARON_COLORS.length]} blur-md`}
                  />
                )}
              </motion.div>
            </button>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
