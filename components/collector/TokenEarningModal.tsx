'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, CheckCircle2, Award } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TokenEarningModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokensEarned: number
  milestones?: Array<{
    milestone: string
    tokens: number
    description: string
  }>
  breakdown?: string[]
}

export default function TokenEarningModal({
  open,
  onOpenChange,
  tokensEarned,
  milestones = [],
  breakdown = [],
}: TokenEarningModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (open) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [open])

  const totalTokens = tokensEarned + milestones.reduce((sum, m) => sum + m.tokens, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0">
        <div className="relative bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 text-white">
          {/* Confetti effect */}
          <AnimatePresence>
            {showConfetti && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: '50%',
                      y: '50%',
                      opacity: 1,
                      scale: 1,
                    }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 200}%`,
                      y: `${50 + (Math.random() - 0.5) * 200}%`,
                      opacity: 0,
                      scale: 0,
                      rotate: Math.random() * 360,
                    }}
                    transition={{
                      duration: 2,
                      delay: Math.random() * 0.5,
                    }}
                    className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          <div className="relative z-10 p-6">
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center"
                >
                  <Sparkles className="w-10 h-10" />
                </motion.div>
              </div>
              <DialogTitle className="text-3xl font-black text-center mb-2">
                Tokens Earned! 🎉
              </DialogTitle>
              <DialogDescription className="text-center text-white/80">
                Your rewards have been added to your balance
              </DialogDescription>
            </DialogHeader>

            {/* Total Tokens */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-center my-6"
            >
              <div className="text-6xl font-black mb-2">{totalTokens.toLocaleString()}</div>
              <div className="text-lg font-semibold text-white/80">EkoTokens</div>
            </motion.div>

            {/* Breakdown */}
            {breakdown.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
                <h4 className="text-sm font-bold mb-2 uppercase tracking-wider">Breakdown</h4>
                <div className="space-y-1">
                  {breakdown.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-xs text-white/80 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            {milestones.length > 0 && (
              <div className="space-y-2 mb-4">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.milestone}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                  >
                    <Award className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-bold text-sm">{milestone.description}</div>
                      <div className="text-xs text-white/70">+{milestone.tokens.toLocaleString()} tokens</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-white text-cyan-600 hover:bg-white/90 font-bold"
            >
              Awesome!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

