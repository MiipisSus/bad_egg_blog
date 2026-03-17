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

  return (
    <div className="group mb-4 break-inside-avoid">
      <div
        className="relative overflow-hidden bg-cream/50"
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

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Info on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            {photo.category}
          </span>
          <p className="mt-1 text-xs text-white/80">
            {format(new Date(photo.date), "yyyy/MM/dd")}
          </p>
        </div>
      </div>
    </div>
  )
}

function MasonrySkeleton() {
  const heights = [300, 400, 350, 500, 300, 450, 400, 350, 500, 300, 400, 350]
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {heights.map((h, i) => (
        <div
          key={i}
          className="mb-4 break-inside-avoid animate-pulse rounded-3xl bg-cream/50"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  )
}
