'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { ArrowRight, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Header() {
  const { user } = useAuth()

  return (
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
            {user ? (
              <Link href="/collector/dashboard">
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
  )
}

