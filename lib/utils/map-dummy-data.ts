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
    // Gulshan Area
    {
      address: 'Gulshan-2, Dhaka',
      coords: [90.4212, 23.7895] as [number, number],
    },
    {
      address: 'Gulshan-1, Dhaka',
      coords: [90.4125, 23.7950] as [number, number],
    },
    {
      address: 'Banani, Dhaka',
      coords: [90.4050, 23.7944] as [number, number],
    },
    {
      address: 'Banani DOHS, Dhaka',
      coords: [90.4000, 23.7900] as [number, number],
    },
    {
      address: 'Niketon, Gulshan, Dhaka',
      coords: [90.4180, 23.7850] as [number, number],
    },
    
    // Dhanmondi Area
    {
      address: 'Dhanmondi, Dhaka',
      coords: [90.3687, 23.7465] as [number, number],
    },
    {
      address: 'Dhanmondi 27, Dhaka',
      coords: [90.3700, 23.7450] as [number, number],
    },
    {
      address: 'Dhanmondi 32, Dhaka',
      coords: [90.3650, 23.7480] as [number, number],
    },
    {
      address: 'Sobhanbag, Dhanmondi, Dhaka',
      coords: [90.3620, 23.7420] as [number, number],
    },
    
    // Uttara Area
    {
      address: 'Uttara Sector 7, Dhaka',
      coords: [90.3874, 23.8714] as [number, number],
    },
    {
      address: 'Uttara Sector 3, Dhaka',
      coords: [90.3850, 23.8650] as [number, number],
    },
    {
      address: 'Uttara Sector 9, Dhaka',
      coords: [90.3900, 23.8750] as [number, number],
    },
    {
      address: 'Uttara Sector 11, Dhaka',
      coords: [90.3750, 23.8800] as [number, number],
    },
    {
      address: 'Uttara Sector 1, Dhaka',
      coords: [90.3800, 23.8600] as [number, number],
    },
    
    // Mirpur Area
    {
      address: 'Mirpur-1, Dhaka',
      coords: [90.3625, 23.8068] as [number, number],
    },
    {
      address: 'Mirpur-2, Dhaka',
      coords: [90.3650, 23.8100] as [number, number],
    },
    {
      address: 'Mirpur-10, Dhaka',
      coords: [90.3550, 23.8200] as [number, number],
    },
    {
      address: 'Mirpur-12, Dhaka',
      coords: [90.3500, 23.8250] as [number, number],
    },
    {
      address: 'Mirpur-14, Dhaka',
      coords: [90.3450, 23.8300] as [number, number],
    },
    
    // Mohakhali & Tejgaon Area
    {
      address: 'Mohakhali, Dhaka',
      coords: [90.3988, 23.7803] as [number, number],
    },
    {
      address: 'Tejgaon Industrial Area, Dhaka',
      coords: [90.3988, 23.7600] as [number, number],
    },
    {
      address: 'Tejgaon, Dhaka',
      coords: [90.4000, 23.7650] as [number, number],
    },
    {
      address: 'Farmgate, Dhaka',
      coords: [90.3850, 23.7550] as [number, number],
    },
    {
      address: 'Kawran Bazar, Dhaka',
      coords: [90.3900, 23.7500] as [number, number],
    },
    
    // Old Dhaka Area
    {
      address: 'Wari, Old Dhaka',
      coords: [90.3996, 23.7099] as [number, number],
    },
    {
      address: 'Lalbagh, Old Dhaka',
      coords: [90.3950, 23.7150] as [number, number],
    },
    {
      address: 'Banga Bazar, Old Dhaka',
      coords: [90.4000, 23.7200] as [number, number],
    },
    {
      address: 'Shankhari Bazar, Old Dhaka',
      coords: [90.3950, 23.7100] as [number, number],
    },
    
    // Rampura & Bashundhara Area
    {
      address: 'Rampura, Dhaka',
      coords: [90.4250, 23.7650] as [number, number],
    },
    {
      address: 'Bashundhara R/A, Dhaka',
      coords: [90.4300, 23.8150] as [number, number],
    },
    {
      address: 'Bashundhara Block A, Dhaka',
      coords: [90.4320, 23.8120] as [number, number],
    },
    {
      address: 'Bashundhara Block B, Dhaka',
      coords: [90.4280, 23.8180] as [number, number],
    },
    
    // Motijheel & Paltan Area
    {
      address: 'Motijheel, Dhaka',
      coords: [90.4200, 23.7300] as [number, number],
    },
    {
      address: 'Paltan, Dhaka',
      coords: [90.4100, 23.7350] as [number, number],
    },
    {
      address: 'Gulistan, Dhaka',
      coords: [90.4150, 23.7200] as [number, number],
    },
    
    // Mohammadpur Area
    {
      address: 'Mohammadpur, Dhaka',
      coords: [90.3600, 23.7650] as [number, number],
    },
    {
      address: 'Adabor, Mohammadpur, Dhaka',
      coords: [90.3550, 23.7600] as [number, number],
    },
    {
      address: 'Shyamoli, Mohammadpur, Dhaka',
      coords: [90.3500, 23.7700] as [number, number],
    },
    
    // Additional Areas
    {
      address: 'Rampura Bridge, Dhaka',
      coords: [90.4220, 23.7680] as [number, number],
    },
    {
      address: 'Malibagh, Dhaka',
      coords: [90.4150, 23.7550] as [number, number],
    },
    {
      address: 'Khilgaon, Dhaka',
      coords: [90.4250, 23.7500] as [number, number],
    },
    {
      address: 'Shantinagar, Dhaka',
      coords: [90.4100, 23.7400] as [number, number],
    },
    {
      address: 'Kamalapur, Dhaka',
      coords: [90.4300, 23.7250] as [number, number],
    },
    {
      address: 'Bijoy Nagar, Dhaka',
      coords: [90.4080, 23.7450] as [number, number],
    },
    {
      address: 'Banasree, Dhaka',
      coords: [90.4350, 23.7950] as [number, number],
    },
    {
      address: 'Badda, Dhaka',
      coords: [90.4300, 23.7900] as [number, number],
    },
    {
      address: 'Baridhara, Dhaka',
      coords: [90.4280, 23.8000] as [number, number],
    },
    {
      address: 'Nikunja-2, Dhaka',
      coords: [90.4250, 23.8050] as [number, number],
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

