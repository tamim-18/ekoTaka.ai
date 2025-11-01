'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, Zap, MapPin, Shield, Recycle, TrendingUp, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'

const features = [
  {
    icon: Zap,
    title: "AI-Powered Verification",
    description: "Instant plastic recognition using advanced computer vision. Get verified in seconds, not hours.",
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    delay: 0.1
  },
  {
    icon: MapPin,
    title: "Smart Route Optimization",
    description: "AI suggests the most efficient pickup routes based on real-time data and collector density.",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    delay: 0.2
  },
  {
    icon: Shield,
    title: "Blockchain Traceability",
    description: "Every pickup is immutably recorded. Complete transparency from collection to recycling.",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    delay: 0.3
  },
  {
    icon: Recycle,
    title: "Intelligent Categorization",
    description: "Automatically classify PET, HDPE, LDPE, PP, PS with 99%+ accuracy using machine learning.",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    delay: 0.4
  },
  {
    icon: TrendingUp,
    title: "Real-Time Analytics",
    description: "Track CO₂ savings, collection trends, and environmental impact with live dashboards.",
    gradient: "from-orange-500 via-red-500 to-pink-500",
    delay: 0.5
  },
  {
    icon: Users,
    title: "Ecosystem Network",
    description: "Connect seamlessly with collectors, recyclers, and FMCG brands in one unified platform.",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    delay: 0.6
  }
]

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(16, 185, 129) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6 mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block"
          >
            <span className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">
              Powerful Features
            </span>
          </motion.div>
          <h2 className="text-5xl sm:text-6xl font-black text-gray-900 leading-tight">
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Transform Waste
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            Advanced technology meets sustainability in one powerful platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 })
            
            return (
              <motion.div
                key={index}
                ref={ref}
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{ delay: feature.delay, duration: 0.6 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <Card className="p-8 h-full border-2 border-gray-100 hover:border-emerald-300 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity"
                    style={{
                      background: `linear-gradient(135deg, ${feature.gradient.split(' ')[1]} 0%, ${feature.gradient.split(' ')[3]} 100%)`
                    }}
                  />
                  
                  <div className="relative z-10">
                    <motion.div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    
                    <motion.div
                      className="mt-6 inline-flex items-center text-emerald-600 font-semibold"
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                    >
                      Learn more <ArrowRight className="ml-2 w-4 h-4" />
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

