import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import UploadPanel from '../components/evaluate/UploadPanel'
import ResultsPanel from '../components/evaluate/ResultsPanel'

export default function EvaluatePage() {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('idle')

  const handleResult = useCallback((data) => {
    setResult(data)
  }, [])

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
