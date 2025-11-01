'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Award } from 'lucide-react'
import { Card } from '@/components/ui/card'

const testimonials = [
  {
    quote: "EkoTaka.ai has revolutionized our collection process. The AI verification saves hours every day.",
    author: "Shamim Ahmed",
    role: "Professional Collector",
    stats: "2,500+ kg collected",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    quote: "The traceability features help us meet our EPR compliance requirements effortlessly.",
    author: "Unilever Bangladesh",
    role: "FMCG Brand Partner",
    stats: "150+ tons verified",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    quote: "Real-time analytics give us insights we never had before. Game-changing platform.",
    author: "GreenCycle Ltd",
    role: "Recycling Partner",
    stats: "98% accuracy rate",
    gradient: "from-purple-500 to-pink-500"
  }
]

const brands = ['Unilever', 'P&G', 'Nestlé', 'Coca-Cola', 'PepsiCo']

export default function TestimonialsSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            Trusted by <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Industry Leaders</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how brands and collectors are transforming waste management
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => {
            const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 })
            
            return (
              <motion.div
                key={index}
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="p-8 h-full border-2 border-gray-100 hover:border-emerald-300 bg-gradient-to-br from-white to-gray-50/50 shadow-lg hover:shadow-2xl transition-all">
                  <div className="space-y-6">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    
                    <p className="text-gray-700 text-lg leading-relaxed font-medium italic">
                      "{testimonial.quote}"
                    </p>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="font-bold text-gray-900">{testimonial.author}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        {testimonial.stats}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Logo Cloud */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-12 border-t border-gray-200"
        >
          <p className="text-center text-sm text-gray-500 mb-8 font-medium">Trusted by leading organizations</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
            {brands.map((brand, i) => (
              <motion.div
                key={i}
                className="text-2xl font-black text-gray-400"
                whileHover={{ scale: 1.1, color: 'rgb(16, 185, 129)' }}
                transition={{ duration: 0.3 }}
              >
                {brand}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

