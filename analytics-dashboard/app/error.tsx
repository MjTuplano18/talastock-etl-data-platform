'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
        <AlertTriangle className="w-6 h-6" style={{ color: '#F87171' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
          Something went wrong
        </p>
        <p className="text-xs max-w-sm" style={{ color: 'var(--text-muted)' }}>
          {error.message?.includes('connect')
            ? 'Could not connect to the warehouse database. Make sure the Docker container is running.'
            : 'An unexpected error occurred while loading this page.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all"
        style={{
          background: 'linear-gradient(135deg, #E8547A, #9B6DFF)',
          color: '#fff',
        }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Try again
      </button>
    </div>
  )
}
