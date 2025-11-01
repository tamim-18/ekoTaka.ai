'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const impactItems = [
  "Real-time CO₂ savings calculation",
  "Traceable ESG reporting for brands",
  "Geographic heatmaps of collection zones",
  "Compliance-ready EPR documentation"
]

const stats = [
  { value: "2.5K", label: "Tons CO₂ Saved", delay: 0.1 },
  { value: "98%", label: "Verification Rate", delay: 0.2 },
  { value: "15K+", label: "Kg This Month", delay: 0.3 },
  { value: "500+", label: "Active Users", delay: 0.4 },
]

export default function ImpactSection() {
  const { isSignedIn } = useUser()

  return (
    <section id="impact" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">
                Environmental Impact
              </div>
              <h2 className="text-5xl sm:text-6xl font-black text-gray-900 leading-tight">
                Measurable
                <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Sustainability
                </span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Every pickup is converted into quantifiable environmental value with transparent, verifiable reporting that brands can use for ESG compliance.
              </p>
            </div>

            <div className="space-y-4">
              {impactItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  </motion.div>
                  <span className="text-lg text-gray-700 font-medium">{item}</span>
                </motion.div>
              ))}
            </div>

            <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-10 py-7 shadow-xl shadow-emerald-500/50">
                  Start Making Impact
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => {
                const { ref, inView } = useInView({ triggerOnce: true })
                
                return (
                  <motion.div
                    key={index}
                    ref={ref}
                    initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                    animate={inView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
                    transition={{ delay: stat.delay, duration: 0.6 }}
                    whileHover={{ y: -10, rotateY: 5 }}
                  >
                    <Card className="p-8 bg-white/90 backdrop-blur-sm border-2 border-emerald-100 shadow-xl hover:shadow-2xl transition-all">
                      <div className="text-5xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                        {stat.value}
                      </div>
                      <div className="text-sm font-semibold text-gray-600">{stat.label}</div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

