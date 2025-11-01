'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import GoogleMapComponent from './GoogleMap'
import { logger } from '@/lib/logger'

interface LocationStepProps {
  address: string
  coordinates: [number, number] | null // [lng, lat]
  onAddressChange: (address: string) => void
  onCoordinatesChange: (coordinates: [number, number] | null) => void
  onNext: () => void
  onBack: () => void
}

export default function LocationStep({
  address,
  coordinates,
  onAddressChange,
  onCoordinatesChange,
  onNext,
  onBack
}: LocationStepProps) {
  const [gettingLocation, setGettingLocation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        onCoordinatesChange([lng, lat])
        setGettingLocation(false)
        
        // Reverse geocode using Google Maps Geocoding API
        reverseGeocode(lat, lng)
      },
      (error) => {
        logger.error('Geolocation failed', new Error(error.message))
        alert('Unable to get your location. Please select on the map or enter address manually.')
        setGettingLocation(false)
      }
    )
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address
        onAddressChange(formattedAddress)
        logger.info('Reverse geocoding successful', { lat, lng, address: formattedAddress })
      } else {
        onAddressChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      }
    } catch (error) {
      logger.error('Reverse geocoding failed', error instanceof Error ? error : new Error(String(error)))
      onAddressChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }
  }

  const handleLocationSelect = useCallback((coords: [number, number], addr: string) => {
    onCoordinatesChange(coords)
    onAddressChange(addr)
    logger.info('Location selected from map', { coordinates: coords, address: addr })
  }, [onCoordinatesChange, onAddressChange])

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        const location = result.geometry.location
        const lat = location.lat
        const lng = location.lng
        const formattedAddress = result.formatted_address

        onCoordinatesChange([lng, lat])
        onAddressChange(formattedAddress)
        logger.info('Location search successful', { query, lat, lng, address: formattedAddress })
      } else {
        alert('Location not found. Please try a different search term.')
      }
    } catch (error) {
      logger.error('Location search failed', error instanceof Error ? error : new Error(String(error)))
      alert('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search - search after 1 second of no typing
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(value)
      }, 1000)
    }
  }

  // Allow proceeding - validation happens at submit
  const canProceed = true

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Location</h2>
        <p className="text-gray-600">Select or search for the collection location on the map</p>
      </div>

      {/* Address Input with Search */}
      <div className="space-y-4">
        <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          Collection Address <span className="text-red-500">*</span>
        </Label>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for location or enter address"
              value={address}
              onChange={(e) => {
                onAddressChange(e.target.value)
                handleSearchChange(e.target.value)
              }}
              className="pl-11 h-14 text-lg"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              </div>
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
          >
            <Navigation className={`w-5 h-5 ${gettingLocation ? 'animate-spin' : ''}`} />
            {gettingLocation ? 'Locating...' : 'Current'}
          </Button>
        </div>

        {coordinates && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200"
          >
            <p className="text-sm font-semibold text-emerald-900 mb-1">📍 Location Set</p>
            <p className="text-xs text-emerald-700">{address}</p>
            <p className="text-xs text-emerald-600 mt-1">
              Coordinates: {coordinates[1].toFixed(6)}, {coordinates[0].toFixed(6)}
            </p>
          </motion.div>
        )}
      </div>

      {/* Google Map */}
      <div className="relative h-96 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
        <GoogleMapComponent
          onLocationSelect={handleLocationSelect}
          initialCenter={coordinates ? { lat: coordinates[1], lng: coordinates[0] } : { lat: 23.8103, lng: 90.4125 }}
          initialAddress={address}
          selectedCoordinates={coordinates}
        />
      </div>

      <div className="flex justify-between gap-4 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-gray-300"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
        >
          Review & Submit
        </Button>
      </div>
    </div>
  )
}
