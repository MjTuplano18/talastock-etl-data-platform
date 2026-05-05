import { ArrowRight, Layers, BarChart3, FileText } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { query } from '@/lib/db'
import { PipelineTableRow } from '@/components/pipeline/PipelineTableRow'
import { PipelineControlPanel } from '@/components/pipeline/PipelineControlPanel'
import { PageHeader } from '@/components/layout/PageHeader'
import { RefreshButton } from '@/components/pipeline/RefreshButton'
import type { PipelineLayerCount } from '@/types'

async function getPipeline(): Promise<PipelineLayerCount[]> {
  return query<PipelineLayerCount>(
    `SELECT 'raw'       AS layer, 'products'            AS table_name, COUNT(*)::int AS row_count FROM raw.products
     UNION ALL SELECT 'raw',      'sales',                             COUNT(*)::int FROM raw.sales
     UNION ALL SELECT 'staging',  'products',                          COUNT(*)::int FROM staging.products
     UNION ALL SELECT 'staging',  'sales',                             COUNT(*)::int FROM staging.sales
     UNION ALL SELECT 'analytics','dim_products',                      COUNT(*)::int FROM analytics.dim_products
     UNION ALL SELECT 'analytics','dim_dates',                         COUNT(*)::int FROM analytics.dim_dates
     UNION ALL SELECT 'analytics','dim_times',                         COUNT(*)::int FROM analytics.dim_times
     UNION ALL SELECT 'analytics','fact_sales',                        COUNT(*)::int FROM analytics.fact_sales
     UNION ALL SELECT 'analytics','daily_sales_summary',               COUNT(*)::int FROM analytics.daily_sales_summary
     UNION ALL SELECT 'analytics','product_performance',               COUNT(*)::int FROM analytics.product_performance
     UNION ALL SELECT 'analytics','category_performance',              COUNT(*)::int FROM analytics.category_performance
     ORDER BY layer, table_name`
  )
}

const layerMeta = {
  raw: {
    label:       'Raw Layer',
    description: 'Exact copy from source CSVs — no transformations',
    color:       '#FBBF24',
    bg:          'rgba(251,191,36,0.08)',
    border:      'rgba(251,191,36,0.22)',
    icon:        FileText,
    step:        '01',
  },
  staging: {
    label:       'Staging Layer',
    description: 'Cleaned, typed, and deduplicated data',
    color:       '#9B6DFF',
    bg:          'rgba(155,109,255,0.08)',
    border:      'rgba(155,109,255,0.22)',
    icon:        Layers,
    step:        '02',
  },
  analytics: {
    label:       'Analytics Layer',
    description: 'Star schema — dimensions, facts, and aggregates',
    color:       '#4ADE80',
    bg:          'rgba(74,222,128,0.08)',
    border:      'rgba(74,222,128,0.22)',
    icon:        BarChart3,
    step:        '03',
  },
} as const

type LayerKey = keyof typeof layerMeta

export default async function PipelinePage() {
  const data = await getPipeline()

  const grouped = data.reduce<Record<string, PipelineLayerCount[]>>((acc, row) => {
    if (!acc[row.layer]) acc[row.layer] = []
    acc[row.layer].push(row)
    return acc
  }, {})

  const layers: LayerKey[] = ['raw', 'staging', 'analytics']

  return (
    <div className="space-y-8">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Pipeline Status"
          subtitle="End-to-end data flow from source CSVs to analytics warehouse"
        />
        <RefreshButton />
      </div>

      {/* ── Pipeline Controls ────────────────────────────────────── */}
      <PipelineControlPanel />

      {/* ── Stepper ─────────────────────────────────────────────── */}
      <div className="flex items-stretch gap-0">
        {layers.map((layer, i) => {
          const meta = layerMeta[layer]
          const tables = grouped[layer] || []
          const total = tables.reduce((s, t) => s + t.row_count, 0)
          const allHealthy = tables.every(t => t.row_count > 0)
          const Icon = meta.icon

          return (
            <div key={layer} className="flex items-center flex-1 min-w-0">
              {/* Card */}
              <div
                className="flex-1 rounded-2xl p-5 min-w-0"
                style={{
                  background: meta.bg,
                  border: `1.5px solid ${meta.border}`,
                  boxShadow: `0 0 0 1px ${meta.border}`,
                }}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${meta.color}20` }}>
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase"
                      style={{ color: meta.color }}>
                      Step {meta.step}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: allHealthy ? '#4ADE80' : '#F87171',
                        boxShadow: allHealthy ? '0 0 6px #4ADE8099' : '0 0 6px #F8717199',
                      }} />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {allHealthy ? 'Healthy' : 'Empty'}
                    </span>
                  </div>
                </div>

                {/* Name + description */}
                <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text)' }}>
                  {meta.label}
                </p>
                <p className="text-[11px] leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                  {meta.description}
                </p>

                {/* Stats row */}
                <div className="flex items-end justify-between pt-3"
                  style={{ borderTop: `1px solid ${meta.border}` }}>
                  <div>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                      {formatNumber(total)}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>total rows</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold" style={{ color: meta.color }}>
                      {tables.length}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>tables</p>
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              {i < 2 && (
                <div className="flex flex-col items-center px-3 flex-shrink-0">
                  <ArrowRight className="w-5 h-5" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Layer detail panels ──────────────────────────────────── */}
      <div className="space-y-5">
        {layers.map(layer => {
          const meta = layerMeta[layer]
          const tables = grouped[layer] || []
          const maxCount = Math.max(...tables.map(t => t.row_count), 1)

          return (
            <div key={layer} className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--card-bg)' }}>

              {/* Panel header */}
              <div className="px-5 py-4 flex items-center gap-3"
                style={{ borderBottom: '1px solid var(--border)', background: meta.bg }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${meta.color}20` }}>
                  <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{meta.label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{meta.description}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0"
                  style={{
                    background: `${meta.color}18`,
                    color: meta.color,
                    border: `1px solid ${meta.border}`,
                  }}>
                  {tables.length} {tables.length === 1 ? 'table' : 'tables'}
                </span>
              </div>

              {/* Column headers */}
              <div className="flex items-center px-5 py-2"
                style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-2)' }}>
                <span className="w-6 mr-3" />
                <span className="w-3 mr-3" />
                <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}>Table</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider mr-3 hidden sm:block w-32 text-right"
                  style={{ color: 'var(--text-muted)' }}>Fill</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider w-28 text-right"
                  style={{ color: 'var(--text-muted)' }}>Row Count</span>
              </div>

              {/* Rows */}
              <div>
                {tables.map((t, i) => (
                  <PipelineTableRow
                    key={t.table_name}
                    row={t}
                    index={i}
                    maxCount={maxCount}
                    layerColor={meta.color}
                    layerBg={meta.bg}
                    isLast={i === tables.length - 1}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
