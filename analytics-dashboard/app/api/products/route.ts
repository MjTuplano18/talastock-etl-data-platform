import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { ProductPerformance } from '@/types'

export async function GET() {
  try {
    const rows = await query<ProductPerformance>(`
      SELECT
        product_key,
        sku,
        product_name,
        category,
        total_revenue::numeric(12,2)    AS total_revenue,
        total_profit::numeric(12,2)     AS total_profit,
        profit_margin_pct::numeric(5,1) AS profit_margin_pct,
        total_units_sold::int           AS total_units_sold,
        total_transactions::int         AS total_transactions,
        revenue_rank::int               AS revenue_rank
      FROM analytics.product_performance
      ORDER BY revenue_rank ASC
    `)
    return NextResponse.json(rows)
  } catch (err) {
    console.error('Products API error:', err)
    return NextResponse.json({ error: 'Failed to fetch product performance' }, { status: 500 })
  }
}
