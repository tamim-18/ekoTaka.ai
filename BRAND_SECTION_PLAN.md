# 🏢 Brand Section Implementation Plan

## 📋 Overview
Complete brand-side features to enable brands to browse, purchase, and manage plastic collections from collectors.

---

## 🎯 Phase 1: Database Models & Backend Foundation

### Task 1.1: Create BrandProfile Model ⚠️ HIGH PRIORITY
**Status:** Pending  
**Files to create:**
- `lib/models/BrandProfile.ts`

**Fields:**
- `userId` (reference to User)
- `companyName`
- `companyType` (manufacturer, recycler, brand)
- `contactInfo` (address, phone, email)
- `businessLicense`
- `verification` (isVerified, verificationLevel)
- `preferences` (notifications, currency, language)
- `stats` (totalPurchases, totalSpent, activeOrders, etc.)

**Estimated Time:** 1 hour

---

### Task 1.2: Create Order Model ⚠️ HIGH PRIORITY
**Status:** Pending  
**Files to create:**
- `lib/models/Order.ts`

**Fields:**
- `orderId` (unique identifier)
- `brandId` (reference to User)
- `collectorId` (reference to User)
- `pickupId` (reference to Pickup)
- `quantity` (weight in kg)
- `unitPrice` (price per kg)
- `totalAmount`
- `status` (pending, confirmed, processing, shipped, delivered, cancelled)
- `orderDate`
- `deliveryDate`
- `paymentStatus` (pending, paid, refunded)
- `shippingAddress`
- `notes`

**Estimated Time:** 1 hour

---

### Task 1.3: Update Transaction Model for Brands
**Status:** Pending  
**Files to modify:**
- `lib/models/Transaction.ts`

**Changes:**
- Add `brandId` field (optional, for brand-initiated payments)
- Keep `collectorId` (required)
- Update indexes to support brand queries

**Estimated Time:** 30 minutes

---

### Task 1.4: Create Message/Conversation Models ⚠️ MEDIUM PRIORITY
**Status:** Pending  
**Files to create:**
- `lib/models/Conversation.ts`
- `lib/models/Message.ts`

**Conversation Fields:**
- `participants` [brandId, collectorId]
- `lastMessage` (reference to Message)
- `lastMessageAt`
- `unreadCount` (by participant)

**Message Fields:**
- `conversationId` (reference to Conversation)
- `senderId` (User ID)
- `senderRole` ('brand' | 'collector')
- `content` (text)
- `readAt` (date)
- `createdAt`

**Estimated Time:** 1.5 hours

---

## 🎯 Phase 2: API Endpoints

### Task 2.1: Brand Profile API ⚠️ HIGH PRIORITY
**Status:** Pending  
**Files to create:**
- `app/api/brand/profile/route.ts` (GET, PUT)

**Endpoints:**
- `GET /api/brand/profile` - Get brand profile
- `PUT /api/brand/profile` - Update brand profile

**Estimated Time:** 1 hour

---

### Task 2.2: Brand Inventory API ⚠️ HIGH PRIORITY
**Status:** Pending  
**Files to create:**
- `app/api/brand/inventory/route.ts` (GET)

**Endpoints:**
- `GET /api/brand/inventory` - Get available plastic collections
  - Query params: category, minWeight, maxWeight, location, sortBy, page, limit
  - Returns: List of verified pickups available for purchase

**Estimated Time:** 2 hours

---

### Task 2.3: Order Management API ⚠️ HIGH PRIORITY
**Status:** Pending  
**Files to create:**
- `app/api/brand/orders/route.ts` (GET, POST)
- `app/api/brand/orders/[id]/route.ts` (GET, PUT, DELETE)

**Endpoints:**
- `GET /api/brand/orders` - List orders (with filters)
- `POST /api/brand/orders` - Create new order
- `GET /api/brand/orders/[id]` - Get order details
- `PUT /api/brand/orders/[id]` - Update order (status, etc.)
- `DELETE /api/brand/orders/[id]` - Cancel order

**Estimated Time:** 3 hours

---

### Task 2.4: Brand Transactions API
**Status:** Pending  
**Files to create:**
- `app/api/brand/transactions/route.ts` (GET)

**Endpoints:**
- `GET /api/brand/transactions` - Get payment history
  - Query params: status, startDate, endDate, page, limit

**Estimated Time:** 1.5 hours

---

### Task 2.5: Brand Analytics API
**Status:** Pending  
**Files to create:**
- `app/api/brand/analytics/route.ts` (GET)

**Endpoints:**
- `GET /api/brand/analytics` - Get analytics data
  - Returns: Spending trends, purchase history, category breakdown, etc.

**Estimated Time:** 2 hours

---

### Task 2.6: Messaging API ⚠️ MEDIUM PRIORITY
**Status:** Pending  
**Files to create:**
- `app/api/brand/messages/conversations/route.ts` (GET, POST)
- `app/api/brand/messages/conversations/[id]/route.ts` (GET)
- `app/api/brand/messages/conversations/[id]/messages/route.ts` (GET, POST)

**Endpoints:**
- `GET /api/brand/messages/conversations` - List conversations
- `POST /api/brand/messages/conversations` - Start new conversation
- `GET /api/brand/messages/conversations/[id]` - Get conversation details
- `GET /api/brand/messages/conversations/[id]/messages` - Get messages
- `POST /api/brand/messages/conversations/[id]/messages` - Send message

**Estimated Time:** 3 hours

---

## 🎯 Phase 3: Frontend Pages

### Task 3.1: Brand Dashboard (Enhancement)
**Status:** Partial (mock data exists)  
**Files to modify:**
- `app/brand/dashboard/page.tsx`

**Tasks:**
- Connect to real API endpoints
- Show real stats (available plastic, orders, spending)
- Add recent orders section
- Add quick actions

**Estimated Time:** 2 hours

---

### Task 3.2: Brand Inventory Page ⚠️ HIGH PRIORITY
**Status:** Pending  
**Files to create:**
- `app/brand/inventory/page.tsx`

**Features:**
- Grid/list view of available plastic collections
- Filters (category, weight range, location, verification status)
- Search functionality
- Sort options (price, weight, date)
- Card view with pickup details, photos, collector info
- "Request Purchase" button on each item
- Pagination

**Estimated Time:** 4 hours

---

### Task 3.3: Brand Orders Page ⚠️ HIGH PRIORITY
**Status:** Pending  
**Files to create:**
- `app/brand/orders/page.tsx`
- `app/brand/orders/[id]/page.tsx` (Order detail page)

**Features:**
- List of all orders (pending, confirmed, processing, delivered, cancelled)
- Filter by status
- Order cards with key info
- Order detail page with full information
- Status updates
- Cancel order functionality
- Payment status tracking

**Estimated Time:** 5 hours

---

### Task 3.4: Brand Transactions Page
**Status:** Pending  
**Files to create:**
- `app/brand/transactions/page.tsx`

**Features:**
- Transaction history table/list
- Filters (status, date range, payment method)
- Export functionality (CSV)
- Summary stats (total spent, pending payments, etc.)
- Transaction details modal/card

**Estimated Time:** 3 hours

---

### Task 3.5: Brand Analytics Page
**Status:** Pending  
**Files to create:**
- `app/brand/analytics/page.tsx`

**Features:**
- Spending trends chart (line chart)
- Category breakdown (pie chart)
- Purchase volume over time
- Top collectors
- CO₂ impact visualization
- Date range selector
- Export reports

**Estimated Time:** 4 hours

---

### Task 3.6: Brand Profile Page
**Status:** Pending  
**Files to create:**
- `app/brand/profile/page.tsx`

**Features:**
- Company information form
- Verification status
- Business license upload
- Contact information
- Notification preferences
- Statistics display

**Estimated Time:** 3 hours

---

### Task 3.7: Brand Messaging Page ⚠️ MEDIUM PRIORITY
**Status:** Pending  
**Files to create:**
- `app/brand/messages/page.tsx`
- `app/brand/messages/[conversationId]/page.tsx`

**Features:**
- Conversation list sidebar
- Message thread view
- Send message input
- Read/unread indicators
- Start new conversation button
- Search conversations

**Estimated Time:** 5 hours

---

## 🎯 Phase 4: Payment Integration

### Task 4.1: Dummy Payment Gateway Simulation ⚠️ HIGH PRIORITY
**Status:** Pending  
**Files to create:**
- `lib/services/payment-simulator.ts`
- `app/api/brand/payments/initiate/route.ts`
- `app/api/brand/payments/confirm/route.ts`

**Features:**
- Simulate payment initiation
- Generate fake transaction IDs
- Simulate payment confirmation flow
- Update order and transaction status

**Estimated Time:** 2 hours

---

## 📊 Implementation Priority

### 🔴 CRITICAL (Week 1)
1. **Task 1.1** - BrandProfile Model
2. **Task 1.2** - Order Model
3. **Task 1.3** - Update Transaction Model
4. **Task 2.1** - Brand Profile API
5. **Task 2.2** - Brand Inventory API
6. **Task 2.3** - Order Management API
7. **Task 3.2** - Brand Inventory Page
8. **Task 3.3** - Brand Orders Page
9. **Task 3.1** - Brand Dashboard Enhancement
10. **Task 4.1** - Payment Simulator

### 🟡 HIGH PRIORITY (Week 2)
11. **Task 2.4** - Brand Transactions API
12. **Task 2.5** - Brand Analytics API
13. **Task 3.4** - Brand Transactions Page
14. **Task 3.5** - Brand Analytics Page
15. **Task 3.6** - Brand Profile Page

### 🟢 MEDIUM PRIORITY (Week 3)
16. **Task 1.4** - Message/Conversation Models
17. **Task 2.6** - Messaging API
18. **Task 3.7** - Brand Messaging Page

---

## 📝 Notes

### Key Considerations:
1. **Authentication:** All APIs must use `getCurrentUser()` and verify brand role
2. **Data Privacy:** Brands should only see verified/available pickups
3. **Order Flow:** 
   - Brand browses inventory → Creates order → Payment → Order confirmed → Collector ships → Delivered
4. **Payment Flow:**
   - Brand initiates payment → Payment simulator processes → Transaction completed → Order status updated
5. **Messaging:**
   - Messages initiated by either party
   - No real-time (polling or manual refresh)
   - Conversation persists in database

### Dependencies:
- All brand pages depend on BrandProfile model
- Orders depend on Pickup model (verified pickups)
- Transactions depend on Order model
- Analytics depend on Orders and Transactions
- Messaging is independent but enhances UX

---

## ✅ Completion Tracking

**Total Tasks:** 18  
**Critical Path:** 10 tasks  
**Estimated Total Time:** ~45 hours

**Next Step:** Start with Task 1.1 (BrandProfile Model)

