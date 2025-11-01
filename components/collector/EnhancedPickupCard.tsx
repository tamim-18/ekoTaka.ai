'use client'

import { motion } from 'framer-motion'
import { Package, MapPin, Calendar, Weight, ArrowRight, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import StatusBadge from './StatusBadge'
import { DummyPickup } from '@/lib/dummy-data'

interface EnhancedPickupCardProps {
  pickup: DummyPickup
  index: number
}

export default function EnhancedPickupCard({ pickup, index }: EnhancedPickupCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Link href={`/collector/pickups/${pickup.id}`}>
        <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-emerald-100/50 shadow-md hover:shadow-xl transition-all duration-300">
          {/* Gradient accent on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/50 transition-all duration-300" />

          <div className="relative p-5">
            <div className="flex gap-5">
              {/* Enhanced Photo */}
              <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-100 group-hover:shadow-lg transition-all">
                <Image
                  src={pickup.photos.before.url}
                  alt={`Pickup ${pickup.id}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  unoptimized
                />
                {pickup.photos.after && (
                  <div className="absolute inset-0 bg-emerald-500/30 backdrop-blur-sm flex items-center justify-center">
                    <div className="p-1.5 rounded-full bg-emerald-500 shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                {/* Status indicator */}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={pickup.status} />
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100">
                      <Package className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-bold text-lg text-gray-900">{pickup.category}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Weight className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold">
                      {pickup.actualWeight || pickup.estimatedWeight} kg
                    </span>
                    {pickup.actualWeight && (
                      <span className="text-xs text-gray-400">
                        (est. {pickup.estimatedWeight} kg)
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span className="truncate font-medium">
                      {pickup.location.address || 'Location not specified'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(pickup.createdAt)}</span>
                  </div>
                </div>

                {/* Action indicator */}
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View details</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
    </motion.div>
  )
}

