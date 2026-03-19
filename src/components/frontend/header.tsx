"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

export function Header() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [isScrolled, setIsScrolled] = useState(!isHome)

  useEffect(() => {
    // Non-home pages: always show solid header
    if (!isHome) {
      setIsScrolled(true)
      return
    }

    const handleScroll = () => {
      const heroHeight = window.innerHeight
      setIsScrolled(window.scrollY > heroHeight - 80)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [isHome])

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: isScrolled ? "var(--background)" : "transparent",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-sm"
      style={{
        backdropFilter: isScrolled ? "blur(12px)" : "none",
        boxShadow: isScrolled ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none",
      }}
    >
      <div className="flex h-20 items-center justify-between px-6 md:px-12">
        {/* Brand Name - Large Bold Typography */}
        <Link href="/" className="flex items-center">
          <motion.span
            animate={{
              color: isScrolled ? "var(--foreground)" : "white",
            }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold tracking-tight md:text-3xl"
          >
            CLUB NAME
          </motion.span>
        </Link>

        {/* Navigation - Right Side */}
        <nav className="hidden items-center gap-8 md:flex">
          {[
            { label: "首頁", href: "/" },
            { label: "成員", href: "/members" },
            { label: "畫廊", href: "/gallery" },
            { label: "簽到簿", href: "/sign-book" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="relative text-sm font-medium transition-colors"
            >
              <motion.span
                animate={{
                  color: isScrolled ? "color-mix(in srgb, var(--foreground) 80%, transparent)" : "rgba(255,255,255,0.85)",
                }}
                whileHover={{
                  color: isScrolled ? "var(--foreground)" : "white",
                }}
                transition={{ duration: 0.2 }}
              >
                {item.label}
              </motion.span>
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button className="flex flex-col gap-1.5 md:hidden">
          <motion.span
            animate={{ backgroundColor: isScrolled ? "var(--foreground)" : "white" }}
            className="h-0.5 w-6 rounded-full"
          />
          <motion.span
            animate={{ backgroundColor: isScrolled ? "var(--foreground)" : "white" }}
            className="h-0.5 w-6 rounded-full"
          />
          <motion.span
            animate={{ backgroundColor: isScrolled ? "var(--foreground)" : "white" }}
            className="h-0.5 w-4 rounded-full"
          />
        </button>
      </div>
    </motion.header>
  )
}
