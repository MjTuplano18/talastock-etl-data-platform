import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { OverviewMetrics } from '@/types'

export async function GET() {
  try {
    const [metrics] = await query<OverviewMetrics>(`
      SELECT
        SUM(total_revenue)::float              AS total_revenue,
        SUM(total_profit)::float               AS total_profit,
        ROUND(SUM(total_profit) / NULLIF(SUM(total_revenue), 0) * 100, 1)::float AS margin_pct,
        SUM(total_transactions)::int           AS total_transactions,
        SUM(total_units_sold)::int             AS total_units_sold,
        COUNT(DISTINCT date)::int              AS date_range_days
      FROM analytics.daily_sales_summary
    `)

    const [counts] = await query<{ total_products: number; total_categories: number }>(`
      SELECT
        COUNT(DISTINCT sku)::int      AS total_products,
        COUNT(DISTINCT category)::int AS total_categories
      FROM analytics.dim_products
    `)

    return NextResponse.json({ ...metrics, ...counts })
  } catch (err) {
    console.error('Overview API error:', err)
    return NextResponse.json({ error: 'Failed to fetch overview metrics' }, { status: 500 })
  }
}
