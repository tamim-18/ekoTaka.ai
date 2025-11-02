'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'
import { Card } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MapPin,
  PlusCircle,
  RefreshCw,
  Navigation,
  Package,
  Weight,
  Clock,
  Phone,
  Map,
  Satellite,
  Layers,
  Filter,
  X,
  Loader2,
  Flame,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { logger } from '@/lib/logger'
import { generateDummyCollectionPoints, CollectionInfo } from '@/lib/utils/map-dummy-data'

const libraries: ('places' | 'geometry' | 'visualization')[] = ['places', 'geometry', 'visualization']

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

interface MapViewProps {
  apiKey: string
}

type MapType = 'roadmap' | 'satellite' | 'terrain' | 'hybrid'

export default function EnhancedMapView({ apiKey }: MapViewProps) {
  const [center, setCenter] = useState({ lat: 23.8103, lng: 90.4125 }) // Dhaka
  const [zoom, setZoom] = useState(12)
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [collectionPoints, setCollectionPoints] = useState<CollectionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState<Hotspot | CollectionInfo | null>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportingLocation, setReportingLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [mapType, setMapType] = useState<MapType>('roadmap')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [heatmapData, setHeatmapData] = useState<google.maps.LatLng[]>([])
  const heatmapLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const isUpdatingMapRef = useRef(false) // Prevent infinite loops from map events

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
        
        // Combine with dummy collection points for rich data
        const dummyPoints = generateDummyCollectionPoints()
        
        // Normalize API collection points to CollectionInfo format
        const apiCollectionPoints: CollectionInfo[] = (data.collectionPoints || []).map((p: any) => ({
          id: p.id,
          location: p.location,
          wasteDetails: {
            totalWeight: p.weight || 0,
            categories: {
              [p.category]: p.weight || 0,
            },
          },
          collectionInstructions: {
            bestTimeToCollect: 'Anytime',
            accessMethod: 'Public area',
            estimatedValue: (p.weight || 0) * 30,
          },
          status: p.status || 'active',
          reportedAt: p.collectedAt || new Date().toISOString(),
          lastCollected: p.collectedAt,
          collectionCount: 0,
        }))
        
        setCollectionPoints([...dummyPoints, ...apiCollectionPoints])
      }
    } catch (error) {
      logger.error('Error fetching map data', error instanceof Error ? error : new Error(String(error)))
      // Fallback to dummy data if API fails
      const dummyPoints = generateDummyCollectionPoints()
      setCollectionPoints(dummyPoints)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isLoaded) {
      fetchMapData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

          // Setup heatmap when map loads or data changes
  useEffect(() => {
    if (map && isLoaded && showHeatmap && collectionPoints.length > 0) {
      const heatmapPoints = collectionPoints
        .filter(p => {
          const status = 'status' in p ? p.status : 'active'
          return status === 'active' || status === 'high-demand'
        })
        .map(p => new google.maps.LatLng(p.location.coordinates[1], p.location.coordinates[0]))

      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null)
      }

      const heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapPoints,
        map: map,
        radius: 30,
        opacity: 0.7,
        gradient: [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 1)',
          'rgba(0, 191, 255, 1)',
          'rgba(0, 127, 255, 1)',
          'rgba(0, 63, 255, 1)',
          'rgba(0, 0, 255, 1)',
          'rgba(0, 0, 223, 1)',
          'rgba(0, 0, 191, 1)',
          'rgba(0, 0, 159, 1)',
          'rgba(0, 0, 127, 1)',
          'rgba(63, 0, 91, 1)',
          'rgba(127, 0, 63, 1)',
          'rgba(191, 0, 31, 1)',
          'rgba(255, 0, 0, 1)'
        ],
      })

      heatmapLayerRef.current = heatmap
    } else if (heatmapLayerRef.current && (!showHeatmap || collectionPoints.length === 0)) {
      heatmapLayerRef.current.setMap(null)
      heatmapLayerRef.current = null
    }
  }, [map, isLoaded, showHeatmap, collectionPoints])

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
          isUpdatingMapRef.current = true
          setCenter(newCenter)
          setZoom(14)
          if (map) {
            map.setCenter(newCenter)
            map.setZoom(14)
          }
          setTimeout(() => {
            isUpdatingMapRef.current = false
          }, 100)
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
    if (event.latLng && isLoaded) {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()

      // Reverse geocode to get address
      try {
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
      } catch (error) {
        // Fallback if geocoding fails
        setReportingLocation({
          lat,
          lng,
          address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
        })
        setShowReportDialog(true)
      }
    }
  }

  // Handle marker click
  const handleMarkerClick = (marker: Hotspot | CollectionInfo) => {
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

  // Filter markers based on status
  const filteredCollectionPoints = collectionPoints.filter(p => {
    if (filterStatus === 'all') return true
    const status = 'status' in p ? p.status : 'active'
    return status === filterStatus
  })

  const filteredHotspots = hotspots.filter(h => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'active') return h.status === 'active'
    return true
  })

  // Get marker icon
  const getMarkerIcon = (status: string, type?: string, weight?: number) => {
    const baseSize = type === 'collection' ? 40 : 32
    const scale = weight ? Math.min(1.5, 0.8 + (weight / 50)) : 1

    if (type === 'collection') {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: baseSize * scale,
        fillColor: status === 'high-demand' ? '#EF4444' : '#3B82F6',
        fillOpacity: 0.8,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
        zIndex: status === 'high-demand' ? 1000 : 500,
      }
    }

    switch (status) {
      case 'active':
        return {
          path: google.maps.SymbolPath.CIRCLE,
          scale: baseSize * scale,
          fillColor: '#10B981',
          fillOpacity: 0.9,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        }
      case 'high-demand':
        return {
          path: google.maps.SymbolPath.CIRCLE,
          scale: baseSize * scale * 1.2,
          fillColor: '#EF4444',
          fillOpacity: 0.9,
          strokeColor: '#FFFFFF',
          strokeWeight: 4,
          zIndex: 1000,
        }
      case 'depleted':
        return {
          path: google.maps.SymbolPath.CIRCLE,
          scale: baseSize * 0.7,
          fillColor: '#6B7280',
          fillOpacity: 0.6,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        }
      default:
        return {
          path: google.maps.SymbolPath.CIRCLE,
          scale: baseSize,
          fillColor: '#EF4444',
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        }
    }
  }

  if (loadError) {
    return (
      <Card>
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load Google Maps</p>
        </Card>
      </Card>
    )
  }

  if (!isLoaded) {
    return (
      <Card>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </Card>
      </Card>
    )
  }

  return (
    <div className="relative h-full">
      {/* Enhanced Map Controls - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Map Type Selector */}
        <Card className="p-2 bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200">
          <div className="flex gap-1">
            <Button
              onClick={() => setMapType('roadmap')}
              size="sm"
              variant={mapType === 'roadmap' ? 'default' : 'ghost'}
              className="h-8 w-8 p-0"
              title="Roadmap"
            >
              <Map className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setMapType('satellite')}
              size="sm"
              variant={mapType === 'satellite' ? 'default' : 'ghost'}
              className="h-8 w-8 p-0"
              title="Satellite"
            >
              <Satellite className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setMapType('hybrid')}
              size="sm"
              variant={mapType === 'hybrid' ? 'default' : 'ghost'}
              className="h-8 w-8 p-0"
              title="Hybrid"
            >
              <Layers className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Heatmap Toggle */}
        <Button
          onClick={() => setShowHeatmap(!showHeatmap)}
          size="sm"
          variant={showHeatmap ? 'default' : 'outline'}
          className="bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200"
        >
          <Flame className={`w-4 h-4 mr-2 ${showHeatmap ? 'text-orange-500' : ''}`} />
          Heatmap
        </Button>

        {/* Filter */}
        <Select 
          value={filterStatus} 
          onValueChange={(value) => {
            setFilterStatus(value)
          }}
        >
          <SelectTrigger className="w-[140px] bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Points</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="high-demand">High Demand</SelectItem>
            <SelectItem value="depleted">Depleted</SelectItem>
          </SelectContent>
        </Select>

        {/* Current Location */}
        <Button
          onClick={handleGetCurrentLocation}
          size="sm"
          variant="outline"
          className="bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200"
        >
          <Navigation className="w-4 h-4 mr-2" />
          My Location
        </Button>

        {/* Refresh */}
        <Button
          onClick={fetchMapData}
          size="sm"
          variant="outline"
          className="bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200"
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
        onZoomChanged={() => {
          if (mapRef.current && !isUpdatingMapRef.current) {
            const newZoom = mapRef.current.getZoom() || 12
            if (newZoom !== zoom) {
              setZoom(newZoom)
            }
          }
        }}
        onCenterChanged={() => {
          if (mapRef.current && !isUpdatingMapRef.current) {
            const mapCenter = mapRef.current.getCenter()
            if (mapCenter) {
              const newCenter = { lat: mapCenter.lat(), lng: mapCenter.lng() }
              // Only update if center actually changed (prevents infinite loops)
              if (Math.abs(newCenter.lat - center.lat) > 0.0001 || Math.abs(newCenter.lng - center.lng) > 0.0001) {
                setCenter(newCenter)
              }
            }
          }
        }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          mapTypeId: mapType,
          styles: mapType === 'roadmap' ? [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ] : undefined,
        }}
      >
        {/* Collection Point Markers */}
        {filteredCollectionPoints.map((point) => {
          // Handle both API response format and CollectionInfo format
          const weight: number = 'wasteDetails' in point && point.wasteDetails
            ? (point.wasteDetails.totalWeight as number) || 0
            : 'weight' in point
            ? (point.weight as number) || 0
            : 0
          const status = 'status' in point ? point.status : 'active'
          
          return (
            <Marker
              key={point.id}
              position={{
                lat: point.location.coordinates[1],
                lng: point.location.coordinates[0],
              }}
              icon={getMarkerIcon(status, 'collection', weight)}
              onClick={() => handleMarkerClick(point)}
              animation={status === 'high-demand' ? google.maps.Animation.BOUNCE : undefined}
            />
          )
        })}

        {/* Hotspot Markers */}
        {filteredHotspots.map((hotspot) => (
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

        {/* Enhanced Info Window */}
        {selectedMarker && (
          <InfoWindow
            position={{
              lat: selectedMarker.location.coordinates[1],
              lng: selectedMarker.location.coordinates[0],
            }}
            onCloseClick={() => setSelectedMarker(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -10),
            }}
          >
            <div className="p-3 min-w-[280px] max-w-[320px]">
              {'collectionInstructions' in selectedMarker ? (
                // Collection Point Info with rich details
                <div className="space-y-3">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-base text-gray-900">
                        {selectedMarker.location.address}
                      </h3>
                      <Badge
                        variant={
                          selectedMarker.status === 'high-demand'
                            ? 'destructive'
                            : selectedMarker.status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                        className={
                          selectedMarker.status === 'high-demand'
                            ? 'bg-red-500'
                            : selectedMarker.status === 'active'
                            ? 'bg-emerald-500'
                            : 'bg-gray-500'
                        }
                      >
                        {selectedMarker.status === 'high-demand' ? 'High Demand' : selectedMarker.status}
                      </Badge>
                    </div>

                    {/* Waste Details */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center gap-1 mb-1">
                          <Weight className="w-3 h-3 text-emerald-600" />
                          <span className="text-xs text-gray-600">Available</span>
                        </div>
                        <p className="font-bold text-sm text-gray-900">
                          {selectedMarker.wasteDetails.totalWeight.toFixed(1)} kg
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign className="w-3 h-3 text-blue-600" />
                          <span className="text-xs text-gray-600">Est. Value</span>
                        </div>
                        <p className="font-bold text-sm text-gray-900">
                          ৳{selectedMarker.collectionInstructions.estimatedValue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Plastic Types:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(selectedMarker.wasteDetails.categories).map(([cat, weight]) => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}: {weight?.toFixed(1)}kg
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Collection Instructions */}
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      <div className="flex items-start gap-2 text-xs">
                        <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-700">Best Time: </span>
                          <span className="text-gray-600">{selectedMarker.collectionInstructions.bestTimeToCollect}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-700">Access: </span>
                          <span className="text-gray-600">{selectedMarker.collectionInstructions.accessMethod}</span>
                        </div>
                      </div>
                      {selectedMarker.collectionInstructions.contactInfo?.phone && (
                        <div className="flex items-start gap-2 text-xs">
                          <Phone className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-gray-700">Contact: </span>
                            <span className="text-gray-600">{selectedMarker.collectionInstructions.contactInfo.phone}</span>
                          </div>
                        </div>
                      )}
                      {selectedMarker.collectionInstructions.specialInstructions && (
                        <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
                          <strong>Note:</strong> {selectedMarker.collectionInstructions.specialInstructions}
                        </div>
                      )}
                    </div>

                    {selectedMarker.collectionCount > 0 && (
                      <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                        {selectedMarker.collectionCount} previous collection(s)
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Hotspot Info (simpler)
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

      {/* Enhanced Legend */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 text-sm border-2 border-gray-200"
      >
        <div className="font-bold mb-3 text-gray-900">Legend</div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-md"></div>
            <span className="text-xs">Active Hotspot</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow-md animate-pulse"></div>
            <span className="text-xs">High Demand</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>
            <span className="text-xs">Collection Point</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-500 border-2 border-white shadow-md"></div>
            <span className="text-xs">Depleted</span>
          </div>
          {showHeatmap && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-xs">Heatmap Active</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 border-2 border-gray-200"
      >
        <div className="font-bold mb-2 text-sm text-gray-900">Collection Points</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Active:</span>
            <Badge variant="default" className="bg-emerald-500">
              {collectionPoints.filter(p => {
                const status = 'status' in p ? p.status : 'active'
                return status === 'active'
              }).length}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">High Demand:</span>
            <Badge variant="destructive">
              {collectionPoints.filter(p => {
                const status = 'status' in p ? p.status : 'active'
                return status === 'high-demand'
              }).length}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Total Available:</span>
            <span className="font-bold text-gray-900">
              {collectionPoints.reduce((sum, p) => {
                const weight: number = 'wasteDetails' in p && p.wasteDetails
                  ? (p.wasteDetails.totalWeight as number) || 0
                  : 'weight' in p
                  ? (p.weight as number) || 0
                  : 0
                return sum + weight
              }, 0).toFixed(1)} kg
            </span>
          </div>
        </div>
      </motion.div>
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
      <DialogContent className="max-w-md">
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

