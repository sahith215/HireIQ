import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('hireiq-theme') || 'dark')
  const location = useLocation()

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    localStorage.setItem('hireiq-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Home', href: '/' },

    { label: 'Evaluate', href: '/evaluate' },
  ]

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/' && !location.hash
    if (href.startsWith('/#')) return location.hash === href.slice(1)
    return location.pathname === href
  }

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? 'rgba(4, 4, 10, 0.85)'
          : 'rgba(4, 4, 10, 0)',
        backdropFilter: scrolled ? 'blur(24px)' : 'blur(0px)',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.07)'
          : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span
            className="font-black text-[22px] gradient-text-primary"
            style={{ letterSpacing: '-0.5px' }}
          >
            HireIQ
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`nav-link ${isActive(link.href) ? 'active' : ''}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions CTA */}
        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/evaluate">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary px-5 py-2 text-sm font-semibold rounded-full relative z-10"
            >
              Try It Free
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}
