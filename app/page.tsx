'use client'

import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import ImpactSection from '@/components/landing/ImpactSection'
import CTASection from '@/components/landing/CTASection'

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <ImpactSection />
      <CTASection />
      <Footer />
    </div>
  )
}
