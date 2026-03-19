"use client"

import { motion } from "framer-motion"

export function JoinSection() {
  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-background py-24">
      {/* Decorative background dots */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute top-12 left-16 h-32 w-32 rounded-full bg-mint" />
        <div className="absolute top-1/3 right-20 h-20 w-20 rounded-full bg-peach" />
        <div className="absolute bottom-16 left-1/3 h-24 w-24 rounded-full bg-lavender" />
        <div className="absolute bottom-24 right-1/4 h-16 w-16 rounded-full bg-coral" />
      </div>

      <div className="relative z-10 text-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold tracking-tight text-foreground md:text-7xl"
        >
          Welcome to join us
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground"
        >
          Be part of our story — let&apos;s create something amazing together.
        </motion.p>
      </div>
    </section>
  )
}
