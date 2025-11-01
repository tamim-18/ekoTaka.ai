'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FloatingActionCardProps {
  icon: LucideIcon
  title: string
  description: string
  href: string
  gradient: string
  delay?: number
}

export default function FloatingActionCard({
  icon: Icon,
  title,
  description,
  href,
  gradient,
  delay = 0
}: FloatingActionCardProps) {
  return (
    <Link href={href} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay, duration: 0.5, type: "spring", stiffness: 200 }}
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative h-full p-6 rounded-3xl overflow-hidden cursor-pointer",
          "bg-gradient-to-br shadow-xl hover:shadow-2xl transition-all duration-500",
          gradient,
          "text-white"
        )}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Icon className="w-7 h-7" />
            </div>
          </motion.div>

          <h3 className="text-xl font-black mb-2">{title}</h3>
          <p className="text-sm text-white/80 font-medium leading-relaxed">{description}</p>

          {/* Arrow indicator */}
          <div className="mt-auto pt-4">
            <motion.div
              className="inline-flex items-center gap-2 text-sm font-semibold"
              whileHover={{ x: 5 }}
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Glow effect */}
        <motion.div
          className={cn(
            "absolute -inset-1 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500",
            "bg-gradient-to-br",
            gradient
          )}
        />
      </motion.div>
    </Link>
  )
}

