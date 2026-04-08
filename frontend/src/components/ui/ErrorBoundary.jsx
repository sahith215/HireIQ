import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[HireIQ ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--color-bg)' }}
        >
          <div className="glass-card p-8 max-w-md w-full text-center flex flex-col gap-4">
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-textprimary">Something went wrong</h2>
            <p className="text-textmuted text-sm" style={{ wordBreak: 'break-word' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
