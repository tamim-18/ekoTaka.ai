'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  MapPin,
  PlusCircle,
  RefreshCw,
  Navigation,
  Package,
  Weight,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react'
import { logger } from '@/lib/logger'

const libraries: ('places' | 'geometry')[] = ['places', 'geometry']

interface Hotspot {
  id: string
  location: {
    coordinates: [number, number]
    address: string
  }
  status: 'active' | 'depleted' | 'expired'
  estimatedAvailable: {
    totalWeight: number
    categories: {
      PET?: number
      HDPE?: number
      LDPE?: number
      PP?: number
      PS?: number
      Other?: number
    }
  }
  reportedBy: string
  reportedAt: string
  lastUpdated: string
  lastCollectedAt?: string
  collectionCount: number
  metadata?: {
    description?: string
    photos?: Array<{ url: string }>
    accessInstructions?: string
  }
}

interface CollectionPoint {
  id: string
  location: {
    coordinates: [number, number]
    address: string
  }
  category: string
  weight: number
  collectedAt: string
  status: string
  type: 'collection'
}

interface MapViewProps {
  apiKey: string
}

export default function MapView({ apiKey }: MapViewProps) {
  const [center, setCenter] = useState({ lat: 23.8103, lng: 90.4125 }) // Dhaka
  const [zoom, setZoom] = useState(12)
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState<Hotspot | CollectionPoint | null>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportingLocation, setReportingLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  })

  // Fetch hotspots and collection points
  const fetchMapData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/map/hotspots?lat=${center.lat}&lng=${center.lng}&radius=10`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch map data')
      }

      const data = await response.json()
      if (data.success) {
        setHotspots(data.hotspots || [])
        setCollectionPoints(data.collectionPoints || [])
      }
    } catch (error) {
      logger.error('Error fetching map data', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }, [center.lat, center.lng])

  useEffect(() => {
    if (isLoaded) {
      fetchMapData()
    }
  }, [isLoaded, fetchMapData])

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMapData()
    }, 120000) // 2 minutes

    return () => clearInterval(interval)
  }, [fetchMapData])

  // Get current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCenter(newCenter)
          setZoom(14)
          fetchMapData()
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  // Handle map click to report new location
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()

      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setReportingLocation({
            lat,
            lng,
            address: results[0].formatted_address,
          })
          setShowReportDialog(true)
        } else {
          setReportingLocation({
            lat,
            lng,
            address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
          })
          setShowReportDialog(true)
        }
      })
    }
  }

  // Handle marker click
  const handleMarkerClick = (marker: Hotspot | CollectionPoint) => {
    setSelectedMarker(marker)
  }

  // Report new waste location
  const handleReportLocation = async (formData: {
    totalWeight: number
    category: string
    description?: string
  }) => {
    if (!reportingLocation) return

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/map/hotspots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: {
            coordinates: [reportingLocation.lng, reportingLocation.lat],
            address: reportingLocation.address,
          },
          estimatedAvailable: {
            totalWeight: formData.totalWeight,
            categories: {
              [formData.category]: formData.totalWeight,
            },
          },
          description: formData.description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to report location')
      }

      const data = await response.json()
      if (data.success) {
        setShowReportDialog(false)
        setReportingLocation(null)
        await fetchMapData() // Refresh map
      }
    } catch (error) {
      console.error('Error reporting location:', error)
      alert('Failed to report location. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMarkerIcon = (status: string, type?: string) => {
    if (type === 'collection') {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3B82F6', // Blue
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      }
    }

    switch (status) {
      case 'active':
        return {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10B981', // Green
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        }
      case 'depleted':
        return {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#6B7280', // Gray
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        }
      default:
        return {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EF4444', // Red
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        }
    }
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load Google Maps</p>
        </CardContent>
      </Card>
    )
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative h-full">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          onClick={handleGetCurrentLocation}
          size="sm"
          variant="outline"
          className="bg-white shadow-lg"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Current Location
        </Button>
        <Button
          onClick={fetchMapData}
          size="sm"
          variant="outline"
          className="bg-white shadow-lg"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
        onClick={handleMapClick}
        onLoad={(map) => {
          mapRef.current = map
          setMap(map)
        }}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Hotspot Markers */}
        {hotspots.map((hotspot) => (
          <Marker
            key={hotspot.id}
            position={{
              lat: hotspot.location.coordinates[1],
              lng: hotspot.location.coordinates[0],
            }}
            icon={getMarkerIcon(hotspot.status)}
            onClick={() => handleMarkerClick(hotspot)}
          />
        ))}

        {/* Collection Point Markers */}
        {collectionPoints.map((point) => (
          <Marker
            key={point.id}
            position={{
              lat: point.location.coordinates[1],
              lng: point.location.coordinates[0],
            }}
            icon={getMarkerIcon('', 'collection')}
            onClick={() => handleMarkerClick(point)}
          />
        ))}

        {/* Info Window */}
        {selectedMarker && (
          <InfoWindow
            position={{
              lat: selectedMarker.location.coordinates[1],
              lng: selectedMarker.location.coordinates[0],
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 min-w-[200px]">
              {'estimatedAvailable' in selectedMarker ? (
                // Hotspot Info
                <>
                  <div className="font-bold text-sm mb-2">{selectedMarker.location.address}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        selectedMarker.status === 'active'
                          ? 'default'
                          : selectedMarker.status === 'depleted'
                          ? 'secondary'
                          : 'outline'
                      }
                      className={
                        selectedMarker.status === 'active'
                          ? 'bg-emerald-500'
                          : selectedMarker.status === 'depleted'
                          ? 'bg-gray-500'
                          : 'bg-red-500'
                      }
                    >
                      {selectedMarker.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <Weight className="w-4 h-4" />
                    <span>{selectedMarker.estimatedAvailable.totalWeight.toFixed(1)} kg available</span>
                  </div>
                  {selectedMarker.collectionCount > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedMarker.collectionCount} collection(s)
                    </div>
                  )}
                  {selectedMarker.metadata?.description && (
                    <div className="text-xs text-gray-600 mt-2 border-t pt-2">
                      {selectedMarker.metadata.description}
                    </div>
                  )}
                </>
              ) : (
                // Collection Point Info
                <>
                  <div className="font-bold text-sm mb-2">{selectedMarker.location.address}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4" />
                    <span className="text-sm">{selectedMarker.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Weight className="w-4 h-4" />
                    <span>{selectedMarker.weight.toFixed(1)} kg</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Collected {new Date(selectedMarker.collectedAt).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Report Location Dialog */}
      <ReportLocationDialog
        open={showReportDialog}
        onClose={() => {
          setShowReportDialog(false)
          setReportingLocation(null)
        }}
        location={reportingLocation}
        onSubmit={handleReportLocation}
        isSubmitting={isSubmitting}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 text-sm">
        <div className="font-semibold mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
            <span>Active Hotspot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-500"></div>
            <span>Depleted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Recent Collection</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Report Location Dialog Component
function ReportLocationDialog({
  open,
  onClose,
  location,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onClose: () => void
  location: { lat: number; lng: number; address: string } | null
  onSubmit: (data: { totalWeight: number; category: string; description?: string }) => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState({
    totalWeight: '',
    category: 'PET',
    description: '',
  })

  const categories = ['PET', 'HDPE', 'LDPE', 'PP', 'PS', 'Other']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.totalWeight && parseFloat(formData.totalWeight) > 0) {
      onSubmit({
        totalWeight: parseFloat(formData.totalWeight),
        category: formData.category,
        description: formData.description || undefined,
      })
      setFormData({ totalWeight: '', category: 'PET', description: '' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Waste Location</DialogTitle>
          <DialogDescription>
            Report a new location where plastic waste is available for collection.
          </DialogDescription>
        </DialogHeader>

        {location && (
          <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold">Location</span>
            </div>
            <p className="text-sm text-gray-700">{location.address}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="weight">Estimated Weight (kg) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0.1"
              value={formData.totalWeight}
              onChange={(e) => setFormData({ ...formData, totalWeight: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="category">Plastic Category *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1"
              rows={3}
              placeholder="Any additional information about this location..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Report Location
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

