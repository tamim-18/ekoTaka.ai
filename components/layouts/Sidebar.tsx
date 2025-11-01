'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, Package, PlusCircle, Wallet, 
  User, Map, X, Menu, Leaf
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/collector/dashboard',
    icon: LayoutDashboard,
    badge: null
  },
  {
    name: 'My Pickups',
    href: '/collector/pickups',
    icon: Package,
    badge: null
  },
  {
    name: 'New Pickup',
    href: '/collector/pickups/new',
    icon: PlusCircle,
    badge: 'New',
    highlight: true
  },
  {
    name: 'Payments',
    href: '/collector/payments',
    icon: Wallet,
    badge: null
  },
  {
    name: 'Map View',
    href: '/collector/map',
    icon: Map,
    badge: null
  },
  {
    name: 'Profile',
    href: '/collector/profile',
    icon: User,
    badge: null
  }
]

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const [isMobile, setIsMobile] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      // Auto-open on desktop
      if (window.innerWidth >= 1024) {
        setIsOpen(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setIsOpen])

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile ? (isOpen ? 0 : -320) : 0
        }}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-80 bg-white/95 backdrop-blur-xl border-r border-emerald-100/50 shadow-2xl",
          "lg:relative lg:z-auto lg:shadow-none",
          "flex flex-col flex-shrink-0"
        )}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-100/50">
          <Link href="/collector/dashboard" className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Leaf className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                EkoTaka
              </span>
              <p className="text-xs text-gray-500 font-medium">Collector Portal</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const isHighlight = item.highlight

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={item.href}>
                  <motion.div
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/50"
                        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700",
                      isHighlight && !isActive && "border-2 border-emerald-200 bg-emerald-50/50"
                    )}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive ? "text-white" : "text-gray-600 group-hover:text-emerald-600"
                    )} />
                    <span className="font-semibold flex-1">{item.name}</span>
                    {item.badge && !isActive && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500 text-white">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-2 w-2 h-2 rounded-full bg-white"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-emerald-100/50">
          <Link href="/collector/profile">
            <motion.div
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors group"
              whileHover={{ scale: 1.02 }}
            >
              <Avatar className="w-10 h-10 border-2 border-emerald-200">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.fullName || 'Collector'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.primaryEmailAddress?.emailAddress || 'user@ekotaka.ai'}
                </p>
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.aside>
    </>
  )
}

