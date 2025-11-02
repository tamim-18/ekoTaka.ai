# EkoTaka Design Analysis: Profile & Map View

## 1. PROFILE SECTION ANALYSIS

### Current State:
- Authentication: Clerk (provides basic user info)
- No dedicated collector profile model in database
- Profile data is currently fetched from Clerk

### Requirements:
1. **Collector Profile Data**:
   - Personal info (name, email, phone, address)
   - Profile photo
   - Verification status
   - Member since date
   - Collector rating/rank

2. **Statistics Dashboard**:
   - Total pickups
   - Total earnings
   - Total weight collected
   - CO2 saved
   - EkoTokens balance
   - Verification rate
   - Monthly/yearly trends

3. **Settings**:
   - Notification preferences
   - Payment methods (bKash/Nagad numbers)
   - Language preferences
   - Privacy settings

### Database Schema Design:

```typescript
CollectorProfile {
  userId: string (Clerk ID - unique index)
  personalInfo: {
    fullName: string
    phone?: string
    address?: string
    profilePhoto?: { cloudinaryId, url }
    bio?: string
  }
  verification: {
    isVerified: boolean
    verifiedAt?: Date
    verificationLevel: 'basic' | 'verified' | 'premium'
    documents?: Array<{ type: string, url: string }>
  }
  stats: {
    totalPickups: number
    totalEarnings: number
    totalWeightCollected: number
    totalCO2Saved: number
    ekoTokens: number
    verificationRate: number
    memberSince: Date
  }
  preferences: {
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    language: 'en' | 'bn'
    currency: 'BDT'
  }
  payment: {
    bkasNumber?: string
    nagadNumber?: string
    accountName?: string
  }
  createdAt: Date
  updatedAt: Date
}
```

### Approach:
- **Option A**: Store minimal data, calculate stats from Pickup collection (recommended)
- **Option B**: Store all stats, update on each pickup (more efficient queries, but requires updates)

**Recommendation**: Option A with cached stats that update periodically
- Calculate stats from Pickups collection for accuracy
- Cache stats in CollectorProfile for performance
- Update cache via background job or on-demand

---

## 2. MAP VIEW ANALYSIS

### Requirements:
1. **Show Plastic Waste Locations**:
   - Where plastic waste is available for collection
   - Real-time availability status
   - Estimated waste quantity/type

2. **Dynamic Updates**:
   - When collector creates pickup → location becomes "collected" or "reduced"
   - When new waste is reported → new hotspot appears
   - Time-based decay (old hotspots fade if not collected)

### Solution Options:

#### **Option 1: Use Existing Pickup Data (Simple)**
**Pros**: No new schema, uses existing data
**Cons**: Shows where waste WAS, not where it IS
- Show recent pickups (last 7-30 days) as "historical hotspots"
- Problem: Doesn't indicate current availability

#### **Option 2: Create WasteHotspot Model (Recommended)**
**Pros**: Clear separation, better UX, real availability tracking
**Cons**: Requires new schema and logic

**Schema Design:**
```typescript
WasteHotspot {
  location: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
    address: string
  }
  status: 'active' | 'depleted' | 'expired'
  estimatedAvailable: {
    totalWeight: number (kg)
    categories: {
      PET?: number
      HDPE?: number
      LDPE?: number
      PP?: number
      PS?: number
      Other?: number
    }
  }
  reportedBy: string (collectorId who reported)
  reportedAt: Date
  lastUpdated: Date
  lastCollectedAt?: Date
  collectionHistory: Array<{
    collectorId: string
    pickupId: string
    weight: number
    collectedAt: Date
  }>
  metadata: {
    description?: string
    photos?: Array<{ url: string }>
    accessInstructions?: string
    reportedBy?: 'collector' | 'authority' | 'brand'
  }
  createdAt: Date
  updatedAt: Date
}
```

#### **Option 3: Hybrid Approach (Best for MVP)**
Combine both:
1. **WasteHotspot** for reported/known waste locations
2. **Recent Pickups** as "proven collection points" (last 14 days)

### Map Update Logic:

**When Collector Creates Pickup:**
1. Check if hotspot exists within X meters (e.g., 50m) of pickup location
2. If exists:
   - Update hotspot: reduce `estimatedAvailable.weight`
   - Add to `collectionHistory`
   - Update `lastCollectedAt`
   - If weight reaches 0 or below → mark as `depleted`
3. If not exists:
   - Create new hotspot from pickup location (suggests waste is there)
   - Set initial weight based on pickup weight

**When Collector Reports New Location:**
1. Collector can manually report waste location via map
2. Create new hotspot with reported details

**Auto-Expiry:**
- Hotspots older than 30 days without updates → mark as `expired`
- Depleted hotspots older than 7 days → remove from active map

### Map Display Logic:

**Markers on Map:**
1. **Active Hotspots** (Green):
   - Currently available waste
   - Show estimated weight
   - Click to see details

2. **Recent Collections** (Blue):
   - Last 14 days pickups
   - Indicates "proven location"
   - May have more waste available

3. **Depleted** (Grey):
   - Recently collected (last 7 days)
   - Might refill soon

**Marker Clustering:**
- Group nearby hotspots (within 100m)
- Show count in cluster
- Zoom in to see individual markers

---

## 3. IMPLEMENTATION PLAN

### Phase 1: Profile Section
1. Create `CollectorProfile` model
2. Create API endpoints:
   - GET `/api/collector/profile` - Get profile
   - PUT `/api/collector/profile` - Update profile
   - GET `/api/collector/stats` - Get stats (calculated from pickups)
3. Create profile page UI
4. Auto-create profile on first login

### Phase 2: Map View - Schema
1. Create `WasteHotspot` model
2. Create indexes:
   - Geospatial index on location.coordinates
   - Index on status
   - Index on lastUpdated

### Phase 3: Map View - Backend
1. API endpoints:
   - GET `/api/map/hotspots` - Get all active hotspots (with geospatial query)
   - POST `/api/map/report` - Report new waste location
   - POST `/api/map/update-from-pickup` - Called when pickup created (can be integrated into pickup creation)
   - GET `/api/map/nearby` - Get hotspots within radius (for optimization)

### Phase 4: Map View - Frontend
1. Google Maps integration
2. Markers for hotspots
3. Info windows with details
4. Report waste location feature
5. Real-time updates (polling or WebSocket)

### Phase 5: Integration
1. Update pickup creation to trigger hotspot updates
2. Background job for hotspot expiry
3. Stats calculation optimization

---

## 4. DECISIONS NEEDED

### Decision 1: Hotspot Creation Strategy
- **A**: Auto-create from every pickup (aggressive)
- **B**: Only create from pickups > threshold weight (e.g., >5kg)
- **C**: Manual reporting + auto-create for large pickups

**Recommendation**: **Option C** - Best balance

### Decision 2: Stats Calculation
- **A**: Calculate on-demand from Pickups collection
- **B**: Cache in CollectorProfile, update on each pickup
- **C**: Background job updates cache periodically

**Recommendation**: **Option B** for MVP, **Option C** for scale

### Decision 3: Map Update Frequency
- **A**: Real-time (WebSocket/Polling every 30s)
- **B**: On page load + manual refresh
- **C**: On page load + auto-refresh every 2-5 minutes

**Recommendation**: **Option C** for MVP

---

## 5. TECHNICAL CONSIDERATIONS

### Geospatial Queries:
- Use MongoDB's `$near` or `$geoWithin` for location-based queries
- Index: `2dsphere` on `location.coordinates`
- Query radius: Configurable (default 5km)

### Performance:
- Limit hotspot queries to active ones only
- Use pagination for large areas
- Cluster markers on frontend (react-google-maps/clusterer)

### Privacy:
- Don't show collector IDs publicly
- Aggregate collection history
- Option to hide exact coordinates (show approximate)

---

## NEXT STEPS:
1. ✅ Review and approve design
2. Create database schemas
3. Implement profile section
4. Implement map view backend
5. Implement map view frontend
6. Integrate with pickup creation
7. Testing and optimization

