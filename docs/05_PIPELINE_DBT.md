# Pipeline 4 — dbt Transform

**DAG ID**: `dbt_pipeline`  
**Schedule**: Manual / triggered by `warehouse_etl_pipeline`  
**Triggers**: `forecasting_pipeline` on success  
**File**: `airflow/dags/dbt_pipeline.py`

---

## What it does

Runs dbt inside the Airflow container to rebuild all 9 analytics models and execute 104 data quality tests. If any test fails, the pipeline stops — bad data never reaches the dashboard.

dbt also generates documentation with a visual data lineage graph showing how data flows from raw sources through to aggregate tables.

---

## Task flow

```
check_dbt_installed
        │
    dbt_debug          ← verifies connection to warehouse
        │
     dbt_run           ← rebuilds all 9 models
        │
    dbt_test           ← runs 104 quality tests (fails pipeline if any fail)
        │
dbt_docs_generate      ← generates lineage documentation
        │
  report_results       ← logs row counts and revenue summary
        │
trigger_forecasting_pipeline
```

![dbt pipeline graph view](visuals/airflow-dbt.png)

---

## dbt models

### Model dependency graph

```
source('raw', 'products') ──► stg_products ──► dim_products ──► fact_sales ──► aggregates
source('raw', 'sales')    ──► stg_sales    ──► fact_sales
                                           ──► dim_dates    ──► fact_sales
                                           ──► dim_times    ──► fact_sales
```

### Staging models (views)

| Model | Source | Key transformations |
|---|---|---|
| `stg_products` | `raw.products` | Filter active, calculate profit margin |
| `stg_sales` | `raw.sales` | Filter NaN, extract date/time components |

### Dimension models (tables)

| Model | Rows | Description |
|---|---|---|
| `dim_products` | ~100 | Product attributes + surrogate key + price/margin categories |
| `dim_dates` | ~200 | Calendar attributes + `is_weekend`, `is_payday` flags |
| `dim_times` | 24 | Hourly time slots + `time_period`, `is_peak_hour` |

### Fact model (table)

| Model | Rows | Description |
|---|---|---|
| `fact_sales` | ~9,700 | Sales transactions with FK to all dimensions + cost + profit |

### Aggregate models (tables)

| Model | Rows | Description |
|---|---|---|
| `daily_sales_summary` | ~200 | Revenue, profit, transactions per day |
| `product_performance` | ~100 | Revenue/profit rankings + performance tier |
| `category_performance` | 5 | Category-level metrics + revenue/profit share % |

---

## Data quality tests (104 total)

Tests are defined in `schema.yml` files alongside each model. dbt runs them as SQL queries — a test passes if it returns 0 rows.

### Test types

| Test | What it checks |
|---|---|
| `unique` | No duplicate values in a column |
| `not_null` | No NULL values in a column |
| `accepted_values` | Column only contains values from a defined list |
| `relationships` | Foreign key references a valid row in another table |

### Test distribution

| Layer | Models | Tests |
|---|---|---|
| Staging | 2 | 18 |
| Marts (dims + fact) | 4 | 52 |
| Aggregates | 3 | 34 |
| **Total** | **9** | **104** |

### Example: fact_sales tests

```yaml
- name: fact_sales
  columns:
    - name: transaction_id
      tests: [unique, not_null]
    - name: product_key
      tests: [not_null, relationships]   # must exist in dim_products
    - name: payment_method
      tests: [not_null, accepted_values] # Cash, GCash, or Card only
    - name: total_amount
      tests: [not_null]
```

---

## Running dbt locally

You can run dbt outside of Airflow for development. Requires Python 3.10–3.12.

```bash
cd data-platform/dbt

# Create and activate virtual environment
python3.12 -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate  # Mac/Linux

# Install dbt
pip install dbt-core==1.7.0 dbt-postgres==1.7.0

# Test connection
dbt debug

# Run all models
dbt run

# Run specific layer
dbt run --select staging
dbt run --select marts
dbt run --select aggregates

# Run specific model
dbt run --select fact_sales

# Run tests
dbt test

# Run tests for one model
dbt test --select fact_sales

# Generate and view documentation
dbt docs generate
dbt docs serve   # opens http://localhost:8080
```

### Useful selection patterns

```bash
# Run a model and all its dependencies
dbt run --select +fact_sales

# Run a model and everything downstream
dbt run --select fact_sales+

# Full refresh (rebuild from scratch)
dbt run --full-refresh
```

---

## dbt project configuration

### `dbt_project.yml`

```yaml
models:
  talastock:
    staging:
      +materialized: view      # fast to build, runs SQL on every query
      +schema: staging
    marts:
      +materialized: table     # stored result, fast to query
      +schema: analytics
    aggregates:
      +materialized: table
      +schema: analytics
```

### `profiles.yml`

```yaml
talastock:
  target: dev
  outputs:
    dev:
      type: postgres
      host: localhost
      port: 5433
      user: warehouse_user
      password: warehouse_pass
      dbname: talastock_warehouse
      schema: analytics
      threads: 4
    docker:
      type: postgres
      host: talastock-warehouse   # container name inside Docker network
      port: 5432
      user: warehouse_user
      password: warehouse_pass
      dbname: talastock_warehouse
      schema: analytics
      threads: 4
```

The Airflow DAG uses the `docker` target. Local development uses `dev`.

---

## Why dbt instead of raw SQL in Airflow?

| Without dbt | With dbt |
|---|---|
| SQL scattered across Airflow tasks | SQL organised in versioned model files |
| No automated tests | 104 tests run on every pipeline run |
| No documentation | Auto-generated docs with lineage graph |
| Hard to trace data flow | Visual lineage from source to aggregate |
| Transformations tightly coupled to orchestration | Transformations are independent and reusable |
