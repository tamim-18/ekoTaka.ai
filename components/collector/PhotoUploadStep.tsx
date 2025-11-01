'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Camera, Image as ImageIcon, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface PhotoUploadStepProps {
  photos: {
    before: File | null
    after: File | null
  }
  onPhotosChange: (photos: { before: File | null; after: File | null }) => void
  onNext: () => void
  onAIDetection?: (detection: { category: string; weight: number; confidence: number }) => void
  onAIDetectionStatusChange?: (status: { isDetecting: boolean; isComplete: boolean }) => void
}

export default function PhotoUploadStep({ photos, onPhotosChange, onNext, onAIDetection, onAIDetectionStatusChange }: PhotoUploadStepProps) {
  const [dragActive, setDragActive] = useState(false)
  const [previewBefore, setPreviewBefore] = useState<string | null>(null)
  const [previewAfter, setPreviewAfter] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionResult, setDetectionResult] = useState<{ category: string; weight: number; confidence: number } | null>(null)

  // Sync previews when photos prop changes (e.g., when navigating back)
  useEffect(() => {
    if (photos.before && !previewBefore) {
      const reader = new FileReader()
      reader.onload = (e) => setPreviewBefore(e.target?.result as string)
      reader.readAsDataURL(photos.before)
    }
    if (photos.after && !previewAfter) {
      const reader = new FileReader()
      reader.onload = (e) => setPreviewAfter(e.target?.result as string)
      reader.readAsDataURL(photos.after)
    }
  }, [photos.before, photos.after, previewBefore, previewAfter])

  const handleFile = useCallback(async (file: File, type: 'before' | 'after') => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('Image size must be less than 10MB')
      return
    }

    const newPhotos = { ...photos, [type]: file }
    onPhotosChange(newPhotos)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      if (type === 'before') {
        setPreviewBefore(e.target?.result as string)
      } else {
        setPreviewAfter(e.target?.result as string)
      }
    }
    reader.readAsDataURL(file)

    // If this is the "before" photo, trigger AI detection
    if (type === 'before' && onAIDetection) {
      setIsDetecting(true)
      setDetectionResult(null)
      onAIDetectionStatusChange?.({ isDetecting: true, isComplete: false })
      
      try {
        const formData = new FormData()
        formData.append('photo', file)

        const response = await fetch('/api/pickups/detect', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.detection) {
            const detection = result.detection
            if (detection.detectedCategory && detection.confidence > 0.5) {
              setDetectionResult({
                category: detection.detectedCategory,
                weight: detection.estimatedWeight,
                confidence: detection.confidence
              })
              // Auto-fill the detected category and weight
              onAIDetection({
                category: detection.detectedCategory,
                weight: detection.estimatedWeight,
                confidence: detection.confidence
              })
              onAIDetectionStatusChange?.({ isDetecting: false, isComplete: true })
            } else {
              onAIDetectionStatusChange?.({ isDetecting: false, isComplete: true })
            }
          } else {
            onAIDetectionStatusChange?.({ isDetecting: false, isComplete: true })
          }
        } else {
          onAIDetectionStatusChange?.({ isDetecting: false, isComplete: true })
        }
      } catch (error) {
        console.error('AI detection error:', error)
        onAIDetectionStatusChange?.({ isDetecting: false, isComplete: true })
      } finally {
        setIsDetecting(false)
      }
    }
  }, [photos, onPhotosChange, onAIDetection, onAIDetectionStatusChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, type: 'before' | 'after') => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], type)
    }
  }, [handleFile])

  const removePhoto = (type: 'before' | 'after') => {
    const newPhotos = { ...photos, [type]: null }
    onPhotosChange(newPhotos)
    if (type === 'before') {
      setPreviewBefore(null)
    } else {
      setPreviewAfter(null)
    }
  }

  // Allow proceeding regardless - validation happens at submit
  const canProceed = true

  // Debug log to check photo state
  useEffect(() => {
    console.log('📸 PhotoUploadStep - Photo state:', {
      beforeExists: !!photos.before,
      beforeIsFile: photos.before instanceof File,
      beforeName: photos.before instanceof File ? photos.before.name : null,
      afterExists: !!photos.after,
      afterIsFile: photos.after instanceof File,
    })
  }, [photos.before, photos.after])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Upload Photos</h2>
        <p className="text-gray-600">Take clear photos of your plastic waste collection. AI will automatically detect the type and weight.</p>
        {isDetecting && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI is analyzing your photo...</span>
          </div>
        )}
        {detectionResult && !isDetecting && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>
              AI detected: <strong>{detectionResult.category}</strong> ({detectionResult.weight.toFixed(2)} kg) - 
              {Math.round(detectionResult.confidence * 100)}% confident
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Photo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Before Photo <span className="text-red-500">*</span>
          </label>
          
          {previewBefore ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group rounded-2xl overflow-hidden border-2 border-emerald-200 bg-gray-50"
            >
              <div className="aspect-square relative">
                <Image
                  src={previewBefore}
                  alt="Before photo"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto('before')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Uploaded
              </div>
            </motion.div>
          ) : (
            <div
              className={`
                relative rounded-2xl border-2 border-dashed transition-all
                ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50'}
                hover:border-emerald-400 hover:bg-emerald-50/50
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleDrop(e, 'before')}
            >
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'before')}
              />
              <div className="aspect-square flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">Drop image here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
                <p className="text-xs text-gray-400 mt-2">Max 10MB • JPG, PNG, WEBP</p>
              </div>
            </div>
          )}
        </div>

        {/* After Photo (Optional) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            After Photo <span className="text-gray-400">(Optional)</span>
          </label>
          
          {previewAfter ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group rounded-2xl overflow-hidden border-2 border-teal-200 bg-gray-50"
            >
              <div className="aspect-square relative">
                <Image
                  src={previewAfter}
                  alt="After photo"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto('after')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Uploaded
              </div>
            </motion.div>
          ) : (
            <div
              className={`
                relative rounded-2xl border-2 border-dashed transition-all
                ${dragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 bg-gray-50'}
                hover:border-teal-400 hover:bg-teal-50/50
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleDrop(e, 'after')}
            >
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'after')}
              />
              <div className="aspect-square flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-teal-600" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">Drop image here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
                <p className="text-xs text-gray-400 mt-2">Max 10MB • JPG, PNG, WEBP</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
          type="button"
        >
          {isDetecting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </span>
          ) : (
            <>
              Next Step
              <Upload className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}


