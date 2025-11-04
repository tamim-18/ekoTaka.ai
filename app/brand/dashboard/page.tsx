'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { 
  Package, ShoppingCart, DollarSign, TrendingUp, 
  ArrowRight, Loader2, Box, Wallet, BarChart3, CheckCircle2, Clock, XCircle
} from 'lucide-react'
import BrandLayout from '@/components/layouts/BrandLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { format, isToday, isYesterday } from 'date-fns'
import Link from 'next/link'

interface BrandProfile {
  stats: {
    totalPurchases: number
    totalSpent: number
    activeOrders: number
    completedOrders: number
    totalWeightPurchased: number
    totalCO2Impact: number
  }
  companyInfo: {
    companyName: string
  }
}

interface RecentOrder {
  id: string
  orderId: string
  pickupCategory: string
  quantity: number
  totalAmount: number
  status: string
  orderDate: string
  collectorName: string
}

export default function BrandDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [availablePlastic, setAvailablePlastic] = useState(0)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/sign-in')
      return
    }

    // Redirect if not brand
    if (user.role !== 'brand') {
      router.push('/collector/dashboard')
      return
    }

    // Fetch dashboard data
    fetchDashboardData()
  }, [loading, user, router])

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true)
      
      // Fetch profile and orders in parallel
      const [profileRes, ordersRes, inventoryRes] = await Promise.all([
        fetch('/api/brand/profile'),
        fetch('/api/brand/orders?limit=5&page=1'),
        fetch('/api/brand/inventory?limit=1'),
      ])

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (profileData.success) {
          setProfile(profileData.profile)
        }
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        if (ordersData.success) {
          setRecentOrders(ordersData.orders || [])
        }
      }

      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json()
        if (inventoryData.success) {
          // Calculate total available plastic
          const totalAvailable = inventoryData.inventory.reduce(
            (sum: number, item: any) => sum + (item.availableWeight || 0),
            0
          )
          setAvailablePlastic(Math.round(totalAvailable * 100) / 100)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || !user) {
    return (
      <BrandLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </BrandLayout>
    )
  }

  // If not brand, show loading (will redirect)
  if (user.role !== 'brand') {
    return (
      <BrandLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      </BrandLayout>
    )
  }

  // Calculate monthly spend (last 30 days)
  const monthlySpend = profile?.stats.totalSpent || 0 // Simplified - could filter by date
  const stats = {
    availablePlastic,
    totalCollections: profile?.stats.completedOrders || 0,
    monthlySpend,
    activeOrders: profile?.stats.activeOrders || 0,
  }

  return (
    <BrandLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.fullName || 'Brand'}! 👋
          </h1>
          <p className="text-gray-600">
            Discover and purchase verified plastic collections from our network of collectors.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Available Plastic</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.availablePlastic} kg</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-green-100 hover:border-green-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Monthly Spend</p>
                    <p className="text-2xl font-bold text-gray-900">৳{stats.monthlySpend.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 border-orange-100 hover:border-orange-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Collections</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCollections}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Box className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to purchase?</h3>
                  <p className="text-gray-600 mb-4">
                    Browse available plastic collections from verified collectors and start your purchase journey.
                  </p>
                  <Button
                    onClick={() => router.push('/brand/inventory')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    Browse Inventory
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="hidden md:block">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 flex items-center justify-center">
                    <Package className="w-16 h-16 text-blue-600/30" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                <Link href="/brand/orders">
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              {loadingData ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No orders yet</p>
                  <p className="text-sm mt-1">Start browsing inventory to place your first order</p>
                  <Button
                    onClick={() => router.push('/brand/inventory')}
                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Browse Inventory
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order, index) => {
                    const orderDate = new Date(order.orderDate)
                    const statusConfig = {
                      pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
                      confirmed: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Confirmed' },
                      processing: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Processing' },
                      shipped: { icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Shipped' },
                      delivered: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Delivered' },
                      cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' },
                    }
                    const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
                    const StatusIcon = status.icon

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                      >
                        <Link href={`/brand/orders/${order.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center`}>
                                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-gray-900">{order.orderId}</p>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                        {status.label}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {order.pickupCategory} • {order.quantity} kg • {order.collectorName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {isToday(orderDate) 
                                        ? 'Today' 
                                        : isYesterday(orderDate) 
                                        ? 'Yesterday' 
                                        : format(orderDate, 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900">৳{order.totalAmount.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500">{order.quantity} kg</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </BrandLayout>
  )
}

