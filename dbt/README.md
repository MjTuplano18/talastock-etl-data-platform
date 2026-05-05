# dbt

dbt Core 1.7 transforms raw warehouse data into tested, documented analytics models.

---

## Quick start

Requires Python 3.10–3.12 (not 3.14).

```bash
cd data-platform/dbt

python3.12 -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac / Linux

pip install dbt-core==1.7.0 dbt-postgres==1.7.0

dbt debug        # test connection
dbt run          # build all 9 models
dbt test         # run 104 quality tests
dbt docs generate && dbt docs serve   # view lineage docs
```

---

## Models

```
raw.products / raw.sales
        │
   stg_products / stg_sales        (views — staging schema)
        │
   dim_products / dim_dates / dim_times   (tables — analytics schema)
        │
   fact_sales                       (table — analytics schema)
        │
   daily_sales_summary / product_performance / category_performance
```

| Model | Type | Rows | Description |
|---|---|---|---|
| `stg_products` | view | ~100 | Cleaned products, profit margin calculated |
| `stg_sales` | view | ~9,700 | Cleaned sales, NaN filtered, time fields extracted |
| `dim_products` | table | ~100 | Product dimension with surrogate key |
| `dim_dates` | table | ~200 | Date dimension with payday/weekend flags |
| `dim_times` | table | 24 | Hourly time dimension with peak hour flag |
| `fact_sales` | table | ~9,700 | Sales fact table with cost and profit |
| `daily_sales_summary` | table | ~200 | Daily revenue, profit, transaction metrics |
| `product_performance` | table | ~100 | Revenue/profit rankings per product |
| `category_performance` | table | 5 | Revenue/profit metrics per category |

---

## Tests (104 total)

Tests are defined in `schema.yml` files. dbt runs them as SQL — a test passes if it returns 0 rows.

| Test type | What it checks |
|---|---|
| `unique` | No duplicate values |
| `not_null` | No NULL values |
| `accepted_values` | Only allowed values present |
| `relationships` | Foreign key integrity |

---

## Common commands

```bash
# Run specific layer
dbt run --select staging
dbt run --select marts
dbt run --select aggregates

# Run one model
dbt run --select fact_sales

# Run model + all dependencies
dbt run --select +fact_sales

# Run model + all downstream
dbt run --select fact_sales+

# Full rebuild from scratch
dbt run --full-refresh

# Test one model
dbt test --select fact_sales

# Compile SQL without running
dbt compile --select fact_sales
cat target/compiled/talastock/models/marts/facts/fact_sales.sql
```

---

## Connection targets

| Target | Use case | Host | Port |
|---|---|---|---|
| `dev` | Local development | `localhost` | `5433` |
| `docker` | Inside Airflow container | `talastock-warehouse` | `5432` |

The Airflow DAG uses `--target docker`. Local development uses `dev` (default).

---

## Full guide

See `docs/05_PIPELINE_DBT.md` for a complete explanation of the models, tests, and how dbt fits into the pipeline.
