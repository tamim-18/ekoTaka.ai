'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { 
  ArrowRight, CheckCircle2, Leaf, Recycle, TrendingUp, Zap, 
  MapPin, Shield, Users, Sparkles, Waves, Circle, Target,
  Award, Globe, Activity, ArrowDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Enhanced Animated Floating Elements Component
const FloatingIcon = ({ icon: Icon, delay = 0, duration = 8, x = 0, y = 0, color = "emerald" }: any) => {
  const colorVariants: any = {
    emerald: "text-emerald-500",
    teal: "text-teal-500",
    cyan: "text-cyan-500",
    green: "text-green-500",
  }

  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.1, 1],
        y: [0, -40, 20, -30, 10, 0],
        x: [0, 30, -20, 25, -15, 0],
        rotate: [0, 15, -15, 20, -10, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      whileHover={{ 
        scale: 1.3, 
        opacity: 0.8,
        rotate: 360,
        transition: { duration: 0.5 }
      }}
    >
      <div className="relative">
        {/* Glow effect */}
        <motion.div
          className={`absolute inset-0 ${colorVariants[color] || colorVariants.emerald} blur-xl opacity-30`}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay
          }}
        />
        
        {/* Icon with gradient */}
        <div className="relative">
          <Icon className={`w-16 h-16 ${colorVariants[color] || colorVariants.emerald} drop-shadow-lg group-hover:drop-shadow-2xl transition-all`} 
            strokeWidth={1.5}
            fill="currentColor"
            fillOpacity={0.1}
          />
          
          {/* Animated ring */}
          <motion.div
            className={`absolute inset-0 rounded-full border-2 ${colorVariants[color] || colorVariants.emerald} opacity-20`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// Parallax Section Component
const ParallaxSection = ({ children, speed = 0.5, className = "" }: any) => {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, 300 * speed])
  const opacity = useTransform(scrollY, [0, 300, 600], [1, 0.8, 0])
  
  return (
    <motion.div style={{ y, opacity }} className={className}>
      {children}
    </motion.div>
  )
}

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2, suffix = "" }: any) => {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView({ triggerOnce: true })

  useEffect(() => {
    if (inView) {
      let startTime: number | null = null
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime
        const elapsed = (currentTime - startTime) / 1000
        const progress = Math.min(elapsed / duration, 1)
        
        setCount(Math.floor(end * progress))
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [inView, end, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

export default function Home() {
  const { isSignedIn } = useUser()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scaleProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100 })

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Enhanced Header with Scroll Effect */}
      <motion.header 
        className="fixed top-0 w-full z-50 transition-all duration-300"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)'
        }}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Leaf className="w-7 h-7 text-white" />
              </motion.div>
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                EkoTaka.ai
              </span>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-10">
              {['Features', 'How It Works', 'Impact'].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-gray-700 font-medium relative group"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {item}
                  <motion.span 
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-full transition-all duration-300"
                  />
                </motion.a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="font-semibold">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button variant="ghost" size="sm" className="font-semibold">Sign In</Button>
                  </Link>
                  <Link href="/sign-up">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/50">
                        Get Started
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </motion.div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Revolutionary Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        {/* Dynamic Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          {/* Enhanced Floating Icons with Better Visibility */}
          {[
            { icon: Recycle, x: 10, y: 20, delay: 0, duration: 10, color: "emerald" },
            { icon: Leaf, x: 85, y: 30, delay: 1.5, duration: 12, color: "green" },
            { icon: Zap, x: 20, y: 70, delay: 3, duration: 9, color: "teal" },
            { icon: Globe, x: 75, y: 80, delay: 2, duration: 11, color: "cyan" },
            { icon: Target, x: 50, y: 10, delay: 1, duration: 8, color: "emerald" },
            { icon: Activity, x: 90, y: 60, delay: 4, duration: 10, color: "teal" },
            { icon: TrendingUp, x: 15, y: 50, delay: 2.5, duration: 9, color: "green" },
            { icon: Shield, x: 80, y: 15, delay: 1.8, duration: 11, color: "cyan" },
          ].map((item, i) => (
            <FloatingIcon key={i} {...item} />
          ))}

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

        {/* Hero Content with Parallax */}
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

            {/* Main Heading with Staggered Animation */}
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

            {/* CTA Buttons with Enhanced Animation */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
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

            {/* Live Stats with Counter Animation */}
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

      {/* Revolutionary Features Section with Scroll Animations */}
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
            {[
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
            ].map((feature, index) => {
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
                    {/* Gradient Overlay on Hover */}
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
                      
                      {/* Animated Arrow */}
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

      {/* How It Works - Interactive Timeline */}
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
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-30" />
            
            {[
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
            ].map((step, index) => {
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
                  {/* Step Number Badge */}
                  <motion.div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-2xl font-black mb-6 mx-auto shadow-xl relative z-10`}
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {step.step}
                  </motion.div>
                  
                  {/* Icon */}
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

      {/* Testimonials / Success Stories Section */}
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
            {[
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
            ].map((testimonial, index) => {
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
              {['Unilever', 'P&G', 'Nestlé', 'Coca-Cola', 'PepsiCo'].map((brand, i) => (
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

      {/* Impact Section - Parallax Cards */}
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
                  {[
                    "Real-time CO₂ savings calculation",
                    "Traceable ESG reporting for brands",
                    "Geographic heatmaps of collection zones",
                    "Compliance-ready EPR documentation"
                  ].map((item, index) => (
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
                  {[
                    { value: "2.5K", label: "Tons CO₂ Saved", delay: 0.1 },
                    { value: "98%", label: "Verification Rate", delay: 0.2 },
                    { value: "15K+", label: "Kg This Month", delay: 0.3 },
                    { value: "500+", label: "Active Users", delay: 0.4 },
                  ].map((stat, index) => {
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

      {/* Final CTA Section */}
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

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-gray-300 py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Leaf className="w-7 h-7 text-white" />
                </motion.div>
                <span className="text-2xl font-black text-white">EkoTaka.ai</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                AI-powered platform revolutionizing Bangladesh's plastic waste value chain through intelligent technology.
              </p>
            </motion.div>

            {[
              {
                title: "Product",
                links: ["Features", "How It Works", "Impact", "Pricing"]
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Partners"]
              },
              {
                title: "Support",
                links: ["Help Center", "Contact", "Privacy", "Terms"]
              }
            ].map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h4 className="font-bold text-white mb-4 text-lg">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link href="#" className="hover:text-emerald-400 transition-colors text-gray-400">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between"
          >
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} EkoTaka.ai. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 sm:mt-0">
              {['Twitter', 'LinkedIn', 'GitHub'].map((social, i) => (
                <motion.a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-emerald-600 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
