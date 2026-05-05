import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to   = searchParams.get('to')
    const dateFilter = from && to
      ? `AND d.date BETWEEN '${from}' AND '${to}'`
      : ''

    const rows = await query<{ method: string; transactions: number; revenue: number; pct: number }>(`
      WITH base AS (
        SELECT
          COALESCE(NULLIF(f.payment_method, 'NaN'), 'Unknown') AS method,
          COUNT(*)::int          AS transactions,
          SUM(f.total_amount)::float AS revenue
        FROM analytics.fact_sales f
        JOIN analytics.dim_dates d ON f.date_key = d.date_key
        WHERE f.total_amount > 0 ${dateFilter}
        GROUP BY 1
      ),
      total AS (SELECT SUM(transactions) AS t FROM base)
      SELECT method, transactions, revenue,
             ROUND((transactions::numeric / total.t * 100), 1)::float AS pct
      FROM base, total
      ORDER BY transactions DESC
    `)

    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
  }
}
