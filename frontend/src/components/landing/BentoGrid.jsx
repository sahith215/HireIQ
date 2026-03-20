import { useRef } from 'react'
import { motion } from 'framer-motion'

// Animated SVG: ReAct loop nodes
function AgenticReasoningViz() {
  const nodes = [
    { cx: 80, cy: 60, label: 'Thought', color: '#6366F1' },
    { cx: 220, cy: 60, label: 'Action', color: '#8B5CF6' },
    { cx: 300, cy: 140, label: 'Obs.', color: '#06B6D4' },
    { cx: 160, cy: 170, label: 'Loop', color: '#6366F1' },
  ]
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
  ]

  return (
    <svg viewBox="0 0 380 230" className="w-full h-full" style={{ maxHeight: 180 }}>
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill="rgba(99,102,241,0.6)" />
        </marker>
      </defs>
      {edges.map(([from, to], i) => (
        <line
          key={i}
          x1={nodes[from].cx} y1={nodes[from].cy}
          x2={nodes[to].cx} y2={nodes[to].cy}
          stroke="rgba(99,102,241,0.25)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          markerEnd="url(#arrowhead)"
          className="flow-line"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.cx} cy={n.cy} r={24}
            fill={`${n.color}18`}
            stroke={n.color}
            strokeWidth="1.5"
            className="node-pulse"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
          <text
            x={n.cx} y={n.cy + 4}
            textAnchor="middle"
            fill={n.color}
            fontSize="11"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// Animated chunks
function SemanticChunkingViz() {
  const chunks = [
    { label: 'Skills', color: '#6366F1', delay: 0 },
    { label: 'Experience', color: '#8B5CF6', delay: 0.3 },
    { label: 'Education', color: '#06B6D4', delay: 0.6 },
    { label: 'Projects', color: '#10B981', delay: 0.9 },
  ]

  return (
    <div className="flex flex-col gap-2 mt-2">
      {chunks.map((chunk) => (
        <motion.div
          key={chunk.label}
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: chunk.delay, ease: [0.4, 0, 0.2, 1] }}
          style={{ originX: 0 }}
          className="flex items-center gap-2"
        >
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: `${chunk.color}15`,
              border: `1px solid ${chunk.color}35`,
              color: chunk.color,
            }}
          >
            [{chunk.label}]
          </span>
          <div
            className="flex-1 h-1.5 rounded-full"
            style={{ background: `${chunk.color}20` }}
          >
            <motion.div
              initial={{ width: '0%' }}
              whileInView={{ width: '75%' }}
              viewport={{ once: false }}
              transition={{ duration: 0.7, delay: chunk.delay + 0.2 }}
              className="h-full rounded-full"
              style={{ background: chunk.color }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Vector retrieval scores
function VectorRetrievalViz() {
  const scores = [
    { section: 'React Skills', score: 0.84, color: '#6366F1' },
    { section: 'AWS Exp.', score: 0.72, color: '#8B5CF6' },
    { section: 'Leadership', score: 0.58, color: '#06B6D4' },
    { section: 'Education', score: 0.46, color: '#10B981' },
  ]

  return (
    <div className="flex flex-col gap-3 mt-3">
      {scores.map((item) => (
        <div key={item.section} className="flex items-center gap-3">
          <span className="text-xs text-textmuted w-20 flex-shrink-0">{item.section}</span>
          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--glass-border)' }}>
            <motion.div
              initial={{ width: '0%' }}
              whileInView={{ width: `${item.score * 100}%` }}
              viewport={{ once: false }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}80)` }}
            />
          </div>
          <span className="text-xs font-mono" style={{ color: item.color }}>{item.score}</span>
        </div>
      ))}
    </div>
  )
}

const features = [
  {
    id: 'agentic',
    title: 'Agentic Reasoning',
    subtitle: 'ReAct loop: Thought → Action → Observation',
    size: 'large',
    content: <AgenticReasoningViz />,
  },
  {
    id: 'chunking',
    title: 'Semantic Chunking',
    subtitle: 'Resume sections extracted automatically',
    size: 'medium',
    content: <SemanticChunkingViz />,
  },
  {
    id: 'retrieval',
    title: 'Vector Retrieval',
    subtitle: 'Similarity-scored context lookup',
    size: 'medium',
    content: <VectorRetrievalViz />,
  },
  {
    id: 'zero-hall',
    title: 'Zero Hallucination',
    subtitle: 'Evidence-backed scoring only.',
    size: 'small',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="16" stroke="#10B981" strokeWidth="1.5" fill="none" />
        <path d="M14 20 L18 24 L26 16" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: '#10B981',
  },
  {
    id: 'instant',
    title: 'Instant Questions',
    subtitle: '9 interview questions per eval.',
    size: 'small',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M20 6 L24 16 L34 16 L26 22 L29 32 L20 26 L11 32 L14 22 L6 16 L16 16 Z" stroke="#F59E0B" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      </svg>
    ),
    color: '#F59E0B',
  },

]

export default function BentoGrid() {
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2
            className="font-extrabold text-textprimary"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-1.5px' }}
          >
            Built on{' '}
            <span className="gradient-text-primary">Deep AI</span>
          </h2>
          <p className="text-textmuted mt-4 max-w-lg mx-auto" style={{ fontSize: 16 }}>
            Every component is engineered for precision hiring decisions.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="bento-grid">
          {/* Large card */}
          {features.filter(f => f.size === 'large').map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(99,102,241,0.2)' }}
              className="glass-card p-8 bento-large"
            >
              <div className="text-xs font-bold tracking-widest text-indigo-500 mb-2 uppercase">Feature</div>
              <h3 className="text-textprimary font-semibold mb-1" style={{ fontSize: 20 }}>{f.title}</h3>
              <p className="text-textmuted mb-4" style={{ fontSize: 13 }}>{f.subtitle}</p>
              {f.content}
            </motion.div>
          ))}

          {/* Medium cards */}
          {features.filter(f => f.size === 'medium').map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(99,102,241,0.2)' }}
              className="glass-card p-8"
            >
              <div className="text-xs font-bold tracking-widest text-indigo-500 mb-2 uppercase">Feature</div>
              <h3 className="text-textprimary font-semibold mb-1" style={{ fontSize: 20 }}>{f.title}</h3>
              <p className="text-textmuted mb-4" style={{ fontSize: 13 }}>{f.subtitle}</p>
              {f.content}
            </motion.div>
          ))}

          {/* Small cards */}
          {features.filter(f => f.size === 'small').map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(99,102,241,0.2)' }}
              className="glass-card p-8"
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="font-semibold mb-1" style={{ color: f.color, fontSize: 18 }}>{f.title}</h3>
              <p className="text-textmuted" style={{ fontSize: 13 }}>{f.subtitle}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
