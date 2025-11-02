'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Award, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TokenBalanceCardProps {
  balance: number
  monthlyEarned?: number
  nextMilestone?: {
    milestone: string
    tokens: number
    description: string
    progress: number
    current: number
    target: number
  } | null
  isLoading?: boolean
  className?: string
}

export default function TokenBalanceCard({
  balance,
  monthlyEarned = 0,
  nextMilestone,
  isLoading = false,
  className,
}: TokenBalanceCardProps) {
  const [displayBalance, setDisplayBalance] = useState(0)

  // Animate balance counter
  useEffect(() => {
    if (isLoading) return

    const startBalance = displayBalance
    const difference = balance - startBalance
    const duration = 600
    const steps = 20
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayBalance(Math.round(startBalance + difference * eased))

      if (currentStep >= steps) {
        setDisplayBalance(balance)
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [balance, isLoading])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('relative', className)}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 shadow-xl border border-emerald-200/50">
        {/* Subtle animated background */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Balance */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">EkoTokens</h3>
                <p className="text-[10px] text-white/70">Reward Balance</p>
              </div>
            </div>
            
            <div className="flex items-baseline gap-3">
              <motion.div
                key={displayBalance}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className="text-5xl md:text-6xl font-black text-white tracking-tight"
              >
                {isLoading ? (
                  <span className="inline-block w-32 h-14 bg-white/20 rounded-lg animate-pulse" />
                ) : (
                  displayBalance.toLocaleString()
                )}
              </motion.div>
              {monthlyEarned > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-semibold text-white">
                    +{monthlyEarned.toLocaleString()}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right: Milestone */}
          {nextMilestone && (
            <div className="md:col-span-1 md:border-l md:border-white/20 md:pl-6">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-white/90">Next Milestone</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/80 mb-2">
                  <span>{nextMilestone.current} / {nextMilestone.target}</span>
                  <span className="font-semibold">{Math.round(nextMilestone.progress)}%</span>
                </div>
                
                <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(nextMilestone.progress, 100)}%` }}
                    transition={{ delay: 0.2, duration: 1, type: 'spring' }}
                    className="h-full bg-white rounded-full shadow-sm"
                  />
                </div>
                
                <p className="text-[10px] text-white/70 leading-tight mt-2">
                  {nextMilestone.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none"
          animate={{
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
          }}
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
          }}
        />
      </div>
    </motion.div>
  )
}
