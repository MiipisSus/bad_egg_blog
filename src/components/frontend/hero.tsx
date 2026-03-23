"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

const carouselImages = [
  {
    id: 1,
    alt: "Club members at annual gathering",
    bgColor: "bg-lavender",
    image: "https://picsum.photos/seed/hero1/1920/1080",
  },
  {
    id: 2,
    alt: "Creative workshop session",
    bgColor: "bg-cream",
    image: "https://picsum.photos/seed/hero2/1920/1080",
  },
  {
    id: 3,
    alt: "Community event celebration",
    bgColor: "bg-peach",
    image: "https://picsum.photos/seed/hero3/1920/1080",
  },
]

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
    }, 5000)
  }, [])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resetTimer])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
    resetTimer()
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
    resetTimer()
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    resetTimer()
  }

  return (
    <section className="relative w-full min-h-screen">
      {/* Full-width Carousel */}
      <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden rounded-b-xl">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {carouselImages.map((image) => (
            <div
              key={image.id}
              className={`relative w-full h-full shrink-0 ${image.bgColor}`}
            >
              <img
                src={image.image}
                alt={image.alt}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
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
          {carouselImages.map((_, index) => (
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
