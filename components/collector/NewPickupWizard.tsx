'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'
import PhotoUploadStep from './PhotoUploadStep'
import CategoryDetailsStep, { PlasticCategory } from './CategoryDetailsStep'
import LocationStep from './LocationStep'
import ReviewStep from './ReviewStep'
import { useRouter } from 'next/navigation'

type Step = 1 | 2 | 3 | 4

interface FormData {
  photos: {
    before: File | null
    after: File | null
  }
  category: PlasticCategory | ''
  weight: number | ''
  address: string
  notes: string
  coordinates: [number, number] | null
}

export default function NewPickupWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState<{ isDetecting: boolean; isComplete: boolean }>({
    isDetecting: false,
    isComplete: false
  })
  const [formData, setFormData] = useState<FormData>({
    photos: { before: null, after: null },
    category: '',
    weight: '',
    address: '',
    notes: '',
    coordinates: null
  })

  // Use refs to persist File objects across re-renders
  const fileRefs = useRef<{
    before: File | null
    after: File | null
  }>({
    before: null,
    after: null
  })

  // Sync refs with state whenever photos change
  useEffect(() => {
    if (formData.photos.before instanceof File) {
      fileRefs.current.before = formData.photos.before
    }
    if (formData.photos.after instanceof File) {
      fileRefs.current.after = formData.photos.after
    }
  }, [formData.photos.before, formData.photos.after])

  const steps = [
    { number: 1, label: 'Photos', icon: CheckCircle2 },
    { number: 2, label: 'Details', icon: CheckCircle2 },
    { number: 3, label: 'Location', icon: CheckCircle2 },
    { number: 4, label: 'Review', icon: CheckCircle2 },
  ]

  const handleNext = () => {
    console.log('🔄 handleNext called', { currentStep, maxStep: 4 })
    if (currentStep < 4) {
      const nextStep = (currentStep + 1) as Step
      console.log('✅ Moving to step', nextStep)
      setCurrentStep(nextStep)
    } else {
      console.warn('⚠️ Already at last step')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
    }
  }

  const handleSubmit = async () => {
    // Try to recover File from refs if lost from state
    const beforePhoto = formData.photos.before instanceof File 
      ? formData.photos.before 
      : fileRefs.current.before
    
    const afterPhoto = formData.photos.after instanceof File 
      ? formData.photos.after 
      : fileRefs.current.after

    // Debug: Log current state
    console.log('🚀 handleSubmit called with formData:', {
      photosFromState: {
        before: formData.photos.before ? {
          exists: true,
          isFile: formData.photos.before instanceof File,
          name: formData.photos.before instanceof File ? formData.photos.before.name : 'not a file',
        } : null,
      },
      photosFromRefs: {
        before: fileRefs.current.before ? {
          exists: true,
          name: fileRefs.current.before.name,
          size: fileRefs.current.before.size
        } : null,
      },
      recoveredPhoto: beforePhoto ? {
        name: beforePhoto.name,
        size: beforePhoto.size,
        isFile: beforePhoto instanceof File
      } : null,
      category: formData.category,
      weight: formData.weight,
      address: formData.address,
    })

    // Validate required fields with detailed error messages
    // Use recovered photo if available
    if (!beforePhoto || !(beforePhoto instanceof File)) {
      const isFile = beforePhoto !== null && typeof beforePhoto === 'object' && 'name' in beforePhoto
      console.error('❌ Before photo validation failed:', {
        statePhoto: formData.photos.before,
        refPhoto: fileRefs.current.before,
        recoveredPhoto: beforePhoto,
        isFile: isFile
      })
      alert('Please upload a before photo. Go back to step 1 and upload an image.')
      setIsSubmitting(false)
      return
    }
    
    if (!formData.category) {
      alert('Please select a plastic category')
      setIsSubmitting(false)
      return
    }
    if (!formData.weight || Number(formData.weight) <= 0) {
      alert('Please enter a valid weight (greater than 0)')
      setIsSubmitting(false)
      return
    }
    if (!formData.address || formData.address.trim().length === 0) {
      alert('Please enter or select a location address')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create FormData for API
      const submitData = new FormData()
      
      // Use recovered File objects from refs if state lost them
      submitData.append('beforePhoto', beforePhoto)
      console.log('✅ Before photo appended:', beforePhoto.name, beforePhoto.size)
      
      if (afterPhoto instanceof File) {
        submitData.append('afterPhoto', afterPhoto)
        console.log('✅ After photo appended:', afterPhoto.name)
      }
      
      submitData.append('category', formData.category)
      submitData.append('weight', String(formData.weight))
      submitData.append('address', formData.address)
      submitData.append('notes', formData.notes || '')
      
      if (formData.coordinates) {
        submitData.append('coordinates', JSON.stringify(formData.coordinates))
      }

      console.log('📤 Submitting pickup:', {
        hasBeforePhoto: !!formData.photos.before,
        hasAfterPhoto: !!formData.photos.after,
        category: formData.category,
        weight: formData.weight,
        address: formData.address
      })

      const response = await fetch('/api/pickups/create', {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Submission failed:', errorData)
        throw new Error(errorData.error || `Failed to submit pickup (${response.status})`)
      }

              const result = await response.json()
              console.log('✅ Pickup submitted successfully:', {
                pickupId: result.pickupId,
                pickup: result.pickup,
                hasPickupId: !!result.pickupId,
                idType: typeof result.pickupId
              })

              // Redirect to pickup detail page
              // Use pickupId from response, or fallback to pickup.id
              const pickupId = result.pickupId || result.pickup?.id
              if (!pickupId) {
                console.error('❌ No pickup ID in response:', result)
                throw new Error('No pickup ID received from server')
              }
              
              console.log('🔄 Redirecting to pickup detail page:', `/collector/pickups/${pickupId}`)
              router.push(`/collector/pickups/${pickupId}`)
    } catch (error) {
      console.error('Error submitting pickup:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit pickup. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number
            const Icon = step.icon

            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                    ${isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : isActive
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <span className="font-bold">{step.number}</span>
                    )}
                  </div>
                  <p className={`
                    mt-2 text-xs font-semibold
                    ${isActive || isCompleted ? 'text-emerald-600' : 'text-gray-400'}
                  `}>
                    {step.label}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-4 transition-colors
                    ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl border-2 border-emerald-100/50 shadow-xl p-8"
        >
          {currentStep === 1 && (
            <PhotoUploadStep
              photos={formData.photos}
              onPhotosChange={(photos) => {
                console.log('📸 Updating photos in state:', {
                  beforeExists: !!photos.before,
                  beforeIsFile: photos.before instanceof File,
                  beforeName: photos.before instanceof File ? photos.before.name : null,
                })
                
                // Store File objects in refs for persistence
                if (photos.before instanceof File) {
                  fileRefs.current.before = photos.before
                }
                if (photos.after instanceof File) {
                  fileRefs.current.after = photos.after
                }
                
                // Ensure we're updating the state correctly
                setFormData(prev => ({ ...prev, photos }))
              }}
              onNext={handleNext}
              onAIDetection={(detection) => {
                // Auto-fill category and weight from AI detection
                setFormData(prev => ({
                  ...prev,
                  category: detection.category as PlasticCategory,
                  weight: detection.weight
                }))
              }}
              onAIDetectionStatusChange={(status) => {
                setAiAnalysisStatus(status)
              }}
            />
          )}

          {currentStep === 2 && (
            <CategoryDetailsStep
              category={formData.category}
              weight={formData.weight}
              notes={formData.notes}
              onCategoryChange={(category) => setFormData(prev => ({ ...prev, category }))}
              onWeightChange={(weight) => setFormData(prev => ({ ...prev, weight }))}
              onNotesChange={(notes) => setFormData(prev => ({ ...prev, notes }))}
              onNext={handleNext}
              onBack={handleBack}
              aiAnalysisStatus={aiAnalysisStatus}
            />
          )}

          {currentStep === 3 && (
            <LocationStep
              address={formData.address}
              coordinates={formData.coordinates}
              onAddressChange={(address) => setFormData({ ...formData, address })}
              onCoordinatesChange={(coordinates) => setFormData({ ...formData, coordinates })}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <ReviewStep
              photos={{
                // Use refs as fallback if state lost the File objects
                before: formData.photos.before instanceof File ? formData.photos.before : (fileRefs.current.before || formData.photos.before),
                after: formData.photos.after instanceof File ? formData.photos.after : (fileRefs.current.after || formData.photos.after),
              }}
              category={formData.category}
              weight={formData.weight}
              address={formData.address}
              notes={formData.notes}
              onBack={handleBack}
              onSubmit={() => {
                // Debug: Check if photos are still available
                console.log('🔍 Review Step - Form Data Check:', {
                  stateBefore: formData.photos.before,
                  refBefore: fileRefs.current.before,
                  finalBefore: formData.photos.before instanceof File ? formData.photos.before : fileRefs.current.before,
                  category: formData.category,
                  weight: formData.weight,
                  address: formData.address
                })
                handleSubmit()
              }}
              isSubmitting={isSubmitting}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}


