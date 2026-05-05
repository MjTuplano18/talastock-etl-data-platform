import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query<Record<string, unknown>>(`
      SELECT revenue_rank, sku, product_name, category,
             total_revenue, total_profit, profit_margin_pct,
             total_units_sold, total_transactions
      FROM analytics.product_performance
      ORDER BY revenue_rank ASC
    `)

    const headers = ['Rank','SKU','Product','Category','Revenue','Profit','Margin %','Units Sold','Transactions']
    const csvRows = rows.map(r => [
      r.revenue_rank, r.sku, `"${r.product_name}"`, r.category,
      r.total_revenue, r.total_profit, r.profit_margin_pct,
      r.total_units_sold, r.total_transactions,
    ].join(','))

    const csv = [headers.join(','), ...csvRows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="products.csv"',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
