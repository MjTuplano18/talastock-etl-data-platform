import {
  ShieldCheck, AlertTriangle, Database,
  Clock, CheckCircle2, XCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { HealthScoreRing } from '@/components/quality/HealthScoreRing'
import { TableHealthPanel } from '@/components/quality/TableHealthPanel'
import { DbtTestInventory } from '@/components/quality/DbtTestInventory'
import { DagRunHistory } from '@/components/quality/DagRunHistory'
import { formatNumber } from '@/lib/utils'
import { TOTAL_DBT_TESTS } from '@/lib/dbtTests'
import { query } from '@/lib/db'
import type { TableHealth } from '@/types'

// ── Data fetching ─────────────────────────────────────────────

async function getTableHealth(): Promise<TableHealth[]> {
  const counts = await query<{ schema: string; table_name: string; row_count: number }>(`
    SELECT 'raw'       AS schema, 'products'             AS table_name, COUNT(*)::int AS row_count FROM raw.products
    UNION ALL SELECT 'raw',       'sales',                               COUNT(*)::int FROM raw.sales
    UNION ALL SELECT 'staging',   'products',                            COUNT(*)::int FROM staging.products
    UNION ALL SELECT 'staging',   'sales',                               COUNT(*)::int FROM staging.sales
    UNION ALL SELECT 'analytics', 'dim_products',                        COUNT(*)::int FROM analytics.dim_products
    UNION ALL SELECT 'analytics', 'dim_dates',                           COUNT(*)::int FROM analytics.dim_dates
    UNION ALL SELECT 'analytics', 'dim_times',                           COUNT(*)::int FROM analytics.dim_times
    UNION ALL SELECT 'analytics', 'fact_sales',                          COUNT(*)::int FROM analytics.fact_sales
    UNION ALL SELECT 'analytics', 'daily_sales_summary',                 COUNT(*)::int FROM analytics.daily_sales_summary
    UNION ALL SELECT 'analytics', 'product_performance',                 COUNT(*)::int FROM analytics.product_performance
    UNION ALL SELECT 'analytics', 'category_performance',                COUNT(*)::int FROM analytics.category_performance
    ORDER BY schema, table_name
  `)

  // Freshness check — only tables that have a usable timestamp
  let freshnessRows: { table_name: string; latest_updated_at: string; freshness_hours: number }[] = []
  try {
    freshnessRows = await query<{
      table_name: string; latest_updated_at: string; freshness_hours: number
    }>(`
      SELECT 'fact_sales'          AS table_name,
             MAX(created_at)::text AS latest_updated_at,
             ROUND(EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 3600, 1)::float AS freshness_hours
      FROM analytics.fact_sales WHERE created_at IS NOT NULL
      UNION ALL
      SELECT 'daily_sales_summary',
             MAX(updated_at)::text,
             ROUND(EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 3600, 1)::float
      FROM analytics.daily_sales_summary WHERE updated_at IS NOT NULL
    `)
  } catch {
    // freshness columns may not exist — degrade gracefully
  }

  const freshnessMap = Object.fromEntries(freshnessRows.map(f => [f.table_name, f]))

  return counts.map(c => ({
    ...c,
    latest_updated_at: freshnessMap[c.table_name]?.latest_updated_at ?? null,
    freshness_hours:   freshnessMap[c.table_name]?.freshness_hours   ?? null,
  }))
}

async function getWarehouseSummary() {
  try {
    const [r] = await query<{ total_rows: number; total_tables: number }>(`
      SELECT
        COALESCE(SUM(n_live_tup), 0)::int AS total_rows,
        COUNT(*)::int                      AS total_tables
      FROM pg_stat_user_tables
      WHERE schemaname IN ('raw', 'staging', 'analytics')
    `)
    return r
  } catch {
    return { total_rows: 0, total_tables: 0 }
  }
}

// ── Page ──────────────────────────────────────────────────────

export default async function QualityPage() {
  const [tableHealth, summary] = await Promise.all([
    getTableHealth().catch(() => [] as TableHealth[]),
    getWarehouseSummary(),
  ])

  const populatedTables = tableHealth.filter(t => t.row_count > 0).length
  const emptyTables     = tableHealth.filter(t => t.row_count === 0).length
  const staleCount      = tableHealth.filter(
    t => t.freshness_hours !== null && t.freshness_hours > 25
  ).length
  const healthScore = tableHealth.length > 0
    ? Math.round((populatedTables / tableHealth.length) * 100)
    : 0

  const scoreColor = healthScore >= 90 ? '#4ADE80'
    : healthScore >= 70 ? '#FBBF24'
    : '#F87171'

  const scoreLabel = healthScore >= 90 ? 'Healthy'
    : healthScore >= 70 ? 'Warning'
    : 'Critical'

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <PageHeader
        title="Data Quality"
        subtitle="Observability across warehouse tables, pipeline runs, and dbt tests"
      />

      {/* ── KPI row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Health score */}
        <div
          className="rounded-2xl p-4 flex items-center gap-4 lg:col-span-1"
          style={{ background: 'var(--card-bg)', border: `1px solid ${scoreColor}30` }}
        >
          <HealthScoreRing score={healthScore} />
          <div className="min-w-0">
            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
              Health Score
            </p>
            <p className="text-sm font-semibold" style={{ color: scoreColor }}>{scoreLabel}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {populatedTables}/{tableHealth.length} tables populated
            </p>
          </div>
        </div>

        {/* dbt tests */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--card-bg)', border: '1px solid rgba(74,222,128,0.25)' }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(74,222,128,0.12)' }}>
            <ShieldCheck className="w-4 h-4" style={{ color: '#4ADE80' }} />
          </div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>dbt Tests Defined</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
            {TOTAL_DBT_TESTS}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: '#4ADE80' }}>across 9 models</p>
        </div>

        {/* Empty tables */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'var(--card-bg)',
            border: emptyTables > 0 ? '1px solid rgba(248,113,113,0.25)' : '1px solid rgba(74,222,128,0.25)',
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ background: emptyTables > 0 ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)' }}>
            {emptyTables > 0
              ? <XCircle className="w-4 h-4" style={{ color: '#F87171' }} />
              : <CheckCircle2 className="w-4 h-4" style={{ color: '#4ADE80' }} />
            }
          </div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Empty Tables</p>
          <p className="text-2xl font-bold tabular-nums"
            style={{ color: emptyTables > 0 ? '#F87171' : '#4ADE80' }}>
            {emptyTables}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {emptyTables === 0 ? 'All tables populated' : 'need attention'}
          </p>
        </div>

        {/* Stale / warehouse size */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'var(--card-bg)',
            border: staleCount > 0 ? '1px solid rgba(251,191,36,0.25)' : '1px solid var(--border)',
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ background: staleCount > 0 ? 'rgba(251,191,36,0.12)' : 'rgba(96,165,250,0.12)' }}>
            {staleCount > 0
              ? <AlertTriangle className="w-4 h-4" style={{ color: '#FBBF24' }} />
              : <Database className="w-4 h-4" style={{ color: '#60A5FA' }} />
            }
          </div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            {staleCount > 0 ? 'Stale Tables' : 'Total Rows'}
          </p>
          <p className="text-2xl font-bold tabular-nums"
            style={{ color: staleCount > 0 ? '#FBBF24' : 'var(--text)' }}>
            {staleCount > 0 ? staleCount : formatNumber(summary?.total_rows ?? 0)}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {staleCount > 0 ? '> 25h since last update' : 'across warehouse'}
          </p>
        </div>
      </div>

      {/* ── Freshness legend ───────────────────────────────── */}
      <div
        className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-4"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
          Freshness:
        </span>
        {[
          { color: '#4ADE80', label: '≤ 25h — Fresh' },
          { color: '#FBBF24', label: '25–72h — Warning' },
          { color: '#F87171', label: '> 72h — Stale' },
          { color: 'var(--text-muted)', label: 'N/A — No timestamp' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <Clock className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Alert threshold: 25h
          </span>
        </div>
      </div>

      {/* ── Main grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TableHealthPanel tables={tableHealth} />
        <DagRunHistory />
      </div>

      {/* ── dbt test inventory ─────────────────────────────── */}
      <DbtTestInventory />

    </div>
  )
}
