'use client'

import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'pending' | 'verified' | 'rejected' | 'paid'
  className?: string
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  verified: {
    label: 'Verified',
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      config.className,
      className
    )}>
      {config.label}
    </span>
  )
}

