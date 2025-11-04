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
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  Receipt,
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

interface Transaction {
  id: string
  orderId: string
  orderNumber: string | null
  pickupId: string
  collectorId: string
  collectorName: string
  amount: number
  paymentMethod: string
  transactionId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  transactionType: string
  initiatedAt: string
  completedAt?: string
  failedAt?: string
  failureReason?: string
  metadata?: any
  createdAt: string
}

interface TransactionStats {
  totalSpent: number
  pendingPayments: number
  byStatus: Record<string, { total: number; count: number }>
}

export default function BrandTransactionsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasMore: false,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

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

    fetchTransactions()
  }, [authLoading, user, router, statusFilter, paymentMethodFilter, currentPage, startDate, endDate])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (paymentMethodFilter !== 'all') {
        params.append('paymentMethod', paymentMethodFilter)
      }
      if (startDate) {
        params.append('startDate', startDate)
      }
      if (endDate) {
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/brand/transactions?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      if (data.success) {
        setTransactions(data.transactions || [])
        setStats(data.stats || null)
        setPagination(data.pagination || { total: 0, totalPages: 1, hasMore: false })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: any; color: string; bg: string; label: string }> = {
      completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
      pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
      processing: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Processing' },
      failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
      cancelled: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Cancelled' },
    }

    const config = configs[status] || configs.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.bg} ${config.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentMethodIcon = (method: string) => {
    return <CreditCard className="w-4 h-4" />
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bkash: 'bKash',
      nagad: 'Nagad',
      bank_transfer: 'Bank Transfer',
      card: 'Card',
    }
    return labels[method] || method
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setPaymentMethodFilter('all')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  if (authLoading || !user) {
    return (
      <BrandLayout title="Transactions">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </BrandLayout>
    )
  }

  return (
    <BrandLayout title="Transactions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
            <p className="text-gray-600">Track all your payment transactions</p>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">৳{stats.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Pending Payments</p>
                    <p className="text-2xl font-bold text-gray-900">৳{stats.pendingPayments.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Method</label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => {
                      setPaymentMethodFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Methods</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchTransactions} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">No transactions found</p>
              <p className="text-sm text-gray-500 mb-4">
                {statusFilter !== 'all' || paymentMethodFilter !== 'all' || startDate || endDate
                  ? 'Try adjusting your filters'
                  : 'Your payment history will appear here once you make your first payment'}
              </p>
              {statusFilter === 'all' && paymentMethodFilter === 'all' && !startDate && !endDate && (
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
              {transactions.map((transaction, index) => {
                const transactionDate = new Date(transaction.initiatedAt)

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                {getPaymentMethodIcon(transaction.paymentMethod)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">
                                    {transaction.orderNumber || `Order ${transaction.orderId?.slice(0, 8)}`}
                                  </h3>
                                  {getStatusBadge(transaction.status)}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {getPaymentMethodLabel(transaction.paymentMethod)} • {transaction.collectorName}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {isToday(transactionDate)
                                    ? 'Today'
                                    : isYesterday(transactionDate)
                                    ? 'Yesterday'
                                    : format(transactionDate, 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                            </div>

                            {transaction.failureReason && (
                              <div className="mt-2 p-2 bg-red-50 rounded-lg">
                                <p className="text-xs text-red-600">{transaction.failureReason}</p>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 mb-1">
                              ৳{transaction.amount.toLocaleString()}
                            </p>
                            {transaction.transactionId && (
                              <p className="text-xs text-gray-500 font-mono">{transaction.transactionId}</p>
                            )}
                            {transaction.completedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Completed {format(new Date(transaction.completedAt), 'MMM d')}
                              </p>
                            )}
                          </div>
                        </div>

                        {transaction.orderId && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <Link href={`/brand/orders/${transaction.orderId}`}>
                              <Button variant="ghost" size="sm" className="text-blue-600">
                                View Order Details
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        )}
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

