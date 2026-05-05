'use client'

import { Database } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { PipelineLayerCount } from '@/types'

interface Props {
  row: PipelineLayerCount
  index: number
  maxCount: number
  layerColor: string
  layerBg: string
  isLast: boolean
}

export function PipelineTableRow({ row, index, maxCount, layerColor, layerBg, isLast }: Props) {
  const pct = maxCount > 0 ? Math.max(2, (row.row_count / maxCount) * 100) : 2

  return (
    <div
      className="flex items-center px-5 py-3.5 transition-colors cursor-default"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border-soft)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-row)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Index */}
      <span className="w-6 text-xs tabular-nums mr-3 flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Status dot */}
      <div className="w-2 h-2 rounded-full mr-3 flex-shrink-0"
        style={{
          background: row.row_count > 0 ? '#4ADE80' : '#F87171',
          boxShadow: row.row_count > 0 ? '0 0 6px #4ADE8099' : '0 0 6px #F8717199',
        }} />

      {/* Table name + badge */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Database className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
        <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
          {row.table_name}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
          style={{ background: layerBg, color: layerColor }}>
          {row.layer}
        </span>
      </div>

      {/* Progress bar — wider, more visible */}
      <div className="hidden sm:flex items-center gap-2 ml-4 flex-shrink-0 w-40">
        <div className="flex-1 h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${layerColor}70, ${layerColor})`,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
        <span className="text-[10px] w-8 text-right flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}>
          {Math.round(pct)}%
        </span>
      </div>

      {/* Row count */}
      <span className="text-sm font-semibold tabular-nums ml-4 w-28 text-right flex-shrink-0"
        style={{ color: row.row_count > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
        {formatNumber(row.row_count)}
        <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>rows</span>
      </span>
    </div>
  )
}
