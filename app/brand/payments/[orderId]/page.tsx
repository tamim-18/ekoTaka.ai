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
  XCircle,
  ArrowLeft,
  CreditCard,
  Wallet,
  Smartphone,
  Building2,
  Shield,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Order {
  id: string
  orderId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  status: string
  paymentStatus: string
  orderDate: string
}

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean
    transactionId?: string
    error?: string
  } | null>(null)

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
  }, [authLoading, user, router, params.orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId
      const response = await fetch(`/api/brand/orders/${orderId}`)

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

  const handlePayment = async () => {
    if (!order || !selectedMethod) return

    try {
      setProcessing(true)
      setPaymentResult(null)

      const response = await fetch('/api/brand/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentMethod: selectedMethod,
          amount: order.totalAmount,
          simulateSuccess: true, // Always simulate success for now
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPaymentResult({
          success: true,
          transactionId: data.transaction.transactionId,
        })
        // Refresh order after 2 seconds
        setTimeout(() => {
          fetchOrder()
        }, 2000)
      } else {
        setPaymentResult({
          success: false,
          error: data.error || 'Payment failed',
        })
      }
    } catch (err) {
      setPaymentResult({
        success: false,
        error: 'Failed to process payment',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading || !user) {
    return (
      <BrandLayout title="Payment">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </BrandLayout>
    )
  }

  if (loading) {
    return (
      <BrandLayout title="Payment">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </BrandLayout>
    )
  }

  if (error || !order) {
    return (
      <BrandLayout title="Payment">
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

  const paymentMethods = [
    {
      id: 'bkash',
      name: 'bKash',
      icon: Smartphone,
      description: 'Mobile wallet payment',
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    },
    {
      id: 'nagad',
      name: 'Nagad',
      icon: Wallet,
      description: 'Mobile wallet payment',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: Building2,
      description: 'Direct bank transfer',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Card payment',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    },
  ]

  const isPaid = order.paymentStatus === 'paid'

  return (
    <BrandLayout title="Payment">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/brand/orders/${order.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Order
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
              <p className="text-gray-600">Order: {order.orderId}</p>
            </div>
          </div>
          {isPaid && (
            <Badge className="bg-green-50 text-green-600 border-0 text-base px-4 py-2">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Paid
            </Badge>
          )}
        </div>

        {/* Order Summary */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity</span>
                <span className="font-semibold">{order.quantity} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unit Price</span>
                <span className="font-semibold">৳{order.unitPrice} / kg</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-3xl font-bold text-blue-600">৳{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Result */}
        {paymentResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={paymentResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {paymentResult.success ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-green-900 mb-2">Payment Successful!</h3>
                        <p className="text-green-700 mb-2">
                          Your payment of ৳{order.totalAmount.toLocaleString()} has been processed successfully.
                        </p>
                        {paymentResult.transactionId && (
                          <p className="text-sm text-green-600">
                            Transaction ID: <span className="font-mono font-semibold">{paymentResult.transactionId}</span>
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-900 mb-2">Payment Failed</h3>
                        <p className="text-red-700">{paymentResult.error || 'Please try again'}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Payment Methods */}
        {!isPaid && !paymentResult && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Select Payment Method</h2>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  This is a payment simulator for testing purposes. Select a payment method to simulate the payment process.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon
                    const isSelected = selectedMethod === method.id

                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg ${method.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{method.name}</p>
                            <p className="text-xs text-gray-600">{method.description}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Payment Button */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
                    <p className="text-2xl font-bold text-gray-900">৳{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <Button
                    onClick={handlePayment}
                    disabled={!selectedMethod || processing}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Payment Simulator</h3>
                <p className="text-sm text-blue-800">
                  This is a simulated payment system for testing purposes. No actual money will be transferred.
                  All payments are processed instantly and create transaction records in the system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BrandLayout>
  )
}

