import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { CategoryPerformance } from '@/types'

export async function GET() {
  try {
    const rows = await query<CategoryPerformance>(`
      SELECT
        category,
        total_revenue::numeric(12,2)    AS total_revenue,
        total_profit::numeric(12,2)     AS total_profit,
        profit_margin_pct::numeric(5,1) AS profit_margin_pct,
        total_units_sold::int           AS total_units_sold,
        total_transactions::int         AS total_transactions,
        unique_products::int            AS unique_products,
        revenue_rank::int               AS revenue_rank
      FROM analytics.category_performance
      ORDER BY revenue_rank ASC
    `)
    return NextResponse.json(rows)
  } catch (err) {
    console.error('Categories API error:', err)
    return NextResponse.json({ error: 'Failed to fetch category performance' }, { status: 500 })
  }
}
