'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Package, Weight, MapPin, Camera, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PlasticCategory } from './CategoryDetailsStep'

interface ReviewStepProps {
  photos: {
    before: File | null
    after: File | null
  }
  category: PlasticCategory | ''
  weight: number | ''
  address: string
  notes: string
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export default function ReviewStep({
  photos,
  category,
  weight,
  address,
  notes,
  onBack,
  onSubmit,
  isSubmitting
}: ReviewStepProps) {
  // Create preview URLs and store them to prevent garbage collection
  const [previewUrls, setPreviewUrls] = useState<{ before: string | null; after: string | null }>({
    before: null,
    after: null
  })

  useEffect(() => {
    const urls = {
      before: photos.before ? URL.createObjectURL(photos.before) : null,
      after: photos.after ? URL.createObjectURL(photos.after) : null
    }
    setPreviewUrls(urls)

    // Cleanup function to revoke URLs when component unmounts
    return () => {
      if (urls.before) URL.revokeObjectURL(urls.before)
      if (urls.after) URL.revokeObjectURL(urls.after)
    }
  }, [photos.before, photos.after])

  const previewBefore = previewUrls.before
  const previewAfter = previewUrls.after

  // Validate all required fields
  // Check if photo exists (either File object or preview URL - both mean photo was uploaded)
  const hasBeforePhoto = (photos.before !== null && photos.before instanceof File) || previewBefore !== null
  
  const isValid = 
    hasBeforePhoto &&
    category !== '' && 
    weight !== '' && 
    Number(weight) > 0 && 
    address.trim().length > 0

  // Debug log with detailed info
  useEffect(() => {
    console.log('📋 ReviewStep validation:', {
      photosBefore: photos.before,
      isFile: photos.before instanceof File,
      hasPreview: !!previewBefore,
      hasBeforePhoto,
      category,
      weight,
      weightValid: weight !== '' && Number(weight) > 0,
      address,
      addressValid: address.trim().length > 0,
      isValid,
      isSubmitting,
      photoType: typeof photos.before,
      photoConstructor: photos.before?.constructor?.name
    })
  }, [photos.before, previewBefore, hasBeforePhoto, category, weight, address, isValid, isSubmitting])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-gray-600">Please review your information before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Photos */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            Photos
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {previewBefore && (
              <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-200 bg-gray-100">
                <Image
                  src={previewBefore}
                  alt="Before"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  Before
                </div>
              </div>
            )}
            {previewAfter && (
              <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-teal-200 bg-gray-100">
                <Image
                  src={previewAfter}
                  alt="After"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-2 left-2 bg-teal-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  After
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Category */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Category</p>
                <p className="text-lg font-black text-gray-900">{category}</p>
              </div>
            </div>
          </div>

          {/* Weight */}
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-teal-500">
                <Weight className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Estimated Weight</p>
                <p className="text-lg font-black text-gray-900">{weight} kg</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Location</p>
                <p className="text-sm font-medium text-gray-900">{address || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Additional Notes</p>
              <p className="text-sm text-gray-700">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Validation Status */}
      {!isValid && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300"
        >
          <p className="text-sm font-semibold text-amber-900 mb-2">⚠️ Please complete the following:</p>
          <ul className="text-xs text-amber-800 space-y-1">
            {!hasBeforePhoto && (
              <li>• Upload a before photo (Photo missing: {photos.before ? 'exists but not File type' : 'completely missing'})</li>
            )}
            {!category && (
              <li>• Select a plastic category</li>
            )}
            {(!weight || Number(weight) <= 0) && (
              <li>• Enter a valid weight</li>
            )}
            {!address.trim() && (
              <li>• Enter or select a location address</li>
            )}
          </ul>
        </motion.div>
      )}

      {/* Info Box */}
      {isValid && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 mb-1">What happens next?</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Your pickup will be verified using AI</li>
              <li>• You'll receive instant confirmation</li>
              <li>• Payment will be processed after verification</li>
            </ul>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between gap-4 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="border-gray-300"
        >
          Back
        </Button>
        <Button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            
            // Validate ONLY when submitting
            if (!isValid) {
              const missingFields = []
              if (!hasBeforePhoto) missingFields.push('Before photo')
              if (!category) missingFields.push('Category')
              if (!weight || Number(weight) <= 0) missingFields.push('Weight')
              if (!address.trim()) missingFields.push('Address')
              
              alert(`Please complete all required fields:\n\n${missingFields.map(f => `• ${f}`).join('\n')}`)
              return
            }
            
            if (isSubmitting) {
              return // Already submitting, prevent double-click
            }
            
            onSubmit()
          }}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
          type="button"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Submit Pickup
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}


