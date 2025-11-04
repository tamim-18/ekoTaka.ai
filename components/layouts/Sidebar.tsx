'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
          LayoutDashboard, Package, PlusCircle, Wallet, 
          User, Map, X, Menu, Leaf, Sparkles
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
    name: 'EkoTokens',
    href: '/collector/tokens',
    icon: Sparkles,
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
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(true)
  const [mounted, setMounted] = useState(false)
  // Removed expanded state - sidebar is always full width when open

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      const width = window.innerWidth
      setIsMobile(width < 1024)
      // Auto-open on desktop
      if (width >= 1024) {
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
        <AnimatePresence>
          {isOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            x: isMobile ? (isOpen ? 0 : -240) : 0,
            width: 240 // Fixed width - always 240px (reduced from 320px)
          }}
          className={cn(
            "fixed left-0 top-0 z-50 h-screen bg-gradient-to-b from-white via-emerald-50/30 to-teal-50/30",
            "backdrop-blur-xl border-r border-emerald-100/50 shadow-xl",
            "lg:relative lg:z-auto lg:shadow-none",
            "flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out"
          )}
        >
          {/* Header - Compact */}
          <div className="flex items-center justify-between p-4 border-b border-emerald-100/30">
            <Link href="/collector/dashboard" className="flex items-center gap-3 min-w-0">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Leaf className="w-5 h-5 text-white" />
              </motion.div>
              <div className="overflow-hidden">
                <span className="text-lg font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent block whitespace-nowrap">
                  EkoTaka
                </span>
                <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap">Collector</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="lg:hidden h-8 w-8 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation - Compact icons with tooltips */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              // Check exact match first
              const exactMatch = pathname === item.href
              
              // For parent routes, check if pathname starts with href + '/'
              // But exclude cases where a more specific menu route exists
              const isParentRoute = pathname?.startsWith(item.href + '/')
              
              // Check if there's a more specific menu route that should be active instead
              // This prevents both /collector/pickups and /collector/pickups/new from being highlighted
              const hasMoreSpecificMenuRoute = navigationItems.some(
                otherItem => 
                  otherItem.href !== item.href && 
                  pathname === otherItem.href && // Exact match with another menu item
                  otherItem.href.startsWith(item.href + '/') // That other item is a child of this one
              )
              
              // Active if exact match, or if it's a parent route and no more specific menu route exists
              const isActive = exactMatch || (isParentRoute && !hasMoreSpecificMenuRoute)
              const isHighlight = item.highlight

              const navItem = (
                <Link href={item.href} className="block">
                  <motion.div
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden",
                      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-emerald-500/10 before:to-teal-500/10 before:opacity-0 before:transition-opacity",
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 before:opacity-100"
                        : "text-gray-700 hover:bg-emerald-50/50 hover:text-emerald-700 before:hover:opacity-100",
                      isHighlight && !isActive && "border border-emerald-200/50 bg-emerald-50/30"
                    )}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0 transition-transform",
                      isActive ? "text-white" : "text-gray-600 group-hover:text-emerald-600",
                      isActive && "scale-110"
                    )} />
                    <span className="font-semibold text-sm whitespace-nowrap overflow-hidden">
                      {item.name}
                    </span>
                    {item.badge && !isActive && (
                      <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-white">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/90 shadow-sm"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              )

              return <div key={item.href}>{navItem}</div>
            })}
          </nav>

          {/* User Profile Section - Compact */}
          <div className="p-3 border-t border-emerald-100/30">
            <Link href="/collector/profile">
              <motion.div
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <Avatar className="w-8 h-8 border-2 border-emerald-200 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {user?.fullName || 'Collector'}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {user?.email?.split('@')[0] || 'user'}
                  </p>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.aside>
      </>
  )
}
