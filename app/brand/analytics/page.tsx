'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import BrandLayout from '@/components/layouts/BrandLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Leaf,
  BarChart3,
  Calendar,
  Filter,
  PieChart,
  Activity,
  ShoppingCart,
  Award,
} from 'lucide-react'
import { format, subMonths } from 'date-fns'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface AnalyticsData {
  summary: {
    totalOrders: number
    completedOrders: number
    totalSpent: number
    totalWeightPurchased: number
    averageOrderValue: number
    activeOrders: number
  }
  spendingTrends: Array<{
    date: string
    amount: number
    count: number
  }>
  categoryBreakdown: Array<{
    category: string
    weight: number
    orders: number
    amount: number
  }>
  purchaseVolume: Array<{
    date: string
    weight: number
    count: number
  }>
  topCollectors: Array<{
    collectorId: string
    collectorName: string
    orders: number
    totalAmount: number
    totalWeight: number
  }>
  co2Impact: {
    totalCO2Saved: number
    totalWeightPurchased: number
    averageCO2PerKg: number
  }
  dateRange: {
    start: string
    end: string
  }
  period: string
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']
const CATEGORY_COLORS: Record<string, string> = {
  PET: '#3b82f6',
  HDPE: '#10b981',
  LDPE: '#8b5cf6',
  PP: '#f59e0b',
  PS: '#ef4444',
  Other: '#06b6d4',
}

export default function BrandAnalyticsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 12), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/sign-in')
      return
    }

    if (user.role !== 'brand') {
      router.push('/collector/dashboard')
      return
    }

    fetchAnalytics()
  }, [authLoading, user, router, period, dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        period,
        startDate: dateRange.start,
        endDate: dateRange.end,
      })

      const response = await fetch(`/api/brand/analytics?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      if (data.success) {
        setAnalytics(data.analytics)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const resetDateRange = () => {
    setDateRange({
      start: format(subMonths(new Date(), 12), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd'),
    })
  }

  // Format data for charts
  const spendingChartData = analytics?.spendingTrends.map((t) => ({
    date: period === 'monthly' 
      ? format(new Date(t.date + '-01'), 'MMM yyyy')
      : period === 'weekly'
      ? format(new Date(t.date), 'MMM d')
      : format(new Date(t.date), 'MMM d'),
    amount: Math.round(t.amount),
    orders: t.count,
  })) || []

  const volumeChartData = analytics?.purchaseVolume.map((v) => ({
    date: period === 'monthly'
      ? format(new Date(v.date + '-01'), 'MMM yyyy')
      : period === 'weekly'
      ? format(new Date(v.date), 'MMM d')
      : format(new Date(v.date), 'MMM d'),
    weight: Math.round(v.weight * 10) / 10,
    orders: v.count,
  })) || []

  const pieChartData = analytics?.categoryBreakdown.map((c) => ({
    name: c.category,
    value: c.weight,
    amount: c.amount,
    orders: c.orders,
  })) || []

  const collectorsChartData = analytics?.topCollectors.slice(0, 5).map((c, idx) => ({
    name: c.collectorName.length > 15 ? c.collectorName.substring(0, 15) + '...' : c.collectorName,
    amount: Math.round(c.totalAmount),
    orders: c.orders,
  })) || []

  if (authLoading || !user) {
    return (
      <BrandLayout title="Analytics">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </BrandLayout>
    )
  }

  return (
    <BrandLayout title="Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Visual insights into your purchasing patterns and impact</p>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Period</label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Start Date</label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">End Date</label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={resetDateRange}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchAnalytics}>Try Again</Button>
            </CardContent>
          </Card>
        ) : analytics ? (
          <>
            {/* Hero Stats Section - Integrated Design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 lg:p-12 text-white"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '40px 40px'
                }}></div>
              </div>
              
              <div className="relative">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-8">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black mb-2">Performance Overview</h2>
                    <p className="text-blue-100 text-sm lg:text-base">Key metrics at a glance</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-100">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(analytics.dateRange.start), 'MMM d')} - {format(new Date(analytics.dateRange.end), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-100 text-sm">
                      <DollarSign className="w-4 h-4" />
                      <span>Total Spent</span>
                    </div>
                    <p className="text-3xl lg:text-4xl font-black">{analytics.summary.totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-blue-200">{analytics.summary.completedOrders} completed</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-100 text-sm">
                      <ShoppingCart className="w-4 h-4" />
                      <span>Total Orders</span>
                    </div>
                    <p className="text-3xl lg:text-4xl font-black">{analytics.summary.totalOrders}</p>
                    <p className="text-xs text-blue-200">{analytics.summary.activeOrders} active</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-100 text-sm">
                      <Package className="w-4 h-4" />
                      <span>Weight</span>
                    </div>
                    <p className="text-3xl lg:text-4xl font-black">{analytics.summary.totalWeightPurchased.toFixed(1)}</p>
                    <p className="text-xs text-blue-200">kg recycled</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-100 text-sm">
                      <Leaf className="w-4 h-4" />
                      <span>CO₂ Saved</span>
                    </div>
                    <p className="text-3xl lg:text-4xl font-black">{analytics.co2Impact.totalCO2Saved.toFixed(1)}</p>
                    <p className="text-xs text-blue-200">kg impact</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spending Trends - Line Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Spending Trends</h3>
                        <p className="text-sm text-gray-600">Amount spent over time</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    {spendingChartData.length === 0 ? (
                      <div className="h-80 flex items-center justify-center text-gray-400">
                        <p>No spending data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={spendingChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `৳${value}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                            formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Amount']}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 5 }}
                            activeDot={{ r: 7 }}
                            name="Amount Spent"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Purchase Volume - Area Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Purchase Volume</h3>
                        <p className="text-sm text-gray-600">Weight purchased over time</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    {volumeChartData.length === 0 ? (
                      <div className="h-80 flex items-center justify-center text-gray-400">
                        <p>No volume data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={volumeChartData}>
                          <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}kg`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                            formatter={(value: number) => [`${value} kg`, 'Weight']}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="weight"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorWeight)"
                            name="Weight (kg)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Category Breakdown - Pie Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Category Breakdown</h3>
                        <p className="text-sm text-gray-600">Purchases by plastic type</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                    {pieChartData.length === 0 ? (
                      <div className="h-80 flex items-center justify-center text-gray-400">
                        <p>No category data available</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <ResponsiveContainer width="100%" height={280}>
                          <RechartsPieChart>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              }}
                              formatter={(value: number, name: string, props: any) => [
                                `${value} kg (৳${props.payload.amount.toLocaleString()})`,
                                name,
                              ]}
                            />
                            <Legend />
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                          </RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-3">
                          {pieChartData.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: CATEGORY_COLORS[item.name] || COLORS[index % COLORS.length] }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.value.toFixed(1)} kg</p>
                              </div>
                              <p className="text-xs font-semibold text-gray-700">৳{item.amount.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Top Collectors - Bar Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Top Collectors</h3>
                        <p className="text-sm text-gray-600">Your most frequent suppliers</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                    </div>
                    {collectorsChartData.length === 0 ? (
                      <div className="h-80 flex items-center justify-center text-gray-400">
                        <p>No collector data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={collectorsChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            width={100}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                            formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Total Spent']}
                          />
                          <Legend />
                          <Bar dataKey="amount" fill="#6366f1" radius={[0, 8, 8, 0]} name="Total Spent (৳)" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Secondary Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CO₂ Impact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="lg:col-span-2"
              >
                <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                        <Leaf className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Environmental Impact</h3>
                        <p className="text-sm text-gray-600">Your contribution to sustainability</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                        <p className="text-4xl font-black text-emerald-600 mb-2">
                          {analytics.co2Impact.totalCO2Saved.toFixed(1)}
                        </p>
                        <p className="text-sm font-semibold text-gray-700">kg CO₂ Saved</p>
                        <p className="text-xs text-gray-500 mt-1">Equivalent to planting trees</p>
                      </div>
                      <div className="text-center p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                        <p className="text-4xl font-black text-emerald-600 mb-2">
                          {analytics.co2Impact.totalWeightPurchased.toFixed(1)}
                        </p>
                        <p className="text-sm font-semibold text-gray-700">kg Recycled</p>
                        <p className="text-xs text-gray-500 mt-1">Plastic diverted from waste</p>
                      </div>
                      <div className="text-center p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                        <p className="text-4xl font-black text-emerald-600 mb-2">
                          {analytics.co2Impact.averageCO2PerKg.toFixed(1)}
                        </p>
                        <p className="text-sm font-semibold text-gray-700">kg CO₂/kg</p>
                        <p className="text-xs text-gray-500 mt-1">Average impact per kg</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Order Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Order Statistics</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Average Order Value</p>
                        <p className="text-2xl font-bold text-gray-900">৳{analytics.summary.averageOrderValue.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.summary.totalOrders > 0
                            ? ((analytics.summary.completedOrders / analytics.summary.totalOrders) * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Active Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.summary.activeOrders}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        ) : null}
      </div>
    </BrandLayout>
  )
}
