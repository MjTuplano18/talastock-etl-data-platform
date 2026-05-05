import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { DailySalesSummary } from '@/types'

export async function GET() {
  try {
    const rows = await query<DailySalesSummary>(`
      SELECT
        TO_CHAR(date, 'YYYY-MM-DD')       AS date,
        total_revenue::numeric(12,2)      AS total_revenue,
        total_profit::numeric(12,2)       AS total_profit,
        total_transactions::int           AS total_transactions,
        total_units_sold::int             AS total_units_sold,
        profit_margin_pct::numeric(5,1)   AS profit_margin_pct,
        average_transaction_value::numeric(10,2) AS average_transaction_value
      FROM analytics.daily_sales_summary
      ORDER BY date ASC
    `)
    return NextResponse.json(rows)
  } catch (err) {
    console.error('Daily sales API error:', err)
    return NextResponse.json({ error: 'Failed to fetch daily sales' }, { status: 500 })
  }
}
