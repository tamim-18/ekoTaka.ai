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
    // For now, we'll use dummy data or fetch from API
    // TODO: Create API endpoint to fetch pickup by ID
    const fetchPickup = async () => {
      try {
        setLoading(true)
        // This is a placeholder - you'll need to create the API endpoint
        // const response = await fetch(`/api/pickups/${params.id}`)
        // const data = await response.json()
        // setPickup(data.pickup)
        
        // For now, just show a message
        setError('Pickup detail API endpoint not yet implemented')
        setLoading(false)
      } catch (err) {
        setError('Failed to load pickup details')
        setLoading(false)
      }
    }

    if (params.id) {
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
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pickup.statusHistory.map((entry, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {entry.status === 'verified' || entry.status === 'paid' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : entry.status === 'rejected' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold capitalize">{entry.status}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-600">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

