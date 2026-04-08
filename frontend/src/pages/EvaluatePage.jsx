import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import UploadPanel from '../components/evaluate/UploadPanel'
import ResultsPanel from '../components/evaluate/ResultsPanel'

const N8N_BASE = import.meta.env.VITE_N8N_URL || 'http://localhost:5678'
const N8N_HEALTHZ = `${N8N_BASE}/healthz`
const HEALTH_CHECK_INTERVAL_MS = 30_000
const HEALTH_CHECK_TIMEOUT_MS = 3_000

export default function EvaluatePage() {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('idle')

  // FIX 6: Real n8n health check state
  const [n8nStatus, setN8nStatus] = useState('checking') // 'checking' | 'online' | 'offline'

  const handleResult = useCallback((data) => {
    setResult(data)
  }, [])

  // FIX 6: Health check function — try localhost:5678/healthz directly.
  // If CORS blocks it or it times out (3s), mark as offline.
  const checkN8nHealth = useCallback(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS)
    try {
      const res = await fetch(N8N_HEALTHZ, { signal: controller.signal })
      clearTimeout(timeoutId)
      setN8nStatus(res.ok ? 'online' : 'offline')
    } catch {
      clearTimeout(timeoutId)
      setN8nStatus('offline')
    }
  }, [])

  useEffect(() => {
    checkN8nHealth()
    const interval = setInterval(checkN8nHealth, HEALTH_CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [checkN8nHealth])

  // Badge config derived from n8nStatus
  const healthBadge = {
    checking: {
      dot: 'w-2 h-2 rounded-full bg-amber-400 animate-pulse',
      dotShadow: '0 0 6px #F59E0B',
      label: 'Checking…',
    },
    online: {
      dot: 'w-2 h-2 rounded-full bg-success animate-pulse',
      dotShadow: '0 0 8px #10B981',
      label: 'n8n Connected',
    },
    offline: {
      dot: 'w-2 h-2 rounded-full bg-danger',
      dotShadow: '0 0 6px #EF4444',
      label: 'n8n Offline',
    },
  }[n8nStatus]

  return (
    <div className="min-h-screen flex flex-col pt-24" style={{ background: 'var(--color-bg)' }}>
      {/* Header Actions */}
      <div className="max-w-[1600px] w-full mx-auto px-6 mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-textmuted hover:text-textprimary transition-colors text-sm font-medium"
        >
          <span>←</span> Back
        </button>

        {/* FIX 6: Real health check badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={n8nStatus}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <span
              className={healthBadge.dot}
              style={{ boxShadow: healthBadge.dotShadow }}
            />
            <span className="text-xs text-textmuted font-medium">{healthBadge.label}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col gap-8 max-w-[1600px] mx-auto w-full px-6 pb-12">
        {/* Top: Upload */}
        <div className="flex flex-col flex-shrink-0" style={{ minHeight: '30vh' }}>
          <UploadPanel
            onResult={handleResult}
            onLoading={setIsLoading}
            status={status}
            setStatus={setStatus}
          />
        </div>

        {/* Bottom: Results */}
        <div className="flex flex-col flex-1 w-full">
          <ResultsPanel result={result} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
