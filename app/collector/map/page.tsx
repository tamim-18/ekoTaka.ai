'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import EnhancedMapView from '@/components/collector/EnhancedMapView'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'

export default function MapViewPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get Google Maps API key from environment
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (key) {
      setApiKey(key)
    } else {
      setError('Google Maps API key not configured')
    }
  }, [])

  if (error) {
    return (
      <DashboardLayout title="Map View">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{error}</p>
            <p className="text-sm text-gray-500">
              Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (!apiKey) {
    return (
      <DashboardLayout title="Map View">
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading map...</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Map View">
      <div className="h-[calc(100vh-200px)] min-h-[600px] rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl">
        <EnhancedMapView apiKey={apiKey} />
      </div>
    </DashboardLayout>
  )
}

