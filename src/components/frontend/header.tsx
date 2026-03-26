"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

const NAV_ITEMS = [
  { label: "首頁", href: "/" },
  { label: "成員", href: "/members" },
  { label: "畫廊", href: "/gallery" },
  { label: "簽到簿", href: "/sign-book" },
]

export function Header() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [isScrolled, setIsScrolled] = useState(!isHome)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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

        {/* Navigation - Desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
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

        {/* Mobile Menu Button — hamburger ↔ X animation */}
        <button
          className="relative z-50 flex h-8 w-8 cursor-pointer flex-col items-end justify-center gap-1.5 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "關閉選單" : "開啟選單"}
        >
          <motion.span
            animate={{
              backgroundColor: (mobileOpen || isScrolled) ? "var(--foreground)" : "white",
              rotate: mobileOpen ? 45 : 0,
              y: mobileOpen ? 8 : 0,
              width: mobileOpen ? 24 : 24,
            }}
            transition={{ duration: 0.25 }}
            className="h-0.5 w-6 rounded-full"
          />
          <motion.span
            animate={{
              backgroundColor: (mobileOpen || isScrolled) ? "var(--foreground)" : "white",
              opacity: mobileOpen ? 0 : 1,
              scaleX: mobileOpen ? 0 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="h-0.5 w-6 rounded-full"
          />
          <motion.span
            animate={{
              backgroundColor: (mobileOpen || isScrolled) ? "var(--foreground)" : "white",
              rotate: mobileOpen ? -45 : 0,
              y: mobileOpen ? -8 : 0,
              width: mobileOpen ? 24 : 16,
            }}
            transition={{ duration: 0.25 }}
            className="h-0.5 w-4 rounded-full"
          />
        </button>
      </div>

      {/* Mobile Dropdown Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-black/5 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col px-6 py-4">
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 + 0.1, duration: 0.25 }}
                >
                  <Link
                    href={item.href}
                    className={`block py-3 text-lg font-medium transition-colors ${
                      pathname === item.href
                        ? "text-foreground"
                        : "text-foreground/60 active:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
