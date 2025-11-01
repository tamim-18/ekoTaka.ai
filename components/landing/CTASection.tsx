'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CTASection() {
  const { isSignedIn } = useUser()

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          backgroundSize: "200% 200%",
        }}
      />
      
      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-8"
        >
          <motion.h2
            className="text-5xl sm:text-6xl font-black text-white leading-tight"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Ready to Transform
            <br />
            Waste Into Value?
          </motion.h2>
          <p className="text-xl text-emerald-50 max-w-2xl mx-auto font-medium">
            Join thousands of collectors and brands creating a sustainable future through intelligent technology
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="secondary" className="text-lg px-10 py-7 font-bold shadow-2xl cursor-pointer">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-2 border-white text-emerald-600 hover:bg-white hover:text-emerald-600 font-bold cursor-pointer">
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

