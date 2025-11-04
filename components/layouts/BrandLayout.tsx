'use client'

import { useState } from 'react'
import BrandSidebar from './BrandSidebar'
import TopBar from './TopBar'

interface BrandLayoutProps {
  children: React.ReactNode
  title?: string
  action?: React.ReactNode
}

export default function BrandLayout({ children, title, action }: BrandLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
      <div className="flex h-screen overflow-hidden">
        <BrandSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar onMenuClick={() => setSidebarOpen(true)} title={title} action={action} />
          
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

