'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Package,
  Weight,
  MapPin,
  Calendar,
  Filter,
  Search,
  PlusCircle,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  Sparkles,
  Grid3x3,
  List,
} from 'lucide-react'
import Image from 'next/image'
import { format, isToday, isYesterday } from 'date-fns'

interface Pickup {
  id: string
  category: string
  estimatedWeight: number
  actualWeight?: number
  status: 'pending' | 'verified' | 'rejected' | 'paid'
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
    manualReview: boolean
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function MyPickupsPage() {
  const router = useRouter()
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasMore: false,
  })

  useEffect(() => {
    fetchPickups()
  }, [statusFilter, currentPage])

  const fetchPickups = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: '20',
      })

      const response = await fetch(`/api/pickups?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch pickups (${response.status})`)
      }

      const data = await response.json()

      if (data.success) {
        setPickups(data.pickups)
        setPagination(data.pagination)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching pickups:', err)
      setError(err instanceof Error ? err.message : 'Failed to load pickups')
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const stats = {
    total: pickups.length,
    pending: pickups.filter(p => p.status === 'pending').length,
    verified: pickups.filter(p => p.status === 'verified').length,
    paid: pickups.filter(p => p.status === 'paid').length,
    totalWeight: pickups.reduce((sum, p) => sum + (p.actualWeight || p.estimatedWeight), 0),
  }

  const filteredPickups = pickups.filter((pickup) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      pickup.category.toLowerCase().includes(query) ||
      pickup.location.address.toLowerCase().includes(query) ||
      pickup.id.toLowerCase().includes(query)
    )
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM dd, yyyy')
  }

  const statusFilters = [
    { value: 'all', label: 'All', count: stats.total, color: 'emerald' },
    { value: 'pending', label: 'Pending', count: stats.pending, color: 'yellow' },
    { value: 'verified', label: 'Verified', count: stats.verified, color: 'blue' },
    { value: 'paid', label: 'Paid', count: stats.paid, color: 'green' },
  ]

  if (loading && pickups.length === 0) {
    return (
      <DashboardLayout title="My Pickups">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading pickups...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="My Pickups"
      action={
        <Link href="/collector/pickups/new">
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Pickup
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusFilters.map((filter, index) => (
            <motion.div
              key={filter.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setStatusFilter(filter.value)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                statusFilter === filter.value
                  ? `border-${filter.color}-500 bg-gradient-to-br from-${filter.color}-50 to-${filter.color}-100/50 shadow-md`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${
                  statusFilter === filter.value ? `text-${filter.color}-700` : 'text-gray-500'
                }`}>
                  {filter.label}
                </span>
                {statusFilter === filter.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-2 h-2 rounded-full bg-${filter.color}-500`}
                  />
                )}
              </div>
              <div className={`text-2xl font-black ${
                statusFilter === filter.value ? `text-${filter.color}-700` : 'text-gray-900'
              }`}>
                {filter.count}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="border border-emerald-100/50 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search pickups by category, location, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-white border-gray-200 focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-10"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-10"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Pickups</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={fetchPickups} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPickups.length === 0 && (
          <Card className="border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center"
              >
                <Package className="w-12 h-12 text-emerald-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {statusFilter !== 'all' ? 'No pickups with this status' : 'No pickups yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {statusFilter !== 'all' 
                  ? 'Try changing the status filter or create a new pickup'
                  : 'Start your journey by submitting your first plastic waste collection'
                }
              </p>
              <Link href="/collector/pickups/new">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create First Pickup
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Pickups List/Grid */}
        {!loading && !error && filteredPickups.length > 0 && (
          <>
            {viewMode === 'list' ? (
              <div className="space-y-3">
                {filteredPickups.map((pickup, index) => (
                  <PickupCardList key={pickup.id} pickup={pickup} index={index} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPickups.map((pickup, index) => (
                  <PickupCardGrid key={pickup.id} pickup={pickup} index={index} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="h-10"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-4">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={!pagination.hasMore || loading}
                  className="h-10"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

// List View Card Component
function PickupCardList({ pickup, index }: { pickup: Pickup; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link href={`/collector/pickups/${pickup.id}`}>
        <Card className="group hover:shadow-xl transition-all duration-300 border border-emerald-100/50 hover:border-emerald-300 bg-white cursor-pointer overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Photo */}
              <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
                <Image
                  src={pickup.photos.before.url}
                  alt={`${pickup.category} pickup`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={pickup.status} />
                </div>
                {pickup.photos.after && (
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-emerald-500 text-white border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      After Photo
                    </Badge>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                          <Package className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900">
                          {pickup.category}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">
                        ID: {pickup.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50">
                      <Weight className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Weight</p>
                        <p className="text-sm font-bold text-gray-900">
                          {pickup.actualWeight || pickup.estimatedWeight} kg
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50">
                      <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {pickup.location.address.split(',')[0]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {pickup.verification && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50/50">
                      <div className={`w-2 h-2 rounded-full ${
                        pickup.verification.aiConfidence >= 0.8 
                          ? 'bg-emerald-500' 
                          : pickup.verification.aiConfidence >= 0.6 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`} />
                      <span className="text-xs text-gray-600">AI Confidence:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round(pickup.verification.aiConfidence * 100)}%
                      </span>
                      {pickup.verification.manualReview && (
                        <Badge variant="secondary" className="ml-auto text-xs">Manual Review</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(pickup.createdAt), 'MMM dd, yyyy • h:mm a')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">
                    View Details →
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

// Grid View Card Component
function PickupCardGrid({ pickup, index }: { pickup: Pickup; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/collector/pickups/${pickup.id}`}>
        <Card className="group hover:shadow-xl transition-all duration-300 border border-emerald-100/50 hover:border-emerald-300 bg-white cursor-pointer overflow-hidden h-full flex flex-col">
          <CardContent className="p-0 flex flex-col h-full">
            {/* Photo */}
            <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
              <Image
                src={pickup.photos.before.url}
                alt={`${pickup.category} pickup`}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                unoptimized
              />
              <div className="absolute top-3 right-3">
                <StatusBadge status={pickup.status} />
              </div>
              {pickup.photos.after && (
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-emerald-500 text-white border-0 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    After
                  </Badge>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                  <Package className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900">{pickup.category}</h3>
              </div>

              <div className="space-y-3 mb-4 flex-1">
                <div className="flex items-center gap-2">
                  <Weight className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-gray-900">
                    {pickup.actualWeight || pickup.estimatedWeight} kg
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-600 line-clamp-2">
                    {pickup.location.address}
                  </span>
                </div>

                {pickup.verification && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      pickup.verification.aiConfidence >= 0.8 ? 'bg-emerald-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-xs text-gray-600">
                      AI: {Math.round(pickup.verification.aiConfidence * 100)}%
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(new Date(pickup.createdAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <span className="text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                  View Details →
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string; icon: any }> = {
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: Clock,
    },
    verified: {
      label: 'Verified',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: CheckCircle2,
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle,
    },
    paid: {
      label: 'Paid',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: DollarSign,
    },
  }

  const config = configs[status] || configs.pending
  const Icon = config.icon

  return (
    <Badge className={`${config.className} border flex items-center gap-1 font-semibold`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  )
}
