'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Package,
  Weight,
  Leaf,
  Edit3,
  Save,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

interface CollectorProfile {
  userId: string
  personalInfo: {
    fullName?: string
    phone?: string
    address?: string
    profilePhoto?: {
      url: string
    }
    bio?: string
    email?: string
  }
  verification: {
    isVerified: boolean
    verificationLevel: string
  }
  stats: {
    totalPickups: number
    totalEarnings: number
    totalWeightCollected: number
    totalCO2Saved: number
    ekoTokens: number
    verificationRate: number
    memberSince: string
  }
  preferences: {
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    language: string
  }
  payment: {
    bkasNumber?: string
    nagadNumber?: string
    accountName?: string
  }
}

export default function ProfilePage() {
  const { user } = useUser()
  const [profile, setProfile] = useState<CollectorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    bio: '',
    bkasNumber: '',
    nagadNumber: '',
    accountName: '',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/collector/profile')

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      if (data.success && data.profile) {
        setProfile(data.profile)
        setFormData({
          fullName: data.profile.personalInfo.fullName || '',
          phone: data.profile.personalInfo.phone || '',
          address: data.profile.personalInfo.address || '',
          bio: data.profile.personalInfo.bio || '',
          bkasNumber: data.profile.payment.bkasNumber || '',
          nagadNumber: data.profile.payment.nagadNumber || '',
          accountName: data.profile.payment.accountName || '',
          emailNotifications: data.profile.preferences.notifications.email,
          pushNotifications: data.profile.preferences.notifications.push,
          smsNotifications: data.profile.preferences.notifications.sms,
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/collector/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalInfo: {
            fullName: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            bio: formData.bio,
          },
          preferences: {
            notifications: {
              email: formData.emailNotifications,
              push: formData.pushNotifications,
              sms: formData.smsNotifications,
            },
            language: 'en',
            currency: 'BDT',
          },
          payment: {
            bkasNumber: formData.bkasNumber,
            nagadNumber: formData.nagadNumber,
            accountName: formData.accountName,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await response.json()
      if (data.success) {
        setProfile(data.profile)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout title="Profile">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Failed to load profile</p>
            <Button onClick={fetchProfile} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Profile"
      action={
        !isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 -mt-16 pb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {user?.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt={profile.personalInfo.fullName || 'Profile'}
                      width={128}
                      height={128}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-4xl font-bold">
                      {profile.personalInfo.fullName?.charAt(0) || user?.firstName?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                {profile.verification.isVerified && (
                  <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-gray-900">
                    {profile.personalInfo.fullName || user?.fullName || 'Collector'}
                  </h1>
                  {profile.verification.isVerified && (
                    <Badge variant="default" className="bg-emerald-500">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{profile.personalInfo.bio || 'No bio yet'}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {profile.personalInfo.email || user?.primaryEmailAddress?.emailAddress}
                  </div>
                  {profile.personalInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {profile.personalInfo.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member since {format(new Date(profile.stats.memberSince), 'MMM yyyy')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm text-gray-600">Total Pickups</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{profile.stats.totalPickups}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      <span className="text-sm text-gray-600">Total Earnings</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">৳{profile.stats.totalEarnings.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Weight className="w-5 h-5 text-cyan-600" />
                      <span className="text-sm text-gray-600">Weight Collected</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{profile.stats.totalWeightCollected.toFixed(1)} kg</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-600">CO₂ Saved</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{profile.stats.totalCO2Saved.toFixed(1)} kg</p>
                  </div>
                  <Link href="/collector/tokens" className="block">
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span className="text-sm text-gray-600">EkoTokens</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900">{profile.stats.ekoTokens.toLocaleString()}</p>
                    </div>
                  </Link>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">Verification Rate</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{profile.stats.verificationRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 font-semibold text-gray-900">
                        {profile.personalInfo.fullName || 'Not set'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 font-semibold text-gray-900">
                        {profile.personalInfo.phone || 'Not set'}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 font-semibold text-gray-900">
                      {profile.personalInfo.address || 'Not set'}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">
                      {profile.personalInfo.bio || 'No bio yet'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bkasNumber">bKash Number</Label>
                    {isEditing ? (
                      <Input
                        id="bkasNumber"
                        value={formData.bkasNumber}
                        onChange={(e) => setFormData({ ...formData, bkasNumber: e.target.value })}
                        className="mt-1"
                        placeholder="01XXXXXXXXX"
                      />
                    ) : (
                      <p className="mt-1 font-semibold text-gray-900">
                        {profile.payment.bkasNumber || 'Not set'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="nagadNumber">Nagad Number</Label>
                    {isEditing ? (
                      <Input
                        id="nagadNumber"
                        value={formData.nagadNumber}
                        onChange={(e) => setFormData({ ...formData, nagadNumber: e.target.value })}
                        className="mt-1"
                        placeholder="01XXXXXXXXX"
                      />
                    ) : (
                      <p className="mt-1 font-semibold text-gray-900">
                        {profile.payment.nagadNumber || 'Not set'}
                      </p>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      className="mt-1"
                      placeholder="Name on account"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preferences Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotif">Email Notifications</Label>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      id="emailNotif"
                      checked={formData.emailNotifications}
                      onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600"
                    />
                  ) : (
                    <Badge variant={profile.preferences.notifications.email ? 'default' : 'secondary'}>
                      {profile.preferences.notifications.email ? 'On' : 'Off'}
                    </Badge>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushNotif">Push Notifications</Label>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      id="pushNotif"
                      checked={formData.pushNotifications}
                      onChange={(e) => setFormData({ ...formData, pushNotifications: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600"
                    />
                  ) : (
                    <Badge variant={profile.preferences.notifications.push ? 'default' : 'secondary'}>
                      {profile.preferences.notifications.push ? 'On' : 'Off'}
                    </Badge>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="smsNotif">SMS Notifications</Label>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      id="smsNotif"
                      checked={formData.smsNotifications}
                      onChange={(e) => setFormData({ ...formData, smsNotifications: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600"
                    />
                  ) : (
                    <Badge variant={profile.preferences.notifications.sms ? 'default' : 'secondary'}>
                      {profile.preferences.notifications.sms ? 'On' : 'Off'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

