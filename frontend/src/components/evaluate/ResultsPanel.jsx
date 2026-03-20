import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Animated SVG Score Ring
const ScoreRing = memo(function ScoreRing({ score, max = 10, size = 120, label }) {
  const [displayed, setDisplayed] = useState(0)
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (displayed / max) * circumference
  const offset = circumference - progress

  const color = score >= 7 ? '#10B981' : score >= 4 ? '#F59E0B' : '#EF4444'

  useEffect(() => {
    let start
    const duration = 1200
    const target = score

    const step = (now) => {
      if (!start) start = now
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(eased * target))
      if (t < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [score])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="var(--glass-border)"
            strokeWidth="10"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="ring-animated"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-textprimary" style={{ fontSize: 28 }}>{displayed}</span>
          <span className="text-textmuted" style={{ fontSize: 11 }}>/ {max}</span>
        </div>
      </div>
      <span className="text-sm text-textmuted font-medium text-center">{label}</span>
    </div>
  )
})

// Collapsible Accordion
function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="font-semibold text-textprimary" style={{ fontSize: 15 }}>{title}</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="#64748B" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-5 pb-5"
              style={{ borderTop: '1px solid var(--glass-border)' }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Question Card within tabs
function QuestionCard({ question, rationale, expected_signal, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass-card p-6 flex flex-col gap-3"
    >
      <p className="text-textprimary font-medium" style={{ fontSize: 15, lineHeight: 1.6 }}>
        {question}
      </p>
      {rationale && (
        <Accordion title="Rationale">
          <p className="text-textmuted pt-3" style={{ fontSize: 13, lineHeight: 1.7 }}>{rationale}</p>
        </Accordion>
      )}
      {expected_signal && (
        <Accordion title="Expected Signal">
          <p className="text-textmuted pt-3" style={{ fontSize: 13, lineHeight: 1.7 }}>{expected_signal}</p>
        </Accordion>
      )}
    </motion.div>
  )
}

// Main ResultsPanel
export default function ResultsPanel({ result, isLoading }) {
  const [activeTab, setActiveTab] = useState('technical')
  const tabs = ['technical', 'behavioral', 'scenario_based']
  const tabLabels = { technical: 'Technical', behavioral: 'Behavioral', scenario_based: 'Scenario' }

  // Empty State
  if (!result && !isLoading) {
    return (
      <div className="glass-card h-full flex flex-col items-center justify-center gap-4 p-12">
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="12" y="8" width="40" height="52" rx="4" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" fill="none" />
            <path d="M20 24 L44 24 M20 32 L36 32 M20 40 L40 40" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="58" cy="18" r="10" fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" />
            <path d="M54 18 L57 21 L63 15" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
        <div className="text-center">
          <p className="text-textprimary font-semibold mb-2" style={{ fontSize: 18 }}>
            Your AI evaluation will appear here
          </p>
          <p className="text-textmuted" style={{ fontSize: 14 }}>
            Upload a resume to get started
          </p>
        </div>
      </div>
    )
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="glass-card h-full flex flex-col items-center justify-center gap-6 p-12">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: '#6366F1' }}
              animate={{ y: [0, -12, 0], opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
        <p className="text-textmuted text-sm">Agent is reasoning through the resume…</p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {[70, 90, 55].map((width, i) => (
            <div
              key={i}
              className="shimmer rounded-lg"
              style={{ height: 14, width: `${width}%` }}
            />
          ))}
        </div>
      </div>
    )
  }

  // Results State
  const { evaluation, interview_questions, agent_meta, candidate_id, evaluated_at } = result

  const recommendationConfig = {
    hire: {
      label: 'HIRE',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
      border: 'rgba(16,185,129,0.3)',
      color: '#10B981',
    },
    interview: {
      label: 'INTERVIEW',
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
      border: 'rgba(245,158,11,0.3)',
      color: '#F59E0B',
    },
    reject: {
      label: 'REJECT',
      gradient: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
      border: 'rgba(239,68,68,0.3)',
      color: '#EF4444',
    },
  }

  const rec = recommendationConfig[evaluation.recommendation] || recommendationConfig.interview

  const confidenceColor = {
    high: '#10B981',
    medium: '#F59E0B',
    low: '#EF4444',
  }[evaluation.confidence] || '#64748B'

  const formattedDate = evaluated_at
    ? new Date(evaluated_at).toLocaleString()
    : '—'

  return (
    <div className="glass-card p-8 h-full flex flex-col gap-6 overflow-y-auto">
      {/* 1. Recommendation Header */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex items-center justify-between p-5 rounded-2xl"
        style={{
          background: rec.gradient,
          border: `1px solid ${rec.border}`,
        }}
      >
        <div>
          <p className="text-xs font-semibold text-textmuted uppercase tracking-widest mb-1">Recommendation</p>
          <p className="font-black" style={{ color: rec.color, fontSize: 36, letterSpacing: '-1px' }}>
            {rec.label}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{
              background: `${confidenceColor}18`,
              border: `1px solid ${confidenceColor}40`,
              color: confidenceColor,
            }}
          >
            {evaluation.confidence} Confidence
          </span>
          <span className="text-textmuted" style={{ fontSize: 11 }}>
            {candidate_id}
          </span>
        </div>
      </motion.div>

      {/* 2. Score Rings */}
      <div className="flex justify-center gap-16 py-4">
        <ScoreRing
          score={evaluation.skills_match_score}
          label="Skills Match"
        />
        <ScoreRing
          score={evaluation.experience_match_score}
          label="Experience Match"
        />
      </div>

      {/* 3. Strengths vs Missing Skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strengths */}
        <div
          className="p-5 rounded-2xl"
          style={{
            background: 'rgba(16,185,129,0.05)',
            border: '1px solid rgba(16,185,129,0.15)',
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#10B981' }}>
            ✓ Strengths
          </p>
          <div className="flex flex-col gap-2">
            {evaluation.strengths?.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full mt-[6px] flex-shrink-0" style={{ background: '#10B981' }} />
                <span className="text-textprimary" style={{ fontSize: 13, lineHeight: 1.5 }}>{s}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        <div
          className="p-5 rounded-2xl"
          style={{
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#EF4444' }}>
            ✗ Missing Skills
          </p>
          <div className="flex flex-col gap-2">
            {evaluation.missing_skills?.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full mt-[6px] flex-shrink-0" style={{ background: '#EF4444' }} />
                <span className="text-textprimary" style={{ fontSize: 13, lineHeight: 1.5 }}>{s}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Evidence */}
      <Accordion title="📎 Evidence">
        <div className="flex flex-col gap-4 pt-4">
          {evaluation.evidence?.map((item, i) => (
            <div key={i} className="flex flex-col gap-2">
              <p className="text-textprimary font-medium" style={{ fontSize: 14 }}>{item.claim}</p>
              <div
                className="pl-4 py-2 pr-3 rounded-lg"
                style={{
                  borderLeft: '3px solid #6366F1',
                  background: 'rgba(99,102,241,0.06)',
                }}
              >
                <p className="text-indigo-300 italic" style={{ fontSize: 13 }}>"{item.quote}"</p>
                <p className="text-textmuted mt-1" style={{ fontSize: 11 }}>Section: {item.section}</p>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      {/* 5. Reasoning Trace */}
      <Accordion title="🧠 Agent Reasoning">
        <div
          className="mt-4 rounded-xl p-4"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
        >
          {evaluation.reasoning_trace?.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.12 }}
              className="flex gap-3 mb-2"
            >
              <span className="terminal-text opacity-50 flex-shrink-0">
                {String(i + 1).padStart(2, '0')}.
              </span>
              <span className="terminal-text">{step}</span>
            </motion.div>
          ))}
        </div>
      </Accordion>

      {/* 6. Interview Questions — Tabs */}
      <div>
        <p className="text-textprimary font-semibold mb-4" style={{ fontSize: 16 }}>
          Interview Questions
        </p>
        {/* Tab Bar */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-5"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative flex-1 py-2 text-sm font-semibold rounded-lg transition-colors z-10"
              style={{ color: activeTab === tab ? '#F8FAFC' : '#64748B' }}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
          >
            {interview_questions?.[activeTab]?.map((q, i) => (
              <QuestionCard
                key={i}
                index={i}
                question={q.question}
                rationale={q.rationale}
                expected_signal={q.expected_signal}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 7. Agent Metadata */}
      {agent_meta && (
        <div
          className="flex flex-wrap gap-3 p-4 rounded-2xl"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
        >
          {[
            {
              label: 'Iterations',
              value: `${agent_meta.iterations_used}/${agent_meta.max_iterations}`,
            },
            {
              label: 'Chunks Retrieved',
              value: agent_meta.retrieval_stats?.returned ?? '—',
            },
            {
              label: 'Top Similarity',
              value: agent_meta.retrieval_stats?.top_score?.toFixed(2) ?? '—',
            },
            {
              label: 'Evaluated At',
              value: formattedDate,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-3 py-2 rounded-xl"
              style={{
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.12)',
              }}
            >
              <p className="text-textmuted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </p>
              <p className="text-textprimary font-semibold" style={{ fontSize: 13 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
