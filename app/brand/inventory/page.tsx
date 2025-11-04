'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import BrandLayout from '@/components/layouts/BrandLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Weight,
  MapPin,
  Filter,
  Search,
  Loader2,
  ShoppingCart,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'

interface InventoryItem {
  id: string
  collectorId: string
  collectorName: string
  collectorEmail?: string
  category: string
  estimatedWeight: number
  actualWeight?: number
  availableWeight: number
  orderedWeight: number
  status: string
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
  isAvailable: boolean
}

export default function BrandInventoryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasMore: false,
  })

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState('')
  const [minWeight, setMinWeight] = useState('')
  const [maxWeight, setMaxWeight] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)

  // Order creation
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderQuantity, setOrderQuantity] = useState('')
  const [orderUnitPrice, setOrderUnitPrice] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [creatingOrder, setCreatingOrder] = useState(false)

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

    fetchInventory()
  }, [authLoading, user, router, currentPage, categoryFilter, locationFilter, minWeight, maxWeight, sortBy, sortOrder])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy,
        sortOrder,
      })

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }
      if (locationFilter) {
        params.append('location', locationFilter)
      }
      if (minWeight) {
        params.append('minWeight', minWeight)
      }
      if (maxWeight) {
        params.append('maxWeight', maxWeight)
      }

      const response = await fetch(`/api/brand/inventory?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }

      const data = await response.json()
      if (data.success) {
        setInventory(data.inventory || [])
        setPagination(data.pagination || { total: 0, totalPages: 1, hasMore: false })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!selectedItem) return

    const quantity = parseFloat(orderQuantity)
    const unitPrice = parseFloat(orderUnitPrice)

    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    if (quantity > selectedItem.availableWeight) {
      alert(`Only ${selectedItem.availableWeight} kg available`)
      return
    }

    if (!unitPrice || unitPrice <= 0) {
      alert('Please enter a valid unit price')
      return
    }

    try {
      setCreatingOrder(true)

      const response = await fetch('/api/brand/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupId: selectedItem.id,
          quantity,
          unitPrice,
          shippingAddress: {
            street: 'To be updated',
            city: 'Dhaka',
            district: 'Dhaka',
            country: 'Bangladesh',
          },
          notes: orderNotes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Order created successfully!')
        setShowOrderModal(false)
        setSelectedItem(null)
        setOrderQuantity('')
        setOrderUnitPrice('')
        setOrderNotes('')
        fetchInventory() // Refresh inventory
      } else {
        alert(data.error || 'Failed to create order')
      }
    } catch (err) {
      alert('Failed to create order')
    } finally {
      setCreatingOrder(false)
    }
  }

  const resetFilters = () => {
    setCategoryFilter('all')
    setLocationFilter('')
    setMinWeight('')
    setMaxWeight('')
    setSortBy('date')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  if (authLoading || !user) {
    return (
      <BrandLayout title="Inventory">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </BrandLayout>
    )
  }

  const categories = ['PET', 'HDPE', 'LDPE', 'PP', 'PS', 'Other']

  return (
    <BrandLayout title="Inventory">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Inventory</h1>
            <p className="text-gray-600">Discover verified plastic collections from our network</p>
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

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                      <Input
                        placeholder="Search location..."
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Min Weight (kg)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={minWeight}
                        onChange={(e) => setMinWeight(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Max Weight (kg)</label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={maxWeight}
                        onChange={(e) => setMaxWeight(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="date">Date</option>
                        <option value="weight">Weight</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Order</label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={resetFilters}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inventory Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchInventory} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : inventory.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">No inventory found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`hover:shadow-lg transition-shadow ${!item.isAvailable ? 'opacity-60' : ''}`}>
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={item.photos.before.url}
                          alt={item.category}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge
                            className={item.isAvailable ? 'bg-green-500' : 'bg-gray-500'}
                          >
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Category & Weight */}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{item.category}</Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Weight className="w-4 h-4" />
                            <span className="font-semibold">{item.availableWeight} kg</span>
                            <span className="text-gray-400">available</span>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{item.location.address}</span>
                        </div>

                        {/* Collector */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{item.collectorName}</span>
                        </div>

                        {/* Verification */}
                        {item.verification && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span>AI Verified ({Math.round(item.verification.aiConfidence)}%)</span>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          onClick={() => {
                            setSelectedItem(item)
                            setOrderQuantity(item.availableWeight.toString())
                            setShowOrderModal(true)
                          }}
                          disabled={!item.isAvailable}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Order Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
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

        {/* Order Modal */}
        <AnimatePresence>
          {showOrderModal && selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowOrderModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Create Order</h3>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pickup</p>
                    <p className="font-semibold">{selectedItem.category} • {selectedItem.id.slice(0, 8)}...</p>
                    <p className="text-sm text-gray-500">{selectedItem.location.address}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Quantity (kg) - Max: {selectedItem.availableWeight} kg
                    </label>
                    <Input
                      type="number"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(e.target.value)}
                      max={selectedItem.availableWeight}
                      min="0.1"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Unit Price (৳/kg)
                    </label>
                    <Input
                      type="number"
                      value={orderUnitPrice}
                      onChange={(e) => setOrderUnitPrice(e.target.value)}
                      min="0"
                      step="1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  {orderQuantity && orderUnitPrice && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ৳{(parseFloat(orderQuantity) * parseFloat(orderUnitPrice)).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowOrderModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateOrder}
                      disabled={creatingOrder || !orderQuantity || !orderUnitPrice}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {creatingOrder ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Order'
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrandLayout>
  )
}

