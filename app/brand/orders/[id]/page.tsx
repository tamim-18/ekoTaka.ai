'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import BrandLayout from '@/components/layouts/BrandLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  TrendingUp,
  ArrowLeft,
  User,
  MapPin,
  Weight,
  DollarSign,
  Calendar,
  Truck,
  Phone,
  Mail,
  Wallet,
} from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import Link from 'next/link'
import React from 'react'

interface OrderDetail {
  id: string
  orderId: string
  brandId: string
  collectorId: string
  collector: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  pickupId: string
  pickup: {
    id: string
    category: string
    estimatedWeight: number
    actualWeight?: number
    location: {
      coordinates: [number, number]
      address: string
    }
    photos: {
      before: { url: string }
      after?: { url: string }
    }
    verification?: {
      aiConfidence: number
      aiCategory: string
      aiWeight: number
    }
  } | null
  quantity: number
  unitPrice: number
  totalAmount: number
  status: string
  orderDate: string
  confirmedAt?: string
  processingAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  cancellationReason?: string
  paymentStatus: string
  paymentMethod?: string
  transactionId?: string
  shippingAddress: {
    street: string
    city: string
    district: string
    postalCode?: string
    country: string
    contactPerson?: string
    contactPhone?: string
  }
  pickupLocation?: {
    coordinates: [number, number]
    address: string
  }
  notes?: string
  collectorNotes?: string
  estimatedDeliveryDate?: string
  actualDeliveryDate?: string
  trackingNumber?: string
  statusHistory: Array<{
    status: string
    timestamp: string
    notes?: string
    changedBy: string
    changedByRole: string
  }>
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

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

    fetchOrder()
  }, [authLoading, user, router, params.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/brand/orders/${params.id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }

      const data = await response.json()
      if (data.success) {
        setOrder(data.order)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!order) return
    if (!confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      setCancelling(true)

      const response = await fetch(`/api/brand/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          cancellationReason: 'Cancelled by brand',
        }),
      })

      const data = await response.json()

      if (data.success) {
        fetchOrder() // Refresh order
      } else {
        alert(data.error || 'Failed to cancel order')
      }
    } catch (err) {
      alert('Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  if (authLoading || !user) {
    return (
      <BrandLayout title="Order Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </BrandLayout>
    )
  }

  if (loading) {
    return (
      <BrandLayout title="Order Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </BrandLayout>
    )
  }

  if (error || !order) {
    return (
      <BrandLayout title="Order Details">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
            <Link href="/brand/orders">
              <Button variant="outline">Back to Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </BrandLayout>
    )
  }

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
  const canCancel = ['pending', 'confirmed'].includes(order.status)

  return (
    <BrandLayout title="Order Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/brand/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{order.orderId}</h1>
              <p className="text-gray-600">Order placed on {format(new Date(order.orderDate), 'MMMM d, yyyy')}</p>
            </div>
          </div>
          <Badge className={`${status.bg} ${status.color} border-0 text-base px-4 py-2`}>
            <StatusIcon className="w-4 h-4 mr-2" />
            {status.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pickup Info */}
            {order.pickup && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Pickup Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative h-64 w-full rounded-lg overflow-hidden">
                      <Image
                        src={order.pickup.photos.before.url}
                        alt={order.pickup.category}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Category</p>
                        <Badge variant="outline" className="text-base">{order.pickup.category}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Weight</p>
                        <p className="font-semibold">
                          {order.pickup.actualWeight || order.pickup.estimatedWeight} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Location</p>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <p className="text-sm">{order.pickup.location.address}</p>
                        </div>
                      </div>
                      {order.pickup.verification && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Verification</p>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm">
                              AI Verified ({Math.round(order.pickup.verification.aiConfidence)}%)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Quantity</p>
                      <p className="text-lg font-semibold">{order.quantity} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Unit Price</p>
                      <p className="text-lg font-semibold">৳{order.unitPrice} / kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-600">৳{order.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                      <Badge className={order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                    {order.paymentMethod && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                        <p className="font-semibold capitalize">{order.paymentMethod.replace('_', ' ')}</p>
                      </div>
                    )}
                    {order.transactionId && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                        <p className="font-mono text-sm">{order.transactionId}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Status History</h2>
                  <div className="space-y-4">
                    {order.statusHistory.map((entry, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                        <div className={`w-8 h-8 rounded-full ${statusConfig[entry.status as keyof typeof statusConfig]?.bg || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                          {React.createElement(statusConfig[entry.status as keyof typeof statusConfig]?.icon || Clock, { className: `w-4 h-4 ${statusConfig[entry.status as keyof typeof statusConfig]?.color || 'text-gray-600'}` })}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold capitalize">{entry.status}</p>
                          <p className="text-sm text-gray-600">{format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}</p>
                          {entry.notes && (
                            <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Changed by {entry.changedByRole}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Collector Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Collector</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{order.collector.name}</p>
                      {order.collector.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          {order.collector.email}
                        </div>
                      )}
                      {order.collector.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {order.collector.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Shipping Address</h3>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.district}</p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.postalCode && (
                    <p>Postal Code: {order.shippingAddress.postalCode}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            {(order.estimatedDeliveryDate || order.trackingNumber) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Delivery</h3>
                  <div className="space-y-3">
                    {order.estimatedDeliveryDate && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Estimated Delivery</p>
                        <p className="font-semibold">{format(new Date(order.estimatedDeliveryDate), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                    {order.trackingNumber && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                        <p className="font-mono text-sm">{order.trackingNumber}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {(order.notes || order.collectorNotes) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Notes</h3>
                  <div className="space-y-3">
                    {order.notes && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Your Notes</p>
                        <p className="text-sm">{order.notes}</p>
                      </div>
                    )}
                    {order.collectorNotes && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Collector Notes</p>
                        <p className="text-sm">{order.collectorNotes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="p-6 space-y-3">
                {order.paymentStatus !== 'paid' && (
                  <Link href={`/brand/payments/${order.id}`}>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Wallet className="w-4 h-4 mr-2" />
                      Pay Now
                    </Button>
                  </Link>
                )}
                {canCancel && (
                  <Button
                    onClick={handleCancel}
                    disabled={cancelling}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Order
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </BrandLayout>
  )
}

