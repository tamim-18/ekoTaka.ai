'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api'
import { MapPin } from 'lucide-react'
import { logger } from '@/lib/logger'

// Use comprehensive libraries set - all components should use the same to avoid conflicts
const libraries: ('places' | 'geometry' | 'visualization')[] = ['places', 'geometry', 'visualization']

interface GoogleMapComponentProps {
  onLocationSelect: (coordinates: [number, number], address: string) => void
  initialCenter?: { lat: number; lng: number }
  initialAddress?: string
  selectedCoordinates?: [number, number] | null
}

export default function GoogleMapComponent({
  onLocationSelect,
  initialCenter = { lat: 23.8103, lng: 90.4125 }, // Default to Dhaka, Bangladesh
  initialAddress,
  selectedCoordinates
}: GoogleMapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    selectedCoordinates ? { lat: selectedCoordinates[1], lng: selectedCoordinates[0] } : null
  )
  const [infoWindow, setInfoWindow] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  // Check if Google Maps is already loaded to prevent re-initialization conflicts
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
    // Prevent re-loading if already initialized
    preventGoogleFontsLoading: false,
  })

  // Geocode coordinates to get address
  const geocodeCoordinates = useCallback(async (lat: number, lng: number) => {
    if (!window.google) return

    setIsGeocoding(true)
    try {
      const geocoder = new window.google.maps.Geocoder()
      const response = await geocoder.geocode({ location: { lat, lng } })
      
      if (response.results && response.results.length > 0) {
        const address = response.results[0].formatted_address
        setInfoWindow({ lat, lng, address })
        onLocationSelect([lng, lat], address)
        logger.info('Location geocoded', { lat, lng, address })
      } else {
        // Fallback address
        const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        setInfoWindow({ lat, lng, address })
        onLocationSelect([lng, lat], address)
      }
    } catch (error) {
      logger.error('Geocoding failed', error instanceof Error ? error : new Error(String(error)), { lat, lng })
      const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setInfoWindow({ lat, lng, address })
      onLocationSelect([lng, lat], address)
    } finally {
      setIsGeocoding(false)
    }
  }, [onLocationSelect])

  // Handle map click
  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      setSelectedLocation({ lat, lng })
      geocodeCoordinates(lat, lng)
    }
  }, [geocodeCoordinates])

  // Initialize map with default location or selected coordinates
  useEffect(() => {
    if (map && selectedCoordinates) {
      const center = { lat: selectedCoordinates[1], lng: selectedCoordinates[0] }
      map.setCenter(center)
      setSelectedLocation(center)
    } else if (map && !selectedLocation) {
      map.setCenter(initialCenter)
    }
  }, [map, selectedCoordinates, initialCenter, selectedLocation])


  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        if (map) {
          map.setCenter({ lat, lng })
          map.setZoom(15)
          setSelectedLocation({ lat, lng })
          geocodeCoordinates(lat, lng)
        }
      },
      (error) => {
        logger.error('Geolocation failed', new Error(error.message))
        alert('Unable to get your location. Please select on the map.')
      }
    )
  }, [map, geocodeCoordinates])

  const handleSearch = useCallback(async (query: string) => {
    if (!window.google || !map || !query.trim()) return

    try {
      const service = new window.google.maps.places.PlacesService(map)
      const request = {
        query: query,
        fields: ['geometry', 'formatted_address', 'name'],
      }

      service.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const place = results[0]
          const location = place.geometry?.location
          if (location) {
            const lat = location.lat()
            const lng = location.lng()
            const address = place.formatted_address || place.name || ''
            
            map.setCenter({ lat, lng })
            map.setZoom(15)
            setSelectedLocation({ lat, lng })
            setInfoWindow({ lat, lng, address })
            onLocationSelect([lng, lat], address)
            
            logger.info('Place found', { query, lat, lng, address })
          }
        }
      })
    } catch (error) {
      logger.error('Place search failed', error instanceof Error ? error : new Error(String(error)), { query })
    }
  }, [map, onLocationSelect])

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-xl border-2 border-red-200">
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold">Error loading Google Maps</p>
          <p className="text-sm text-gray-600 mt-2">Please check your API key</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-xl border-2 border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
        center={selectedLocation || initialCenter}
        zoom={selectedLocation ? 15 : 12}
        onClick={handleMapClick}
        onLoad={setMap}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }}
      >
        {selectedLocation && (
          <Marker
            position={selectedLocation}
            icon={{
              url: 'data:image/svg+xml;base64,' + btoa(`
                <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 40 16 40C16 40 32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#10B981"/>
                  <circle cx="16" cy="16" r="8" fill="white"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 40),
              anchor: new window.google.maps.Point(16, 40)
            }}
            onClick={() => {
              if (selectedLocation) {
                setInfoWindow(prev => prev ? null : { 
                  lat: selectedLocation.lat, 
                  lng: selectedLocation.lng, 
                  address: infoWindow?.address || 'Loading...' 
                })
              }
            }}
          />
        )}

        {infoWindow && (
          <InfoWindow
            position={{ lat: infoWindow.lat, lng: infoWindow.lng }}
            onCloseClick={() => setInfoWindow(null)}
          >
            <div className="p-2">
              <p className="font-semibold text-gray-900 text-sm mb-1">📍 Selected Location</p>
              <p className="text-xs text-gray-600">{infoWindow.address}</p>
              {isGeocoding && (
                <p className="text-xs text-emerald-600 mt-1">Getting address...</p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={getCurrentLocation}
          className="bg-white hover:bg-gray-50 p-2 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center"
          title="Use current location"
        >
          <MapPin className="w-5 h-5 text-emerald-600" />
        </button>
      </div>

      {/* Instructions */}
      {!selectedLocation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm text-gray-700 font-medium">👆 Click on the map to select location</p>
        </div>
      )}
    </div>
  )
}

// Export search function for use in parent component
export const usePlaceSearch = (map: google.maps.Map | null) => {
  const searchPlace = useCallback(async (query: string) => {
    if (!window.google || !map) return null

    return new Promise<{ lat: number; lng: number; address: string } | null>((resolve) => {
      const service = new window.google.maps.places.PlacesService(map)
      const request = {
        query: query,
        fields: ['geometry', 'formatted_address', 'name'],
      }

      service.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const place = results[0]
          const location = place.geometry?.location
          if (location) {
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              address: place.formatted_address || place.name || ''
            })
          } else {
            resolve(null)
          }
        } else {
          resolve(null)
        }
      })
    })
  }, [map])

  return searchPlace
}

