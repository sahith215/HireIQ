/** @type {import('tailwindcss').Config} */
// trigger tailwind rebuild
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        indigo: {
          DEFAULT: 'var(--color-primary)',
          500: 'var(--color-primary)',
          600: 'var(--color-primary-dark)',
        },
        violet: {
          DEFAULT: 'var(--color-secondary)',
          500: 'var(--color-secondary)',
        },
        cyan: {
          DEFAULT: 'var(--color-tertiary)',
          500: 'var(--color-tertiary)',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        textprimary: 'var(--color-text-primary)',
        textmuted: 'var(--color-text-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        glass: '24px',
      },
      borderRadius: {
        glass: '20px',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'mesh-bg': 'meshBg 8s ease-in-out infinite',
        'orb-drift-1': 'orbDrift1 15s ease-in-out infinite',
        'orb-drift-2': 'orbDrift2 20s ease-in-out infinite',
        'orb-drift-3': 'orbDrift3 12s ease-in-out infinite',
        'bounce-chevron': 'bounceChevron 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.4,0,0.2,1) forwards',
        'typewriter': 'typewriter 0.05s steps(1) forwards',
        'dot-pulse': 'dotPulse 1.4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'blur(0)' },
          '50%': { opacity: '0.7', filter: 'blur(1px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        meshBg: {
          '0%, 100%': { backgroundColor: '#0A0A2E' },
          '33%': { backgroundColor: '#0D0A3E' },
          '66%': { backgroundColor: '#080820' },
        },
        orbDrift1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-30px, 40px) scale(1.05)' },
          '66%': { transform: 'translate(20px, -20px) scale(0.98)' },
        },
        orbDrift2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(40px, -30px) scale(1.08)' },
        },
        orbDrift3: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-20px, 20px) scale(1.03)' },
        },
        bounceChevron: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '1' },
          '50%': { transform: 'translateY(12px)', opacity: '0.5' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(60px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        dotPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.8)' },
        },
      },
    },
  },
  plugins: [],
}
