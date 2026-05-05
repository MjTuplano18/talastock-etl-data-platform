'use client'

import { ShieldCheck } from 'lucide-react'
import { getDbtModelTests, TEST_TYPE_COLORS, LAYER_ORDER, TOTAL_DBT_TESTS } from '@/lib/dbtTests'

const LAYER_META: Record<string, { label: string; color: string; bg: string }> = {
  staging:    { label: 'Staging',    color: '#9B6DFF', bg: 'rgba(155,109,255,0.08)' },
  marts:      { label: 'Marts',      color: '#60A5FA', bg: 'rgba(96,165,250,0.08)'  },
  aggregates: { label: 'Aggregates', color: '#4ADE80', bg: 'rgba(74,222,128,0.08)'  },
}

const TEST_LABELS: Record<string, string> = {
  unique:          'Unique',
  not_null:        'Not Null',
  accepted_values: 'Accepted Values',
  relationships:   'Relationships',
}

export function DbtTestInventory() {
  const models = getDbtModelTests().sort(
    (a, b) => LAYER_ORDER[a.layer] - LAYER_ORDER[b.layer]
  )

  // Count by test type
  const typeCounts: Record<string, number> = {}
  for (const m of models) {
    for (const t of m.tests) {
      typeCounts[t.test] = (typeCounts[t.test] ?? 0) + 1
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--card-bg)' }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>dbt Test Inventory</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {TOTAL_DBT_TESTS} tests defined across {models.length} models
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ShieldCheck className="w-4 h-4" style={{ color: '#4ADE80' }} />
          <span className="text-xs font-semibold" style={{ color: '#4ADE80' }}>
            {TOTAL_DBT_TESTS} tests
          </span>
        </div>
      </div>

      {/* Test type legend */}
      <div className="px-5 py-3 flex flex-wrap gap-3"
        style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-2)' }}>
        {Object.entries(typeCounts).map(([type, count]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: TEST_TYPE_COLORS[type] ?? '#888' }}
            />
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {TEST_LABELS[type] ?? type}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: `${TEST_TYPE_COLORS[type] ?? '#888'}18`,
                color: TEST_TYPE_COLORS[type] ?? '#888',
              }}
            >
              {count}
            </span>
          </div>
        ))}
      </div>

      {/* Model rows */}
      <div className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
        {models.map(m => {
          const layerMeta = LAYER_META[m.layer]

          // Group tests by column for compact display
          const byColumn = m.tests.reduce<Record<string, string[]>>((acc, t) => {
            if (!acc[t.column]) acc[t.column] = []
            acc[t.column].push(t.test)
            return acc
          }, {})

          return (
            <div
              key={m.model}
              className="px-5 py-4 transition-colors cursor-default"
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-row)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Model header */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: layerMeta.bg,
                    color: layerMeta.color,
                    border: `1px solid ${layerMeta.color}30`,
                  }}
                >
                  {layerMeta.label}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {m.model}
                </span>
                <span className="ml-auto text-xs tabular-nums flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {m.total_tests} tests
                </span>
              </div>

              {/* Column test pills */}
              <div className="flex flex-wrap gap-1.5 pl-0">
                {Object.entries(byColumn).map(([col, tests]) => (
                  <div
                    key={col}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px]"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>{col}</span>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <div className="flex gap-1">
                      {tests.map(test => (
                        <span
                          key={test}
                          className="font-medium"
                          style={{ color: TEST_TYPE_COLORS[test] ?? '#888' }}
                        >
                          {TEST_LABELS[test] ?? test}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
