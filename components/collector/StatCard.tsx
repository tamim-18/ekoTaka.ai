'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
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
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  gradient = 'from-emerald-500 to-teal-500',
  iconBg = 'bg-emerald-100'
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-emerald-100/50 p-6 shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* Gradient accent */}
      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 bg-gradient-to-br", gradient)} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-black text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}%</span>
              <span className="text-gray-500 font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        
        <div className={cn("p-3 rounded-xl", iconBg)}>
          <Icon className={cn("w-6 h-6 text-emerald-600")} />
        </div>
      </div>
    </motion.div>
  )
}

