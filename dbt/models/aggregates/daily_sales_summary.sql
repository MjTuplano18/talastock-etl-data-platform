/*
  Aggregate Model: Daily Sales Summary
  
  Purpose: Pre-aggregate daily sales metrics for fast dashboard queries
  
  Business Logic:
  - Group by date
  - Calculate key metrics (revenue, profit, transactions)
  - Include derived KPIs
  - Optimized for reporting
*/

{{
  config(
    materialized='table',
    unique_key='date_key'
  )
}}

WITH fact_sales AS (
    SELECT * FROM {{ ref('fact_sales') }}
),

dates AS (
    SELECT * FROM {{ ref('dim_dates') }}
),

daily_aggregates AS (
    SELECT
        -- Date dimension
        d.date_key,
        d.date,
        d.day_of_week_name,
        d.is_weekend,
        d.is_payday,
        d.month_name,
        d.quarter,
        d.year,
        
        -- Revenue metrics
        SUM(f.total_amount) AS total_revenue,
        SUM(f.cost) AS total_cost,
        SUM(f.profit) AS total_profit,
        
        -- Profit margin
        ROUND(
            (SUM(f.profit) / NULLIF(SUM(f.total_amount), 0) * 100)::numeric,
            2
        ) AS profit_margin_pct,
        
        -- Transaction metrics
        COUNT(*) AS total_transactions,
        SUM(f.quantity) AS total_units_sold,
        
        -- Average metrics
        ROUND(AVG(f.total_amount)::numeric, 2) AS average_transaction_value,
        ROUND(AVG(f.quantity)::numeric, 2) AS average_units_per_transaction,
        
        -- Product diversity
        COUNT(DISTINCT f.product_key) AS unique_products_sold,
        
        -- Customer metrics
        COUNT(DISTINCT f.customer_name) AS unique_customers,
        
        -- Payment method breakdown
        COUNT(*) FILTER (WHERE f.payment_method = 'Cash') AS cash_transactions,
        COUNT(*) FILTER (WHERE f.payment_method = 'GCash') AS gcash_transactions,
        COUNT(*) FILTER (WHERE f.payment_method = 'Card') AS card_transactions
        
    FROM fact_sales f
    INNER JOIN dates d ON f.date_key = d.date_key
    GROUP BY 
        d.date_key,
        d.date,
        d.day_of_week_name,
        d.is_weekend,
        d.is_payday,
        d.month_name,
        d.quarter,
        d.year
)

SELECT * FROM daily_aggregates
ORDER BY date
