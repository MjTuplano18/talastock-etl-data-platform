# SQL Queries

Ready-to-run queries for exploring and validating the warehouse. Open pgAdmin, connect to `talastock_warehouse`, and paste these into the Query Tool.

---

## Files

### `01_quick_queries.sql`

15 queries for business exploration:
- Top products by revenue
- Daily and monthly revenue trends
- Category performance
- Sales by day of week and hour
- Payday effect analysis
- Payment method breakdown
- Customer type analysis
- Overall business summary

### `02_data_quality_check.sql`

Validation queries to verify data integrity:
- NULL value checks across all layers
- Orphaned foreign key detection
- Revenue calculation verification
- Data completeness summary

---

## Quick start

```sql
-- Verify data is loaded
SELECT
    'fact_sales'          AS table_name, COUNT(*) AS rows FROM analytics.fact_sales
UNION ALL SELECT
    'dim_products',                      COUNT(*) FROM analytics.dim_products
UNION ALL SELECT
    'daily_sales_summary',               COUNT(*) FROM analytics.daily_sales_summary;

-- Revenue summary
SELECT
    TO_CHAR(SUM(total_revenue), 'FM₱999,999,999.00') AS total_revenue,
    TO_CHAR(SUM(total_profit),  'FM₱999,999,999.00') AS total_profit,
    ROUND(SUM(total_profit) / NULLIF(SUM(total_revenue), 0) * 100, 1) || '%' AS margin
FROM analytics.daily_sales_summary;
```
