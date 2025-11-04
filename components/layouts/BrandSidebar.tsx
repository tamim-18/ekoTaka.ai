'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, Package, ShoppingCart, 
  Wallet, User, X, BarChart3, Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface BrandSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/brand/dashboard',
    icon: LayoutDashboard,
    badge: null
  },
  {
    name: 'Inventory',
    href: '/brand/inventory',
    icon: Package,
    badge: null
  },
  {
    name: 'Orders',
    href: '/brand/orders',
    icon: ShoppingCart,
    badge: null
  },
  {
    name: 'Transactions',
    href: '/brand/transactions',
    icon: Wallet,
    badge: null
  },
  {
    name: 'Analytics',
    href: '/brand/analytics',
    icon: BarChart3,
    badge: null
  },
  {
    name: 'Profile',
    href: '/brand/profile',
    icon: User,
    badge: null
  }
]

export default function BrandSidebar({ isOpen, setIsOpen }: BrandSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(true)
  const [mounted, setMounted] = useState(false)

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
          width: 240
        }}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-gradient-to-b from-white via-blue-50/30 to-indigo-50/30",
          "backdrop-blur-xl border-r border-blue-100/50 shadow-xl",
          "lg:relative lg:z-auto lg:shadow-none",
          "flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out"
        )}
      >
        {/* Header - Brand Theme */}
        <div className="flex items-center justify-between p-4 border-b border-blue-100/30">
          <Link href="/brand/dashboard" className="flex items-center gap-3 min-w-0">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Building2 className="w-5 h-5 text-white" />
            </motion.div>
            <div className="overflow-hidden">
              <span className="text-lg font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block whitespace-nowrap">
                EkoTaka
              </span>
              <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap">Brand Portal</p>
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

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const exactMatch = pathname === item.href
            const isParentRoute = pathname?.startsWith(item.href + '/')
            const hasMoreSpecificMenuRoute = navigationItems.some(
              otherItem => 
                otherItem.href !== item.href && 
                pathname === otherItem.href &&
                otherItem.href.startsWith(item.href + '/')
            )
            const isActive = exactMatch || (isParentRoute && !hasMoreSpecificMenuRoute)

            const navItem = (
              <Link href={item.href} className="block">
                <motion.div
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden",
                    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/10 before:to-indigo-500/10 before:opacity-0 before:transition-opacity",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30 before:opacity-100"
                      : "text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 before:hover:opacity-100"
                  )}
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform",
                    isActive ? "text-white" : "text-gray-600 group-hover:text-blue-600",
                    isActive && "scale-110"
                  )} />
                  <span className="font-semibold text-sm whitespace-nowrap overflow-hidden">
                    {item.name}
                  </span>
                  {item.badge && !isActive && (
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500 text-white">
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

        {/* User Profile Section */}
        <div className="p-3 border-t border-blue-100/30">
          <Link href="/brand/profile">
            <motion.div
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-blue-50/50 transition-colors group cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <Avatar className="w-8 h-8 border-2 border-blue-200 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-bold">
                  {user?.fullName?.charAt(0) || 'B'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {user?.fullName || 'Brand'}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {user?.email?.split('@')[0] || 'brand'}
                </p>
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.aside>
    </>
  )
}

