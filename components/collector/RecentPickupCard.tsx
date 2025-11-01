'use client'

import { motion } from 'framer-motion'
import { Package, MapPin, Calendar, Weight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import StatusBadge from './StatusBadge'
import { DummyPickup } from '@/lib/dummy-data'

interface RecentPickupCardProps {
  pickup: DummyPickup
}

export default function RecentPickupCard({ pickup }: RecentPickupCardProps) {
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className="group bg-white rounded-xl border border-emerald-100/50 p-4 hover:shadow-lg transition-all"
    >
      <Link href={`/collector/pickups/${pickup.id}`}>
        <div className="flex gap-4">
          {/* Photo */}
          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
            <Image
              src={pickup.photos.before.url}
              alt={`Pickup ${pickup.id}`}
              fill
              className="object-cover group-hover:scale-110 transition-transform"
              unoptimized
            />
            {pickup.photos.after && (
              <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-white bg-emerald-500 px-1 rounded">✓</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-gray-900">{pickup.category}</span>
              </div>
              <StatusBadge status={pickup.status} />
            </div>

            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-gray-400" />
                <span>
                  {pickup.actualWeight || pickup.estimatedWeight} kg
                  {pickup.actualWeight && (
                    <span className="text-gray-400 ml-1">
                      (est. {pickup.estimatedWeight} kg)
                    </span>
                  )}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate">{pickup.location.address || 'Location not specified'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatDate(pickup.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

