'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  CreditCard,
  Calendar,
  Filter,
  Loader2,
  Edit3,
  Save,
  Phone,
} from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: string
  pickupId: string
  amount: number
  paymentMethod: 'bkash' | 'nagad'
  transactionId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  initiatedAt: string
  completedAt?: string
  failedAt?: string
  failureReason?: string
  metadata?: {
    paymentGateway?: string
    reference?: string
    notes?: string
  }
  createdAt: string
  updatedAt: string
}

interface PaymentStats {
  totalEarnings: number
  pendingEarnings: number
  byStatus: {
    [key: string]: {
      total: number
      count: number
    }
  }
}

interface PaymentMethods {
  bkash: string | null
  nagad: string | null
  accountName: string | null
}

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    status: 'all',
    paymentMethod: 'all',
    startDate: '',
    endDate: '',
  })
  const [isEditingPayment, setIsEditingPayment] = useState(false)
  const [editFormData, setEditFormData] = useState({
    bkash: '',
    nagad: '',
    accountName: '',
  })

  useEffect(() => {
    fetchPayments()
  }, [page, filters])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters.paymentMethod !== 'all') {
        params.append('paymentMethod', filters.paymentMethod)
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate)
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate)
      }

      const response = await fetch(`/api/collector/payments?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch payments')
      }

      const data = await response.json()
      if (data.success) {
        setTransactions(data.transactions || [])
        setStats(data.stats || null)
        setPaymentMethods(data.paymentMethods || null)
        setTotalPages(data.pagination?.totalPages || 1)
        
        // Set edit form data
        if (data.paymentMethods) {
          setEditFormData({
            bkash: data.paymentMethods.bkash || '',
            nagad: data.paymentMethods.nagad || '',
            accountName: data.paymentMethods.accountName || '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePaymentMethods = async () => {
    try {
      const response = await fetch('/api/collector/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment: {
            bkasNumber: editFormData.bkash,
            nagadNumber: editFormData.nagad,
            accountName: editFormData.accountName,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update payment methods')
      }

      const data = await response.json()
      if (data.success) {
        setPaymentMethods(data.profile.payment)
        setIsEditingPayment(false)
        await fetchPayments() // Refresh to get updated data
      }
    } catch (error) {
      console.error('Error updating payment methods:', error)
      alert('Failed to update payment methods. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      completed: { variant: 'default' as const, className: 'bg-emerald-500', icon: CheckCircle2 },
      pending: { variant: 'secondary' as const, className: 'bg-amber-500', icon: Clock },
      processing: { variant: 'default' as const, className: 'bg-blue-500', icon: AlertCircle },
      failed: { variant: 'destructive' as const, className: 'bg-red-500', icon: XCircle },
      cancelled: { variant: 'outline' as const, className: 'bg-gray-500', icon: XCircle },
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPaymentMethodIcon = (method: string) => {
    return <CreditCard className="w-4 h-4" />
  }

  return (
    <DashboardLayout
      title="Payments"
      action={
        !isEditingPayment ? (
          <Button onClick={() => setIsEditingPayment(true)} variant="outline">
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Payment Methods
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditingPayment(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleUpdatePaymentMethods}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )
      }
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Payment Summary Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-emerald-100/50 shadow-xl bg-gradient-to-br from-white to-emerald-50/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-emerald-600">
                  ৳{stats.totalEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">All completed transactions</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-100/50 shadow-xl bg-gradient-to-br from-white to-amber-50/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-amber-600">
                  ৳{stats.pendingEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100/50 shadow-xl bg-gradient-to-br from-white to-blue-50/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-blue-600">
                  ৳{(
                    (stats.byStatus.completed?.total || 0) +
                    (stats.byStatus.processing?.total || 0)
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Current month earnings</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Methods Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingPayment ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    bKash Number
                  </label>
                  <Input
                    value={editFormData.bkash}
                    onChange={(e) => setEditFormData({ ...editFormData, bkash: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="max-w-xs"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Nagad Number
                  </label>
                  <Input
                    value={editFormData.nagad}
                    onChange={(e) => setEditFormData({ ...editFormData, nagad: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="max-w-xs"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Account Name
                  </label>
                  <Input
                    value={editFormData.accountName}
                    onChange={(e) => setEditFormData({ ...editFormData, accountName: e.target.value })}
                    placeholder="Name on account"
                    className="max-w-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-gray-700">bKash</span>
                  </div>
                  <p className="font-bold text-gray-900">
                    {paymentMethods?.bkash || 'Not configured'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Nagad</span>
                  </div>
                  <p className="font-bold text-gray-900">
                    {paymentMethods?.nagad || 'Not configured'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Account Name</span>
                  </div>
                  <p className="font-bold text-gray-900">
                    {paymentMethods?.accountName || 'Not set'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Select
                value={filters.status}
                onValueChange={(value) => {
                  setFilters({ ...filters, status: value })
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.paymentMethod}
                onValueChange={(value) => {
                  setFilters({ ...filters, paymentMethod: value })
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value })
                  setPage(1)
                }}
                placeholder="Start date"
                className="w-full"
              />

              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value })
                  setPage(1)
                }}
                placeholder="End date"
                className="w-full"
              />
            </div>

            {/* Transactions Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="ml-3 text-gray-600">Loading transactions...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No transactions found</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {transactions.map((txn, index) => (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-200 transition-all cursor-pointer"
                      onClick={() => setSelectedTransaction(txn)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 rounded-lg bg-emerald-100">
                            {getPaymentMethodIcon(txn.paymentMethod)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-bold text-gray-900">
                                ৳{txn.amount.toLocaleString()}
                              </p>
                              {getStatusBadge(txn.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="capitalize">{txn.paymentMethod}</span>
                              <span>•</span>
                              <span>{txn.transactionId}</span>
                              <span>•</span>
                              <span>{format(new Date(txn.initiatedAt), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Transaction Detail Dialog */}
        {selectedTransaction && (
          <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Amount</p>
                    <p className="text-2xl font-black text-emerald-600">
                      ৳{selectedTransaction.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                    <p className="font-semibold capitalize">{selectedTransaction.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                    <p className="font-semibold font-mono">{selectedTransaction.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pickup ID</p>
                    <p className="font-semibold">{selectedTransaction.pickupId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Initiated At</p>
                    <p className="font-semibold">
                      {format(new Date(selectedTransaction.initiatedAt), 'PPpp')}
                    </p>
                  </div>
                  {selectedTransaction.completedAt && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Completed At</p>
                      <p className="font-semibold">
                        {format(new Date(selectedTransaction.completedAt), 'PPpp')}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.failedAt && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Failed At</p>
                      <p className="font-semibold text-red-600">
                        {format(new Date(selectedTransaction.failedAt), 'PPpp')}
                      </p>
                    </div>
                  )}
                </div>
                {selectedTransaction.failureReason && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm font-semibold text-red-900 mb-1">Failure Reason</p>
                    <p className="text-sm text-red-700">{selectedTransaction.failureReason}</p>
                  </div>
                )}
                {selectedTransaction.metadata?.notes && (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{selectedTransaction.metadata.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}

