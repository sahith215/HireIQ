import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ==========================================
// 1. Score Ring Component
// ==========================================
const ScoreRing = memo(function ScoreRing({ score, max = 10, size = 120, label }) {
  const [displayed, setDisplayed] = useState(0)
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset] = useState(circumference) // Start full (0)

  // 0-3 red, 4-6 amber, 7-10 emerald
  const color = score >= 7 ? '#1d9e75' : score >= 4 ? '#ef9f27' : '#e24b4a'

  useEffect(() => {
    // Animate the counter
    let start
    const duration = 600
    const target = score

    const step = (now) => {
      if (!start) start = now
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = target * t // linear for count
      setDisplayed(Math.round(eased))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)

    // Animate the SVG arc over 800ms
    setTimeout(() => {
      const targetOffset = (1 - score / max) * circumference
      setOffset(targetOffset)
    }, 50)
  }, [score, max, circumference])

  return (
    <div className="glass-card flex flex-col items-center justify-center p-6 flex-1 gap-2" style={{ borderRadius: 16 }}>
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
            style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-custom font-bold text-textprimary" style={{ fontSize: 28, lineHeight: 1 }}>{displayed}</span>
        </div>
      </div>
      <p className="font-mono-custom text-textmuted mt-1 uppercase" style={{ fontSize: 13, letterSpacing: '0.05em' }}>{label}</p>
      <span className="text-textmuted text-sm" style={{ opacity: 0.6 }}>{score} / {max}</span>
    </div>
  )
})

// ==========================================
// 2. Accordion Component
// ==========================================
function Accordion({ title, children, defaultOpen = false, icon }) {
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef(null)

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{
        background: open ? 'var(--color-background-secondary)' : 'var(--glass-bg)',
        border: '1px solid var(--color-border-tertiary)',
        transition: 'background 300ms'
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
          <span className="font-semibold text-textprimary" style={{ fontSize: 16 }}>{title}</span>
        </div>
        <motion.svg
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.3 }}
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          className="text-textmuted"
        >
          <polyline points="9 18 15 12 9 6" />
        </motion.svg>
      </button>
      <div 
        ref={contentRef}
        className="overflow-hidden"
        style={{
          maxHeight: open ? `${contentRef.current?.scrollHeight + 100}px` : '0px',
          transition: 'max-height 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="px-5 pb-5 pt-2" style={{ borderTop: '1px solid var(--color-border-tertiary)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. Mini Accordion (for questions rationale)
// ==========================================
function MiniAccordion({ title, children }) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef(null)

  return (
    <div className="mt-3 rounded-lg overflow-hidden" style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-left focus:outline-none"
      >
        <span className="font-medium text-textprimary" style={{ fontSize: 14 }}>{title}</span>
        <motion.svg
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="#64748B" strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </motion.svg>
      </button>
      <div 
        ref={contentRef}
        className="overflow-hidden"
        style={{
          maxHeight: open ? `${contentRef.current?.scrollHeight}px` : '0px',
          transition: 'max-height 300ms ease',
        }}
      >
        <div className="px-3 pb-3 text-textmuted" style={{ fontSize: 14 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 4. Question Card within tabs
// ==========================================
function QuestionCard({ question, rationale, expected_signal, index, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="glass-card relative flex flex-col p-5"
      style={{
        borderLeft: `3px solid ${color}`,
        borderRadius: 12
      }}
    >
      <div className="absolute top-5 right-5 px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${color}15`, color: color }}>
        Q{index + 1}
      </div>
      <p className="text-textprimary font-medium pr-8" style={{ fontSize: 17, lineHeight: 1.6 }}>
        {question}
      </p>
      
      <div className="flex flex-col gap-1 mt-4">
        {rationale && (
          <MiniAccordion title="💡 Why this question">
            {rationale}
          </MiniAccordion>
        )}
        {expected_signal && (
          <MiniAccordion title="🎯 What to listen for">
            <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
              {expected_signal}
            </div>
          </MiniAccordion>
        )}
      </div>
    </motion.div>
  )
}

// ==========================================
// 5. Main ResultsPanel
// ==========================================
export default function ResultsPanel({ result, isLoading }) {
  const [activeTab, setActiveTab] = useState('technical')
  
  const tabs = [
    { id: 'technical', label: 'Technical', color: '#3B82F6' },
    { id: 'behavioral', label: 'Behavioral', color: '#F59E0B' },
    { id: 'scenario_based', label: 'Scenario', color: '#8B5CF6' }
  ]

  // Copy ID
  const doCopy = (text) => {
    navigator.clipboard.writeText(text)
  }

  // ------------------------------------------
  // Empty State
  // ------------------------------------------
  if (!result && !isLoading) {
    return null; // The EvaluatePage layout implies this only renders on loading/result
  }

  // ------------------------------------------
  // Loading State
  // ------------------------------------------
  if (isLoading) {
    return (
      <div className="glass-card h-[400px] flex flex-col items-center justify-center gap-6 p-12 w-full">
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
        <p className="text-textmuted font-medium">Agentic RAG is evaluating the candidate&hellip;</p>
      </div>
    )
  }

  // ------------------------------------------
  // Error Banner State
  // ------------------------------------------
  const isSuccess = result.success !== false && result.evaluation?.success !== false;
  
  if (!isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full flex items-center gap-4 p-5 rounded-2xl glass-card" 
        style={{ borderLeft: '4px solid #EF4444' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span className="text-textprimary font-medium" style={{ fontSize: 16 }}>Evaluation failed — please try again.</span>
      </motion.div>
    )
  }

  // ------------------------------------------
  // Results State
  // ------------------------------------------
  const { evaluation, interview_questions, agent_meta, candidate_id, evaluated_at } = result

  // Hero Display logic
  const recWord = (evaluation.recommendation || 'interview').toLowerCase()
  const recommendationConfig = {
    hire:      { label: 'HIRE',      gradient: 'from-emerald-600 to-teal-500' },
    interview: { label: 'INTERVIEW', gradient: 'from-emerald-600 to-teal-500' },
    maybe:     { label: 'MAYBE',     gradient: 'from-amber-500 to-orange-400' },
    reject:    { label: 'REJECT',    gradient: 'from-red-600 to-rose-500'     }
  }
  const rec = recommendationConfig[recWord] || recommendationConfig.interview

  const confidenceColor = {
    high: '#10B981', // green
    medium: '#F59E0B', // amber
    low: '#EF4444', // red
  }[evaluation.confidence?.toLowerCase()] || '#F59E0B'

  // Date parsing
  let formattedDate = '—'
  if (evaluated_at) {
    try {
      const d = new Date(evaluated_at)
      formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' +
                      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch {
      formattedDate = evaluated_at
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ======================================= */}
      {/* 1. Cinematic Hero Section               */}
      {/* ======================================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`flex flex-col md:flex-row items-center justify-between p-10 md:p-14 rounded-2xl w-full relative overflow-hidden bg-gradient-to-br ${rec.gradient}`}
      >
        <div className="flex flex-col gap-1 z-10 w-full text-center md:text-left">
          <p className="text-sm font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Recommendation</p>
          <h1 className="font-display font-black text-white m-0" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', lineHeight: 1, letterSpacing: '0.05em' }}>
            {rec.label}
          </h1>
        </div>

        <div className="flex flex-col md:items-end gap-3 mt-6 md:mt-0 z-10 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-2"
            style={{
              background: `rgba(0,0,0,0.2)`,
              boxShadow: `0 0 0 4px ${confidenceColor}33`,
              color: confidenceColor,
            }}
          >
            <span className="w-2 h-2 rounded-full animation-pulse-fast" style={{ background: confidenceColor, boxShadow: `0 0 8px ${confidenceColor}` }} />
            {evaluation.confidence || 'Medium'} Confidence
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md backdrop-blur-md cursor-pointer hover:bg-black/40 transition-colors" 
               style={{ background: 'rgba(0,0,0,0.25)' }}
               onClick={() => doCopy(candidate_id || 'CAND_UNKN0WN')}
          >
            <span className="font-mono-custom text-white" style={{ fontSize: 14 }}>
              {candidate_id || 'CAND_UNKN0WN'}
            </span>
            <svg className="text-white/60" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </div>
          
          <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>{formattedDate}</span>
          </div>
        </div>
      </motion.div>

      {/* ======================================= */}
      {/* 2. Score Section                        */}
      {/* ======================================= */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col md:flex-row justify-center gap-6 w-full"
      >
        <ScoreRing
          score={evaluation.skills_match_score || 0}
          label="SKILLS MATCH"
        />
        <ScoreRing
          score={evaluation.experience_match_score || 0}
          label="EXPERIENCE MATCH"
        />
      </motion.div>

      {/* ======================================= */}
      {/* 3. Strengths & Missing Skills           */}
      {/* ======================================= */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="flex flex-col gap-3">
          <p className="font-display font-semibold text-textprimary mb-1">Strengths</p>
          <div className="flex flex-wrap gap-2">
            {!evaluation.strengths || evaluation.strengths.length === 0 ? (
              <span className="text-textmuted italic flex items-center gap-1" style={{ fontSize: 14 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                No strengths detected
              </span>
            ) : (
              evaluation.strengths.map((s, i) => (
                <div key={i} className="px-3 py-1.5 rounded-md flex items-center gap-2" style={{ background: 'rgba(29, 158, 117, 0.12)', borderLeft: '2px solid #1d9e75' }}>
                  <span style={{ color: '#1d9e75', fontWeight: 'bold' }}>✓</span>
                  <span className="text-textprimary" style={{ fontSize: 14, fontFamily: 'inherit' }}>{s}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-display font-semibold text-textprimary mb-1">Missing Skills</p>
          <div className="flex flex-wrap gap-2">
            {!evaluation.missing_skills || evaluation.missing_skills.length === 0 ? (
              <span className="text-textmuted italic" style={{ fontSize: 14 }}>None identified</span>
            ) : (
              evaluation.missing_skills.map((s, i) => {
                if (s.includes("truncated")) {
                  return (
                    <div key={i} className="px-3 py-2 w-full rounded-md flex items-center gap-2 italic text-textmuted" style={{ background: 'var(--color-background-secondary)', borderLeft: '2px solid #64748B' }}>
                      <span>⏱</span>
                      <span style={{ fontSize: 14 }}>Analysis was truncated due to response length</span>
                    </div>
                  )
                }
                return (
                  <div key={i} className="px-3 py-1.5 rounded-md flex items-center gap-2" style={{ background: 'rgba(239, 159, 39, 0.12)', borderLeft: '2px solid #ef9f27' }}>
                    <span style={{ color: '#ef9f27', fontWeight: 'bold' }}>⚠</span>
                    <span className="text-textprimary" style={{ fontSize: 14 }}>{s}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* ======================================= */}
      {/* 4. Reasoning Trace & Evidence Accordions*/}
      {/* ======================================= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="w-full flex flex-col mt-4"
      >
        <Accordion title="Agent Reasoning Trace" icon="🧠">
          <div className="flex flex-col gap-4 mt-2">
            {evaluation.reasoning_trace?.map((step, i) => {
              if (step.includes("truncated")) {
                return (
                  <div key={i} className="text-textmuted italic flex items-center gap-2 py-2" style={{ fontSize: 14 }}>
                    ⏱ Analysis was truncated due to response length limit
                  </div>
                )
              }
              return (
                <div key={i} className="flex gap-3 items-start animate-fade-in-stagger" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-mono-custom text-xs" style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--glass-border)', color: 'var(--color-primary)' }}>
                    {i + 1}
                  </div>
                  <div className="text-textprimary" style={{ fontSize: 15, lineHeight: 1.6, paddingTop: 1 }}>
                    {step}
                  </div>
                </div>
              )
            })}
          </div>
        </Accordion>

        <Accordion title="Evidence Collected" icon="📎">
          <div className="flex flex-col pl-3 pt-2">
            {!evaluation.evidence || evaluation.evidence.length === 0 ? (
              <span className="text-textmuted italic" style={{ fontSize: 14 }}>No evidence was collected</span>
            ) : (
              evaluation.evidence.map((item, i) => (
                <div key={i} className="relative pl-6 pb-6 animate-fade-in-stagger" style={{ animationDelay: `${i * 80}ms` }}>
                  {/* Timeline line */}
                  {i !== evaluation.evidence.length - 1 && (
                    <div className="absolute top-2 left-[5px] w-[2px] h-full" style={{ background: 'var(--color-border-tertiary)' }} />
                  )}
                  {/* Timeline dot */}
                  <div className="absolute top-[6px] left-0 w-[12px] h-[12px] rounded-full" style={{ background: 'var(--color-primary)' }} />
                  
                  <p className="text-textprimary font-medium" style={{ fontSize: 15 }}>{item.claim}</p>
                  <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--color-background-secondary)', borderLeft: '3px solid var(--color-primary)' }}>
                    <p className="text-indigo-300 italic mb-1" style={{ fontSize: 14 }}>"{item.quote}"</p>
                    <p className="font-mono-custom text-textmuted" style={{ fontSize: 11 }}>SECTION: {item.section}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Accordion>
      </motion.div>

      {/* ======================================= */}
      {/* 5. Interview Questions                  */}
      {/* ======================================= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="w-full flex flex-col mt-4"
      >
        <p className="font-display font-semibold text-textprimary mb-4" style={{ fontSize: 20 }}>
          Interview Questions
        </p>

        {/* Tab Bar */}
        <div className="flex gap-2 p-1.5 rounded-xl mb-6 glass-card w-full md:w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-6 py-2 text-sm font-semibold rounded-lg transition-colors z-10 w-full md:w-auto"
                style={{
                  color: isActive ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: tab.color, zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 w-full"
          >
            {interview_questions?.[activeTab]?.map((q, i) => (
              <QuestionCard
                key={i}
                index={i}
                question={q.question}
                rationale={q.rationale}
                expected_signal={q.expected_signal}
                color={tabs.find(t => t.id === activeTab)?.color}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ======================================= */}
      {/* 6. Agent Meta Strip                     */}
      {/* ======================================= */}
      {agent_meta && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="w-full mt-6"
        >
          <div className="glass-card w-full p-6 flex flex-wrap gap-6 items-center rounded-2xl">
            {/* Iterations */}
            <div className="flex flex-col gap-1 min-w-[120px]">
              <span className="font-mono-custom text-textmuted text-xs tracking-wider uppercase">Iterations</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-display text-textprimary" style={{ fontSize: 24, lineHeight: 1 }}>{agent_meta.iterations_used} <span style={{ opacity: 0.4, fontSize: 16 }}>/ {agent_meta.max_iterations}</span></span>
                <div className="flex gap-1" style={{ height: 6 }}>
                  {Array.from({ length: agent_meta.max_iterations || 4 }).map((_, i) => (
                    <div key={i} className="w-6 rounded-sm" style={{ background: i < agent_meta.iterations_used ? 'var(--color-primary)' : 'var(--glass-border)' }}></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Chunks */}
            <div className="flex flex-col gap-1 min-w-[120px]">
              <span className="font-mono-custom text-textmuted text-xs tracking-wider uppercase">Total Chunks</span>
              <span className="font-display text-textprimary mt-1" style={{ fontSize: 24, lineHeight: 1 }}>{agent_meta.retrieval_stats?.total ?? '—'}</span>
            </div>

            {/* Retrieved */}
            <div className="flex flex-col gap-1 min-w-[120px]">
              <span className="font-mono-custom text-textmuted text-xs tracking-wider uppercase">Retrieved</span>
              <span className="font-display text-textprimary mt-1" style={{ fontSize: 24, lineHeight: 1 }}>{agent_meta.retrieval_stats?.returned ?? '—'}</span>
            </div>

            {/* Top Score */}
            <div className="flex flex-col gap-1 min-w-[150px]">
              <span className="font-mono-custom text-textmuted text-xs tracking-wider uppercase">Top Similarity</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-display text-textprimary" style={{ fontSize: 24, lineHeight: 1 }}>{agent_meta.retrieval_stats?.top_score?.toFixed(2) ?? '—'}</span>
                {agent_meta.retrieval_stats?.top_score && (
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(agent_meta.retrieval_stats.top_score * 100, 100)}%`, background: agent_meta.retrieval_stats.top_score >= 0.7 ? '#10B981' : agent_meta.retrieval_stats.top_score >= 0.5 ? '#F59E0B' : '#EF4444' }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Sections */}
            {agent_meta.retrieval_stats?.sections && agent_meta.retrieval_stats.sections.length > 0 && (
              <div className="flex flex-col gap-2 ml-auto">
                 <span className="font-mono-custom text-textmuted text-xs tracking-wider uppercase">Sections Retrieved</span>
                 <div className="flex gap-2 flex-wrap">
                   {agent_meta.retrieval_stats.sections.map(sec => (
                     <span key={sec} className="px-2 py-0.5 rounded text-xs font-mono-custom" style={{ background: 'rgba(99,102,241,0.1)', color: '#8B5CF6' }}>{sec}</span>
                   ))}
                 </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
