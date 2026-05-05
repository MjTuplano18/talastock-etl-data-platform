import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// ── Types ─────────────────────────────────────────────────────
interface TableHealth {
  schema: string
  table_name: string
  row_count: number
  // freshness: most recent timestamp column value, null if table has none
  latest_updated_at: string | null
  freshness_hours: number | null
}

// ── Queries ───────────────────────────────────────────────────

async function getTableHealth(): Promise<TableHealth[]> {
  // Row counts for every warehouse table
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

  // Freshness: tables that have a timestamp we can check
  const freshness = await query<{
    table_name: string
    latest_updated_at: string
    freshness_hours: number
  }>(`
    SELECT 'fact_sales'           AS table_name,
           MAX(created_at)::text  AS latest_updated_at,
           ROUND(EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 3600, 1)::float AS freshness_hours
    FROM analytics.fact_sales
    WHERE created_at IS NOT NULL
    UNION ALL
    SELECT 'daily_sales_summary',
           MAX(updated_at)::text,
           ROUND(EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 3600, 1)::float
    FROM analytics.daily_sales_summary
    WHERE updated_at IS NOT NULL
  `)

  const freshnessMap = Object.fromEntries(
    freshness.map(f => [f.table_name, f])
  )

  return counts.map(c => ({
    ...c,
    latest_updated_at: freshnessMap[c.table_name]?.latest_updated_at ?? null,
    freshness_hours:   freshnessMap[c.table_name]?.freshness_hours   ?? null,
  }))
}

async function getWarehouseSummary() {
  const [r] = await query<{
    total_rows: number
    total_tables: number
    schemas: number
  }>(`
    SELECT
      (SELECT SUM(n_live_tup)::int FROM pg_stat_user_tables) AS total_rows,
      (SELECT COUNT(*)::int FROM pg_stat_user_tables)        AS total_tables,
      (SELECT COUNT(DISTINCT schemaname)::int FROM pg_stat_user_tables
       WHERE schemaname IN ('raw','staging','analytics'))    AS schemas
  `)
  return r
}

// ── Handler ───────────────────────────────────────────────────
export async function GET() {
  try {
    const [tableHealth, summary] = await Promise.all([
      getTableHealth(),
      getWarehouseSummary(),
    ])

    // Derive health score: % of tables with row_count > 0
    const populated   = tableHealth.filter(t => t.row_count > 0).length
    const healthScore = Math.round((populated / tableHealth.length) * 100)

    // Flag stale tables (> 25 hours since last update)
    const staleCount = tableHealth.filter(
      t => t.freshness_hours !== null && t.freshness_hours > 25
    ).length

    return NextResponse.json({
      health_score:  healthScore,
      stale_count:   staleCount,
      table_health:  tableHealth,
      summary,
    })
  } catch (err) {
    console.error('Quality API error:', err)
    return NextResponse.json({ error: 'Failed to fetch quality data' }, { status: 500 })
  }
}
