import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// All secrets moved to environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

// Change 1 — helper to classify candidates
const SHORTLISTED_STATUSES = new Set(['shortlisted', 'evaluated', 'approved', 'rejected'])

function cleanFileName(fileName) {
  const baseName = (fileName || '').split('/').pop()
  return baseName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
}

export default function DashboardPage() {
  const { job_id } = useParams()
  console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'MISSING')
  console.log('job_id from URL:', job_id)
  const navigate = useNavigate()

  const [candidates, setCandidates] = useState([])
  const [evaluations, setEvaluations] = useState({})
  const [loading, setLoading] = useState(true)
  const [isPolling, setIsPolling] = useState(true)
  const [connectionLost, setConnectionLost] = useState(false)
  const consecutiveErrors = useRef(0)

  const fetchDashboardData = useCallback(async () => {
    if (!job_id) return

    try {
      // 1. Fetch all candidates for this job
      const candidatesRes = await fetch(
        `${SUPABASE_URL}/rest/v1/candidates?job_id=eq.${job_id}&select=candidate_id,file_name,shortlist_score,status,file_url&order=shortlist_score.desc`,
        { headers: HEADERS }
      )
      if (!candidatesRes.ok) throw new Error(`Supabase error: ${candidatesRes.status}`)
      const candidatesData = await candidatesRes.json()

      setCandidates(candidatesData)

      // Reset error counter on success
      consecutiveErrors.current = 0
      setConnectionLost(false)

      // Change 5 — only fetch evaluations for shortlisted candidate IDs
      const shortlistedIds = candidatesData
        .filter(c => SHORTLISTED_STATUSES.has(c.status))
        .map(c => c.candidate_id)

      // Within shortlisted, only query those already evaluated
      const evaluatedIds = candidatesData
        .filter(c => c.status === 'evaluated' || c.status === 'approved' || c.status === 'rejected')
        .map(c => c.candidate_id)

      if (evaluatedIds.length > 0) {
        const evalsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/evaluations?candidate_id=in.(${evaluatedIds.join(',')})&select=candidate_id,skills_match_score,experience_match_score,recommendation,confidence`,
          { headers: HEADERS }
        )
        if (evalsRes.ok) {
          const evalsData = await evalsRes.json()
          const evalsMap = {}
          evalsData.forEach(ev => {
            evalsMap[ev.candidate_id] = ev
          })
          setEvaluations(evalsMap)
        }
      }

      // Change 4 — polling stop condition: only check shortlisted candidates
      if (shortlistedIds.length > 0) {
        const shortlistedCandidates = candidatesData.filter(c => SHORTLISTED_STATUSES.has(c.status))
        const allShortlistedDone = shortlistedCandidates.every(
          c => c.status === 'evaluated' || c.status === 'approved' || c.status === 'rejected'
        )
        if (allShortlistedDone) {
          setIsPolling(false)
        }
      }
    } catch (err) {
      console.error('Polling error:', err)
      consecutiveErrors.current += 1
      if (consecutiveErrors.current >= 3) {
        setIsPolling(false)
        setConnectionLost(true)
      }
    } finally {
      setLoading(false)
    }
  }, [job_id])

  // Polling Effect — 4 second interval
  useEffect(() => {
    fetchDashboardData()

    if (!isPolling) return

    const interval = setInterval(() => {
      fetchDashboardData()
    }, 4000)

    return () => clearInterval(interval)
  }, [fetchDashboardData, isPolling])

  const handleRetry = () => {
    consecutiveErrors.current = 0
    setConnectionLost(false)
    setIsPolling(true)
  }

  // Change 1 — split into two sorted arrays
  const shortlistedCandidates = candidates
    .filter(c => SHORTLISTED_STATUSES.has(c.status))
    .sort((a, b) => (b.shortlist_score ?? 0) - (a.shortlist_score ?? 0))

  const nonShortlistedCandidates = candidates
    .filter(c => !SHORTLISTED_STATUSES.has(c.status)) // scored only
    .sort((a, b) => (b.shortlist_score ?? 0) - (a.shortlist_score ?? 0))

  // Stats strip
  const processed = candidates.length
  const shortlistedCount = shortlistedCandidates.length
  const analyzedCount = candidates.filter(
    c => c.status === 'evaluated' || c.status === 'approved' || c.status === 'rejected'
  ).length

  const todayDate = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen flex flex-col pt-24" style={{ background: 'var(--color-bg)' }}>
      {/* ─── Top Header Bar ─── */}
      <div className="max-w-[1600px] w-full mx-auto px-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-textmuted hover:text-textprimary transition-colors text-sm font-medium"
          >
            <span>←</span> Home
          </button>
          <div className="h-4 w-[1px] bg-[var(--glass-border)]" />
          <h1 className="font-bold text-textprimary text-xl">HireIQ</h1>
        </div>

        {/* Center — job session pill */}
        <div className="flex items-center px-4 py-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-sm">
          <span className="text-sm font-medium text-textprimary opacity-90">
            Bulk Analysis · {todayDate}
          </span>
          {isPolling && (
            <span className="ml-3 flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
          )}
        </div>

        {/* Right — real-time stats strip */}
        <div className="flex gap-4 text-sm font-medium">
          <div className="flex flex-col items-end">
            <span className="text-textmuted text-xs uppercase tracking-wider">Processed</span>
            <span className="text-textprimary">{processed}</span>
          </div>
          <div className="w-[1px] bg-[var(--glass-border)]" />
          <div className="flex flex-col items-end">
            <span className="text-textmuted text-xs uppercase tracking-wider">Shortlisted</span>
            <span className="text-textprimary">{shortlistedCount}</span>
          </div>
          <div className="w-[1px] bg-[var(--glass-border)]" />
          <div className="flex flex-col items-end">
            <span className="text-textmuted text-xs uppercase tracking-wider">Analyzed</span>
            <span className="text-textprimary">{analyzedCount}</span>
          </div>
        </div>
      </div>

      {/* ─── Connection Lost Banner ─── */}
      <AnimatePresence>
        {connectionLost && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="max-w-[1600px] mx-auto w-full px-6 mb-4"
          >
            <div
              className="flex items-center justify-between px-5 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#EF4444',
              }}
            >
              <span>⚠ Connection lost — polling stopped after 3 consecutive failures.</span>
              <button
                onClick={handleRetry}
                className="ml-4 px-3 py-1 rounded-lg font-semibold text-xs"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#EF4444',
                }}
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <div className="max-w-[1600px] mx-auto w-full px-6 pb-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : processed === 0 ? (
          <div className="text-center py-20 text-textmuted">
            <p>No candidates found for this batch yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">

            {/* ══════════════════════════════════════════
                Change 2 — SHORTLISTED SECTION
            ══════════════════════════════════════════ */}
            <section>
              {/* Green section header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-4 mb-6"
              >
                <div
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    boxShadow: '0 2px 16px rgba(16,185,129,0.08)',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>✦</span>
                  <span
                    className="font-bold text-base tracking-wide"
                    style={{ color: '#34D399' }}
                  >
                    Shortlisted Candidates
                  </span>
                  <div
                    className="flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#6EE7B7',
                    }}
                  >
                    {shortlistedCandidates.length} / {processed}
                  </div>
                </div>
                <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.3) 0%, transparent 100%)' }} />
              </motion.div>

              {/* Shortlisted candidate cards — existing design unchanged */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                  {shortlistedCandidates.map((c, index) => {
                    const evalData = evaluations[c.candidate_id]
                    // Change 6 — "View Full Analysis" enabled only when status is 'evaluated'
                    const isEvaluated = c.status === 'evaluated'
                    const displayName = cleanFileName(c.file_name)

                    // Recommendation badge
                    let recBadge = null
                    if (isEvaluated && evalData) {
                      const rec = (evalData.recommendation || 'MAYBE').toUpperCase()
                      const colorMap = {
                        HIRE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        INTERVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                        REJECT: 'bg-red-500/10 text-red-400 border-red-500/20',
                        MAYBE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      }
                      const colors = colorMap[rec] || colorMap.MAYBE
                      recBadge = (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors}`}
                        >
                          {rec}
                        </span>
                      )
                    } else {
                      recBadge = (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                          ANALYZING
                        </span>
                      )
                    }

                    // Confidence badge
                    let confBadge = null
                    if (isEvaluated && evalData) {
                      const conf = (evalData.confidence || 'MEDIUM').toUpperCase()
                      const colorHex =
                        conf === 'HIGH' ? '#10B981' : conf === 'LOW' ? '#EF4444' : '#F59E0B'
                      confBadge = (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: colorHex }}
                        >
                          {conf} CONFIDENCE
                        </span>
                      )
                    }

                    return (
                      <motion.div
                        key={c.candidate_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.4 }}
                        className="glass-card p-6 flex flex-col gap-5 relative overflow-hidden"
                      >
                        {/* Rank badge */}
                        <div className="absolute top-0 left-0 bg-[var(--glass-border)] px-3 py-1 text-xs font-bold text-textmuted rounded-br-lg z-10">
                          #{index + 1}
                        </div>

                        <div className="flex justify-between items-start mt-2">
                          <h3
                            className="text-textprimary font-semibold text-lg max-w-[70%] truncate capitalize"
                            title={displayName}
                          >
                            {displayName}
                          </h3>
                          {recBadge}
                        </div>

                        <div className="flex items-center gap-8">
                          {/* Similarity score */}
                          <div className="flex flex-col">
                            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                              {c.shortlist_score != null ? Math.round(c.shortlist_score) : '—'}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-textmuted mt-1">
                              Similarity Score
                            </span>
                          </div>

                          {/* Progress bars */}
                          <div className="flex-1 flex flex-col gap-3">
                            {/* Skills Match */}
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] font-medium text-textmuted uppercase tracking-wider">
                                <span>Skills Match</span>
                                <span>
                                  {isEvaluated && evalData
                                    ? `${evalData.skills_match_score}/10`
                                    : '...'}
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-[var(--glass-bg)] rounded-full overflow-hidden">
                                {isEvaluated && evalData ? (
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${(evalData.skills_match_score / 10) * 100}%`,
                                    }}
                                    transition={{ duration: 1 }}
                                    className="h-full bg-indigo-500 rounded-full"
                                  />
                                ) : (
                                  <motion.div
                                    className="h-full w-1/3 bg-indigo-500/30 rounded-full"
                                    animate={{ x: ['-100%', '300%'] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Experience Match */}
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] font-medium text-textmuted uppercase tracking-wider">
                                <span>Experience Match</span>
                                <span>
                                  {isEvaluated && evalData
                                    ? `${evalData.experience_match_score}/10`
                                    : '...'}
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-[var(--glass-bg)] rounded-full overflow-hidden">
                                {isEvaluated && evalData ? (
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${(evalData.experience_match_score / 10) * 100}%`,
                                    }}
                                    transition={{ duration: 1 }}
                                    className="h-full bg-purple-500 rounded-full"
                                  />
                                ) : (
                                  <motion.div
                                    className="h-full w-1/3 bg-purple-500/30 rounded-full"
                                    animate={{ x: ['-100%', '300%'] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-[var(--glass-border)]">
                          <div>{confBadge}</div>
                          {/* Change 6 — enabled only when status === 'evaluated' */}
                          <button
                            onClick={() => {
                              localStorage.setItem('hireiq_last_job_id', job_id)
                              navigate(`/candidate/${c.candidate_id}`)
                            }}
                            disabled={!isEvaluated}
                            className={`text-sm font-semibold transition-colors flex items-center gap-1 ${
                              isEvaluated
                                ? 'text-indigo-400 hover:text-indigo-300'
                                : 'text-textmuted cursor-not-allowed opacity-50'
                            }`}
                          >
                            View Full Analysis <span>→</span>
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </section>

            {/* ══════════════════════════════════════════
                Change 2 — NOT SHORTLISTED SECTION
                Only rendered if there are non-shortlisted candidates
            ══════════════════════════════════════════ */}
            {nonShortlistedCandidates.length > 0 && (
              <section>
                {/* Red section header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex items-center gap-4 mb-6"
                >
                  <div
                    className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(185,28,28,0.06) 100%)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      boxShadow: '0 2px 16px rgba(239,68,68,0.08)',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', color: '#F87171' }}>✕</span>
                    <span
                      className="font-bold text-base tracking-wide"
                      style={{ color: '#F87171' }}
                    >
                      Not Shortlisted
                    </span>
                    <div
                      className="flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#FCA5A5',
                      }}
                    >
                      {nonShortlistedCandidates.length} / {processed}
                    </div>
                  </div>
                  <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.3) 0%, transparent 100%)' }} />
                </motion.div>

                {/* Change 3 — Non-shortlisted cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {nonShortlistedCandidates.map((c, index) => {
                      const displayName = cleanFileName(c.file_name)
                      const hasResume = !!c.file_url

                      return (
                        <motion.div
                          key={c.candidate_id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.35 }}
                          className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-5"
                          style={{
                            background: 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(var(--glass-bg-raw, 255,255,255),0.03) 100%)',
                            border: '1px solid rgba(239,68,68,0.15)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                          }}
                        >
                          {/* Rank badge */}
                          <div
                            className="absolute top-0 left-0 px-2.5 py-1 text-[10px] font-bold rounded-br-xl"
                            style={{
                              background: 'rgba(239,68,68,0.12)',
                              color: '#FCA5A5',
                              border: '0 0 1px 1px solid rgba(239,68,68,0.2)',
                            }}
                          >
                            #{index + 1}
                          </div>

                          {/* Score circle */}
                          <div
                            className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl mt-2"
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.2)',
                            }}
                          >
                            <span
                              className="text-2xl font-extrabold leading-none"
                              style={{ color: '#F87171' }}
                            >
                              {c.shortlist_score != null ? Math.round(c.shortlist_score) : '—'}
                            </span>
                            <span
                              className="text-[8px] uppercase tracking-wider mt-0.5 font-semibold"
                              style={{ color: '#FCA5A5' }}
                            >
                              Score
                            </span>
                          </div>

                          {/* Candidate info */}
                          <div className="flex-1 min-w-0 mt-2">
                            <h3
                              className="font-semibold text-base truncate capitalize mb-1"
                              style={{ color: 'var(--color-text-primary, #F1F5F9)' }}
                              title={displayName}
                            >
                              {displayName}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[10px] uppercase tracking-wider font-medium"
                                style={{ color: 'rgba(248,113,113,0.7)' }}
                              >
                                Similarity Score
                              </span>
                              <span
                                className="text-[10px] font-bold"
                                style={{ color: '#F87171' }}
                              >
                                {c.shortlist_score != null ? Math.round(c.shortlist_score) : '—'}
                              </span>
                            </div>
                          </div>

                          {/* View Resume button */}
                          <div className="flex-shrink-0">
                            {hasResume ? (
                              <a
                                href={c.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                                style={{
                                  background: 'rgba(239,68,68,0.1)',
                                  border: '1px solid rgba(239,68,68,0.25)',
                                  color: '#F87171',
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'rgba(239,68,68,0.2)'
                                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
                                }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                                View Resume
                              </a>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-not-allowed"
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.07)',
                                  color: 'rgba(255,255,255,0.2)',
                                }}
                              >
                                No Resume Available
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
