
import HeroSection from '../components/landing/HeroSection'
import HowItWorks from '../components/landing/HowItWorks'
import FeatureStats from '../components/landing/FeatureStats'
import BentoGrid from '../components/landing/BentoGrid'
import Footer from '../components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      <HeroSection />
      <HowItWorks />
      <FeatureStats />
      <BentoGrid />
      <Footer />
    </div>
  )
}
