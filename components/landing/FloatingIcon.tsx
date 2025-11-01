'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface FloatingIconProps {
  icon: LucideIcon
  delay?: number
  duration?: number
  x?: number
  y?: number
  color?: 'emerald' | 'teal' | 'cyan' | 'green'
}

export function FloatingIcon({ icon: Icon, delay = 0, duration = 8, x = 0, y = 0, color = "emerald" }: FloatingIconProps) {
  const colorVariants = {
    emerald: "text-emerald-500",
    teal: "text-teal-500",
    cyan: "text-cyan-500",
    green: "text-green-500",
  }

  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.1, 1],
        y: [0, -40, 20, -30, 10, 0],
        x: [0, 30, -20, 25, -15, 0],
        rotate: [0, 15, -15, 20, -10, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      whileHover={{ 
        scale: 1.3, 
        opacity: 0.8,
        rotate: 360,
        transition: { duration: 0.5 }
      }}
    >
      <div className="relative">
        {/* Glow effect */}
        <motion.div
          className={`absolute inset-0 ${colorVariants[color]} blur-xl opacity-30`}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay
          }}
        />
        
        {/* Icon */}
        <div className="relative">
          <Icon className={`w-16 h-16 ${colorVariants[color]} drop-shadow-lg group-hover:drop-shadow-2xl transition-all`} 
            strokeWidth={1.5}
            fill="currentColor"
            fillOpacity={0.1}
          />
          
          {/* Animated ring */}
          <motion.div
            className={`absolute inset-0 rounded-full border-2 ${colorVariants[color]} opacity-20`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

