import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { PipelineLayerCount } from '@/types'

export async function GET() {
  try {
    const rows = await query<PipelineLayerCount>(`
      SELECT 'raw'      AS layer, 'products' AS table_name, COUNT(*)::int AS row_count FROM raw.products
      UNION ALL
      SELECT 'raw',      'sales',              COUNT(*)::int FROM raw.sales
      UNION ALL
      SELECT 'staging',  'products',           COUNT(*)::int FROM staging.products
      UNION ALL
      SELECT 'staging',  'sales',              COUNT(*)::int FROM staging.sales
      UNION ALL
      SELECT 'analytics','dim_products',       COUNT(*)::int FROM analytics.dim_products
      UNION ALL
      SELECT 'analytics','dim_dates',          COUNT(*)::int FROM analytics.dim_dates
      UNION ALL
      SELECT 'analytics','dim_times',          COUNT(*)::int FROM analytics.dim_times
      UNION ALL
      SELECT 'analytics','fact_sales',         COUNT(*)::int FROM analytics.fact_sales
      UNION ALL
      SELECT 'analytics','daily_sales_summary',COUNT(*)::int FROM analytics.daily_sales_summary
      UNION ALL
      SELECT 'analytics','product_performance',COUNT(*)::int FROM analytics.product_performance
      UNION ALL
      SELECT 'analytics','category_performance',COUNT(*)::int FROM analytics.category_performance
      ORDER BY layer, table_name
    `)
    return NextResponse.json(rows)
  } catch (err) {
    console.error('Pipeline API error:', err)
    return NextResponse.json({ error: 'Failed to fetch pipeline status' }, { status: 500 })
  }
}
