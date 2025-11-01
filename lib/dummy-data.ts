// Dummy Data Generator for EkoTaka Frontend Prototype
// This provides realistic mock data for all collector features

export interface DummyPickup {
  id: string
  collectorId: string
  category: 'PET' | 'HDPE' | 'LDPE' | 'PP' | 'PS' | 'Other'
  estimatedWeight: number
  actualWeight?: number
  status: 'pending' | 'verified' | 'rejected' | 'paid'
  location: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
    address?: string
  }
  photos: {
    before: {
      cloudinaryId: string
      url: string
    }
    after?: {
      cloudinaryId: string
      url: string
    }
  }
  verification?: {
    aiConfidence: number
    aiCategory: string
    aiWeight: number
    manualReview: boolean
    verifiedBy?: string
    verifiedAt?: string
  }
  statusHistory: Array<{
    status: string
    timestamp: string
    notes?: string
  }>
  createdAt: string
  updatedAt: string
}

export interface DummyTransaction {
  id: string
  pickupId: string
  collectorId: string
  amount: number
  paymentMethod: 'bkash' | 'nagad'
  transactionId: string
  status: 'pending' | 'completed' | 'failed'
  initiatedAt: string
  completedAt?: string
}

export interface DummyEkoToken {
  id: string
  userId: string
  amount: number
  source: 'pickup' | 'bonus' | 'referral'
  pickupId?: string
  expiresAt?: string
  redeemedAt?: string
  createdAt: string
}

export interface CollectorStats {
  totalPickups: number
  totalPickupsThisMonth: number
  totalEarnings: number
  pendingEarnings: number
  ekoTokens: number
  verificationRate: number
  totalWeightCollected: number
  totalCO2Saved: number
}

// Generate deterministic coordinates in Bangladesh based on seed
function getDeterministicCoords(seed: number): [number, number] {
  // Use seed to generate consistent coordinates
  // Bangladesh roughly: lat 20.7-26.6, lng 88.0-92.7
  const normalized = (seed * 0.618) % 1 // Golden ratio for better distribution
  const lat = 23.7 + (normalized * 6 - 3) // Around Dhaka/Sylhet
  const lng = 90.3 + ((seed * 0.382) % 1 * 2 - 1) // Around Dhaka
  return [lng, lat]
}

// Generate deterministic date based on seed and daysAgo
function getDeterministicDate(seed: number, daysAgo: number): string {
  const date = new Date()
  const daysOffset = Math.floor((seed * 0.618) % daysAgo)
  date.setDate(date.getDate() - daysOffset)
  // Set to midnight to ensure consistency
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

// Helper to get seed from pickup ID
function getSeedFromId(id: string): number {
  // Convert ID to numeric seed (e.g., "pickup-1" -> 1)
  const match = id.match(/\d+/)
  return match ? parseInt(match[0], 10) : 1
}

// Dummy pickup data with deterministic dates
export const dummyPickups: DummyPickup[] = [
  {
    id: 'pickup-1',
    collectorId: 'collector-1',
    category: 'PET',
    estimatedWeight: 12.5,
    actualWeight: 13.2,
    status: 'paid',
    location: {
      type: 'Point',
      coordinates: getDeterministicCoords(getSeedFromId('pickup-1')),
      address: 'Gulshan-2, Dhaka'
    },
    photos: {
      before: {
        cloudinaryId: 'ekotaka/pickups/pickup-1/before',
        url: 'https://images.unsplash.com/photo-1619823046626-6e21193e274b?w=800&q=80'
      },
      after: {
        cloudinaryId: 'ekotaka/pickups/pickup-1/after',
        url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80'
      }
    },
    verification: {
      aiConfidence: 0.94,
      aiCategory: 'PET',
      aiWeight: 13.2,
      manualReview: false,
      verifiedBy: 'system',
      verifiedAt: getDeterministicDate(getSeedFromId('pickup-1') + 10, 2)
    },
    statusHistory: [
      { status: 'pending', timestamp: getDeterministicDate(getSeedFromId('pickup-1'), 5) },
      { status: 'verified', timestamp: getDeterministicDate(getSeedFromId('pickup-1') + 1, 4) },
      { status: 'paid', timestamp: getDeterministicDate(getSeedFromId('pickup-1') + 2, 3) }
    ],
    createdAt: getDeterministicDate(getSeedFromId('pickup-1'), 5),
    updatedAt: getDeterministicDate(getSeedFromId('pickup-1') + 2, 3)
  },
  {
    id: 'pickup-2',
    collectorId: 'collector-1',
    category: 'HDPE',
    estimatedWeight: 8.3,
    actualWeight: 8.7,
    status: 'verified',
    location: {
      type: 'Point',
      coordinates: getDeterministicCoords(getSeedFromId('pickup-2')),
      address: 'Dhanmondi, Dhaka'
    },
    photos: {
      before: {
        cloudinaryId: 'ekotaka/pickups/pickup-2/before',
        url: 'https://images.unsplash.com/photo-1621886293081-5347eb0b55d0?w=800&q=80'
      }
    },
    verification: {
      aiConfidence: 0.87,
      aiCategory: 'HDPE',
      aiWeight: 8.7,
      manualReview: false
    },
    statusHistory: [
      { status: 'pending', timestamp: getDeterministicDate(getSeedFromId('pickup-2'), 2) },
      { status: 'verified', timestamp: getDeterministicDate(getSeedFromId('pickup-2') + 1, 1) }
    ],
    createdAt: getDeterministicDate(getSeedFromId('pickup-2'), 2),
    updatedAt: getDeterministicDate(getSeedFromId('pickup-2') + 1, 1)
  },
  {
    id: 'pickup-3',
    collectorId: 'collector-1',
    category: 'PP',
    estimatedWeight: 15.0,
    status: 'pending',
    location: {
      type: 'Point',
      coordinates: getDeterministicCoords(getSeedFromId('pickup-3')),
      address: 'Uttara, Dhaka'
    },
    photos: {
      before: {
        cloudinaryId: 'ekotaka/pickups/pickup-3/before',
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80'
      }
    },
    statusHistory: [
      { status: 'pending', timestamp: getDeterministicDate(getSeedFromId('pickup-3'), 1) }
    ],
    createdAt: getDeterministicDate(getSeedFromId('pickup-3'), 1),
    updatedAt: getDeterministicDate(getSeedFromId('pickup-3'), 1)
  },
  {
    id: 'pickup-4',
    collectorId: 'collector-1',
    category: 'PET',
    estimatedWeight: 10.5,
    actualWeight: 11.0,
    status: 'paid',
    location: {
      type: 'Point',
      coordinates: getDeterministicCoords(getSeedFromId('pickup-4')),
      address: 'Banani, Dhaka'
    },
    photos: {
      before: {
        cloudinaryId: 'ekotaka/pickups/pickup-4/before',
        url: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80'
      },
      after: {
        cloudinaryId: 'ekotaka/pickups/pickup-4/after',
        url: 'https://images.unsplash.com/photo-1586616414352-0b8db93b3f54?w=800&q=80'
      }
    },
    verification: {
      aiConfidence: 0.91,
      aiCategory: 'PET',
      aiWeight: 11.0,
      manualReview: false
    },
    statusHistory: [
      { status: 'pending', timestamp: getDeterministicDate(getSeedFromId('pickup-4'), 7) },
      { status: 'verified', timestamp: getDeterministicDate(getSeedFromId('pickup-4') + 1, 6) },
      { status: 'paid', timestamp: getDeterministicDate(getSeedFromId('pickup-4') + 2, 5) }
    ],
    createdAt: getDeterministicDate(getSeedFromId('pickup-4'), 7),
    updatedAt: getDeterministicDate(getSeedFromId('pickup-4') + 2, 5)
  },
  {
    id: 'pickup-5',
    collectorId: 'collector-1',
    category: 'LDPE',
    estimatedWeight: 6.8,
    actualWeight: 7.1,
    status: 'paid',
    location: {
      type: 'Point',
      coordinates: getDeterministicCoords(getSeedFromId('pickup-5')),
      address: 'Mirpur, Dhaka'
    },
    photos: {
      before: {
        cloudinaryId: 'ekotaka/pickups/pickup-5/before',
        url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80'
      }
    },
    verification: {
      aiConfidence: 0.76,
      aiCategory: 'LDPE',
      aiWeight: 7.1,
      manualReview: true,
      verifiedBy: 'admin-1',
      verifiedAt: getDeterministicDate(getSeedFromId('pickup-5') + 10, 10)
    },
    statusHistory: [
      { status: 'pending', timestamp: getDeterministicDate(getSeedFromId('pickup-5'), 12) },
      { status: 'verified', timestamp: getDeterministicDate(getSeedFromId('pickup-5') + 1, 10) },
      { status: 'paid', timestamp: getDeterministicDate(getSeedFromId('pickup-5') + 2, 9) }
    ],
    createdAt: getDeterministicDate(getSeedFromId('pickup-5'), 12),
    updatedAt: getDeterministicDate(getSeedFromId('pickup-5') + 2, 9)
  },
  {
    id: 'pickup-6',
    collectorId: 'collector-1',
    category: 'HDPE',
    estimatedWeight: 9.2,
    status: 'rejected',
    location: {
      type: 'Point',
      coordinates: getDeterministicCoords(getSeedFromId('pickup-6')),
      address: 'Wari, Dhaka'
    },
    photos: {
      before: {
        cloudinaryId: 'ekotaka/pickups/pickup-6/before',
        url: 'https://images.unsplash.com/photo-1614977645540-7abd94ba6d60?w=800&q=80'
      }
    },
    verification: {
      aiConfidence: 0.45,
      aiCategory: 'Other',
      aiWeight: 5.0,
      manualReview: true
    },
    statusHistory: [
      { status: 'pending', timestamp: getDeterministicDate(getSeedFromId('pickup-6'), 15) },
      { status: 'rejected', timestamp: getDeterministicDate(getSeedFromId('pickup-6') + 1, 14), notes: 'Low quality, not suitable for recycling' }
    ],
    createdAt: getDeterministicDate(getSeedFromId('pickup-6'), 15),
    updatedAt: getDeterministicDate(getSeedFromId('pickup-6') + 1, 14)
  }
]

// Dummy transactions with deterministic dates
export const dummyTransactions: DummyTransaction[] = [
  {
    id: 'txn-1',
    pickupId: 'pickup-1',
    collectorId: 'collector-1',
    amount: 187.5,
    paymentMethod: 'bkash',
    transactionId: 'BKASH2024001',
    status: 'completed',
    initiatedAt: getDeterministicDate(getSeedFromId('txn-1'), 3),
    completedAt: getDeterministicDate(getSeedFromId('txn-1') + 1, 3)
  },
  {
    id: 'txn-2',
    pickupId: 'pickup-4',
    collectorId: 'collector-1',
    amount: 157.5,
    paymentMethod: 'nagad',
    transactionId: 'NAGAD2024001',
    status: 'completed',
    initiatedAt: getDeterministicDate(getSeedFromId('txn-2'), 5),
    completedAt: getDeterministicDate(getSeedFromId('txn-2') + 1, 5)
  },
  {
    id: 'txn-3',
    pickupId: 'pickup-5',
    collectorId: 'collector-1',
    amount: 106.5,
    paymentMethod: 'bkash',
    transactionId: 'BKASH2024002',
    status: 'completed',
    initiatedAt: getDeterministicDate(getSeedFromId('txn-3'), 9),
    completedAt: getDeterministicDate(getSeedFromId('txn-3') + 1, 9)
  },
  {
    id: 'txn-4',
    pickupId: 'pickup-2',
    collectorId: 'collector-1',
    amount: 130.5,
    paymentMethod: 'bkash',
    transactionId: 'BKASH2024003',
    status: 'pending',
    initiatedAt: getDeterministicDate(getSeedFromId('txn-4'), 1)
  }
]

// Dummy EkoTokens with deterministic dates
export const dummyEkoTokens: DummyEkoToken[] = [
  {
    id: 'token-1',
    userId: 'collector-1',
    amount: 50,
    source: 'pickup',
    pickupId: 'pickup-1',
    createdAt: getDeterministicDate(getSeedFromId('token-1'), 3)
  },
  {
    id: 'token-2',
    userId: 'collector-1',
    amount: 42,
    source: 'pickup',
    pickupId: 'pickup-4',
    createdAt: getDeterministicDate(getSeedFromId('token-2'), 5)
  },
  {
    id: 'token-3',
    userId: 'collector-1',
    amount: 30,
    source: 'pickup',
    pickupId: 'pickup-5',
    createdAt: getDeterministicDate(getSeedFromId('token-3'), 9)
  },
  {
    id: 'token-4',
    userId: 'collector-1',
    amount: 25,
    source: 'bonus',
    createdAt: getDeterministicDate(getSeedFromId('token-4'), 10)
  }
]

// Calculate collector stats from dummy data
export function getCollectorStats(): CollectorStats {
  const thisMonth = new Date()
  thisMonth.setDate(1) // Start of month
  
  const pickupsThisMonth = dummyPickups.filter(p => {
    const pickupDate = new Date(p.createdAt)
    return pickupDate >= thisMonth
  })

  const verifiedPickups = dummyPickups.filter(p => p.status === 'verified' || p.status === 'paid')
  const totalPickups = dummyPickups.length
  const verificationRate = totalPickups > 0 
    ? (verifiedPickups.length / totalPickups) * 100 
    : 0

  const totalEarnings = dummyTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  const pendingEarnings = dummyTransactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalEkoTokens = dummyEkoTokens
    .filter(t => !t.redeemedAt)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalWeightCollected = dummyPickups
    .filter(p => p.actualWeight)
    .reduce((sum, p) => sum + (p.actualWeight || 0), 0)

  // CO₂ saved calculation: 1 kg plastic ≈ 1.4 kg CO₂ saved
  const totalCO2Saved = totalWeightCollected * 1.4

  return {
    totalPickups,
    totalPickupsThisMonth: pickupsThisMonth.length,
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    pendingEarnings: Math.round(pendingEarnings * 100) / 100,
    ekoTokens: totalEkoTokens,
    verificationRate: Math.round(verificationRate * 100) / 100,
    totalWeightCollected: Math.round(totalWeightCollected * 100) / 100,
    totalCO2Saved: Math.round(totalCO2Saved * 100) / 100
  }
}

// Get recent pickups (last 5) - with stable sort
export function getRecentPickups(limit: number = 5): DummyPickup[] {
  return [...dummyPickups]
    .sort((a, b) => {
      // Primary sort: by date (descending)
      const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (dateDiff !== 0) return dateDiff
      // Secondary sort: by ID (for stability)
      return a.id.localeCompare(b.id)
    })
    .slice(0, limit)
}

// Get pickups by status
export function getPickupsByStatus(status: DummyPickup['status']): DummyPickup[] {
  return dummyPickups.filter(p => p.status === status)
}

// Get pickup by ID
export function getPickupById(id: string): DummyPickup | undefined {
  return dummyPickups.find(p => p.id === id)
}

// Get transactions for collector
export function getCollectorTransactions(): DummyTransaction[] {
  return [...dummyTransactions].sort(
    (a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime()
  )
}

// Get EkoTokens balance
export function getEkoTokensBalance(): number {
  return dummyEkoTokens
    .filter(t => !t.redeemedAt && (!t.expiresAt || new Date(t.expiresAt) > new Date()))
    .reduce((sum, t) => sum + t.amount, 0)
}

