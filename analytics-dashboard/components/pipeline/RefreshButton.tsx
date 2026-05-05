'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function RefreshButton() {
  const router = useRouter()
  const [spinning, setSpinning] = useState(false)

  function handleRefresh() {
    setSpinning(true)
    router.refresh()
    setTimeout(() => setSpinning(false), 1000)
  }

  return (
    <button
      onClick={handleRefresh}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
    >
      <RefreshCw
        className="w-3.5 h-3.5 transition-transform duration-700"
        style={{ transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)' }}
      />
      Refresh
    </button>
  )
}
