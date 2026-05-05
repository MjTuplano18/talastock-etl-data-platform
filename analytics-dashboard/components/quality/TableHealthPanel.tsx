'use client'

import { formatNumber } from '@/lib/utils'
import type { TableHealth } from '@/types'

interface TableHealthPanelProps {
  tables: TableHealth[]
}

const LAYER_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  raw:       { label: 'Raw',       color: '#FBBF24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.22)'  },
  staging:   { label: 'Staging',   color: '#9B6DFF', bg: 'rgba(155,109,255,0.08)', border: 'rgba(155,109,255,0.22)' },
  analytics: { label: 'Analytics', color: '#4ADE80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.22)'  },
}

function freshnessLabel(hours: number | null): { text: string; color: string } {
  if (hours === null) return { text: 'N/A', color: 'var(--text-muted)' }
  if (hours <= 1)     return { text: `${Math.round(hours * 60)}m ago`, color: '#4ADE80' }
  if (hours <= 25)    return { text: `${Math.round(hours)}h ago`,      color: '#4ADE80' }
  if (hours <= 72)    return { text: `${Math.round(hours)}h ago`,      color: '#FBBF24' }
  return { text: `${Math.round(hours / 24)}d ago`, color: '#F87171' }
}

export function TableHealthPanel({ tables }: TableHealthPanelProps) {
  const layers = ['raw', 'staging', 'analytics'] as const
  const maxCount = Math.max(...tables.map(t => t.row_count), 1)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--card-bg)' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Table Health</p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Row counts and data freshness per warehouse table
        </p>
      </div>

      {layers.map(layer => {
        const meta   = LAYER_META[layer]
        const subset = tables.filter(t => t.schema === layer)
        if (subset.length === 0) return null

        return (
          <div key={layer}>
            {/* Layer header */}
            <div
              className="px-5 py-2.5 flex items-center gap-2"
              style={{ background: meta.bg, borderBottom: `1px solid ${meta.border}` }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: meta.color }}
              >
                {meta.label} Layer
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: `${meta.color}18`, color: meta.color }}
              >
                {subset.length} tables
              </span>
            </div>

            {/* Table rows */}
            {subset.map((t, i) => {
              const pct = Math.max(2, (t.row_count / maxCount) * 100)
              const fresh = freshnessLabel(t.freshness_hours)
              const isLast = i === subset.length - 1

              return (
                <div
                  key={t.table_name}
                  className="flex items-center px-5 py-3 gap-4 transition-colors cursor-default"
                  style={{ borderBottom: isLast ? '1px solid var(--border-soft)' : '1px solid var(--border-soft)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-row)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Status dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: t.row_count > 0 ? '#4ADE80' : '#F87171',
                      boxShadow: t.row_count > 0 ? '0 0 6px #4ADE8099' : '0 0 6px #F8717199',
                    }}
                  />

                  {/* Table name */}
                  <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {t.table_name}
                  </span>

                  {/* Progress bar */}
                  <div className="hidden sm:flex items-center gap-2 w-32 flex-shrink-0">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${meta.color}70, ${meta.color})`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Freshness */}
                  <span
                    className="text-[11px] tabular-nums w-16 text-right flex-shrink-0"
                    style={{ color: fresh.color }}
                  >
                    {fresh.text}
                  </span>

                  {/* Row count */}
                  <span
                    className="text-sm font-semibold tabular-nums w-24 text-right flex-shrink-0"
                    style={{ color: t.row_count > 0 ? 'var(--text)' : 'var(--text-muted)' }}
                  >
                    {formatNumber(t.row_count)}
                    <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>rows</span>
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
