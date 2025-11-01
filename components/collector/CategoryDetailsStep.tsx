'use client'

import { motion } from 'framer-motion'
import { Package, Weight, Info, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type PlasticCategory = 'PET' | 'HDPE' | 'LDPE' | 'PP' | 'PS' | 'Other'

interface CategoryDetailsStepProps {
  category: PlasticCategory | ''
  weight: number | ''
  notes: string
  onCategoryChange: (category: PlasticCategory) => void
  onWeightChange: (weight: number | '') => void
  onNotesChange: (notes: string) => void
  onNext: () => void
  onBack: () => void
  aiAnalysisStatus?: { isDetecting: boolean; isComplete: boolean }
}

const categories = [
  { value: 'PET', label: 'PET (Polyethylene Terephthalate)', description: 'Bottles, containers' },
  { value: 'HDPE', label: 'HDPE (High-Density Polyethylene)', description: 'Milk jugs, detergent bottles' },
  { value: 'LDPE', label: 'LDPE (Low-Density Polyethylene)', description: 'Plastic bags, wrapping' },
  { value: 'PP', label: 'PP (Polypropylene)', description: 'Food containers, straws' },
  { value: 'PS', label: 'PS (Polystyrene)', description: 'Foam, disposable cups' },
  { value: 'Other', label: 'Other', description: 'Mixed or unknown plastic' },
]

export default function CategoryDetailsStep({
  category,
  weight,
  notes,
  onCategoryChange,
  onWeightChange,
  onNotesChange,
  onNext,
  onBack,
  aiAnalysisStatus
}: CategoryDetailsStepProps) {
  const [showAISuccess, setShowAISuccess] = useState(false)

  useEffect(() => {
    if (aiAnalysisStatus?.isComplete && category && weight) {
      setShowAISuccess(true)
      // Hide success message after 5 seconds
      const timer = setTimeout(() => setShowAISuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [aiAnalysisStatus?.isComplete, category, weight])

  // Allow proceeding - validation happens at submit
  const canProceed = true

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Category & Details</h2>
        
        {/* AI Analysis Status */}
        {aiAnalysisStatus?.isDetecting && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 flex items-center gap-3"
          >
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-900">AI is analyzing your image...</p>
              <p className="text-sm text-emerald-700">Please wait while we detect the plastic type and estimate weight.</p>
            </div>
          </motion.div>
        )}

        {showAISuccess && aiAnalysisStatus?.isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-4 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 flex items-center gap-3"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Analysis Complete!
              </p>
              <p className="text-sm text-emerald-700 mt-1">
                We've auto-filled the category and weight. You can adjust them if needed.
              </p>
            </div>
          </motion.div>
        )}

        <p className={`text-gray-600 mt-2 ${aiAnalysisStatus?.isDetecting ? 'opacity-50' : ''}`}>
          {category && weight ? (
            <span className="flex items-center gap-2">
              <span>AI has pre-filled these values. You can adjust them if needed.</span>
            </span>
          ) : (
            'Select the type and weight of your collection'
          )}
        </p>
      </div>

      {/* Category Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          Plastic Category <span className="text-red-500">*</span>
        </Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <motion.button
              key={cat.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCategoryChange(cat.value as PlasticCategory)}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all
                ${category === cat.value
                  ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-bold ${category === cat.value ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {cat.value}
                </h3>
                {category === cat.value && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{cat.label}</p>
              <p className="text-xs text-gray-500">{cat.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Weight Input */}
      <div className="space-y-3">
        <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Weight className="w-5 h-5 text-emerald-600" />
          Estimated Weight (kg) <span className="text-red-500">*</span>
        </Label>
        
        <div className="relative">
          <Input
            type="number"
            step="0.1"
            min="0.1"
            placeholder="0.0"
            value={weight}
            onChange={(e) => {
              const val = e.target.value
              onWeightChange(val === '' ? '' : parseFloat(val) || '')
            }}
            className="text-lg font-semibold pl-12 h-14"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            kg
          </div>
        </div>
        
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Enter the approximate weight of your collection
        </p>
      </div>

      {/* Additional Notes (Optional) */}
      <div className="space-y-3">
        <Label className="text-base font-semibold text-gray-900">
          Additional Notes <span className="text-gray-400 font-normal">(Optional)</span>
        </Label>
        <Textarea
          placeholder="Any additional information about your collection..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          className="resize-none"
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
                  {aiAnalysisStatus?.isDetecting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    'Next Step'
                  )}
                </Button>
      </div>
    </div>
  )
}


