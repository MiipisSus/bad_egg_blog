"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const carouselImages = [
  {
    id: 1,
    alt: "Club members at annual gathering",
    bgColor: "bg-lavender",
  },
  {
    id: 2,
    alt: "Creative workshop session",
    bgColor: "bg-cream",
  },
  {
    id: 3,
    alt: "Community event celebration",
    bgColor: "bg-peach",
  },
]

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
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
              className={`relative w-full h-full flex-shrink-0 ${image.bgColor}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 flex justify-center gap-3">
                    <div className="h-16 w-16 rounded-2xl bg-mint/40" />
                    <div className="h-16 w-16 rounded-2xl bg-mint/60" />
                    <div className="h-16 w-16 rounded-2xl bg-mint/40" />
                  </div>
                  <p className="text-sm font-medium tracking-wide text-foreground/60">
                    {image.alt}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Dots Indicator */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${index === currentSlide
                ? "w-6 bg-foreground"
                : "w-2 bg-foreground/30"
                }`}
            />
          ))}
        </div>
      </div>

      {/* Club Introduction */}
      <div className="container mx-auto px-4 py-16 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Welcome to Our Creative Community
          </h1>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            A vibrant space where passion meets creativity. Join fellow enthusiasts,
            share ideas, and be part of something extraordinary. Together, we create,
            learn, and grow.
          </p>
        </div>
      </div>
    </section>
  )
}
