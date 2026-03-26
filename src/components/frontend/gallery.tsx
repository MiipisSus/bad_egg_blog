"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react"
import { format, isToday, isThisMonth, isThisYear, isWithinInterval } from "date-fns"
import type { DateRange } from "react-day-picker"
import Image from "next/image"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { GalleryPhoto } from "@/lib/mockData"

type FilterType = "all" | "today" | "month" | "year" | "custom"

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "year", label: "本年度" },
  { value: "month", label: "本月" },
  { value: "today", label: "本日" },
]

export function Gallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [modalPhoto, setModalPhoto] = useState<GalleryPhoto | null>(null)
  const [modalIndex, setModalIndex] = useState(0)

  useEffect(() => {
    fetch("/api/gallery")
      .then((res) => res.json())
      .then((data) => {
        // Transform API albums to GalleryPhoto format
        const albums = data.albums || []
        const transformed: GalleryPhoto[] = albums.map((album: { id: number; title: string; description: string | null; date: string | null; images: { path: string }[] }) => ({
          id: album.id,
          images: album.images.map((img: { path: string }) => img.path),
          albumTitle: album.title,
          description: album.description || "",
          width: 400,
          height: 400,
          date: album.date || new Date().toISOString(),
          category: "",
        }))
        setPhotos(transformed)
        setIsLoading(false)
      })
  }, [])

  const handleFilterClick = useCallback((filter: FilterType) => {
    setActiveFilter(filter)
    if (filter !== "custom") {
      setDateRange(undefined)
    }
  }, [])

  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from) {
      setActiveFilter("custom")
    }
  }, [])

  const filteredPhotos = useMemo(() => {
    if (activeFilter === "all") return photos

    return photos.filter((photo) => {
      const photoDate = new Date(photo.date)

      switch (activeFilter) {
        case "today":
          return isToday(photoDate)
        case "month":
          return isThisMonth(photoDate)
        case "year":
          return isThisYear(photoDate)
        case "custom":
          if (!dateRange?.from) return true
          return isWithinInterval(photoDate, {
            start: dateRange.from,
            end: dateRange.to ?? dateRange.from,
          })
        default:
          return true
      }
    })
  }, [photos, activeFilter, dateRange])

  const openModal = useCallback((photo: GalleryPhoto, index: number) => {
    setModalPhoto(photo)
    setModalIndex(index)
  }, [])

  const closeModal = useCallback(() => {
    setModalPhoto(null)
    setModalIndex(0)
  }, [])

  return (
    <>
      <section className="min-h-screen bg-background pb-20 pt-32">
        <div className="container mx-auto px-4 md:px-6">

          {/* Filter Bar */}
          <FilterBar
            activeFilter={activeFilter}
            dateRange={dateRange}
            onFilterClick={handleFilterClick}
            onDateRangeSelect={handleDateRangeSelect}
          />

          {/* Masonry Grid */}
          {isLoading ? (
            <MasonrySkeleton />
          ) : filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
              <p className="text-lg">此區間沒有照片</p>
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => handleFilterClick("all")}
              >
                查看全部
              </Button>
            </div>
          ) : (
            <MasonryGrid photos={filteredPhotos} onOpen={openModal} />
          )}
        </div>
      </section>

      {/* Modal */}
      {modalPhoto && (
        <GalleryModal
          photo={modalPhoto}
          initialIndex={modalIndex}
          onClose={closeModal}
        />
      )}
    </>
  )
}

function FilterBar({
  activeFilter,
  dateRange,
  onFilterClick,
  onDateRangeSelect,
}: {
  activeFilter: FilterType
  dateRange: DateRange | undefined
  onFilterClick: (filter: FilterType) => void
  onDateRangeSelect: (range: DateRange | undefined) => void
}) {
  return (
    <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
      {filterOptions.map((option) => (
        <Button
          key={option.value}
          variant="ghost"
          onClick={() => onFilterClick(option.value)}
          className={cn(
            "cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-all",
            activeFilter === option.value
              ? "bg-mint text-foreground shadow-sm hover:bg-mint"
              : "bg-white text-foreground/70 hover:bg-cream hover:text-foreground"
          )}
        >
          {option.label}
        </Button>
      ))}

      {/* Custom Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-all",
              activeFilter === "custom"
                ? "bg-mint text-foreground shadow-sm hover:bg-mint"
                : "bg-white text-foreground/70 hover:bg-cream hover:text-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MM/dd")} – {format(dateRange.to, "MM/dd")}
                </>
              ) : (
                format(dateRange.from, "yyyy/MM/dd")
              )
            ) : (
              "自定義區間"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeSelect}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
            endMonth={new Date()}
            classNames={{
              day: "[&_button]:cursor-pointer",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

const COLUMN_COUNT_DESKTOP = 3
const COLUMN_COUNT_MOBILE = 1

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

function MasonryGrid({
  photos,
  onOpen,
}: {
  photos: GalleryPhoto[]
  onOpen: (photo: GalleryPhoto, index: number) => void
}) {
  const isMobile = useIsMobile()
  const columnCount = isMobile ? COLUMN_COUNT_MOBILE : COLUMN_COUNT_DESKTOP

  const columns = useMemo(() => {
    const cols: GalleryPhoto[][] = Array.from({ length: columnCount }, () => [])
    photos.forEach((photo, i) => {
      cols[i % columnCount].push(photo)
    })
    return cols
  }, [photos, columnCount])

  return (
    <div className={cn("flex", isMobile ? "flex-col px-4" : "gap-x-8")}>
      {columns.map((col, colIndex) => (
        <div key={colIndex} className="flex flex-1 flex-col">
          {col.map((photo) => (
            <GalleryCard key={photo.id} photo={photo} onOpen={onOpen} isMobile={isMobile} />
          ))}
        </div>
      ))}
    </div>
  )
}

function GalleryCard({
  photo,
  onOpen,
  isMobile = false,
}: {
  photo: GalleryPhoto
  onOpen: (photo: GalleryPhoto, index: number) => void
  isMobile?: boolean
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // ScrollTrigger fade-in animation
  useEffect(() => {
    if (!cardRef.current) return

    gsap.set(cardRef.current, { opacity: 0, y: 40 })

    const tween = gsap.to(cardRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: cardRef.current,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  // Stable random rotation between -2 and 2 degrees per card
  const rotation = useMemo(() => {
    const seed = photo.id * 9301 + 49297
    return ((seed % 4001) / 1000) - 2
  }, [photo.id])

  // Desktop: hover to cycle images
  const handleMouseEnter = useCallback(() => {
    if (isMobile || photo.images.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photo.images.length)
    }, 1500)
  }, [isMobile, photo.images.length])

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setCurrentIndex(0)
  }, [])

  // Mobile: auto-cycle images when card is in viewport via ScrollTrigger
  useEffect(() => {
    if (!isMobile || photo.images.length <= 1 || !cardRef.current) return

    const el = cardRef.current
    let interval: ReturnType<typeof setInterval> | null = null

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      end: "bottom 20%",
      onEnter: () => {
        interval = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % photo.images.length)
        }, 1500)
      },
      onLeave: () => {
        if (interval) { clearInterval(interval); interval = null }
        setCurrentIndex(0)
      },
      onEnterBack: () => {
        interval = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % photo.images.length)
        }, 1500)
      },
      onLeaveBack: () => {
        if (interval) { clearInterval(interval); interval = null }
        setCurrentIndex(0)
      },
    })

    return () => {
      if (interval) clearInterval(interval)
      trigger.kill()
    }
  }, [isMobile, photo.images.length])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const isStack = photo.images.length > 1

  return (
    <div
      ref={cardRef}
      className="group relative mb-6 break-inside-avoid p-4 transition-[box-shadow,transform] duration-300 ease-out hover:z-40"
      style={{ transform: `rotate(${rotation}deg)` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Stacked polaroid layers behind main frame */}
      {isStack && (
        <>
          <div
            className="absolute inset-4 -z-20 bg-white shadow-md transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-lg"
            style={{ transform: "rotate(-2deg) translate(-2px, 2px)" }}
          />
          <div
            className="absolute inset-4 -z-10 bg-white shadow-md transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-lg"
            style={{ transform: "rotate(2deg) translate(2px, -2px)" }}
          />
        </>
      )}

      {/* Polaroid frame */}
      <div
        className="relative cursor-pointer bg-white p-4 pb-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-[0_16px_50px_rgb(0,0,0,0.2)]"
        onClick={() => onOpen(photo, currentIndex)}
      >
        {/* Image container - natural aspect ratio */}
        <div
          className="relative w-full overflow-hidden border border-slate-100"
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        >
          {/* All images stacked, only currentIndex visible */}
          {photo.images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={`${photo.albumTitle} ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className={cn(
                "absolute inset-0 object-cover transition-opacity duration-500 ease-out",
                i === currentIndex ? "opacity-100" : "opacity-0",
                i === 0 && isLoaded ? "" : i === 0 ? "opacity-0" : ""
              )}
              onLoad={i === 0 ? () => setIsLoaded(true) : undefined}
              priority={i === 0}
            />
          ))}

          {/* Paper grain texture overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-multiply"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        </div>

        {/* Title & Date - centered in bottom white area */}
        <div className="mt-3 text-center">
          <p className="text-sm font-semibold text-slate-800" style={{ fontFamily: "var(--font-huninn)" }}>
            {photo.albumTitle}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {format(new Date(photo.date), "yyyy / MM / dd")}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Fullscreen Modal ────────────────────────────────────────────────

// Full-viewport polaroid swap variants
const polaroidSwapVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100vw" : "-100vw",
    rotate: dir > 0 ? 12 : -12,
    opacity: 0,
  }),
  center: {
    x: 0,
    rotate: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100vw" : "100vw",
    rotate: dir > 0 ? -12 : 12,
    opacity: 0,
  }),
}

function GalleryModal({
  photo,
  initialIndex,
  onClose,
}: {
  photo: GalleryPhoto
  initialIndex: number
  onClose: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [slideKey, setSlideKey] = useState(0)
  const [direction, setDirection] = useState(0)
  const isMulti = photo.images.length > 1

  const totalImages = photo.images.length

  const goNext = useCallback(() => {
    if (totalImages <= 1) return
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % totalImages)
    setSlideKey((prev) => prev + 1)
  }, [totalImages])

  const goPrev = useCallback(() => {
    if (totalImages <= 1) return
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages)
    setSlideKey((prev) => prev + 1)
  }, [totalImages])

  const goTo = useCallback((i: number) => {
    setDirection(i > currentIndex ? 1 : -1)
    setSlideKey((prev) => prev + 1)
    setCurrentIndex(i)
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") goNext()
      if (e.key === "ArrowLeft") goPrev()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose, goNext, goPrev])

  // Touch swipe navigation
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    touchStartRef.current = null
    // Only trigger if horizontal swipe is dominant and exceeds threshold
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }, [goNext, goPrev])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  return (
    <div
      className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button - fixed to screen top-right */}
      <button
        onClick={onClose}
        className="fixed top-6 right-6 z-110 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Full-viewport animation stage - no overflow clipping */}
      <div className="pointer-events-none fixed inset-0 flex flex-col items-center justify-center">
        {/* Polaroid animation area */}
        <div
          className="relative max-md:w-[90vw]"
          style={{
            height: "70vh",
            maxHeight: "90vw",
            aspectRatio: `${photo.width}/${photo.height}`,
          }}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={slideKey}
              custom={direction}
              variants={polaroidSwapVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 20,
                mass: 1,
              }}
              className="pointer-events-auto absolute inset-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Entire polaroid frame as one animated unit */}
              <div className="relative h-full w-full bg-white p-3 pb-14 shadow-[0_12px_40px_rgb(0,0,0,0.3)]">
                <div className="relative h-full w-full overflow-hidden">
                  <Image
                    src={photo.images[currentIndex] || photo.images[0]}
                    alt={`${photo.albumTitle} ${currentIndex + 1}`}
                    fill
                    sizes="(max-width: 1280px) 90vw, 1200px"
                    className="object-cover"
                    priority
                  />

                  {/* Album info - right bottom inset */}
                  <div className="absolute bottom-3 right-3 z-10 max-w-[60%] rounded-lg px-4 py-2.5 text-right">
                    <p
                      className="text-4xl text-white"
                      style={{ fontFamily: "var(--font-huninn)" }}
                    >
                      {photo.albumTitle}
                    </p>
                    <p className="mt-0.5 text-md text-white/70" style={{ fontFamily: "var(--font-huninn)" }}>
                      {photo.description}
                    </p>
                  </div>
                </div>

                {/* Date - centered in bottom white area */}
                <p className="absolute bottom-0 left-0 right-0 pb-5 text-center text-xs text-slate-400">
                  {format(new Date(photo.date), "yyyy / MM / dd")}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom navigation - only for multi-image albums */}
        {isMulti && (
          <div className="pointer-events-auto relative z-10 mt-4 flex items-center gap-6">
            <button
              onClick={(e) => { e.stopPropagation(); goPrev() }}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              {photo.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); goTo(i) }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center"
                >
                  <span
                    className={cn(
                      "block rounded-full transition-all",
                      i === currentIndex
                        ? "h-3.5 w-3.5 bg-white"
                        : "h-2.5 w-2.5 bg-white/40 hover:bg-white/60"
                    )}
                  />
                </button>
              ))}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); goNext() }}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Counter - only for multi-image */}
        {isMulti && (
          <p className="pointer-events-auto relative z-10 mt-3 text-xs text-white/40">
            {currentIndex + 1} / {photo.images.length}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────

function MasonrySkeleton() {
  const items = [
    { rot: -1.5, h: 300 }, { rot: 0.8, h: 220 }, { rot: -0.5, h: 280 },
    { rot: 1.2, h: 350 }, { rot: -1, h: 240 }, { rot: 0.3, h: 300 },
    { rot: 1.8, h: 260 }, { rot: -0.8, h: 320 }, { rot: 0.5, h: 280 },
    { rot: -1.2, h: 340 }, { rot: 1.5, h: 220 }, { rot: -0.3, h: 300 },
  ]

  // Same row-first distribution as MasonryGrid
  const columns: (typeof items)[] = Array.from({ length: COLUMN_COUNT_DESKTOP }, () => [])
  items.forEach((item, i) => {
    columns[i % COLUMN_COUNT_DESKTOP].push(item)
  })

  return (
    <div className="flex gap-x-8">
      {columns.map((col, colIndex) => (
        <div key={colIndex} className="flex flex-1 flex-col">
          {col.map((item, i) => (
            <div
              key={i}
              className="mb-6 p-4"
              style={{ transform: `rotate(${item.rot}deg)` }}
            >
              <div className="animate-pulse bg-white p-4 pb-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <div className="bg-slate-100" style={{ height: `${item.h}px` }} />
                <div className="mt-3 flex items-end justify-between">
                  <div className="h-5 w-20 rounded bg-slate-100" />
                  <div className="h-3 w-24 rounded bg-slate-50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
