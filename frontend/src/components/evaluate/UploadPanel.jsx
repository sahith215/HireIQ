import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_LABELS = {
  idle: 'Ready',
  uploading: 'Uploading…',
  analyzing: 'Agent reasoning…',
  done: 'Complete ✓',
  error: 'Error',
}

const STATUS_COLORS = {
  idle: '#64748B',
  uploading: '#6366F1',
  analyzing: '#8B5CF6',
  done: '#10B981',
  error: '#EF4444',
}

export default function UploadPanel({ onResult, onLoading, status, setStatus }) {
  const [jobDescription, setJobDescription] = useState('')
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const isLoading = status === 'uploading' || status === 'analyzing'

  const handleFile = useCallback((f) => {
    if (!f) return
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are accepted.')
      return
    }
    setError('')
    setFile(f)
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }
  const handleDragLeave = () => setDragging(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    handleFile(dropped)
  }
  const handleInputChange = (e) => handleFile(e.target.files?.[0])

  const handleSubmit = async () => {
    if (!file || !jobDescription.trim()) {
      setError('Please upload a PDF and enter a job description.')
      return
    }

    setError('')
    setStatus('uploading')
    onLoading(true)

    const formData = new FormData()
    formData.append('data', file)
    formData.append('job_description', jobDescription.trim())

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    try {
      // Simulate phase progression for UX
      setTimeout(() => setStatus('analyzing'), 2000)

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let msg = `Evaluation failed: ${response.status}`
        try {
          const data = await response.json()
          if (data.message || data.error) msg = data.message || data.error
        } catch {}
        throw new Error(msg)
      }

      const data = await response.json()
      setStatus('done')
      onResult(data)
    } catch (err) {
      clearTimeout(timeoutId)
      setStatus('error')
      if (err.name === 'AbortError') {
        setError('Evaluation is taking longer than expected. Please try again.')
      } else if (err.message.includes('fetch')) {
        setError('Could not reach the evaluation server. Make sure n8n is running on port 5678.')
      } else {
        setError(err.message)
      }
    } finally {
      onLoading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="glass-card p-8 flex flex-col gap-6 h-full">
      {/* Header */}
      <div>
        <h1 className="text-textprimary font-bold mb-1" style={{ fontSize: 24, letterSpacing: '-0.5px' }}>
          Evaluate a Candidate
        </h1>
        <p className="text-textmuted" style={{ fontSize: 14 }}>
          Paste the job description and upload a resume PDF
        </p>
      </div>

      {/* Job Description */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-textprimary">Job Description</label>
        <div className="relative">
          <textarea
            className="w-full resize-none text-sm text-textprimary placeholder:text-textmuted rounded-xl p-4"
            rows={8}
            style={{
              background: 'var(--glass-bg)',
              border: `1px solid ${jobDescription ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'}`,
              outline: 'none',
              transition: 'border-color 300ms',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.7,
            }}
            placeholder="Describe the role, required skills, experience level, and responsibilities..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(99,102,241,0.7)'
              e.target.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.2)'
            }}
            onBlur={e => {
              e.target.style.borderColor = jobDescription ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'
              e.target.style.boxShadow = 'none'
            }}
          />
          <span
            className="absolute bottom-3 right-3 text-xs"
            style={{ color: jobDescription.length > 2000 ? '#EF4444' : '#64748B' }}
          >
            {jobDescription.length}
          </span>
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-textprimary">Resume PDF</label>
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key="file-selected"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative flex items-center gap-4 p-4 rounded-2xl"
              style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.25)',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="flex-shrink-0">
                <rect x="4" y="2" width="20" height="28" rx="3" stroke="#10B981" strokeWidth="1.5" fill="none" />
                <path d="M4 22 L24 22" stroke="#10B981" strokeWidth="1" strokeOpacity="0.3" />
                <path d="M8 12 L16 12 M8 17 L20 17" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
                <circle cx="28" cy="26" r="6" fill="rgba(16,185,129,0.15)" stroke="#10B981" strokeWidth="1.5" />
                <path d="M25 26 L27 28 L31 24" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-textprimary font-medium text-sm truncate">{file.name}</p>
                <p className="text-textmuted text-xs mt-0.5">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={removeFile}
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-textmuted hover:text-textprimary transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="drop-zone"
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
              animate={{
                opacity: 1,
                scale: dragging ? 1.02 : 1,
                borderColor: dragging ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.3)',
                background: dragging ? 'rgba(99,102,241,0.08)' : 'transparent',
              }}
              className="flex flex-col items-center justify-center gap-3 cursor-pointer rounded-2xl min-h-[160px] transition-all"
              style={{
                border: '2px dashed rgba(99,102,241,0.3)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 28 L20 14 M20 14 L14 20 M20 14 L26 20" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 30 L10 34 L30 34 L30 30" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="text-center">
                <p className="text-textprimary font-medium text-sm">Drop PDF here</p>
                <p className="text-textmuted text-xs mt-1">or click to browse • PDF only</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 rounded-xl text-sm"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#EF4444',
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isLoading || !file || !jobDescription.trim()}
        whileHover={!isLoading ? { y: -3, boxShadow: '0 20px 40px rgba(99,102,241,0.35)' } : {}}
        whileTap={!isLoading ? { scale: 0.97 } : {}}
        className="w-full rounded-2xl font-semibold relative overflow-hidden"
        style={{
          height: 56,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          color: 'white',
          fontSize: 16,
          opacity: (isLoading || !file || !jobDescription.trim()) ? 0.4 : 1,
          cursor: (isLoading || !file || !jobDescription.trim()) ? 'not-allowed' : 'pointer',
          border: 'none',
        }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
              <path d="M12 2 A10 10 0 0 1 22 12" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
            AI is analyzing…
          </span>
        ) : (
          'Evaluate Resume →'
        )}
      </motion.button>

      {/* Status Bar */}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: STATUS_COLORS[status] || '#64748B',
            animation: isLoading ? 'dotPulse 1.4s ease-in-out infinite' : 'none',
          }}
        />
        <span className="text-xs text-textmuted">
          {STATUS_LABELS[status] || 'Ready'}
        </span>
      </div>
    </div>
  )
}
