import { ChartCard } from '@/components/ui/ChartCard'
import { TopProductsBarChart } from '@/components/charts/TopProductsBarChart'
import { ProductsTable } from '@/components/tables/ProductsTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { ExportButton } from '@/components/ui/ExportButton'
import { cachedQuery } from '@/lib/db'
import type { ProductPerformance } from '@/types'

async function getProducts(): Promise<ProductPerformance[]> {
  return cachedQuery<ProductPerformance>(
    'product-performance',
    `SELECT product_key, sku, product_name, category,
            total_revenue::float, total_profit::float,
            profit_margin_pct::float, total_units_sold::int,
            total_transactions::int, revenue_rank::int
     FROM analytics.product_performance
     ORDER BY revenue_rank ASC`,
    [], 600  // 10 min — product data changes rarely
  )
}

export default async function ProductsPage() {
  const data = await getProducts()
  const categories = [...new Set(data.map(d => d.category))].sort()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Product Performance"
          subtitle={`${data.length} products ranked by revenue`}
        />
        <ExportButton url="/api/export/products" filename="products.csv" />
      </div>

      <ChartCard title="Revenue by Product" sub="Toggle between top and bottom performers">
        <TopProductsBarChart data={data} />
      </ChartCard>

      <ChartCard title="All Products" sub="Search, filter, and browse all products">
        <ProductsTable data={data} categories={categories} />
      </ChartCard>
    </div>
  )
}
