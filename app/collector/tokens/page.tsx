'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Filter, Award, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import TokenBalanceCard from '@/components/collector/TokenBalanceCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format, isToday, isYesterday } from 'date-fns'

interface TokenTransaction {
  id: string
  amount: number
  type: 'earned' | 'redeemed' | 'bonus' | 'penalty' | 'expired'
  source: string
  description: string
  metadata?: any
  createdAt: string
}

interface TokenData {
  balance: number
  nextMilestone: {
    milestone: string
    tokens: number
    description: string
    progress: number
    current: number
    target: number
  } | null
  monthlyEarned: number
  recentTransactions: TokenTransaction[]
}

export default function TokensPage() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [history, setHistory] = useState<TokenTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    type: 'all',
    source: 'all',
  })

  useEffect(() => {
    fetchTokenData()
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [page, filters])

  const handleSeedData = async () => {
    try {
      const response = await fetch('/api/collector/tokens/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 30 }),
      })
      if (response.ok) {
        fetchTokenData()
        fetchHistory()
      }
    } catch (error) {
      console.error('Error seeding data:', error)
    }
  }

  const fetchTokenData = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      })
      if (filters.type && filters.type !== 'all') params.append('type', filters.type)
      if (filters.source && filters.source !== 'all') params.append('source', filters.source)

      const response = await fetch(`/api/collector/tokens/history?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHistory(data.transactions)
          setTotalPages(data.pagination.totalPages)
        }
      }
    } catch (error) {
      console.error('Error fetching token history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM dd, yyyy')
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'pickup_verification':
        return '📦'
      case 'milestone':
        return '🏆'
      case 'bonus':
        return '🎁'
      default:
        return '✨'
    }
  }

  return (
    <DashboardLayout title="EkoTokens">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Token Balance Card */}
        {tokenData && (
          <div className="relative">
            <TokenBalanceCard
              balance={tokenData.balance}
              monthlyEarned={tokenData.monthlyEarned}
              nextMilestone={tokenData.nextMilestone}
              isLoading={loading}
            />
            {/* Seed Button */}
            {tokenData.balance === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-3 right-3 z-10"
              >
                <Button
                  onClick={handleSeedData}
                  size="sm"
                  className="h-8 px-3 text-xs bg-white/95 backdrop-blur-sm border border-white/30 hover:bg-white shadow-md text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Generate Demo
                </Button>
              </motion.div>
            )}
          </div>
        )}

        {/* Transaction History */}
        <Card className="border border-emerald-100/50 shadow-lg bg-white/50 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* Filters - Compact */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-100/50">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select
                value={filters.type}
                onValueChange={(value) => {
                  setFilters({ ...filters, type: value })
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[130px] h-9 bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="earned">Earned</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.source}
                onValueChange={(value) => {
                  setFilters({ ...filters, source: value })
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[160px] h-9 bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="pickup_verification">Pickups</SelectItem>
                  <SelectItem value="milestone">Milestones</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transactions List */}
            {loadingHistory ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : history.length > 0 ? (
              <>
                <div className="space-y-2">
                  {history.map((transaction, index) => {
                    const isEarned = transaction.amount > 0
                    const isMilestone = transaction.source === 'milestone'
                    
                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200"
                      >
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                          isMilestone 
                            ? 'bg-gradient-to-br from-yellow-100 to-orange-100' 
                            : isEarned
                            ? 'bg-gradient-to-br from-emerald-50 to-teal-50'
                            : 'bg-gradient-to-br from-blue-50 to-cyan-50'
                        }`}>
                          {isMilestone ? '🏆' : getSourceIcon(transaction.source)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {transaction.description}
                            </h4>
                            {isMilestone && (
                              <Award className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="flex-shrink-0 text-right">
                          <div className={`flex items-center gap-1 text-lg font-black ${
                            isEarned ? 'text-emerald-600' : 'text-blue-600'
                          }`}>
                            {isEarned ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                            {Math.abs(transaction.amount).toLocaleString()}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Pagination - Minimal */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500 px-3">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-8"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center"
                >
                  <Sparkles className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-sm text-gray-500">
                  Start earning tokens by verifying pickups!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
