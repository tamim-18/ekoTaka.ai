'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PlusCircle, Sparkles, TrendingUp, Activity, Zap, Target, Loader2, Package, Map, Wallet, ArrowRight, Calendar, Weight, Leaf, DollarSign, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import TokenBalanceCard from '@/components/collector/TokenBalanceCard'
import { Button } from '@/components/ui/button'
import { getCollectorStats } from '@/lib/dummy-data'
import { format, isToday, isYesterday } from 'date-fns'
import Image from 'next/image'

interface RecentPickup {
  id: string
  category: string
  estimatedWeight: number
  actualWeight?: number
  status: 'pending' | 'verified' | 'rejected' | 'paid'
  location: {
    coordinates: [number, number]
    address?: string
  }
  photos: {
    before: { url: string }
    after?: { url: string }
  }
  verification?: {
    aiConfidence: number
    aiCategory: string
    aiWeight: number
    manualReview: boolean
  }
  createdAt: string
}

export default function CollectorDashboard() {
  const stats = getCollectorStats()
  const [recentPickups, setRecentPickups] = useState<RecentPickup[]>([])
  const [loadingPickups, setLoadingPickups] = useState(true)
  const [tokenData, setTokenData] = useState<{
    balance: number
    monthlyEarned: number
    nextMilestone: any
    recentTransactions: any[]
  } | null>(null)
  const [loadingTokens, setLoadingTokens] = useState(true)
  
  useEffect(() => {
    fetchTokenData()
  }, [])

  useEffect(() => {
    fetchRecentPickups()
  }, [])

  const fetchTokenData = async () => {
    try {
      setLoadingTokens(true)
      const response = await fetch('/api/collector/tokens')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTokenData({
            balance: data.balance || 0,
            monthlyEarned: data.monthlyEarned || 0,
            nextMilestone: data.nextMilestone,
            recentTransactions: data.recentTransactions || [],
          })
        }
      }
    } catch (error) {
      console.error('Error fetching token data:', error)
    } finally {
      setLoadingTokens(false)
    }
  }

  const fetchRecentPickups = async () => {
    try {
      setLoadingPickups(true)
      const response = await fetch('/api/pickups?limit=5&page=1')
      
      if (!response.ok) {
        console.error('Failed to fetch recent pickups')
        return
      }
      
      const data = await response.json()
      
      if (data.success && data.pickups) {
        const formattedPickups: RecentPickup[] = data.pickups.map((pickup: any) => ({
          id: pickup.id,
          category: pickup.category,
          estimatedWeight: pickup.estimatedWeight,
          actualWeight: pickup.actualWeight,
          status: pickup.status,
          location: {
            coordinates: pickup.location.coordinates,
            address: pickup.location.address,
          },
          photos: {
            before: { url: pickup.photos.before.url },
            after: pickup.photos.after ? { url: pickup.photos.after.url } : undefined,
          },
          verification: pickup.verification ? {
            aiConfidence: pickup.verification.aiConfidence,
            aiCategory: pickup.verification.aiCategory,
            aiWeight: pickup.verification.aiWeight,
            manualReview: pickup.verification.manualReview || false,
          } : undefined,
          createdAt: pickup.createdAt,
        }))
        
        setRecentPickups(formattedPickups)
      }
    } catch (error) {
      console.error('Error fetching recent pickups:', error)
    } finally {
      setLoadingPickups(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM dd')
  }

  return (
    <DashboardLayout 
      title="Dashboard"
      action={
        <Link href="/collector/pickups/new">
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Pickup
          </Button>
        </Link>
      }
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section - Organic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          {/* Organic blob background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -80, 0],
                y: [0, -60, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
                delay: 0.5
              }}
              className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-3xl"
            />
          </div>

          <div className="relative z-10 flex items-start justify-between gap-8 flex-wrap">
            <div className="flex-1">
              <h1 className="text-5xl font-black text-gray-900 mb-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Welcome back! 👋
              </h1>
              <p className="text-xl text-gray-600">Here's what's happening with your collections</p>
            </div>
            
            {/* Floating Goal Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className="relative px-8 py-6 rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-emerald-100/50"
            >
              <div className="flex items-center gap-5">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg"
                >
                  <Target className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly Goal</div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-gray-900">{stats.totalPickupsThisMonth}</span>
                    <span className="text-lg text-gray-500">/ 50</span>
                  </div>
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.totalPickupsThisMonth / 50) * 100, 100)}%` }}
                      transition={{ delay: 0.5, duration: 1, type: "spring" }}
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats - Floating Pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FloatingStat
            icon={Activity}
            label="Total Pickups"
            value={stats.totalPickups}
            trend={15}
            gradient="from-emerald-500 to-teal-500"
            delay={0.1}
          />
          <FloatingStat
            icon={TrendingUp}
            label="Total Earnings"
            value={`৳${stats.totalEarnings.toLocaleString()}`}
            trend={22}
            gradient="from-teal-500 to-cyan-500"
            delay={0.2}
          />
          <Link href="/collector/tokens" className="block">
            <FloatingStat
              icon={Sparkles}
              label="EkoTokens"
              value={loadingTokens ? '...' : (tokenData?.balance || 0).toLocaleString()}
              gradient="from-cyan-500 to-blue-500"
              delay={0.3}
            />
          </Link>
          <FloatingStat
            icon={Target}
            label="Verification Rate"
            value={`${stats.verificationRate}%`}
            gradient="from-emerald-500 to-green-500"
            delay={0.4}
          />
        </div>

        {/* Token Balance - Prominent */}
        {tokenData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/collector/tokens">
              <TokenBalanceCard
                balance={tokenData.balance}
                monthlyEarned={tokenData.monthlyEarned}
                nextMilestone={tokenData.nextMilestone}
                isLoading={loadingTokens}
              />
            </Link>
          </motion.div>
        )}

        {/* Main Content - Creative Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Recent Activity */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick Actions - Organic Flow */}
            <div className="relative">
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: PlusCircle, label: 'New Pickup', href: '/collector/pickups/new', color: 'emerald' },
                  { icon: Package, label: 'My Pickups', href: '/collector/pickups', color: 'teal' },
                  { icon: Wallet, label: 'Payments', href: '/collector/payments', color: 'cyan' },
                  { icon: Map, label: 'Map View', href: '/collector/map', color: 'blue' },
                ].map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Link key={action.href} href={action.href}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileHover={{ scale: 1.05, y: -4 }}
                        className="group relative px-6 py-4 rounded-2xl bg-white hover:shadow-2xl transition-all cursor-pointer overflow-hidden"
                      >
                        {/* Gradient blob background */}
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br from-${action.color}-500/10 to-${action.color}-600/5 opacity-0 group-hover:opacity-100 transition-opacity`}
                          style={{
                            background: action.color === 'emerald' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(20, 184, 166, 0.05))' :
                              action.color === 'teal' ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(6, 182, 212, 0.05))' :
                              action.color === 'cyan' ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(37, 99, 235, 0.05))' :
                              'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(67, 56, 202, 0.05))'
                          }}
                        />
                        <div className="relative z-10 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                            action.color === 'emerald' ? 'from-emerald-500 to-emerald-600' :
                            action.color === 'teal' ? 'from-teal-500 to-teal-600' :
                            action.color === 'cyan' ? 'from-cyan-500 to-cyan-600' :
                            'from-blue-500 to-blue-600'
                          } flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="font-black text-gray-900 text-lg">{action.label}</span>
                          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all ml-auto" />
                        </div>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Recent Pickups - Flowing List */}
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  Recent Pickups
                </h2>
                <Link href="/collector/pickups">
                  <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              {loadingPickups ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : recentPickups.length > 0 ? (
                <div className="space-y-4">
                  {recentPickups.map((pickup, index) => (
                    <PickupFlowItem key={pickup.id} pickup={pickup} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 rounded-3xl bg-gradient-to-br from-emerald-50/50 to-teal-50/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/20 to-teal-100/20 blur-3xl" />
                  <div className="relative z-10">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <Package className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No pickups yet</h3>
                    <p className="text-gray-600 mb-6">Start by creating your first pickup</p>
                    <Link href="/collector/pickups/new">
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Create First Pickup
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Impact Metrics - Vertical Flow */}
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              Your Impact
            </h2>
            <div className="space-y-4">
              <ImpactMetric
                icon={Weight}
                label="Weight Collected"
                value={stats.totalWeightCollected.toFixed(1)}
                unit="kg"
                gradient="from-emerald-500 to-emerald-600"
                delay={0.1}
              />
              <ImpactMetric
                icon={Leaf}
                label="CO₂ Saved"
                value={stats.totalCO2Saved.toFixed(1)}
                unit="kg"
                gradient="from-teal-500 to-teal-600"
                delay={0.2}
              />
              <ImpactMetric
                icon={DollarSign}
                label="Pending Earnings"
                value={stats.pendingEarnings.toLocaleString()}
                unit="৳"
                gradient="from-cyan-500 to-cyan-600"
                delay={0.3}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Floating Stat Component
function FloatingStat({ icon: Icon, label, value, trend, gradient, delay }: {
  icon: any
  label: string
  value: string | number
  trend?: number
  gradient: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative group"
    >
      <div className="relative p-6 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all border border-gray-100/50 overflow-hidden">
        {/* Animated gradient blob */}
        <motion.div
          className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
              <motion.p
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.1 }}
                className="text-4xl font-black text-gray-900 leading-none"
              >
                {value}
              </motion.p>
            </div>
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
            >
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
          </div>
          
          {trend && (
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
              <span>{trend}%</span>
              <span className="text-gray-400 font-normal text-xs">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Flow Pickup Item
function PickupFlowItem({ pickup, index }: { pickup: RecentPickup; index: number }) {
  const statusConfig: Record<string, { color: string; dot: string; icon: any; bg: string }> = {
    pending: { color: 'text-yellow-600', dot: 'bg-yellow-500', icon: Clock, bg: 'bg-yellow-50' },
    verified: { color: 'text-blue-600', dot: 'bg-blue-500', icon: CheckCircle2, bg: 'bg-blue-50' },
    rejected: { color: 'text-red-600', dot: 'bg-red-500', icon: Clock, bg: 'bg-red-50' },
    paid: { color: 'text-emerald-600', dot: 'bg-emerald-500', icon: CheckCircle2, bg: 'bg-emerald-50' },
  }

  const config = statusConfig[pickup.status] || statusConfig.pending
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, type: "spring" }}
      whileHover={{ x: 8 }}
    >
      <Link href={`/collector/pickups/${pickup.id}`}>
        <div className="group relative flex items-center gap-5 p-5 rounded-3xl bg-white/80 backdrop-blur-xl hover:bg-white transition-all cursor-pointer shadow-md hover:shadow-xl border border-gray-100/50 hover:border-emerald-200 overflow-hidden">
          {/* Flowing gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-50/0 via-teal-50/0 to-cyan-50/0 group-hover:from-emerald-50/50 group-hover:via-teal-50/50 group-hover:to-cyan-50/50 transition-all"
            initial={false}
          />
          
          {/* Photo with organic shape */}
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg group-hover:shadow-xl transition-all z-10">
            <Image
              src={pickup.photos.before.url}
              alt={pickup.category}
              fill
              className="object-cover group-hover:scale-125 transition-transform duration-500"
              unoptimized
            />
            <div className={`absolute top-2 right-2 w-4 h-4 rounded-full ${config.dot} border-2 border-white shadow-md`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-xl text-gray-900">{pickup.category}</h3>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${config.bg} border border-transparent`}>
                <StatusIcon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-xs font-bold uppercase ${config.color}`}>
                  {pickup.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-5 text-sm text-gray-600">
              <span className="flex items-center gap-2 font-semibold">
                <Weight className="w-4 h-4 text-emerald-500" />
                {pickup.actualWeight || pickup.estimatedWeight} kg
              </span>
              <span className="flex items-center gap-2 min-w-0">
                <Map className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="truncate max-w-[200px]">{pickup.location.address?.split(',')[0] || 'Location not available'}</span>
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDate(pickup.createdAt)}
              </span>
            </div>
          </div>

          <motion.div
            whileHover={{ x: 5 }}
            className="z-10"
          >
            <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-emerald-600 transition-colors" />
          </motion.div>
        </div>
      </Link>
    </motion.div>
  )
}

// Impact Metric Component
function ImpactMetric({ icon: Icon, label, value, unit, gradient, delay }: {
  icon: any
  label: string
  value: string
  unit: string
  gradient: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring" }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl p-6 hover:shadow-xl transition-all border border-gray-100/50"
    >
      {/* Animated blob */}
      <motion.div
        className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity`}
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <div className="relative z-10 flex items-center gap-5">
        <motion.div
          whileHover={{ rotate: [0, -15, 15, 0], scale: 1.1 }}
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-600 mb-2">{label}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{value}</span>
            <span className="text-sm text-gray-500">{unit}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM dd')
}
