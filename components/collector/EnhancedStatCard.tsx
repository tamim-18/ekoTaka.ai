'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedStatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  gradient?: string
  iconBg?: string
  progress?: number
  sparklineData?: number[]
}

export default function EnhancedStatCard({
  title,
  value,
  icon: Icon,
  trend,
  gradient = 'from-emerald-500 via-teal-500 to-cyan-500',
  iconBg = 'bg-emerald-100',
  progress,
  sparklineData = []
}: EnhancedStatCardProps) {
  const maxSparkline = Math.max(...sparklineData, 1)
  const minSparkline = Math.min(...sparklineData, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="group relative overflow-hidden rounded-3xl bg-white border-2 border-emerald-100/50 p-6 shadow-lg hover:shadow-2xl transition-all duration-500"
    >
      {/* Animated gradient background */}
      <motion.div
        className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br", gradient)}
        animate={{
          opacity: [0, 0.05, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Top right accent */}
      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-gradient-to-br", gradient)} />

      {/* Circular progress ring if provided */}
      {progress !== undefined && (
        <div className="absolute top-4 right-4 w-16 h-16">
          <svg className="transform -rotate-90 w-16 h-16">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-emerald-100"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - progress / 100) }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-emerald-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-emerald-600">{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-black text-gray-900 mb-3"
            >
              {value}
            </motion.p>
          </div>
          
          {/* Icon with gradient background */}
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className={cn(
              "relative p-4 rounded-2xl shadow-lg",
              iconBg
            )}
          >
            <div className={cn("absolute inset-0 rounded-2xl opacity-20 bg-gradient-to-br", gradient)} />
            <Icon className={cn("relative z-10 w-6 h-6 text-emerald-600")} />
          </motion.div>
        </div>

        {/* Trend indicator */}
        {trend && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "flex items-center gap-2 text-sm font-semibold",
              trend.isPositive ? "text-emerald-600" : "text-red-500"
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-gray-500 font-normal text-xs">{trend.label}</span>
          </motion.div>
        )}

        {/* Mini sparkline chart */}
        {sparklineData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-end gap-1 h-8">
              {sparklineData.map((point, index) => {
                const height = ((point - minSparkline) / (maxSparkline - minSparkline || 1)) * 100
                return (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                    className={cn(
                      "flex-1 rounded-t bg-gradient-to-t",
                      gradient.replace('from-', '').replace('via-', '').replace('to-', '').split(' ')[0] + "-500",
                      "opacity-60 hover:opacity-100 transition-opacity"
                    )}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
