import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const stats = [
  { value: 13, suffix: '+', label: 'Resume Sections', sub: 'analyzed per document' },
  { value: 8, suffix: '', label: 'Chunks Retrieved', sub: 'per evaluation' },
  { value: 4, suffix: '', label: 'Reasoning Iterations', sub: 'max per run' },
  { value: 3, suffix: '', label: 'Interview Categories', sub: 'Technical · Behavioral · Scenario' },
]

function CountUp({ target, suffix = '', duration = 1500 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const step = (now) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  )
}

export default function FeatureStats() {
  return (
    <section className="relative py-20 px-6">
      <div
        className="max-w-7xl mx-auto"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0"
          style={{ divideColor: 'rgba(255,255,255,0.06)' }}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center p-10 text-center"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="font-black mb-1 gradient-text-primary"
                style={{ fontSize: 'clamp(36px, 4vw, 52px)', letterSpacing: '-2px' }}
              >
                <CountUp target={stat.value} suffix={stat.suffix} duration={1200 + i * 100} />
              </div>
              <div className="text-textprimary font-semibold mb-1" style={{ fontSize: 15 }}>
                {stat.label}
              </div>
              <div className="text-textmuted" style={{ fontSize: 12 }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
