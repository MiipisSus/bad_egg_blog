"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, isToday, isThisMonth, isThisYear, isWithinInterval } from "date-fns"
import type { DateRange } from "react-day-picker"
import Image from "next/image"

import { cn } from "@/lib/utils"
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

  useEffect(() => {
    fetch("/api/gallery")
      .then((res) => res.json())
      .then((data: GalleryPhoto[]) => {
        setPhotos(data)
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

  return (
    <section className="min-h-screen bg-accent pb-20 pt-32" style={{ backgroundImage: "url('/assets/images/white-brick-wall.png')", backgroundRepeat: "repeat", backgroundSize: "50px" }}>
      <div className="container mx-auto px-4 md:px-6">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            畫廊（素材替代）
          </h1>
        </div>

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
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {filteredPhotos.map((photo) => (
              <GalleryCard key={photo.id} photo={photo} />
            ))}
          </div>
        )}
      </div>
    </section>
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
            "rounded-full px-5 py-2 text-sm font-medium transition-all",
            activeFilter === option.value
              ? "bg-mint/60 text-foreground shadow-sm"
              : "bg-cream/60 text-foreground/70 hover:bg-cream hover:text-foreground"
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
              "rounded-full px-5 py-2 text-sm font-medium transition-all",
              activeFilter === "custom"
                ? "bg-mint/60 text-foreground shadow-sm"
                : "bg-cream/60 text-foreground/70 hover:bg-cream hover:text-foreground"
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
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function GalleryCard({ photo }: { photo: GalleryPhoto }) {
  const [isLoaded, setIsLoaded] = useState(false)

  const themeColors = ["var(--mint)", "var(--lavender)", "var(--peach)", "var(--cream)", "var(--coral)"]

  // Stable random rotation between -2 and 2 degrees per card
  const { rotation, titleColor } = useMemo(() => {
    const seed = photo.id * 9301 + 49297
    return {
      rotation: ((seed % 4001) / 1000) - 2,
      titleColor: themeColors[seed % themeColors.length],
    }
  }, [photo.id])

  return (
    <div
      className="group relative mb-6 break-inside-avoid p-4 transition-all duration-300 ease-out hover:z-50"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Polaroid frame */}
      <div className="relative bg-white p-4 pb-16 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-[0_16px_50px_rgb(0,0,0,0.2)]">
        {/* Image container - natural aspect ratio */}
        <div
          className="relative w-full overflow-hidden border border-slate-100"
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className={cn(
              "object-cover transition-all duration-500 ease-out",
              "group-hover:scale-105",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsLoaded(true)}
          />

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

        {/* Title - overlapping left bottom, tilted */}
        <p
          className="absolute bottom-12 left-4 -rotate-6 text-3xl"
          style={{
            fontFamily: "'Mantou Sans', sans-serif",
            color: titleColor,
            WebkitTextStroke: "4px white",
            paintOrder: "stroke fill",
          }}
        >
          {photo.category}
        </p>

        {/* Date - right bottom, aligned with frame */}
        <p
          className="absolute bottom-3 right-3 text-sm text-stone-300"
          style={{
            fontFamily: "'Mantou Sans', sans-serif",
            WebkitTextStroke: "4px white",
            paintOrder: "stroke fill",
          }}
        >
          {format(new Date(photo.date), "yyyy / MM / dd")}
        </p>
      </div>
    </div>
  )
}

function MasonrySkeleton() {
  const rotations = [-1.5, 0.8, -0.5, 1.2, -1, 0.3, 1.8, -0.8, 0.5, -1.2, 1.5, -0.3]
  const heights = [300, 220, 280, 350, 240, 300, 260, 320, 280, 340, 220, 300]
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {rotations.map((rot, i) => (
        <div
          key={i}
          className="mb-6 break-inside-avoid p-4"
          style={{ transform: `rotate(${rot}deg)` }}
        >
          <div className="animate-pulse bg-white p-3 pb-12 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="bg-slate-100" style={{ height: `${heights[i]}px` }} />
            <div className="mt-2 flex flex-col items-center gap-1.5">
              <div className="h-4 w-20 rounded bg-slate-100" />
              <div className="h-3 w-24 rounded bg-slate-50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
