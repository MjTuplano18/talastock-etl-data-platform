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

    const rows = await query<{ hour: number; transactions: number; revenue: number }>(`
      SELECT
        t.hour,
        COUNT(*)::int          AS transactions,
        SUM(f.total_amount)::float AS revenue
      FROM analytics.fact_sales f
      JOIN analytics.dim_times t ON f.time_key = t.time_key
      JOIN analytics.dim_dates d ON f.date_key = d.date_key
      WHERE f.total_amount > 0 ${dateFilter}
      GROUP BY t.hour
      ORDER BY t.hour ASC
    `)

    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch hourly sales' }, { status: 500 })
  }
}
