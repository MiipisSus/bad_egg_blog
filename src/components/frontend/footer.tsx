import Link from "next/link"
import { Github, Twitter, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer id="sign-book" className="bg-cream">
      <div className="px-6 py-12 md:px-12 md:py-16">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Author Info */}
          <div className="flex flex-col items-center gap-4 md:items-start">
            <span className="text-xl font-bold tracking-tight text-foreground">
              CLUB NAME
            </span>
            <p className="max-w-xs text-center text-sm text-muted-foreground md:text-left">
              Created with love by the Club team. Building communities, one connection at a time.
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-mint/40 text-foreground transition-colors hover:bg-mint/60"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender/50 text-foreground transition-colors hover:bg-lavender/70"
            >
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-coral/40 text-foreground transition-colors hover:bg-coral/60"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-border/40 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Club Name. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
