'use client'

import { motion } from 'framer-motion'
import { Target, Award, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImpactMeterProps {
  weight: number
  co2: number
  pendingEarnings: number
}

export default function ImpactMeter({ weight, co2, pendingEarnings }: ImpactMeterProps) {
  const metrics = [
    {
      label: 'Weight Collected',
      value: weight,
      unit: 'kg',
      icon: Target,
      color: 'from-emerald-400 to-emerald-600',
      progress: Math.min((weight / 1000) * 100, 100)
    },
    {
      label: 'CO₂ Saved',
      value: co2,
      unit: 'kg',
      icon: Award,
      color: 'from-teal-400 to-teal-600',
      progress: Math.min((co2 / 1400) * 100, 100)
    },
    {
      label: 'Pending',
      value: pendingEarnings,
      unit: '৳',
      icon: TrendingUp,
      color: 'from-cyan-400 to-cyan-600',
      progress: Math.min((pendingEarnings / 1000) * 100, 100)
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white shadow-2xl"
    >
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black">Your Impact</h3>
        </div>

        <div className="space-y-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${metric.color} shadow-lg`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-white/90">{metric.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">{metric.value.toLocaleString()}</p>
                    <p className="text-xs text-white/70">{metric.unit}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.progress}%` }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 1, type: "spring" }}
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r shadow-lg",
                      metric.color
                    )}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Achievement badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 pt-6 border-t border-white/20"
        >
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <Award className="w-4 h-4" />
              <span className="font-bold">Eco Warrior</span>
            </div>
            <span className="text-white/80">Keep up the amazing work!</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

