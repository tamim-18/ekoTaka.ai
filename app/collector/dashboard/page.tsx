'use client'

import { motion } from 'framer-motion'
import { PlusCircle, Sparkles, TrendingUp, Activity, Zap, Target } from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import ModernStatCard from '@/components/collector/ModernStatCard'
import FloatingActionCard from '@/components/collector/FloatingActionCard'
import EnhancedPickupCard from '@/components/collector/EnhancedPickupCard'
import ImpactMeter from '@/components/collector/ImpactMeter'
import ActivityChart from '@/components/collector/ActivityChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCollectorStats, getRecentPickups } from '@/lib/dummy-data'

export default function CollectorDashboard() {
  const stats = getCollectorStats()
  const recentPickups = getRecentPickups(5)
  
  // Mock weekly activity data with sparklines for stats
  const weeklyActivity = [12, 19, 15, 22, 18, 24, 20]
  const earningsSparkline = [150, 180, 165, 200, 190, 220, 210]
  const pickupsSparkline = [3, 5, 4, 6, 5, 7, 6]
  const tokensSparkline = [40, 45, 42, 50, 48, 55, 52]

  return (
    <DashboardLayout 
      title="Dashboard"
      action={
        <Link href="/collector/pickups/new">
          <Button className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Pickup
          </Button>
        </Link>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 md:p-12 text-white shadow-2xl"
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <h1 className="text-4xl md:text-5xl font-black mb-3">Welcome back! 👋</h1>
              <p className="text-lg md:text-xl text-emerald-50/90">Your dedication is transforming waste into value.</p>
            </motion.div>
            
            {/* Quick goal progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-6 border-t border-white/20"
            >
              <div className="flex items-center gap-4 flex-1 w-full">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <Target className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Monthly Goal Progress</span>
                    <span className="text-sm font-bold">{stats.totalPickupsThisMonth} / 50</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.totalPickupsThisMonth / 50) * 100, 100)}%` }}
                      transition={{ delay: 0.5, duration: 1, type: "spring" }}
                      className="h-full bg-white rounded-full shadow-lg"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">{((stats.totalPickupsThisMonth / 50) * 100).toFixed(0)}% Complete</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid - Modern 3D Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <ModernStatCard
            title="Total Pickups"
            value={stats.totalPickups}
            icon={Activity}
            trend={{
              value: 15,
              label: 'vs last month',
              isPositive: true
            }}
            gradient="from-emerald-500 via-teal-500 to-cyan-500"
            iconGradient="from-emerald-400 to-teal-400"
            sparklineData={pickupsSparkline}
            delay={0.1}
          />
          
          <ModernStatCard
            title="Total Earnings"
            value={`৳${stats.totalEarnings.toLocaleString()}`}
            icon={TrendingUp}
            trend={{
              value: 22,
              label: 'vs last month',
              isPositive: true
            }}
            gradient="from-teal-500 via-cyan-500 to-blue-500"
            iconGradient="from-teal-400 to-cyan-400"
            sparklineData={earningsSparkline}
            delay={0.2}
          />
          
          <ModernStatCard
            title="EkoTokens"
            value={stats.ekoTokens}
            icon={Sparkles}
            gradient="from-cyan-500 via-blue-500 to-indigo-500"
            iconGradient="from-cyan-400 to-blue-400"
            sparklineData={tokensSparkline}
            delay={0.3}
          />
          
          <ModernStatCard
            title="Verification Rate"
            value={`${stats.verificationRate}%`}
            icon={Target}
            gradient="from-emerald-500 via-green-500 to-lime-500"
            iconGradient="from-emerald-400 to-green-400"
            delay={0.4}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Actions & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="border-2 border-emerald-100/50 shadow-xl overflow-hidden bg-gradient-to-br from-white to-emerald-50/20">
              <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-b border-emerald-100/50 pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-black text-gray-900">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <FloatingActionCard
                    icon={PlusCircle}
                    title="New Pickup"
                    description="Submit your plastic waste collection for instant verification"
                    href="/collector/pickups/new"
                    gradient="from-emerald-500 via-emerald-600 to-teal-600"
                    delay={0.1}
                  />
                  
                  <FloatingActionCard
                    icon={Activity}
                    title="View All"
                    description="Browse your complete pickup history and track progress"
                    href="/collector/pickups"
                    gradient="from-teal-500 via-teal-600 to-cyan-600"
                    delay={0.2}
                  />
                  
                  <FloatingActionCard
                    icon={TrendingUp}
                    title="Payments"
                    description="View transactions, earnings, and payment history"
                    href="/collector/payments"
                    gradient="from-cyan-500 via-cyan-600 to-blue-600"
                    delay={0.3}
                  />
                  
                  <FloatingActionCard
                    icon={Target}
                    title="Map View"
                    description="Discover collection points and optimize your routes"
                    href="/collector/map"
                    gradient="from-blue-500 via-blue-600 to-indigo-600"
                    delay={0.4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Weekly Activity Chart */}
            <Card className="border-2 border-emerald-100/50 shadow-xl bg-gradient-to-br from-white to-emerald-50/20">
              <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-b border-emerald-100/50">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-3 text-2xl font-black text-gray-900">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    Weekly Activity
                  </span>
                  <span className="text-sm font-semibold text-gray-500">Last 7 days</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ActivityChart data={weeklyActivity} color="emerald" />
              </CardContent>
            </Card>
          </div>

          {/* Right: Impact Meter */}
          <ImpactMeter
            weight={stats.totalWeightCollected}
            co2={stats.totalCO2Saved}
            pendingEarnings={stats.pendingEarnings}
          />
        </div>

        {/* Recent Pickups Section */}
        <Card className="border-2 border-emerald-100/50 shadow-xl overflow-hidden bg-gradient-to-br from-white to-emerald-50/20">
          <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-b border-emerald-100/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-gray-900">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                Recent Pickups
              </CardTitle>
              <Link href="/collector/pickups">
                <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-semibold">
                  View All
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {recentPickups.length > 0 ? (
              <div className="space-y-4">
                {recentPickups.map((pickup, index) => (
                  <EnhancedPickupCard key={pickup.id} pickup={pickup} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center"
                >
                  <Activity className="w-12 h-12 text-emerald-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No pickups yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start your journey by submitting your first plastic waste collection
                </p>
                <Link href="/collector/pickups/new">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create First Pickup
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
