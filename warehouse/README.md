# Warehouse

PostgreSQL 13 data warehouse running in Docker. Separate from the application database (OLTP) — this is the OLAP layer optimised for analytics queries.

---

## Quick start

```bash
cd data-platform/warehouse
docker-compose up -d
```

| Service | URL / Port | Credentials |
|---|---|---|
| PostgreSQL | `localhost:5433` | warehouse_user / warehouse_pass |
| pgAdmin | http://localhost:5050 | admin@talastock.com / admin |

---

## Schema

Three layers, each in its own PostgreSQL schema:

```
raw.*          Exact copy of source CSVs. No transformations. Audit trail.
staging.*      Cleaned, typed, deduplicated. Business rules applied.
analytics.*    Star schema. Optimised for BI queries.
```

### Analytics layer tables

| Table | Rows | Description |
|---|---|---|
| `dim_products` | ~100 | Product attributes + surrogate key |
| `dim_dates` | ~200 | Calendar attributes + payday/weekend flags |
| `dim_times` | 24 | Hourly time slots + peak hour flag |
| `fact_sales` | ~9,700 | Sales transactions (NaN-filtered) |
| `daily_sales_summary` | ~200 | Pre-aggregated daily metrics |
| `product_performance` | ~100 | Revenue/profit rankings per product |
| `category_performance` | 5 | Revenue/profit metrics per category |
| `forecast_sales` | ~150 | 30-day revenue forecasts per category |
| `forecast_accuracy` | grows | Retrospective forecast vs actual |

---

## Creating the schema

Run these SQL files in pgAdmin in order:

```
schema/01_raw_layer.sql
schema/02_staging_layer.sql
schema/03_analytics_layer.sql
schema/04_forecast_layer.sql
```

The Airflow pipelines create tables automatically if they don't exist, but running the schema files first gives you the full structure with comments and indexes.

---

## Connecting from pgAdmin

1. Right-click **Servers** → **Register → Server**
2. **General**: Name = `Talastock Warehouse`
3. **Connection**:
   - Host: `talastock-warehouse` (container name, not localhost)
   - Port: `5432`
   - Database: `talastock_warehouse`
   - Username: `warehouse_user`
   - Password: `warehouse_pass`

See `PGADMIN_SETUP.md` for screenshots and tips.

---

## Useful queries

```sql
-- Row counts across all layers
SELECT 'raw.products'              AS table_name, COUNT(*) FROM raw.products
UNION ALL SELECT 'raw.sales',                     COUNT(*) FROM raw.sales
UNION ALL SELECT 'analytics.fact_sales',          COUNT(*) FROM analytics.fact_sales
UNION ALL SELECT 'analytics.daily_sales_summary', COUNT(*) FROM analytics.daily_sales_summary;

-- Revenue summary
SELECT
    SUM(total_revenue)::numeric(12,2)  AS total_revenue,
    SUM(total_profit)::numeric(12,2)   AS total_profit,
    ROUND(SUM(total_profit) / NULLIF(SUM(total_revenue), 0) * 100, 1) AS margin_pct
FROM analytics.daily_sales_summary;

-- Top 10 products by revenue
SELECT product_name, category, total_revenue, revenue_rank
FROM analytics.product_performance
ORDER BY revenue_rank
LIMIT 10;

-- Sales by day of week
SELECT
    d.day_of_week_name,
    SUM(f.total_amount) AS revenue,
    COUNT(*)            AS transactions
FROM analytics.fact_sales f
JOIN analytics.dim_dates d ON f.date_key = d.date_key
GROUP BY d.day_of_week_name, d.day_of_week
ORDER BY d.day_of_week;
```

More queries in `sql/01_quick_queries.sql`.

---

## Backup and restore

```bash
# Backup
docker exec talastock-warehouse \
  pg_dump -U warehouse_user talastock_warehouse > backup.sql

# Restore
docker exec -i talastock-warehouse \
  psql -U warehouse_user talastock_warehouse < backup.sql
```
