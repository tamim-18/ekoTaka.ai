'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import { getDashboardUrl } from '@/lib/utils/role-checker'

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/sign-in')
      return
    }

    // Redirect based on role
    const dashboardUrl = getDashboardUrl(user.role)
    router.push(dashboardUrl)
  }, [loading, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-emerald-50/20">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}

