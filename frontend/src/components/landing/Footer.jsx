import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative py-16 px-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <span className="block font-black text-2xl gradient-text-primary mb-3" style={{ letterSpacing: '-0.5px' }}>
              HireIQ
            </span>
            <p className="text-textmuted" style={{ fontSize: 14, lineHeight: 1.7 }}>
              AI-Powered Hiring Intelligence.<br />
              Evaluate faster. Hire smarter.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-textmuted uppercase tracking-widest mb-1">Navigation</span>
            <Link to="/" className="text-textmuted hover:text-textprimary transition-colors text-sm">Home</Link>
            <a href="/#how-it-works" className="text-textmuted hover:text-textprimary transition-colors text-sm">How It Works</a>
            <Link to="/evaluate" className="text-textmuted hover:text-textprimary transition-colors text-sm">Evaluate</Link>
          </div>

          {/* Tech */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-textmuted uppercase tracking-widest mb-1">Technology</span>
            <span className="text-textmuted text-sm">Built with Agentic RAG ✦</span>
            <span className="text-textmuted text-sm">Powered by Gemini</span>
            <span className="text-textmuted text-sm">n8n Orchestration</span>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-textmuted" style={{ fontSize: 13 }}>
            © 2026 HireIQ. All rights reserved.
          </span>
          <span
            className="text-xs font-medium"
            style={{
              background: 'linear-gradient(90deg, #6366F1, #06B6D4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Deeply Engineered ✦ Quietly Premium
          </span>
        </div>
      </div>
    </footer>
  )
}
