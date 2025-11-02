'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Sparkles, Waves, ArrowDown, Users, Recycle, Shield, Zap, Leaf, Globe, Target, Activity, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FloatingIcon } from './FloatingIcon'
import { AnimatedCounter } from './AnimatedCounter'

export default function HeroSection() {
  const { isSignedIn } = useUser()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        
        {/* Enhanced Floating Icons */}
        <FloatingIcon icon={Recycle} x={10} y={20} delay={0} duration={10} color="emerald" />
        <FloatingIcon icon={Leaf} x={85} y={30} delay={1.5} duration={12} color="green" />
        <FloatingIcon icon={Zap} x={20} y={70} delay={3} duration={9} color="teal" />
        <FloatingIcon icon={Globe} x={75} y={80} delay={2} duration={11} color="cyan" />
        <FloatingIcon icon={Target} x={50} y={10} delay={1} duration={8} color="emerald" />
        <FloatingIcon icon={Activity} x={90} y={60} delay={4} duration={10} color="teal" />
        <FloatingIcon icon={TrendingUp} x={15} y={50} delay={2.5} duration={9} color="green" />
        <FloatingIcon icon={Shield} x={80} y={15} delay={1.8} duration={11} color="cyan" />

        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-400/30 to-teal-400/30 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-teal-400/30 to-cyan-400/30 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Hero Content */}
      <motion.div 
        className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200/50 shadow-lg backdrop-blur-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </motion.div>
            <span className="text-sm font-bold text-emerald-700">AI-Powered Waste Revolution</span>
          </motion.div>

          {/* Main Heading */}
          <div className="space-y-4">
            <motion.h1 
              className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <span className="block text-gray-900">Transform</span>
              <motion.span 
                className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: "200% auto",
                }}
              >
                Plastic Into
              </motion.span>
              <span className="block text-gray-900">Digital Gold</span>
            </motion.h1>

            <motion.p 
              className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              The intelligent ecosystem where every kilogram of plastic waste becomes 
              <span className="font-bold text-emerald-600"> traceable ESG value</span>
            </motion.p>
          </div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <Link href={isSignedIn ? "/collector/dashboard" : "/sign-up"}>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="text-lg px-10 py-7 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold shadow-2xl shadow-emerald-500/50 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center">
                    Start Your Journey
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={false}
                  />
                </Button>
              </motion.div>
            </Link>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-10 py-7 border-2 border-gray-300 hover:border-emerald-500 font-semibold group"
              >
                <Waves className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                Explore Platform
              </Button>
            </motion.div>
          </motion.div>

          {/* Live Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {[
              { number: 500, suffix: "+", label: "Active Collectors", icon: Users },
              { number: 50, suffix: "K+", label: "Kg Collected", icon: Recycle },
              { number: 200, suffix: "+", label: "Verified Brands", icon: Shield },
              { number: 99, suffix: "%", label: "AI Accuracy", icon: Zap },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={i}
                  className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-emerald-100/50 shadow-lg hover:shadow-xl transition-all group"
                  whileHover={{ y: -5, scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    <AnimatedCounter end={stat.number} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowDown className="w-6 h-6 text-gray-400" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

