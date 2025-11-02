// Dummy data generator for map hotspots with rich collection information
// This provides realistic collection point data for testing the map

export interface CollectionInfo {
  id: string
  location: {
    coordinates: [number, number]
    address: string
  }
  wasteDetails: {
    totalWeight: number
    categories: {
      PET?: number
      HDPE?: number
      LDPE?: number
      PP?: number
      PS?: number
      Other?: number
    }
  }
  collectionInstructions: {
    bestTimeToCollect: string // "Early morning", "Evening", "Anytime"
    accessMethod: string // "Public area", "Contact owner", "Permit required"
    contactInfo?: {
      name?: string
      phone?: string
      notes?: string
    }
    specialInstructions?: string
    estimatedValue: number // in BDT
  }
  status: 'active' | 'depleted' | 'high-demand'
  reportedAt: string
  lastCollected?: string
  collectionCount: number
  photos?: string[]
}

// Generate dummy collection points with detailed info
export function generateDummyCollectionPoints(): CollectionInfo[] {
  const locations = [
    {
      address: 'Gulshan-2, Dhaka',
      coords: [90.4212, 23.7895] as [number, number],
    },
    {
      address: 'Banani, Dhaka',
      coords: [90.4050, 23.7944] as [number, number],
    },
    {
      address: 'Dhanmondi, Dhaka',
      coords: [90.3687, 23.7465] as [number, number],
    },
    {
      address: 'Uttara Sector 7, Dhaka',
      coords: [90.3874, 23.8714] as [number, number],
    },
    {
      address: 'Mohakhali, Dhaka',
      coords: [90.3988, 23.7803] as [number, number],
    },
    {
      address: 'Mirpur-1, Dhaka',
      coords: [90.3625, 23.8068] as [number, number],
    },
    {
      address: 'Wari, Old Dhaka',
      coords: [90.3996, 23.7099] as [number, number],
    },
    {
      address: 'Tejgaon Industrial Area, Dhaka',
      coords: [90.3988, 23.7600] as [number, number],
    },
  ]

  const categories = ['PET', 'HDPE', 'LDPE', 'PP', 'PS', 'Other']
  const bestTimes = ['Early morning (6-9 AM)', 'Evening (5-8 PM)', 'Anytime']
  const accessMethods = [
    'Public area - No permission needed',
    'Contact building manager',
    'Call before visiting',
    'Permission required',
  ]

  return locations.map((loc, index) => {
    const weight = 5 + Math.random() * 45 // 5-50 kg
    const categoryDist: any = {}
    
    // Randomly distribute weight across 1-3 categories
    const numCategories = Math.floor(Math.random() * 3) + 1
    const selectedCategories = categories
      .sort(() => Math.random() - 0.5)
      .slice(0, numCategories)

    selectedCategories.forEach((cat, i) => {
      if (i === selectedCategories.length - 1) {
        categoryDist[cat] = weight / numCategories
      } else {
        const portion = weight / numCategories * (0.7 + Math.random() * 0.6)
        categoryDist[cat] = portion
      }
    })

    // Calculate estimated value (৳20-40 per kg)
    const estimatedValue = weight * (20 + Math.random() * 20)

    return {
      id: `collection-${index + 1}`,
      location: {
        coordinates: loc.coords,
        address: loc.address,
      },
      wasteDetails: {
        totalWeight: Math.round(weight * 10) / 10,
        categories: categoryDist,
      },
      collectionInstructions: {
        bestTimeToCollect: bestTimes[Math.floor(Math.random() * bestTimes.length)],
        accessMethod: accessMethods[Math.floor(Math.random() * accessMethods.length)],
        contactInfo:
          Math.random() > 0.5
            ? {
                name: `Contact Person ${index + 1}`,
                phone: `01${Math.floor(100000000 + Math.random() * 900000000)}`,
                notes: 'Available during business hours',
              }
            : undefined,
        specialInstructions:
          Math.random() > 0.6
            ? 'Use side entrance. Wear safety gloves. Bring collection bags.'
            : undefined,
        estimatedValue: Math.round(estimatedValue),
      },
      status: Math.random() > 0.7 ? 'high-demand' : 'active',
      reportedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastCollected:
        Math.random() > 0.4
          ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      collectionCount: Math.floor(Math.random() * 5),
      photos: [],
    }
  })
}

