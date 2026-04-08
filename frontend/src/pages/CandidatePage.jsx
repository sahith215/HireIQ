import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ResultsPanel from '../components/evaluate/ResultsPanel'

// FIX 2: All secrets moved to environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

export default function CandidatePage() {
  const { candidate_id } = useParams()
  const navigate = useNavigate()

  const [candidate, setCandidate] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [mergedResult, setMergedResult] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [mutateStatus, setMutateStatus] = useState(null) // 'approved', 'rejected', or null

  // FIX 4: auto-refresh interval reference for pending state
  const pendingRefreshRef = useRef(null)

  const fetchDetails = useCallback(async () => {
    if (!candidate_id) return

    try {
      // 1. Fetch Candidate — FIX 3: select * to get all columns
      const candRes = await fetch(
        `${SUPABASE_URL}/rest/v1/candidates?candidate_id=eq.${candidate_id}&select=*&limit=1`,
        { headers: HEADERS }
      )
      if (!candRes.ok) throw new Error('Failed to fetch candidate')
      const candData = await candRes.json()
      if (candData.length === 0) throw new Error('Candidate not found')
      const c = candData[0]
      setCandidate(c)

      // 2. Fetch Evaluation — FIX 3: select * to get all columns
      const evalRes = await fetch(
        `${SUPABASE_URL}/rest/v1/evaluations?candidate_id=eq.${candidate_id}&select=*&limit=1`,
        { headers: HEADERS }
      )

      let e = null
      if (evalRes.ok) {
        const evalData = await evalRes.json()
        if (evalData.length > 0) {
          e = evalData[0]
          setEvaluation(e)
        }
      }

      // FIX 3: merged shape exactly matches what ResultsPanel expects
      if (c && e) {
        setMergedResult({
          success: true,
          candidate_id: c.candidate_id,
          evaluated_at: e.created_at,
          evaluation: {
            skills_match_score: e.skills_match_score,
            experience_match_score: e.experience_match_score,
            missing_skills: e.missing_skills,
            strengths: e.strengths,
            recommendation: e.recommendation,
            confidence: e.confidence,
            reasoning_trace: e.reasoning_trace,
            evidence: e.evidence,
          },
          interview_questions: e.interview_questions,
          agent_meta: e.agent_meta,
        })
        // Evaluation loaded — clear the pending refresh interval
        if (pendingRefreshRef.current) {
          clearInterval(pendingRefreshRef.current)
          pendingRefreshRef.current = null
        }
      }

      setMutateStatus(
        c.status === 'approved' || c.status === 'rejected' ? c.status : null
      )
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [candidate_id])

  useEffect(() => {
    fetchDetails()
    return () => {
      // Cleanup pending refresh on unmount
      if (pendingRefreshRef.current) {
        clearInterval(pendingRefreshRef.current)
      }
    }
  }, [fetchDetails])

  // FIX 4: Once candidate is loaded but evaluation is null, poll every 5s
  useEffect(() => {
    if (candidate && !evaluation && !error) {
      // Start a 5-second refresh interval
      if (!pendingRefreshRef.current) {
        pendingRefreshRef.current = setInterval(() => {
          fetchDetails()
        }, 5000)
      }
    }
    // If evaluation arrives, the fetchDetails function clears the interval
  }, [candidate, evaluation, error, fetchDetails])

  const handleBack = () => {
    const job_id = localStorage.getItem('hireiq_last_job_id')
    if (job_id) {
      navigate(`/dashboard/${job_id}`)
    } else {
      navigate(-1)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      setMutateStatus('updating')
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/candidates?candidate_id=eq.${candidate_id}`,
        {
          method: 'PATCH',
          headers: HEADERS,
          body: JSON.stringify({ status: newStatus }),
        }
      )
      if (!res.ok) throw new Error('Failed to update status')
      setMutateStatus(newStatus)
      setCandidate(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      console.error(err)
      setMutateStatus(
        candidate?.status === 'approved' || candidate?.status === 'rejected'
          ? candidate.status
          : null
      )
      alert('Could not update status: ' + err.message)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--color-bg)' }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // ── Error state ──
  if (error || !candidate) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 gap-4"
        style={{ background: 'var(--color-bg)' }}
      >
        <div className="text-red-400 font-medium">{error || 'Candidate not found.'}</div>
        <button
          onClick={handleBack}
          className="text-indigo-400 font-semibold px-4 py-2 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/10 transition-colors"
        >
          Go Back
        </button>
      </div>
    )
  }

  const displayName = (candidate.file_name || '')
    .split('/')
    .pop()
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')

  return (
    <div className="min-h-screen flex flex-col pt-24" style={{ background: 'var(--color-bg)' }}>
      {/* ─── Top Header ─── */}
      <div className="max-w-[1600px] w-full mx-auto px-6 pb-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-textmuted hover:text-textprimary hover:bg-[var(--glass-bg)] transition-colors text-sm font-medium border border-transparent hover:border-[var(--glass-border)]"
          >
            <span>←</span> Back to Dashboard
          </button>
          <div className="h-5 w-[1px] bg-[var(--glass-border)] hidden md:block" />
          <h1
            className="font-bold text-textprimary text-xl capitalize max-w-[300px] lg:max-w-[500px] truncate"
            title={displayName}
          >
            {displayName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleStatusChange('approved')}
            disabled={mutateStatus === 'approved' || mutateStatus === 'updating'}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-sm ${
              mutateStatus === 'approved'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-not-allowed'
                : 'bg-[var(--glass-bg)] text-textprimary border border-[var(--glass-border)] hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'
            }`}
          >
            {mutateStatus === 'approved' ? '✓ Approved' : '✅ Approve'}
          </button>
          <button
            onClick={() => handleStatusChange('rejected')}
            disabled={mutateStatus === 'rejected' || mutateStatus === 'updating'}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-sm ${
              mutateStatus === 'rejected'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 cursor-not-allowed'
                : 'bg-[var(--glass-bg)] text-textprimary border border-[var(--glass-border)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
            }`}
          >
            {mutateStatus === 'rejected' ? '✗ Rejected' : '❌ Reject'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-[var(--glass-bg)] text-textprimary border border-[var(--glass-border)] hover:bg-[var(--glass-bg)]/80 transition-colors shadow-sm"
          >
            ⬇ Export
          </button>
        </div>
      </div>

      {/* ─── Full-width AI Evaluation Layout ─── */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6 p-6 overflow-hidden h-[calc(100vh-140px)]">
        {/* Single Column — AI Evaluation */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full h-full flex flex-col overflow-y-auto no-scrollbar rounded-2xl"
        >
          <div className="flex flex-col gap-3 h-full">
            <h2 className="text-sm font-bold text-textmuted uppercase tracking-wider sticky top-0 bg-[var(--color-bg)] z-10 py-1">
              AI Evaluation
            </h2>

            {mergedResult ? (
              <div className="pb-8">
                <ResultsPanel result={mergedResult} isLoading={false} fileUrl={candidate?.file_url} />
              </div>
            ) : (
              // FIX 4: Proper pending state with pulsing spinner + auto-refresh copy
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-10 flex flex-col items-center justify-center gap-5 h-full text-center"
              >
                <div className="relative w-14 h-14">
                  <div className="w-14 h-14 rounded-full border-2 border-indigo-500/30" />
                  <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-textprimary font-semibold text-lg">Evaluation In Progress</p>
                  <p className="text-textmuted text-sm max-w-xs">
                    This candidate is being analyzed by our AI agent. This page will update
                    automatically.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-textmuted">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
                    style={{ boxShadow: '0 0 6px rgba(99,102,241,0.6)' }}
                  />
                  Checking every 5 seconds…
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
