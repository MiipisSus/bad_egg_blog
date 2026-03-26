"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

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

// Fallback when no banners from API
const FALLBACK_IMAGES = [
  { id: 1, image: "https://picsum.photos/seed/hero1/1920/1080" },
  { id: 2, image: "https://picsum.photos/seed/hero2/1920/1080" },
  { id: 3, image: "https://picsum.photos/seed/hero3/1920/1080" },
]

interface BannerData {
  id: number
  image: string
}

export function Hero() {
  const [banners, setBanners] = useState<BannerData[]>(FALLBACK_IMAGES)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = forward (right to left), -1 = backward
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch("/api/hero-banners")
      .then((res) => res.json())
      .then((data) => {
        if (data.banners && data.banners.length > 0) {
          setBanners(data.banners)
        }
      })
      .catch(() => { /* keep fallback */ })
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (banners.length <= 1) return
    timerRef.current = setInterval(() => {
      setDirection(1)
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 5000)
  }, [banners.length])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resetTimer])

  const nextSlide = () => {
    setDirection(1)
    setCurrentSlide((prev) => (prev + 1) % banners.length)
    resetTimer()
  }

  const prevSlide = () => {
    setDirection(-1)
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
    resetTimer()
  }

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1)
    setCurrentSlide(index)
    resetTimer()
  }

  const heroSwipe = useSwipe(nextSlide, prevSlide)

  return (
    <section className="relative w-full min-h-screen">
      {/* Full-width Carousel */}
      <div
        className="relative w-full h-[calc(100vh-4rem)] overflow-hidden rounded-b-xl"
        {...heroSwipe}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%" }),
              center: { x: 0 },
              exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%" }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 bg-muted"
          >
            <img
              src={banners[currentSlide].image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 text-foreground backdrop-blur-sm transition-colors hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 text-foreground backdrop-blur-sm transition-colors hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 cursor-pointer rounded-full transition-all ${index === currentSlide
                    ? "w-6 bg-white"
                    : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Club Introduction */}
      <div className="container mx-auto px-4 py-16 md:px-6">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, duration: 0.6 }}
        >
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Welcome to Our Creative Community
          </h1>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            A vibrant space where passion meets creativity. Join fellow enthusiasts,
            share ideas, and be part of something extraordinary. Together, we create,
            learn, and grow.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
