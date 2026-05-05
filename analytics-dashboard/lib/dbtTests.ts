/**
 * Static dbt test inventory
 * Parsed from the schema.yml files in data-platform/dbt/models/
 *
 * We define these inline rather than reading files at runtime to keep
 * the Next.js server component simple and avoid fs path issues.
 * Update this when schema.yml files change.
 */

import type { DbtModelTests, DbtTestDef } from '@/types'

// ── Raw test definitions ──────────────────────────────────────
// Format: [model, layer, column, test]
const RAW_TESTS: [string, DbtModelTests['layer'], string, string][] = [
  // staging — stg_products
  ['stg_products', 'staging', 'sku',              'unique'],
  ['stg_products', 'staging', 'sku',              'not_null'],
  ['stg_products', 'staging', 'name',             'not_null'],
  ['stg_products', 'staging', 'category',         'not_null'],
  ['stg_products', 'staging', 'category',         'accepted_values'],
  ['stg_products', 'staging', 'price',            'not_null'],
  ['stg_products', 'staging', 'cost_price',       'not_null'],

  // staging — stg_sales
  ['stg_sales', 'staging', 'transaction_id',  'unique'],
  ['stg_sales', 'staging', 'transaction_id',  'not_null'],
  ['stg_sales', 'staging', 'product_sku',     'not_null'],
  ['stg_sales', 'staging', 'product_sku',     'relationships'],
  ['stg_sales', 'staging', 'quantity',        'not_null'],
  ['stg_sales', 'staging', 'unit_price',      'not_null'],
  ['stg_sales', 'staging', 'total_amount',    'not_null'],
  ['stg_sales', 'staging', 'payment_method',  'not_null'],
  ['stg_sales', 'staging', 'payment_method',  'accepted_values'],
  ['stg_sales', 'staging', 'customer_type',   'not_null'],
  ['stg_sales', 'staging', 'customer_type',   'accepted_values'],

  // marts — dim_products
  ['dim_products', 'marts', 'product_key',           'unique'],
  ['dim_products', 'marts', 'product_key',           'not_null'],
  ['dim_products', 'marts', 'sku',                   'unique'],
  ['dim_products', 'marts', 'sku',                   'not_null'],
  ['dim_products', 'marts', 'name',                  'not_null'],
  ['dim_products', 'marts', 'category',              'not_null'],
  ['dim_products', 'marts', 'price',                 'not_null'],
  ['dim_products', 'marts', 'profit_margin_category','accepted_values'],
  ['dim_products', 'marts', 'price_category',        'accepted_values'],

  // marts — dim_dates
  ['dim_dates', 'marts', 'date_key',          'unique'],
  ['dim_dates', 'marts', 'date_key',          'not_null'],
  ['dim_dates', 'marts', 'date',              'unique'],
  ['dim_dates', 'marts', 'date',              'not_null'],
  ['dim_dates', 'marts', 'year',              'not_null'],
  ['dim_dates', 'marts', 'month_number',      'not_null'],
  ['dim_dates', 'marts', 'day_of_week_number','not_null'],
  ['dim_dates', 'marts', 'is_weekend',        'not_null'],
  ['dim_dates', 'marts', 'is_payday',         'not_null'],

  // marts — dim_times
  ['dim_times', 'marts', 'time_key',         'unique'],
  ['dim_times', 'marts', 'time_key',         'not_null'],
  ['dim_times', 'marts', 'time',             'unique'],
  ['dim_times', 'marts', 'time',             'not_null'],
  ['dim_times', 'marts', 'hour_24',          'not_null'],
  ['dim_times', 'marts', 'time_period',      'not_null'],
  ['dim_times', 'marts', 'time_period',      'accepted_values'],
  ['dim_times', 'marts', 'is_peak_hour',     'not_null'],
  ['dim_times', 'marts', 'is_business_hours','not_null'],

  // marts — fact_sales
  ['fact_sales', 'marts', 'sale_key',       'unique'],
  ['fact_sales', 'marts', 'sale_key',       'not_null'],
  ['fact_sales', 'marts', 'transaction_id', 'unique'],
  ['fact_sales', 'marts', 'transaction_id', 'not_null'],
  ['fact_sales', 'marts', 'product_key',    'not_null'],
  ['fact_sales', 'marts', 'product_key',    'relationships'],
  ['fact_sales', 'marts', 'date_key',       'not_null'],
  ['fact_sales', 'marts', 'date_key',       'relationships'],
  ['fact_sales', 'marts', 'time_key',       'not_null'],
  ['fact_sales', 'marts', 'time_key',       'relationships'],
  ['fact_sales', 'marts', 'quantity',       'not_null'],
  ['fact_sales', 'marts', 'unit_price',     'not_null'],
  ['fact_sales', 'marts', 'total_amount',   'not_null'],
  ['fact_sales', 'marts', 'cost',           'not_null'],
  ['fact_sales', 'marts', 'profit',         'not_null'],
  ['fact_sales', 'marts', 'payment_method', 'not_null'],
  ['fact_sales', 'marts', 'payment_method', 'accepted_values'],
  ['fact_sales', 'marts', 'customer_type',  'not_null'],
  ['fact_sales', 'marts', 'customer_type',  'accepted_values'],

  // aggregates — daily_sales_summary
  ['daily_sales_summary', 'aggregates', 'date_key',              'unique'],
  ['daily_sales_summary', 'aggregates', 'date_key',              'not_null'],
  ['daily_sales_summary', 'aggregates', 'date',                  'unique'],
  ['daily_sales_summary', 'aggregates', 'date',                  'not_null'],
  ['daily_sales_summary', 'aggregates', 'total_revenue',         'not_null'],
  ['daily_sales_summary', 'aggregates', 'total_profit',          'not_null'],
  ['daily_sales_summary', 'aggregates', 'total_transactions',    'not_null'],
  ['daily_sales_summary', 'aggregates', 'total_units_sold',      'not_null'],
  ['daily_sales_summary', 'aggregates', 'unique_products_sold',  'not_null'],
  ['daily_sales_summary', 'aggregates', 'unique_customers',      'not_null'],

  // aggregates — product_performance
  ['product_performance', 'aggregates', 'product_key',     'unique'],
  ['product_performance', 'aggregates', 'product_key',     'not_null'],
  ['product_performance', 'aggregates', 'sku',             'unique'],
  ['product_performance', 'aggregates', 'sku',             'not_null'],
  ['product_performance', 'aggregates', 'name',            'not_null'],
  ['product_performance', 'aggregates', 'category',        'not_null'],
  ['product_performance', 'aggregates', 'total_revenue',   'not_null'],
  ['product_performance', 'aggregates', 'total_profit',    'not_null'],
  ['product_performance', 'aggregates', 'total_units_sold','not_null'],
  ['product_performance', 'aggregates', 'revenue_rank',    'not_null'],
  ['product_performance', 'aggregates', 'profit_rank',     'not_null'],
  ['product_performance', 'aggregates', 'performance_tier','not_null'],
  ['product_performance', 'aggregates', 'performance_tier','accepted_values'],

  // aggregates — category_performance
  ['category_performance', 'aggregates', 'category',         'unique'],
  ['category_performance', 'aggregates', 'category',         'not_null'],
  ['category_performance', 'aggregates', 'total_products',   'not_null'],
  ['category_performance', 'aggregates', 'total_revenue',    'not_null'],
  ['category_performance', 'aggregates', 'total_profit',     'not_null'],
  ['category_performance', 'aggregates', 'total_units_sold', 'not_null'],
  ['category_performance', 'aggregates', 'revenue_rank',     'not_null'],
  ['category_performance', 'aggregates', 'profit_rank',      'not_null'],
  ['category_performance', 'aggregates', 'performance_tier', 'not_null'],
  ['category_performance', 'aggregates', 'performance_tier', 'accepted_values'],
]

// ── Exported helpers ──────────────────────────────────────────

export function getDbtModelTests(): DbtModelTests[] {
  const map = new Map<string, DbtModelTests>()

  for (const [model, layer, column, test] of RAW_TESTS) {
    if (!map.has(model)) {
      map.set(model, { model, layer, total_tests: 0, tests: [] })
    }
    const entry = map.get(model)!
    entry.total_tests++
    entry.tests.push({ model, layer, column, test } as DbtTestDef)
  }

  return Array.from(map.values())
}

export const TOTAL_DBT_TESTS = RAW_TESTS.length

export const TEST_TYPE_COLORS: Record<string, string> = {
  unique:          '#60A5FA',
  not_null:        '#4ADE80',
  accepted_values: '#FBBF24',
  relationships:   '#9B6DFF',
}

export const LAYER_ORDER: Record<string, number> = {
  staging:    0,
  marts:      1,
  aggregates: 2,
}
