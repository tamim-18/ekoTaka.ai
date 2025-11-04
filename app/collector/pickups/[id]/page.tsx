'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, MapPin, Package, Weight, Calendar, CheckCircle2, Clock, XCircle, 
  Shield, Zap, Loader2, FileText, Copy
} from 'lucide-react'
import Image from 'next/image'
import { format, isToday, isYesterday } from 'date-fns'

interface Pickup {
  id: string
  category: string
  estimatedWeight: number
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
  statusHistory: Array<{
    status: string
    timestamp: string
    notes?: string
  }>
  notes?: string
  createdAt: string
}

export default function PickupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [pickup, setPickup] = useState<Pickup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPickup = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const pickupId = Array.isArray(params.id) ? params.id[0] : params.id
        
        if (!pickupId) {
          throw new Error('Pickup ID is missing')
        }
        
        const response = await fetch(`/api/pickups/${pickupId}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `Failed to fetch pickup (${response.status})`)
        }
        
        const data = await response.json()
        
        if (data.success && data.pickup) {
          setPickup({
            id: data.pickup.id,
            category: data.pickup.category,
            estimatedWeight: data.pickup.estimatedWeight,
            status: data.pickup.status,
            location: {
              coordinates: data.pickup.location.coordinates,
              address: data.pickup.location.address,
            },
            photos: {
              before: { url: data.pickup.photos.before.url },
              after: data.pickup.photos.after && data.pickup.photos.after.url ? { url: data.pickup.photos.after.url } : undefined,
            },
            verification: data.pickup.verification ? {
              aiConfidence: data.pickup.verification.aiConfidence,
              aiCategory: data.pickup.verification.aiCategory,
              aiWeight: data.pickup.verification.aiWeight,
              manualReview: data.pickup.verification.manualReview,
            } : undefined,
            statusHistory: data.pickup.statusHistory || [],
            notes: data.pickup.notes,
            createdAt: data.pickup.createdAt,
          })
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('Error fetching pickup:', err)
        setError(err instanceof Error ? err.message : 'Failed to load pickup details')
      } finally {
        setLoading(false)
      }
    }

    const pickupId = Array.isArray(params.id) ? params.id[0] : params.id
    if (pickupId) {
      fetchPickup()
    }
  }, [params.id])

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { 
      label: string
      color: string
      bgColor: string
      icon: any
    }> = {
      pending: {
        label: 'Pending',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        icon: Clock
      },
      verified: {
        label: 'Verified',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        icon: CheckCircle2
      },
      rejected: {
        label: 'Rejected',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        icon: XCircle
      },
      paid: {
        label: 'Paid',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        icon: CheckCircle2
      }
    }
    return configs[status] || configs.pending
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM dd, yyyy')
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a')
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Pickup Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !pickup) {
    return (
      <DashboardLayout title="Pickup Details">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pickup Not Found</h3>
                <p className="text-gray-600 mb-6">{error || 'The pickup doesn\'t exist.'}</p>
                <Button onClick={() => router.push('/collector/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const statusConfig = getStatusConfig(pickup.status)
  const StatusIcon = statusConfig.icon

  return (
    <DashboardLayout title="Pickup Details">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bgColor}`}>
            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
            <span className={`text-sm font-semibold ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Pickup Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Pickup #{pickup.id.slice(-8).toUpperCase()}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(pickup.createdAt)} at {formatTime(pickup.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">Category</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{pickup.category}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <Weight className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">Weight</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{pickup.estimatedWeight} kg</p>
              </div>
            </div>

            {/* Photos */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Photos</h3>
              {pickup.photos.after && pickup.photos.after.url ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Before</p>
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={pickup.photos.before.url}
                        alt="Before"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">After</p>
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={pickup.photos.after.url}
                        alt="After"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Before</p>
                  <div className="relative aspect-square max-w-md rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={pickup.photos.before.url}
                      alt="Before"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Location</h3>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 break-words">{pickup.location.address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pickup.location.coordinates[1].toFixed(6)}, {pickup.location.coordinates[0].toFixed(6)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(pickup.location.address)}
                  className="h-7 w-7 p-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              {pickup.location.coordinates && pickup.location.coordinates.length === 2 && (
                <div className="mt-3 h-48 rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${pickup.location.coordinates[1]},${pickup.location.coordinates[0]}&zoom=15`}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>

            {/* AI Verification */}
            {pickup.verification && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Verification</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Confidence</span>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round(pickup.verification.aiConfidence * 100)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${pickup.verification.aiConfidence * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1">AI Category</p>
                      <p className="text-sm font-bold text-gray-900">{pickup.verification.aiCategory || 'N/A'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1">AI Weight</p>
                      <p className="text-sm font-bold text-gray-900">{pickup.verification.aiWeight} kg</p>
                    </div>
                  </div>
                  {pickup.verification.manualReview && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-900">Requires Manual Review</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {pickup.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                <p className="text-sm text-gray-700 p-3 rounded-lg bg-gray-50">{pickup.notes}</p>
              </div>
            )}

            {/* Status History */}
            {pickup.statusHistory && pickup.statusHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Status History</h3>
                <div className="space-y-3">
                  {pickup.statusHistory.map((entry, index) => {
                    const entryStatusConfig = getStatusConfig(entry.status)
                    const EntryIcon = entryStatusConfig.icon
                    const isLast = index === pickup.statusHistory.length - 1
                    
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full ${entryStatusConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <EntryIcon className={`w-4 h-4 ${entryStatusConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-semibold capitalize ${entryStatusConfig.color}`}>
                              {entry.status}
                            </span>
                            {isLast && (
                              <Badge variant="secondary" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDate(entry.timestamp)} at {formatTime(entry.timestamp)}
                          </p>
                          {entry.notes && (
                            <p className="text-xs text-gray-600 mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
