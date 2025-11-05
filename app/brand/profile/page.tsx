'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import BrandLayout from '@/components/layouts/BrandLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
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
  DollarSign,
  CheckCircle2,
  Globe,
  FileText,
  CreditCard,
  Bell,
  Settings,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface BrandProfile {
  userId: string
  companyInfo: {
    companyName: string
    companyType: 'manufacturer' | 'recycler' | 'brand' | 'other'
    businessLicense?: string
    taxId?: string
    website?: string
    logo?: {
      cloudinaryId: string
      url: string
    }
    description?: string
  }
  contactInfo: {
    email: string
    phone?: string
    address?: {
      street: string
      city: string
      district: string
      postalCode?: string
      country: string
    }
    contactPerson?: string
    contactPersonRole?: string
  }
  verification: {
    isVerified: boolean
    verifiedAt?: string
    verificationLevel: 'basic' | 'verified' | 'premium'
    documents?: Array<{
      type: string
      url: string
      uploadedAt: string
    }>
    verificationNotes?: string
  }
  stats: {
    totalPurchases: number
    totalSpent: number
    activeOrders: number
    completedOrders: number
    cancelledOrders: number
    totalWeightPurchased: number
    totalCO2Impact: number
    averageOrderValue: number
    memberSince: string
    lastStatsUpdate: string
  }
  preferences: {
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    language: 'en' | 'bn'
    currency: string
    preferredCategories?: string[]
    preferredLocations?: string[]
    autoOrderConfirmation?: boolean
  }
  billing?: {
    billingAddress?: {
      street: string
      city: string
      district: string
      postalCode?: string
      country: string
    }
    paymentMethods?: Array<{
      type: 'bkash' | 'nagad' | 'bank_transfer' | 'card'
      details: string
      isDefault: boolean
    }>
  }
  createdAt: string
  updatedAt: string
}

export default function BrandProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'company' | 'contact' | 'billing' | 'preferences'>('company')
  
  const [formData, setFormData] = useState({
    // Company Info
    companyName: '',
    companyType: 'brand' as 'manufacturer' | 'recycler' | 'brand' | 'other',
    businessLicense: '',
    taxId: '',
    website: '',
    description: '',
    // Contact Info
    phone: '',
    street: '',
    city: '',
    district: '',
    postalCode: '',
    country: 'Bangladesh',
    contactPerson: '',
    contactPersonRole: '',
    // Billing
    billingStreet: '',
    billingCity: '',
    billingDistrict: '',
    billingPostalCode: '',
    billingCountry: 'Bangladesh',
    // Preferences
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    language: 'en' as 'en' | 'bn',
    currency: 'BDT',
    autoOrderConfirmation: false,
  })

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'brand')) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'brand') {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/brand/profile')
      const data = await response.json()
      if (data.success) {
        setProfile(data.profile)
        // Populate form data
        setFormData({
          companyName: data.profile.companyInfo?.companyName || '',
          companyType: data.profile.companyInfo?.companyType || 'brand',
          businessLicense: data.profile.companyInfo?.businessLicense || '',
          taxId: data.profile.companyInfo?.taxId || '',
          website: data.profile.companyInfo?.website || '',
          description: data.profile.companyInfo?.description || '',
          phone: data.profile.contactInfo?.phone || '',
          street: data.profile.contactInfo?.address?.street || '',
          city: data.profile.contactInfo?.address?.city || '',
          district: data.profile.contactInfo?.address?.district || '',
          postalCode: data.profile.contactInfo?.address?.postalCode || '',
          country: data.profile.contactInfo?.address?.country || 'Bangladesh',
          contactPerson: data.profile.contactInfo?.contactPerson || '',
          contactPersonRole: data.profile.contactInfo?.contactPersonRole || '',
          billingStreet: data.profile.billing?.billingAddress?.street || '',
          billingCity: data.profile.billing?.billingAddress?.city || '',
          billingDistrict: data.profile.billing?.billingAddress?.district || '',
          billingPostalCode: data.profile.billing?.billingAddress?.postalCode || '',
          billingCountry: data.profile.billing?.billingAddress?.country || 'Bangladesh',
          emailNotifications: data.profile.preferences?.notifications?.email ?? true,
          pushNotifications: data.profile.preferences?.notifications?.push ?? true,
          smsNotifications: data.profile.preferences?.notifications?.sms ?? false,
          language: data.profile.preferences?.language || 'en',
          currency: data.profile.preferences?.currency || 'BDT',
          autoOrderConfirmation: data.profile.preferences?.autoOrderConfirmation ?? false,
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const updateData: any = {}
      
      if (activeTab === 'company') {
        updateData.companyInfo = {
          companyName: formData.companyName,
          companyType: formData.companyType,
          businessLicense: formData.businessLicense || undefined,
          taxId: formData.taxId || undefined,
          website: formData.website || undefined,
          description: formData.description || undefined,
        }
      } else if (activeTab === 'contact') {
        updateData.contactInfo = {
          email: profile?.contactInfo.email || user?.email,
          phone: formData.phone || undefined,
          address: {
            street: formData.street,
            city: formData.city,
            district: formData.district,
            postalCode: formData.postalCode || undefined,
            country: formData.country,
          },
          contactPerson: formData.contactPerson || undefined,
          contactPersonRole: formData.contactPersonRole || undefined,
        }
      } else if (activeTab === 'billing') {
        updateData.billing = {
          billingAddress: {
            street: formData.billingStreet,
            city: formData.billingCity,
            district: formData.billingDistrict,
            postalCode: formData.billingPostalCode || undefined,
            country: formData.billingCountry,
          },
        }
      } else if (activeTab === 'preferences') {
        updateData.preferences = {
          notifications: {
            email: formData.emailNotifications,
            push: formData.pushNotifications,
            sms: formData.smsNotifications,
          },
          language: formData.language,
          currency: formData.currency,
          autoOrderConfirmation: formData.autoOrderConfirmation,
        }
      }

      const response = await fetch('/api/brand/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()
      if (data.success) {
        setProfile(data.profile)
        setIsEditing(false)
        toast.success('Profile updated successfully')
        fetchProfile() // Refresh to get updated stats
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading || !user || user.role !== 'brand') {
    return (
      <BrandLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </BrandLayout>
    )
  }

  if (!profile) {
    return (
      <BrandLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Failed to load profile</p>
        </div>
      </BrandLayout>
    )
  }

  return (
    <BrandLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Brand Profile</h1>
            <p className="text-gray-500 mt-1">Manage your company information and settings</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="bg-emerald-500 hover:bg-emerald-600">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Purchases</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.stats.totalPurchases}</p>
                </div>
                <Package className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">৳{profile.stats.totalSpent.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Weight Purchased</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.stats.totalWeightPurchased.toFixed(1)} kg</p>
                </div>
                <Weight className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">CO₂ Impact</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.stats.totalCO2Impact.toFixed(1)} kg</p>
                </div>
                <Leaf className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 border-b">
              <button
                onClick={() => setActiveTab('company')}
                className={`pb-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'company'
                    ? 'border-emerald-500 text-emerald-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building2 className="h-4 w-4 inline mr-2" />
                Company Info
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`pb-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'contact'
                    ? 'border-emerald-500 text-emerald-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapPin className="h-4 w-4 inline mr-2" />
                Contact Info
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`pb-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'billing'
                    ? 'border-emerald-500 text-emerald-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CreditCard className="h-4 w-4 inline mr-2" />
                Billing
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`pb-4 px-2 border-b-2 transition-colors ${
                  activeTab === 'preferences'
                    ? 'border-emerald-500 text-emerald-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Preferences
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Company Info Tab */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Company Information</h3>
                    <p className="text-sm text-gray-500">Update your company details</p>
                  </div>
                  {profile.verification.isVerified && (
                    <Badge className="bg-emerald-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyType">Company Type *</Label>
                    <select
                      id="companyType"
                      value={formData.companyType}
                      onChange={(e) => setFormData({ ...formData, companyType: e.target.value as any })}
                      disabled={!isEditing}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    >
                      <option value="brand">Brand</option>
                      <option value="manufacturer">Manufacturer</option>
                      <option value="recycler">Recycler</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="businessLicense">Business License</Label>
                    <Input
                      id="businessLicense"
                      value={formData.businessLicense}
                      onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                      rows={4}
                      placeholder="Tell us about your company..."
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Contact Info Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.contactInfo.email}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPersonRole">Contact Person Role</Label>
                    <Input
                      id="contactPersonRole"
                      value={formData.contactPersonRole}
                      onChange={(e) => setFormData({ ...formData, contactPersonRole: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="e.g., Manager, Owner"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
                  <p className="text-sm text-gray-500 mb-4">This address will be used for invoices and receipts</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="billingStreet">Street Address</Label>
                    <Input
                      id="billingStreet"
                      value={formData.billingStreet}
                      onChange={(e) => setFormData({ ...formData, billingStreet: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingCity">City</Label>
                    <Input
                      id="billingCity"
                      value={formData.billingCity}
                      onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingDistrict">District</Label>
                    <Input
                      id="billingDistrict"
                      value={formData.billingDistrict}
                      onChange={(e) => setFormData({ ...formData, billingDistrict: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingPostalCode">Postal Code</Label>
                    <Input
                      id="billingPostalCode"
                      value={formData.billingPostalCode}
                      onChange={(e) => setFormData({ ...formData, billingPostalCode: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingCountry">Country</Label>
                    <Input
                      id="billingCountry"
                      value={formData.billingCountry}
                      onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Preferences & Settings</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.emailNotifications}
                          onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                          disabled={!isEditing}
                          className="rounded"
                        />
                        <span>Email notifications</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.pushNotifications}
                          onChange={(e) => setFormData({ ...formData, pushNotifications: e.target.checked })}
                          disabled={!isEditing}
                          className="rounded"
                        />
                        <span>Push notifications</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.smsNotifications}
                          onChange={(e) => setFormData({ ...formData, smsNotifications: e.target.checked })}
                          disabled={!isEditing}
                          className="rounded"
                        />
                        <span>SMS notifications</span>
                      </label>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <select
                        id="language"
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value as 'en' | 'bn' })}
                        disabled={!isEditing}
                        className="mt-1 w-full px-3 py-2 border rounded-md"
                      >
                        <option value="en">English</option>
                        <option value="bn">বাংলা (Bengali)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.autoOrderConfirmation}
                        onChange={(e) => setFormData({ ...formData, autoOrderConfirmation: e.target.checked })}
                        disabled={!isEditing}
                        className="rounded"
                      />
                      <span>Auto-confirm orders</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically confirm orders when payment is received
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Since */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              Member since {format(new Date(profile.stats.memberSince), 'MMMM d, yyyy')}
            </div>
          </CardContent>
        </Card>
      </div>
    </BrandLayout>
  )
}

