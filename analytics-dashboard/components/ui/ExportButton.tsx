'use client'

import { Download } from 'lucide-react'
import { useState } from 'react'

interface ExportButtonProps {
  url: string
  filename: string
  label?: string
}

export function ExportButton({ url, filename, label = 'Export CSV' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = filename
      a.click()
      URL.revokeObjectURL(href)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
    >
      <Download className="w-3.5 h-3.5" />
      {loading ? 'Exporting…' : label}
    </button>
  )
}
