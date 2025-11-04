'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import Link from 'next/link'
import BrandLayout from '@/components/layouts/BrandLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ShoppingCart,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  TrendingUp,
  ArrowRight,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Weight,
  DollarSign,
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

interface Order {
  id: string
  orderId: string
  collectorId: string
  collectorName: string
  collectorEmail?: string
  pickupId: string
  pickupCategory: string
  pickupLocation?: {
    coordinates: [number, number]
    address: string
  }
  quantity: number
  unitPrice: number
  totalAmount: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  orderDate: string
  confirmedAt?: string
  processingAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  cancellationReason?: string
  paymentStatus: string
  paymentMethod?: string
  shippingAddress: {
    street: string
    city: string
    district: string
    country: string
  }
  notes?: string
  estimatedDeliveryDate?: string
  trackingNumber?: string
}

export default function BrandOrdersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasMore: false,
  })
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/sign-in')
      return
    }

    if (user.role !== 'brand') {
      router.push('/collector/dashboard')
      return
    }

    fetchOrders()
  }, [authLoading, user, router, statusFilter, currentPage])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/brand/orders?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      if (data.success) {
        setOrders(data.orders || [])
        setPagination(data.pagination || { total: 0, totalPages: 1, hasMore: false })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      setCancellingOrderId(orderId)

      const response = await fetch(`/api/brand/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          cancellationReason: 'Cancelled by brand',
        }),
      })

      const data = await response.json()

      if (data.success) {
        fetchOrders() // Refresh orders
      } else {
        alert(data.error || 'Failed to cancel order')
      }
    } catch (err) {
      alert('Failed to cancel order')
    } finally {
      setCancellingOrderId(null)
    }
  }

  if (authLoading || !user) {
    return (
      <BrandLayout title="Orders">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </BrandLayout>
    )
  }

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Pending' },
    confirmed: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Confirmed' },
    processing: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Processing' },
    shipped: { icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Shipped' },
    delivered: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Delivered' },
    cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Cancelled' },
  }

  return (
    <BrandLayout title="Orders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your plastic purchases</p>
          </div>
          <Link href="/brand/inventory">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              Browse Inventory
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
            const config = statusConfig[status as keyof typeof statusConfig]
            const StatusIcon = config?.icon || Clock
            const isActive = statusFilter === status

            return (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status)
                  setCurrentPage(1)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? `${config?.bg || 'bg-gray-100'} ${config?.color || 'text-gray-900'} font-semibold`
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <StatusIcon className="w-4 h-4" />
                <span className="capitalize">{status === 'all' ? 'All Orders' : status}</span>
              </button>
            )
          })}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchOrders} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">No orders found</p>
              <p className="text-sm text-gray-500 mb-4">
                {statusFilter !== 'all' ? 'Try selecting a different status filter' : 'Start browsing inventory to place your first order'}
              </p>
              {statusFilter === 'all' && (
                <Link href="/brand/inventory">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Browse Inventory
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order, index) => {
                const orderDate = new Date(order.orderDate)
                const status = statusConfig[order.status]
                const StatusIcon = status.icon
                const canCancel = ['pending', 'confirmed'].includes(order.status)

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`hover:shadow-md transition-shadow border-2 ${status.border}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Order Header */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center`}>
                                <StatusIcon className={`w-5 h-5 ${status.color}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Link href={`/brand/orders/${order.id}`}>
                                    <h3 className="font-bold text-gray-900 hover:text-blue-600 cursor-pointer">
                                      {order.orderId}
                                    </h3>
                                  </Link>
                                  <Badge className={`${status.bg} ${status.color} border-0`}>
                                    {status.label}
                                  </Badge>
                                  {order.paymentStatus === 'paid' && (
                                    <Badge className="bg-green-50 text-green-600 border-0">
                                      Paid
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {isToday(orderDate)
                                    ? 'Today'
                                    : isYesterday(orderDate)
                                    ? 'Yesterday'
                                    : format(orderDate, 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>

                            {/* Order Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Package className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">Category:</span>
                                  <span className="font-semibold">{order.pickupCategory}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Weight className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">Quantity:</span>
                                  <span className="font-semibold">{order.quantity} kg</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">Unit Price:</span>
                                  <span className="font-semibold">৳{order.unitPrice}/kg</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">Collector:</span>
                                  <span className="font-semibold">{order.collectorName}</span>
                                </div>
                                {order.pickupLocation && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <span className="text-gray-600 line-clamp-1">{order.pickupLocation.address}</span>
                                  </div>
                                )}
                                {order.trackingNumber && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Package className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">Tracking:</span>
                                    <span className="font-semibold">{order.trackingNumber}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Notes */}
                            {order.notes && (
                              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Notes:</p>
                                <p className="text-sm text-gray-700">{order.notes}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div>
                                <p className="text-xs text-gray-500">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900">৳{order.totalAmount.toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Link href={`/brand/orders/${order.id}`}>
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                </Link>
                                {canCancel && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancelOrder(order.id)}
                                    disabled={cancellingOrderId === order.id}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    {cancellingOrderId === order.id ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Cancelling...
                                      </>
                                    ) : (
                                      'Cancel'
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </BrandLayout>
  )
}

