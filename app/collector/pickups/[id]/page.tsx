'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Package, Weight, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react'
import Image from 'next/image'

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
        
        // Handle Next.js params which might be string or array
        const pickupId = Array.isArray(params.id) ? params.id[0] : params.id
        
        if (!pickupId) {
          throw new Error('Pickup ID is missing')
        }
        
        console.log('🔍 Fetching pickup with ID:', pickupId, typeof pickupId)
        
        const response = await fetch(`/api/pickups/${pickupId}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('❌ Failed to fetch pickup:', {
            status: response.status,
            error: errorData.error,
            pickupId: pickupId
          })
          throw new Error(errorData.error || `Failed to fetch pickup (${response.status})`)
        }
        
        const data = await response.json()
        
        if (data.success && data.pickup) {
          // Map API response to component interface
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
              after: data.pickup.photos.after ? { url: data.pickup.photos.after.url } : undefined,
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      pending: { variant: 'secondary', label: 'Pending Review' },
      verified: { variant: 'default', label: 'Verified' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      paid: { variant: 'default', label: 'Paid' }
    }
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <DashboardLayout title="Pickup Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pickup details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !pickup) {
    return (
      <DashboardLayout title="Pickup Details">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pickup Not Found</h3>
                <p className="text-gray-600 mb-6">
                  {error || 'The pickup you\'re looking for doesn\'t exist or has been removed.'}
                </p>
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

  return (
    <DashboardLayout title="Pickup Details">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">Pickup #{pickup.id.slice(-8)}</CardTitle>
                  {getStatusBadge(pickup.status)}
                </div>
                <p className="text-gray-600">
                  Created on {new Date(pickup.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Before</p>
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={pickup.photos.before.url}
                    alt="Before photo"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
              {pickup.photos.after && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">After</p>
                  <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={pickup.photos.after.url}
                      alt="After photo"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-semibold">{pickup.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Weight className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-600">Weight</p>
                  <p className="font-semibold">{pickup.estimatedWeight} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{pickup.location.address}</p>
                </div>
              </div>
              {pickup.verification && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">AI Verification</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="font-semibold">
                        {Math.round(pickup.verification.aiConfidence * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">AI Category:</span>
                      <span className="font-semibold">{pickup.verification.aiCategory || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">AI Weight:</span>
                      <span className="font-semibold">{pickup.verification.aiWeight} kg</span>
                    </div>
                    {pickup.verification.manualReview && (
                      <Badge variant="secondary" className="mt-2">Requires Manual Review</Badge>
                    )}
                  </div>
                </div>
              )}
              {pickup.notes && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">Notes</p>
                  <p className="text-sm text-gray-600">{pickup.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status History */}
        {pickup.statusHistory && pickup.statusHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pickup.statusHistory.map((entry, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {entry.status === 'verified' || entry.status === 'paid' ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      ) : entry.status === 'rejected' ? (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold capitalize text-gray-900">{entry.status}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map View */}
        {pickup.location.coordinates && pickup.location.coordinates.length === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Location on Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
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
              <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {pickup.location.address}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

