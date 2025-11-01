'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const steps = [
  {
    step: "01",
    title: "Collect & Log",
    description: "Use our intuitive mobile app to photograph, categorize, and log your plastic collection. Everything happens in seconds.",
    icon: "📸",
    color: "from-purple-500 to-pink-500"
  },
  {
    step: "02",
    title: "AI Verification",
    description: "Our advanced AI instantly analyzes images, verifies plastic types, estimates weight, and detects duplicates.",
    icon: "🤖",
    color: "from-blue-500 to-cyan-500"
  },
  {
    step: "03",
    title: "Instant Value",
    description: "Get verified instantly, earn digital tokens, and see your environmental impact reflected in real-time analytics.",
    icon: "✨",
    color: "from-emerald-500 to-teal-500"
  }
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 overflow-hidden">
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-0 w-96 h-96 rounded-full bg-emerald-200/20 blur-3xl"
          animate={{
            scale: [1, 1.5, 1],
            x: [0, 200, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-6 mb-20"
        >
          <h2 className="text-5xl sm:text-6xl font-black text-gray-900">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            Three steps from collection to value creation
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-30" />
          
          {steps.map((step, index) => {
            const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 })
            
            return (
              <motion.div
                key={index}
                ref={ref}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ delay: index * 0.2, duration: 0.6, type: "spring" }}
                className="relative text-center"
              >
                <motion.div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-2xl font-black mb-6 mx-auto shadow-xl relative z-10`}
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {step.step}
                </motion.div>
                
                <motion.div
                  className="text-7xl mb-6"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}
                >
                  {step.icon}
                </motion.div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{step.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

