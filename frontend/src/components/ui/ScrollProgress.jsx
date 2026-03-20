import { useEffect, useRef } from 'react'

export default function ScrollProgress() {
  const barRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight ? scrollTop / docHeight : 0
      if (barRef.current) {
        barRef.current.style.width = `${progress * 100}%`
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      ref={barRef}
      className="scroll-progress"
      style={{ width: '0%' }}
      aria-hidden="true"
    />
  )
}
