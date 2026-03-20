import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    number: '01',
    title: 'Upload Resume',
    body: 'Our semantic chunker extracts and structures every section of the PDF automatically.',
    color: '#6366F1',
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="14" width="28" height="36" rx="3" stroke="#6366F1" strokeWidth="2" fill="none"/>
        <path d="M24 30 L24 20 M24 20 L20 24 M24 20 L28 24" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 42 L38 42" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="3 2"/>
        <path d="M14 22 L18 22" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5"/>
        <path d="M14 27 L28 27" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5"/>
        <path d="M14 32 L20 32" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5"/>
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Agent Evaluates',
    body: 'Agentic RAG retrieves context, reasons iteratively with a ReAct loop, and scores skills vs. job requirements.',
    color: '#8B5CF6',
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="28" cy="22" r="12" stroke="#8B5CF6" strokeWidth="2" fill="none"/>
        <path d="M20 34 C20 34 16 44 12 46 M36 34 C36 34 40 44 44 46" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="24" cy="20" r="2" fill="#8B5CF6"/>
        <circle cx="32" cy="20" r="2" fill="#8B5CF6"/>
        <path d="M23 26 Q28 29 33 26" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M16 14 L18 16 M40 14 L38 16 M28 10 L28 8" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Get Results',
    body: 'Receive scores, gaps, strengths, recommendation, and custom interview questions instantly.',
    color: '#06B6D4',
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="28" cy="28" r="16" stroke="#06B6D4" strokeWidth="2" fill="none"/>
        <path d="M20 28 L25 33 L36 22" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M40 18 L44 14" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        <path d="M42 22 L46 20" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        <path d="M40 26 L46 25" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      </svg>
    ),
  },
]

const cardVariants = [
  { initial: { x: -60, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  { initial: { y: 60, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  { initial: { x: 60, opacity: 0 }, animate: { x: 0, opacity: 1 } },
]

export default function HowItWorks() {
  const sectionRef = useRef(null)
  const lineRef = useRef(null)
  const headingRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.from(headingRef.current, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headingRef.current,
          start: 'top 85%',
        },
      })

      // SVG path draw
      if (lineRef.current) {
        const length = lineRef.current.getTotalLength?.() || 600
        gsap.set(lineRef.current, { strokeDasharray: length, strokeDashoffset: length })
        gsap.to(lineRef.current, {
          strokeDashoffset: 0,
          duration: 1.5,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-32 px-6"
    >
      {/* Section Heading */}
      <div ref={headingRef} className="text-center mb-20">
        <h2
          className="font-extrabold text-textprimary"
          style={{ fontSize: 'clamp(36px, 5vw, 52px)', letterSpacing: '-1.5px' }}
        >
          Three Steps.{' '}
          <span className="gradient-text-primary">Zero Guesswork.</span>
        </h2>
        <p className="text-textmuted mt-4 max-w-xl mx-auto" style={{ fontSize: 17 }}>
          From resume upload to actionable hiring decision in seconds.
        </p>
      </div>

      {/* Cards + Connecting Line */}
      <div className="relative max-w-6xl mx-auto">
        {/* SVG Connecting Path */}
        <svg
          className="absolute top-1/2 left-[16%] right-[16%] hidden lg:block pointer-events-none"
          style={{ width: '68%', top: '80px', zIndex: 0 }}
          viewBox="0 0 600 40"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            ref={lineRef}
            d="M 0 20 C 150 20 150 20 300 20 C 450 20 450 20 600 20"
            stroke="url(#lineGradient)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.5"
          />
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={cardVariants[i].initial}
              whileInView={cardVariants[i].animate}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(99,102,241,0.2)' }}
              className="glass-card p-8 flex flex-col gap-5"
            >
              {/* Step Number */}
              <div
                className="text-xs font-bold tracking-widest"
                style={{ color: step.color, opacity: 0.6 }}
              >
                STEP {step.number}
              </div>

              {/* Icon */}
              <div>{step.icon}</div>

              {/* Text */}
              <div>
                <h3
                  className="text-textprimary font-semibold mb-2"
                  style={{ fontSize: 20 }}
                >
                  {step.title}
                </h3>
                <p className="text-textmuted" style={{ fontSize: 15, lineHeight: 1.7 }}>
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
