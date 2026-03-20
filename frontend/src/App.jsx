import { useEffect, useRef, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import ScrollProgress from './components/ui/ScrollProgress'
import Navbar from './components/landing/Navbar'
import LandingPage from './pages/LandingPage'

const EvaluatePage = lazy(() => import('./pages/EvaluatePage'))

gsap.registerPlugin(ScrollTrigger)

function App() {
  const lenisRef = useRef(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    })

    lenisRef.current = lenis

    function raf(time) {
      lenis.raf(time)
      ScrollTrigger.update()
      requestAnimationFrame(raf)
    }

    const rafId = requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <BrowserRouter>
      <ScrollProgress />
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/evaluate"
          element={
            <Suspense fallback={
              <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="flex gap-2">
                  {[0,1,2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-indigo-500"
                      style={{
                        animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`
                      }}
                    />
                  ))}
                </div>
              </div>
            }>
              <EvaluatePage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
