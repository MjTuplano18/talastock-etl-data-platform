import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to   = searchParams.get('to')
    const where = from && to ? `WHERE date BETWEEN '${from}' AND '${to}'` : ''

    const rows = await query<Record<string, unknown>>(`
      SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date,
             total_revenue, total_profit, profit_margin_pct,
             total_transactions, total_units_sold, average_transaction_value
      FROM analytics.daily_sales_summary
      ${where}
      ORDER BY date ASC
    `)

    const headers = ['Date','Revenue','Profit','Margin %','Transactions','Units Sold','Avg Order Value']
    const csvRows = rows.map(r => [
      r.date, r.total_revenue, r.total_profit, r.profit_margin_pct,
      r.total_transactions, r.total_units_sold, r.average_transaction_value,
    ].join(','))

    const csv = [headers.join(','), ...csvRows].join('\n')
    const filename = from && to ? `sales_${from}_${to}.csv` : 'sales_all.csv'

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
