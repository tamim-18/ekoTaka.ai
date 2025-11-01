'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ActivityChartProps {
  data: number[]
  color?: 'emerald' | 'teal' | 'cyan' | 'blue'
}

const colorClasses = {
  emerald: {
    gradient: 'from-emerald-500 to-teal-500',
    fill: 'fill-emerald-500/20',
    stroke: 'stroke-emerald-500',
    bg: 'bg-emerald-100',
    text: 'text-emerald-600'
  },
  teal: {
    gradient: 'from-teal-500 to-cyan-500',
    fill: 'fill-teal-500/20',
    stroke: 'stroke-teal-500',
    bg: 'bg-teal-100',
    text: 'text-teal-600'
  },
  cyan: {
    gradient: 'from-cyan-500 to-blue-500',
    fill: 'fill-cyan-500/20',
    stroke: 'stroke-cyan-500',
    bg: 'bg-cyan-100',
    text: 'text-cyan-600'
  },
  blue: {
    gradient: 'from-blue-500 to-indigo-500',
    fill: 'fill-blue-500/20',
    stroke: 'stroke-blue-500',
    bg: 'bg-blue-100',
    text: 'text-blue-600'
  }
}

export default function ActivityChart({ data, color = 'emerald' }: ActivityChartProps) {
  const colors = colorClasses[color]
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Create SVG path for area chart
  const width = 100
  const height = 60
  const padding = 4
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth
    const y = padding + (1 - (value - min) / (max - min || 1)) * chartHeight
    return { x, y, value }
  })

  const pathData = points.map((point, index) => {
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  }).join(' ')

  const areaPath = `${pathData} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`

  return (
    <div className="relative">
      {/* SVG Chart */}
      <div className="relative h-32 w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" className={cn(colors.gradient.split(' ')[0].replace('from-', 'stop-color:'))} stopOpacity="0.4" />
              <stop offset="100%" className={cn(colors.gradient.split(' ')[2]?.replace('to-', 'stop-color:') || colors.gradient.split(' ')[1]?.replace('via-', 'stop-color:'))} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <motion.path
            d={areaPath}
            fill={`url(#gradient-${color})`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          {/* Line stroke */}
          <motion.path
            d={pathData}
            fill="none"
            strokeWidth="2"
            className={colors.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          {/* Data points */}
          {points.map((point, index) => (
            <motion.circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              className={colors.stroke}
              fill="white"
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
            />
          ))}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-4 px-2">
        {days.map((day, index) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.05 }}
            className="text-xs font-medium text-gray-500 text-center"
            style={{ width: `${100 / days.length}%` }}
          >
            {day}
          </motion.div>
        ))}
      </div>

      {/* Stats summary */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className={cn("text-lg font-bold", colors.text)}>
            {Math.round(data.reduce((a, b) => a + b, 0) / data.length)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Peak</p>
          <p className={cn("text-lg font-bold", colors.text)}>{max}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className={cn("text-lg font-bold", colors.text)}>
            {data.reduce((a, b) => a + b, 0)}
          </p>
        </div>
      </div>
    </div>
  )
}
