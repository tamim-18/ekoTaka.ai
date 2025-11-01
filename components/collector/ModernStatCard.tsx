'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ModernStatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  gradient?: string
  iconGradient?: string
  sparklineData?: number[]
  delay?: number
}

export default function ModernStatCard({
  title,
  value,
  icon: Icon,
  trend,
  gradient = 'from-emerald-500 via-teal-500 to-cyan-500',
  iconGradient = 'from-emerald-400 to-teal-400',
  sparklineData = [],
  delay = 0
}: ModernStatCardProps) {
  const [hovered, setHovered] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['17.5deg', '-17.5deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-17.5deg', '17.5deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setHovered(false)
  }

  const maxSparkline = Math.max(...sparklineData, 1) || 1
  const minSparkline = Math.min(...sparklineData, 0) || 0
  const range = maxSparkline - minSparkline || 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 200 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="group relative h-full"
    >
      <div className="relative h-full p-6 rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/30 border border-emerald-100/50 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
        {/* Animated gradient background */}
        <motion.div
          className={cn("absolute inset-0 opacity-0 group-hover:opacity-[0.03] bg-gradient-to-br", gradient)}
          animate={{
            opacity: hovered ? [0, 0.03, 0] : 0,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Glowing orb effect */}
        <div className={cn(
          "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 bg-gradient-to-br",
          gradient
        )} />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{title}</p>
              <motion.p
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay + 0.2, type: "spring" }}
                className="text-4xl font-black text-gray-900 leading-none mb-2"
              >
                {value}
              </motion.p>
            </div>

            {/* Icon with 3D effect */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
              className={cn(
                "relative p-4 rounded-2xl bg-gradient-to-br shadow-xl",
                iconGradient
              )}
            >
              <div className="absolute inset-0 rounded-2xl bg-white/20 blur-sm" />
              <Icon className="relative z-10 w-6 h-6 text-white" />
            </motion.div>
          </div>

          {/* Trend */}
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className={cn(
                "flex items-center gap-2 text-sm font-bold mt-auto",
                trend.isPositive ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-400 font-normal text-xs">{trend.label}</span>
            </motion.div>
          )}

          {/* Sparkline */}
          {sparklineData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-emerald-100/50">
              <div className="flex items-end justify-between gap-1 h-12">
                {sparklineData.map((point, index) => {
                  const height = ((point - minSparkline) / range) * 100
                  return (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ 
                        delay: delay + 0.5 + index * 0.05, 
                        duration: 0.6,
                        type: "spring"
                      }}
                      className={cn(
                        "flex-1 rounded-t-full bg-gradient-to-t",
                        gradient,
                        "opacity-40 group-hover:opacity-70 transition-opacity duration-300"
                      )}
                      style={{ minHeight: '4px' }}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
          initial={false}
          animate={{
            background: hovered
              ? 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)'
              : 'transparent',
          }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </motion.div>
  )
}

