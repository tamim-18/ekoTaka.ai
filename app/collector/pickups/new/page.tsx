'use client'

import DashboardLayout from '@/components/layouts/DashboardLayout'
import NewPickupWizard from '@/components/collector/NewPickupWizard'

export default function NewPickupPage() {
  return (
    <DashboardLayout title="New Pickup">
      <NewPickupWizard />
    </DashboardLayout>
  )
}


