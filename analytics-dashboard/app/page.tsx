import { DollarSign, TrendingUp, ShoppingCart, Package, Tag, BarChart2 } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { ChartCard } from '@/components/ui/ChartCard'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { RevenueAreaChart } from '@/components/charts/RevenueAreaChart'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { resolveDateBounds } from '@/lib/dateRange'
import { query } from '@/lib/db'
import type { DailySalesSummary, CategoryPerformance } from '@/types'

function pctChange(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null
  return ((current - previous) / previous) * 100
}

function prevPeriod(from: string, to: string): { from: string; to: string } {
  const f = new Date(from)
  const t = new Date(to)
  const days = Math.round((t.getTime() - f.getTime()) / 86400000)
  const pf = new Date(f); pf.setDate(pf.getDate() - days - 1)
  const pt = new Date(f); pt.setDate(pt.getDate() - 1)
  return {
    from: pf.toISOString().split('T')[0],
    to:   pt.toISOString().split('T')[0],
  }
}

async function getMetrics(from: string | null, to: string | null) {
  const where = from && to ? `WHERE date BETWEEN '${from}' AND '${to}'` : ''
  const [r] = await query<{
    total_revenue: number; total_profit: number; margin_pct: number
    total_transactions: number; total_units_sold: number; date_range_days: number
  }>(`
    SELECT
      SUM(total_revenue)::float AS total_revenue,
      SUM(total_profit)::float  AS total_profit,
      ROUND(SUM(total_profit)/NULLIF(SUM(total_revenue),0)*100,1)::float AS margin_pct,
      SUM(total_transactions)::int AS total_transactions,
      SUM(total_units_sold)::int   AS total_units_sold,
      COUNT(DISTINCT date)::int    AS date_range_days
    FROM analytics.daily_sales_summary ${where}
  `)
  return {
    total_revenue:      Number(r.total_revenue ?? 0),
    total_profit:       Number(r.total_profit ?? 0),
    margin_pct:         Number(r.margin_pct ?? 0),
    total_transactions: r.total_transactions ?? 0,
    total_units_sold:   r.total_units_sold ?? 0,
    date_range_days:    r.date_range_days ?? 0,
  }
}

async function getCounts() {
  const [r] = await query<{ total_products: number; total_categories: number }>(`
    SELECT COUNT(DISTINCT sku)::int AS total_products,
           COUNT(DISTINCT category)::int AS total_categories
    FROM analytics.dim_products
  `)
  return r
}

async function getDailySales(from: string | null, to: string | null): Promise<DailySalesSummary[]> {
  const where = from && to ? `WHERE date BETWEEN '${from}' AND '${to}'` : ''
  return query<DailySalesSummary>(`
    SELECT TO_CHAR(date,'YYYY-MM-DD') AS date,
           total_revenue::float, total_profit::float,
           total_transactions::int, total_units_sold::int,
           profit_margin_pct::float, average_transaction_value::float
    FROM analytics.daily_sales_summary ${where} ORDER BY date ASC
  `)
}

async function getCategories(from: string | null, to: string | null): Promise<CategoryPerformance[]> {
  if (!from || !to) {
    return query<CategoryPerformance>(`
      SELECT category, total_revenue::float, total_profit::float,
             profit_margin_pct::float, total_units_sold::int,
             total_transactions::int, unique_products::int, revenue_rank::int
      FROM analytics.category_performance ORDER BY revenue_rank ASC
    `)
  }
  return query<CategoryPerformance>(`
    SELECT p.category,
           SUM(f.total_amount)::float AS total_revenue,
           SUM(f.profit)::float AS total_profit,
           ROUND(SUM(f.profit)/NULLIF(SUM(f.total_amount),0)*100,1)::float AS profit_margin_pct,
           SUM(f.quantity)::int AS total_units_sold,
           COUNT(*)::int AS total_transactions,
           COUNT(DISTINCT f.product_key)::int AS unique_products,
           RANK() OVER (ORDER BY SUM(f.total_amount) DESC)::int AS revenue_rank
    FROM analytics.fact_sales f
    JOIN analytics.dim_products p ON f.product_key = p.product_key
    JOIN analytics.dim_dates d    ON f.date_key = d.date_key
    WHERE d.date BETWEEN '${from}' AND '${to}'
    GROUP BY p.category ORDER BY revenue_rank ASC
  `)
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; range?: string }
}) {
  const { from, to } = resolveDateBounds(searchParams)

  // Compute previous period for comparison (only when a range is active)
  const prev = from && to ? prevPeriod(from, to) : null

  const [current, previous, counts, dailySales, categories] = await Promise.all([
    getMetrics(from, to),
    prev ? getMetrics(prev.from, prev.to) : Promise.resolve(null),
    getCounts(),
    getDailySales(from, to),
    getCategories(from, to),
  ])

  const changes = previous ? {
    revenue:      pctChange(current.total_revenue,      previous.total_revenue),
    profit:       pctChange(current.total_profit,       previous.total_profit),
    transactions: pctChange(current.total_transactions, previous.total_transactions),
    units:        pctChange(current.total_units_sold,   previous.total_units_sold),
  } : { revenue: null, profit: null, transactions: null, units: null }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Overview"
          subtitle={`${current.date_range_days} days · ${formatNumber(current.total_transactions)} transactions`}
        />
        <DateRangePicker />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Total Revenue"  value={formatCurrency(current.total_revenue)}
          icon={DollarSign}  color="pink"   change={changes.revenue} />
        <MetricCard label="Total Profit"   value={formatCurrency(current.total_profit)}
          sub={`${formatPercent(current.margin_pct)} margin`}
          icon={TrendingUp}  color="green"  change={changes.profit} />
        <MetricCard label="Transactions"   value={formatNumber(current.total_transactions)}
          icon={ShoppingCart} color="purple" change={changes.transactions} />
        <MetricCard label="Units Sold"     value={formatNumber(current.total_units_sold)}
          icon={BarChart2}    color="amber"  change={changes.units} />
        <MetricCard label="Products"       value={formatNumber(counts.total_products)}
          icon={Package}      color="blue" />
        <MetricCard label="Categories"     value={formatNumber(counts.total_categories)}
          icon={Tag}          color="pink" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard title="Revenue Trend" sub="Daily revenue over selected period" className="xl:col-span-2">
          <RevenueAreaChart data={dailySales} />
        </ChartCard>
        <ChartCard title="Revenue by Category" sub="Total revenue per category">
          <CategoryBarChart data={categories} />
        </ChartCard>
      </div>
    </div>
  )
}
