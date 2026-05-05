# Pipeline 3 — Warehouse ETL

**DAG ID**: `warehouse_etl_pipeline`  
**Schedule**: `@daily`  
**Triggered by**: `sales_etl_pipeline` on success  
**Triggers**: `dbt_pipeline` on success  
**File**: `airflow/dags/warehouse_etl_pipeline.py`

---

## What it does

Loads the cleaned CSV files from `processed/` into the PostgreSQL data warehouse. Implements a full three-layer architecture: raw → staging → analytics (star schema). All aggregate tables are rebuilt on every run.

---

## Task flow

```
validate_cleaned_files
         │
    ┌────┴────┐
load_raw_products  load_raw_sales     ← parallel
    │                  │
load_staging_products  load_staging_sales  ← parallel
    └────┬────┘
         │
    ┌────┼────┐
build_dim_products  build_dim_dates  build_dim_times  ← parallel
    └────┬────┘
         │
  build_fact_sales
         │
    ┌────┼────┐
calculate_daily_summary  calculate_product_performance  calculate_category_performance
    └────┬────┘
         │
warehouse_pipeline_complete
         │
  trigger_dbt_pipeline
```

![Warehouse ETL pipeline graph view](visuals/airflow-warehouse-etl.png)

---

## Task details

### validate_cleaned_files
Checks that `products_cleaned.csv` and `sales_cleaned.csv` exist. Fails fast if missing.

### load_raw_products / load_raw_sales
Truncates the raw table and bulk-inserts the entire CSV. Adds metadata columns: `loaded_at`, `source_file`, `load_id`.

The raw layer is a **full refresh** — it always reflects the latest generated data.

### load_staging_products / load_staging_sales
Transforms raw → staging:

**Products staging**
- Calculates `profit_margin = ((price - cost_price) / price) * 100`
- Filters out rows where `price <= 0` or `cost_price < 0`

**Sales staging**
- Uses `DISTINCT ON (transaction_id)` to deduplicate
- Extracts `sale_date`, `sale_time`, `year`, `month`, `day`, `day_of_week`, `hour`
- Filters out rows where `quantity <= 0` or `total_amount < 0`

### build_dim_products / build_dim_dates / build_dim_times
Builds the three dimension tables from staging data. These run in parallel since they don't depend on each other.

**dim_dates** is generated using PostgreSQL's `generate_series()` — one row per calendar day in the sales date range, with `is_weekend` and `is_payday` flags.

**dim_times** has 24 rows (one per hour) with `time_period` (Morning/Afternoon/Evening/Night) and `is_peak_hour` flags.

### build_fact_sales
Joins staging sales to all three dimensions and inserts into `fact_sales`. Applies strict NaN filtering:

```sql
WHERE s.unit_price IS NOT NULL
  AND s.unit_price != 'NaN'::numeric
  AND s.total_amount IS NOT NULL
  AND s.total_amount != 'NaN'::numeric
  AND s.quantity > 0
  AND p.cost_price >= 0
```

Also calculates `cost = quantity × cost_price` and `profit = total_amount - cost`.

### calculate_daily_summary / calculate_product_performance / calculate_category_performance
Rebuilds the three aggregate tables from `fact_sales`. These run in parallel.

---

## Warehouse schema

### Three-layer architecture

```
raw.*          Exact copy of source CSVs. No transformations. Audit trail.
staging.*      Cleaned, typed, deduplicated. Business rules applied.
analytics.*    Star schema. Optimised for BI queries.
```

### Star schema

```
         dim_products (100 rows)
              │
dim_dates ── fact_sales (~9,700 rows) ── dim_times (24 rows)
```

### Aggregate tables

| Table | Granularity | Key metrics |
|---|---|---|
| `daily_sales_summary` | 1 row per day | revenue, profit, transactions, units sold |
| `product_performance` | 1 row per product | revenue rank, profit rank, performance tier |
| `category_performance` | 1 row per category | revenue share %, profit share % |

---

## Connection details

The warehouse runs in Docker on the `data-platform` network. Airflow connects using the container name as hostname.

```python
WAREHOUSE_CONFIG = {
    'host':     'talastock-warehouse',
    'port':     5432,
    'database': 'talastock_warehouse',
    'user':     'warehouse_user',
    'password': 'warehouse_pass',
}
```

From your local machine, connect on port `5433`:
```
postgresql://warehouse_user:warehouse_pass@localhost:5433/talastock_warehouse
```

---

## Schema SQL files

Run these in pgAdmin in order to create the schema from scratch:

```
warehouse/schema/01_raw_layer.sql
warehouse/schema/02_staging_layer.sql
warehouse/schema/03_analytics_layer.sql
warehouse/schema/04_forecast_layer.sql
```

---

## Idempotency

Every task uses `TRUNCATE` before inserting. Running the pipeline multiple times produces the same result — no duplicates accumulate.
