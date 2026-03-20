import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'

// Animated SVG Arc for mock score rings in hero preview card
function ScoreRing({ score, max = 10, size = 80, label, color = '#6366F1' }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / max) * circumference
  const offset = circumference - progress

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--glass-border)" strokeWidth="8"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-textprimary font-bold text-lg">{score}</span>
        </div>
      </div>
      <span className="text-xs text-textmuted text-center">{label}</span>
    </div>
  )
}

// Floating hero preview card
function HeroPreviewCard() {
  return (
    <motion.div
      initial={{ x: 0, y: -200, rotateZ: 25, rotateY: 90, rotateX: 45, scale: 0.5, opacity: 0 }}
      animate={{ x: 0, y: 0, rotateZ: 0, rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }}
      transition={{
        duration: 4,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo
        delay: 0.2
      }}
      className="relative"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          rotateY: -8,
          boxShadow: '0 40px 80px rgba(99,102,241,0.3)',
          willChange: 'transform',
        }}
        className="glass-card p-20 w-[550px] max-w-full"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-semibold text-textmuted uppercase tracking-widest">
            AI Evaluation Complete
          </span>
        </div>

        {/* Score Rings */}
        <div className="flex gap-9 justify-center mb-7">
          <ScoreRing score={8} label="Skills Match" color="#6366F1" />
          <ScoreRing score={7} label="Experience" color="#8B5CF6" />
        </div>

        {/* Hire Badge */}
        <div className="flex justify-center mb-4">
          <span
            className="px-9 py-1.5 rounded-full text-sm font-bold tracking-widest"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
              border: '1px solid rgba(16,185,129,0.4)',
              color: '#10B981',
            }}
          >
            HIRE
          </span>
        </div>

        {/* Skill Tags */}
        <div className="flex gap-2 flex-wrap mb-4">
          {['React', 'Node.js', 'AWS'].map((skill) => (
            <span
              key={skill}
              className="text-xs px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: 'var(--color-primary-dark)',
              }}
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div
          className="text-xs text-textmuted text-center pt-3"
          style={{ borderTop: '1px solid var(--glass-border)' }}
        >
          3 interview questions generated
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function HeroSection() {
  const scrollIndicatorRef = useRef(null)

  // Fade out scroll indicator after 10% scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollIndicatorRef.current) return
      const progress = window.scrollY / (document.documentElement.scrollHeight * 0.1)
      scrollIndicatorRef.current.style.opacity = Math.max(0, 1 - progress * 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const headlineVariants = {
    hidden: { opacity: 0, y: 80 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay: 0.3 + i * 0.15, ease: [0.4, 0, 0.2, 1] },
    }),
  }

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ paddingTop: '80px' }}
    >
      {/* Background Layer 1: Mesh Gradient */}
      <div
        className="absolute inset-0 mesh-bg"
        style={{ zIndex: 0 }}
      />

      {/* Background Layer 2: Floating Orbs */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {/* Orb 1 - Indigo/Sky */}
        <div
          className="absolute rounded-full animate-[orbDrift1_15s_ease-in-out_infinite]"
          style={{
            width: 600, height: 600,
            background: 'var(--orb-1)',
            filter: 'blur(120px)',
            top: '-10%', right: '-10%',
            willChange: 'transform',
          }}
        />
        {/* Orb 2 - Violet/Blue */}
        <div
          className="absolute rounded-full animate-[orbDrift2_20s_ease-in-out_infinite]"
          style={{
            width: 400, height: 400,
            background: 'var(--orb-2)',
            filter: 'blur(80px)',
            bottom: '-5%', left: '-5%',
            willChange: 'transform',
          }}
        />
        {/* Orb 3 - Cyan/Sky */}
        <div
          className="absolute rounded-full animate-[orbDrift3_12s_ease-in-out_infinite]"
          style={{
            width: 300, height: 300,
            background: 'var(--orb-3)',
            filter: 'blur(60px)',
            top: '40%', right: '30%',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Background Layer 3: Dot Grid */}
      <div className="absolute inset-0 dot-grid pointer-events-none" style={{ zIndex: 2 }} />

      {/* Hero Content */}
      <div
        className="relative max-w-7xl mx-auto px-6 w-full flex items-center gap-12 py-20"
        style={{ zIndex: 3 }}
      >
        {/* Left Content */}
        <div className="flex-1 max-w-[55%]">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{
              border: '1px solid rgba(99,102,241,0.35)',
              background: 'rgba(99,102,241,0.08)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-indigo-500"
              style={{ animation: 'dotPulse 1.4s ease-in-out infinite' }}
            />
            <span className="text-xs font-semibold text-indigo-400 tracking-widest uppercase">
              ✦ Agentic RAG Technology
            </span>
          </motion.div>

          {/* Headline */}
          <div className="mb-6" style={{ overflow: 'hidden' }}>
            <motion.h1
              custom={0}
              variants={headlineVariants}
              initial="hidden"
              animate="visible"
              className="block text-textprimary font-black"
              style={{
                fontSize: 'clamp(52px, 7vw, 80px)',
                letterSpacing: '-3px',
                lineHeight: 1.0,
              }}
            >
              Hire With
            </motion.h1>
            <motion.span
              custom={1}
              variants={headlineVariants}
              initial="hidden"
              animate="visible"
              className="block gradient-text-secondary font-black"
              style={{
                fontSize: 'clamp(52px, 7vw, 80px)',
                letterSpacing: '-3px',
                lineHeight: 1.0,
              }}
            >
              Intelligence.
            </motion.span>
          </div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="text-textmuted mb-10 max-w-[480px]"
            style={{ fontSize: 17, lineHeight: 1.75 }}
          >
            Drop a resume. Our AI agents evaluate skills, identify gaps, and generate
            interview questions in seconds — powered by Agentic RAG.
          </motion.p>

          {/* Button Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="flex items-center gap-4 flex-wrap"
          >
            <Link to="/evaluate">
              <motion.button
                whileHover={{ scale: 1.03, y: -4, boxShadow: '0 20px 40px rgba(99,102,241,0.4)' }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary px-8 font-semibold rounded-full"
                style={{ height: 52, fontSize: 16 }}
              >
                Start Evaluating →
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ background: 'var(--glass-bg)', scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost px-8 font-semibold rounded-full"
              style={{ height: 52, fontSize: 16 }}
            >
              Watch Demo
            </motion.button>
          </motion.div>
        </div>

        {/* Right Content — Preview Card */}
        <div className="hidden lg:flex flex-1 justify-center items-center">
          <HeroPreviewCard />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ zIndex: 4 }}
      >
        <span className="text-xs text-textmuted tracking-widest uppercase">
          Scroll to explore
        </span>
        <svg
          className="animate-bounce-chevron"
          width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: '#64748B', animation: 'bounceChevron 1.5s ease-in-out infinite' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  )
}
