import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_LABELS = {
  idle: 'Ready',
  uploading: 'Uploading…',
  analyzing: 'Agent reasoning…',
  done: 'Complete ✓',
  error: 'Error',
}

const BULK_STATUS_LABELS = {
  idle: 'Ready',
  uploading: 'Uploading ZIP archive…',
  analyzing: 'Generating presigned URLs…',
  done: 'Bulk upload initialized ✓',
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
  const navigate = useNavigate()
  const [mode, setMode] = useState('single') // 'single' or 'bulk'
  const [jobDescription, setJobDescription] = useState('')
  const [file, setFile] = useState(null)
  const [topN, setTopN] = useState(10)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const isLoading = status === 'uploading' || status === 'analyzing'
  
  // Clear file/error when mode changes
  useEffect(() => {
    setFile(null)
    setError('')
    setStatus('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [mode, setStatus])

  const handleFile = useCallback((f) => {
    if (!f) return
    const expectedType = mode === 'single' ? 'application/pdf' : 'application/zip'
    const expectedExt = mode === 'single' ? '.pdf' : '.zip'
    
    if (f.type !== expectedType && !f.name.toLowerCase().endsWith(expectedExt)) {
      setError(`Only ${mode === 'single' ? 'PDF' : 'ZIP'} files are accepted in this mode.`)
      return
    }
    setError('')
    setFile(f)
  }, [mode])

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
      setError(`Please upload a ${mode === 'single' ? 'PDF' : 'ZIP'} and enter a job description.`)
      return
    }

    if (mode === 'bulk' && (topN < 1 || topN > 50 || isNaN(topN))) {
       setError('Top N candidates must be between 1 and 50.')
       return
    }

    setError('')
    setStatus('uploading')
    onLoading(true)

    const formData = new FormData()
    formData.append('data', file)
    formData.append('job_description', jobDescription.trim())
    
    if (mode === 'bulk') {
      formData.append('top_n', topN.toString())
    }

    const N8N_BASE = import.meta.env.VITE_N8N_URL || 'http://localhost:5678'
    const TARGET_URL = mode === 'single'
      ? `${N8N_BASE}/webhook/resume_upload`
      : `${N8N_BASE}/webhook/bulk_shortlist`

    try {
      if (mode === 'bulk') {
        try {
          const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
          const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
      
          // Record start time before firing with 30-second safety buffer
          const startedAt = new Date(Date.now() - 30000).toISOString()
      
          // Fire the pipeline — don't await it
          fetch(TARGET_URL, {
            method: 'POST',
            headers: { 'x-api-key': import.meta.env.VITE_API_KEY },
            body: formData,
          }).catch(() => {}) // ignore errors — we poll Supabase instead
      
          // Poll Supabase for a job created after we started
          const maxWait = 600000 // 10 minutes
          const pollInterval = 4000
          const startTime = Date.now()
      
          const pollForJob = async () => {
            while (Date.now() - startTime < maxWait) {
              await new Promise(r => setTimeout(r, pollInterval))
              try {
                const res = await fetch(
                  `${SUPABASE_URL}/rest/v1/jobs?select=id,created_at&created_at=gte.${startedAt}&order=created_at.desc&limit=1`,
                  {
                    headers: {
                      apikey: SUPABASE_ANON_KEY,
                      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    }
                  }
                )
                const jobs = await res.json()
                if (jobs && jobs.length > 0) {
                  setStatus('done')
                  navigate(`/dashboard/${jobs[0].id}`)
                  return
                }
              } catch(e) {
                // continue polling
              }
            }
            setStatus('error')
            setError('Processing timed out. Check your dashboard manually.')
          }
      
          pollForJob()
          return
      
        } catch (err) {
          setStatus('error')
          setError('Failed to start processing: ' + err.message)
          return
        }
      }

      // SINGLE MODE FLOW (Full Wait)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)
      
      // Simulate phase progression for UX
      setTimeout(() => setStatus('analyzing'), 2000)

      const response = await fetch(TARGET_URL, {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_API_KEY
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let msg = `Request failed: ${response.status}`
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
      setStatus('error')
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else if (err.message.includes('fetch')) {
        setError('Could not reach the evaluation server. Make sure it is running.')
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
      {/* Mode Switcher */}
      <div className="flex justify-center mb-2">
        <div className="relative flex p-1 bg-[rgba(255,255,255,0.05)] rounded-full border border-[rgba(255,255,255,0.1)] w-full max-w-[400px]">
          <button
            onClick={() => !isLoading && setMode('single')}
            disabled={isLoading}
            className={`flex-1 relative z-10 py-2 text-sm font-medium rounded-full transition-colors ${mode === 'single' ? 'text-white' : 'text-textmuted hover:text-textprimary'}`}
          >
            Single Resume
          </button>
          <button
            onClick={() => !isLoading && setMode('bulk')}
            disabled={isLoading}
            className={`flex-1 relative z-10 py-2 text-sm font-medium rounded-full transition-colors ${mode === 'bulk' ? 'text-white' : 'text-textmuted hover:text-textprimary'}`}
          >
            Bulk Shortlist
          </button>
          {/* Active indicator */}
          <motion.div
            layoutId="activeMode"
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-500 rounded-full"
            initial={false}
            animate={{
              left: mode === 'single' ? '4px' : 'calc(50% + 0px)'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ zIndex: 0 }}
          />
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-textprimary font-bold mb-1" style={{ fontSize: 24, letterSpacing: '-0.5px' }}>
          {mode === 'single' ? 'Evaluate a Candidate' : 'Batch Shortlist Resumes'}
        </h1>
        <p className="text-textmuted" style={{ fontSize: 14 }}>
          {mode === 'single' ? 'Paste the job description and upload a resume PDF' : 'Upload a ZIP file of resumes to find the best matches'}
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

      {/* Conditional Inputs */}
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Drop zone */}
        <div className={`flex flex-col gap-2 ${mode === 'bulk' ? 'flex-[2]' : 'w-full'}`}>
          <label className="text-sm font-semibold text-textprimary">
            {mode === 'single' ? 'Resume PDF' : 'Resumes ZIP Archive'}
          </label>
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="relative flex items-center gap-4 p-4 rounded-2xl h-full min-h-[160px]"
                style={{
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.25)',
                }}
              >
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-[rgba(16,185,129,0.15)]">
                  {mode === 'single' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="14 2 14 8 20 8" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                       <rect x="3" y="4" width="18" height="16" rx="2" stroke="#10B981" strokeWidth="2" />
                       <path d="M9 4V8M9 8H15M15 8V12M15 12H9M9 12V16M9 16H15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-textprimary font-medium text-sm truncate">{file.name}</p>
                  <p className="text-textmuted text-xs mt-0.5">{formatSize(file.size)}</p>
                </div>
                <button
                  onClick={removeFile}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-textmuted hover:text-textprimary transition-colors"
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
                className="flex flex-col items-center justify-center gap-3 cursor-pointer rounded-2xl min-h-[160px] h-full transition-all"
                style={{
                  border: '2px dashed rgba(99,102,241,0.3)',
                }}
              >
                <div className="w-12 h-12 rounded-full bg-[rgba(99,102,241,0.1)] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 8 12 3 7 8" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="3" x2="12" y2="15" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-textprimary font-medium text-sm">Drop {mode === 'single' ? 'PDF' : 'ZIP'} here</p>
                  <p className="text-textmuted text-xs mt-1">or click to browse • {mode === 'single' ? 'PDF only' : 'ZIP archive'}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input
            ref={fileInputRef}
            type="file"
            accept={mode === 'single' ? '.pdf,application/pdf' : '.zip,application/zip,application/x-zip-compressed'}
            className="hidden"
            onChange={handleInputChange}
          />
        </div>

        {/* Extra inputs for Bulk Mode */}
        {mode === 'bulk' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col gap-2"
          >
            <label className="text-sm font-semibold text-textprimary">Top N Candidates</label>
            <div className="flex-1 relative flex items-center">
              <input
                 type="number"
                 min="1"
                 max="50"
                 placeholder="10"
                 className="w-full text-center text-4xl font-bold rounded-2xl h-full min-h-[160px] flex items-center justify-center text-textprimary"
                 style={{
                   background: 'var(--glass-bg)',
                   border: '1px solid var(--glass-border)',
                   outline: 'none',
                 }}
                 value={topN}
                 onChange={(e) => setTopN(parseInt(e.target.value) || '')}
              />
              <div className="absolute top-4 left-0 right-0 text-center text-xs text-textmuted pointer-events-none">Target Size</div>
              <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-textmuted pointer-events-none">Max: 50</div>
            </div>
          </motion.div>
        )}
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
        className="w-full rounded-2xl font-semibold relative overflow-hidden flex-shrink-0"
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
            {mode === 'single' ? 'AI is analyzing…' : `Processing ${file?.name} — Scoring all resumes and shortlisting top candidates. Large batches (10+ resumes) may take 3-5 minutes. Do not close this tab.`}
          </span>
        ) : (
          mode === 'single' ? 'Evaluate Resume →' : 'Start Bulk Analysis →'
        )}
      </motion.button>

      {/* Status Bar */}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: STATUS_COLORS[status] || '#64748B',
            animation: isLoading ? 'dotPulse 1.4s ease-in-out infinite' : 'none',
            boxShadow: isLoading ? `0 0 8px ${STATUS_COLORS[status] || '#64748B'}` : 'none'
          }}
        />
        <span className="text-xs text-textmuted min-w-[120px]">
          {mode === 'single' 
            ? (STATUS_LABELS[status] || 'Ready') 
            : (BULK_STATUS_LABELS[status] || 'Ready')}
        </span>
      </div>
    </div>
  )
}
