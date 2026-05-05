import { ChartCard } from '@/components/ui/ChartCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { ExportButton } from '@/components/ui/ExportButton'
import { RevenueAreaChart } from '@/components/charts/RevenueAreaChart'
import { ProfitLineChart } from '@/components/charts/ProfitLineChart'
import { HourlySalesChart } from '@/components/charts/HourlySalesChart'
import { PaymentMethodChart } from '@/components/charts/PaymentMethodChart'
import { CustomerTypeChart } from '@/components/charts/CustomerTypeChart'
import { DailySalesTable } from '@/components/tables/DailySalesTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { resolveDateBounds } from '@/lib/dateRange'
import { query } from '@/lib/db'
import type { DailySalesSummary } from '@/types'

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

async function getHourlySales(from: string | null, to: string | null) {
  const df = from && to ? `AND d.date BETWEEN '${from}' AND '${to}'` : ''
  return query<{ hour: number; transactions: number; revenue: number }>(`
    SELECT t.hour, COUNT(*)::int AS transactions, SUM(f.total_amount)::float AS revenue
    FROM analytics.fact_sales f
    JOIN analytics.dim_times t ON f.time_key = t.time_key
    JOIN analytics.dim_dates d ON f.date_key = d.date_key
    WHERE f.total_amount > 0 ${df}
    GROUP BY t.hour ORDER BY t.hour ASC
  `)
}

async function getPaymentMethods(from: string | null, to: string | null) {
  const df = from && to ? `AND d.date BETWEEN '${from}' AND '${to}'` : ''
  return query<{ method: string; transactions: number; revenue: number; pct: number }>(`
    WITH base AS (
      SELECT COALESCE(NULLIF(f.payment_method,'NaN'),'Unknown') AS method,
             COUNT(*)::int AS transactions, SUM(f.total_amount)::float AS revenue
      FROM analytics.fact_sales f
      JOIN analytics.dim_dates d ON f.date_key = d.date_key
      WHERE f.total_amount > 0 ${df} GROUP BY 1
    ), total AS (SELECT SUM(transactions) AS t FROM base)
    SELECT method, transactions, revenue,
           ROUND((transactions::numeric/total.t*100),1)::float AS pct
    FROM base, total ORDER BY transactions DESC
  `)
}

async function getCustomerTypes(from: string | null, to: string | null) {
  const df = from && to ? `AND d.date BETWEEN '${from}' AND '${to}'` : ''
  return query<{ customer_type: string; transactions: number; revenue: number; avg_order: number }>(`
    SELECT COALESCE(NULLIF(f.customer_type,'NaN'),'Unknown') AS customer_type,
           COUNT(*)::int AS transactions,
           SUM(f.total_amount)::float AS revenue,
           ROUND(AVG(f.total_amount),2)::float AS avg_order
    FROM analytics.fact_sales f
    JOIN analytics.dim_dates d ON f.date_key = d.date_key
    WHERE f.total_amount > 0 ${df}
    GROUP BY 1 ORDER BY transactions DESC
  `)
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; range?: string }
}) {
  const { from, to } = resolveDateBounds(searchParams)

  const [data, hourlyData, paymentData, customerData] = await Promise.all([
    getDailySales(from, to),
    getHourlySales(from, to),
    getPaymentMethods(from, to),
    getCustomerTypes(from, to),
  ])

  const totalRevenue = data.reduce((s, d) => s + Number(d.total_revenue), 0)
  const totalProfit  = data.reduce((s, d) => s + Number(d.total_profit), 0)
  const totalTxns    = data.reduce((s, d) => s + Number(d.total_transactions), 0)
  const totalUnits   = data.reduce((s, d) => s + Number(d.total_units_sold), 0)
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  const best         = data.length > 0
    ? data.reduce((a, b) => Number(a.total_revenue) > Number(b.total_revenue) ? a : b)
    : null

  const exportUrl = from && to ? `/api/export/sales?from=${from}&to=${to}` : '/api/export/sales'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Sales Analytics" subtitle={`${data.length} days of data`} />
        <div className="flex items-center gap-2">
          <ExportButton url={exportUrl} filename="sales.csv" />
          <DateRangePicker />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Revenue"      value={formatCurrency(totalRevenue)} icon={DollarSign}  color="pink" />
        <MetricCard label="Total Profit"       value={formatCurrency(totalProfit)}  sub={`${avgMargin.toFixed(1)}% margin`} icon={TrendingUp} color="green" />
        <MetricCard label="Total Transactions" value={formatNumber(totalTxns)}      icon={ShoppingCart} color="purple" />
        <MetricCard label="Units Sold"         value={formatNumber(totalUnits)}     icon={Package}      color="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Daily Revenue" sub="Revenue per day">
          <RevenueAreaChart data={data} />
        </ChartCard>
        <ChartCard title="Daily Profit" sub="Profit per day">
          <ProfitLineChart data={data} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard title="Sales by Hour of Day" sub="Peak hours highlighted in pink">
          <HourlySalesChart data={hourlyData} />
        </ChartCard>
        <ChartCard title="Payment Methods" sub="Transaction share by payment type">
          <PaymentMethodChart data={paymentData} />
        </ChartCard>
        <ChartCard title="Customer Type" sub="Walk-in vs regular customers">
          <CustomerTypeChart data={customerData} />
        </ChartCard>
      </div>

      <ChartCard
        title="Daily Sales Detail"
        sub={best ? `Best day: ${best.date} — ${formatCurrency(Number(best.total_revenue))}` : ''}
      >
        <DailySalesTable data={data} />
      </ChartCard>
    </div>
  )
}
