export interface OverviewMetrics {
  total_revenue: number
  total_profit: number
  margin_pct: number
  total_transactions: number
  total_units_sold: number
  total_products: number
  total_categories: number
  date_range_days: number
}

export interface DailySalesSummary {
  date: string
  total_revenue: number
  total_profit: number
  total_transactions: number
  total_units_sold: number
  profit_margin_pct: number
  average_transaction_value: number
}

export interface ProductPerformance {
  product_key: number
  sku: string
  product_name: string
  category: string
  total_revenue: number
  total_profit: number
  profit_margin_pct: number
  total_units_sold: number
  total_transactions: number
  revenue_rank: number
}

export interface CategoryPerformance {
  category: string
  total_revenue: number
  total_profit: number
  profit_margin_pct: number
  total_units_sold: number
  total_transactions: number
  unique_products: number
  revenue_rank: number
}

export interface PipelineLayerCount {
  layer: string
  table_name: string
  row_count: number
}

// ── Data Quality / Observability ──────────────────────────────

export interface TableHealth {
  schema: string
  table_name: string
  row_count: number
  latest_updated_at: string | null
  freshness_hours: number | null
}

export interface QualityData {
  health_score: number
  stale_count: number
  table_health: TableHealth[]
  summary: {
    total_rows: number
    total_tables: number
    schemas: number
  }
}

export interface AirflowDagRun {
  dag_run_id: string
  dag_id: string
  state: 'queued' | 'running' | 'success' | 'failed' | 'skipped'
  execution_date: string
  start_date: string | null
  end_date: string | null
  run_type: string
}

export interface DagRunHistory {
  dag_id: string
  runs: AirflowDagRun[]
  error?: string
}

// dbt test definitions parsed from schema YAMLs
export interface DbtTestDef {
  model: string
  layer: 'staging' | 'marts' | 'aggregates'
  column: string
  test: string
}

export interface DbtModelTests {
  model: string
  layer: string
  total_tests: number
  tests: DbtTestDef[]
}
