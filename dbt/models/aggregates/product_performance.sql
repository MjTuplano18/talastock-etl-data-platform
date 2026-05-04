/*
  Aggregate Model: Product Performance
  
  Purpose: Pre-aggregate product-level metrics for product analysis
  
  Business Logic:
  - Group by product
  - Calculate sales, revenue, profit metrics
  - Rank products by performance
  - Identify top/bottom performers
*/

{{
  config(
    materialized='table',
    unique_key='product_key'
  )
}}

WITH fact_sales AS (
    SELECT * FROM {{ ref('fact_sales') }}
),

products AS (
    SELECT * FROM {{ ref('dim_products') }}
),

product_aggregates AS (
    SELECT
        -- Product dimension
        p.product_key,
        p.sku,
        p.name,
        p.category,
        p.brand,
        p.price,
        p.cost_price,
        p.profit_margin AS product_profit_margin_pct,
        p.price_category,
        
        -- Sales metrics
        COUNT(*) AS total_transactions,
        SUM(f.quantity) AS total_units_sold,
        
        -- Revenue metrics
        SUM(f.total_amount) AS total_revenue,
        SUM(f.cost) AS total_cost,
        SUM(f.profit) AS total_profit,
        
        -- Profit margin (actual vs expected)
        ROUND(
            (SUM(f.profit) / NULLIF(SUM(f.total_amount), 0) * 100)::numeric,
            2
        ) AS actual_profit_margin_pct,
        
        -- Average metrics
        ROUND(AVG(f.total_amount)::numeric, 2) AS average_transaction_value,
        ROUND(AVG(f.quantity)::numeric, 2) AS average_units_per_transaction,
        
        -- Customer metrics
        COUNT(DISTINCT f.customer_name) AS unique_customers,
        
        -- Date range
        MIN(d.date) AS first_sale_date,
        MAX(d.date) AS last_sale_date,
        MAX(d.date) - MIN(d.date) + 1 AS days_on_sale
        
    FROM fact_sales f
    INNER JOIN products p ON f.product_key = p.product_key
    INNER JOIN {{ ref('dim_dates') }} d ON f.date_key = d.date_key
    GROUP BY 
        p.product_key,
        p.sku,
        p.name,
        p.category,
        p.brand,
        p.price,
        p.cost_price,
        p.profit_margin,
        p.price_category
),

ranked AS (
    SELECT
        *,
        
        -- Revenue rankings
        ROW_NUMBER() OVER (ORDER BY total_revenue DESC) AS revenue_rank,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY total_revenue DESC) AS revenue_rank_in_category,
        
        -- Profit rankings
        ROW_NUMBER() OVER (ORDER BY total_profit DESC) AS profit_rank,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY total_profit DESC) AS profit_rank_in_category,
        
        -- Volume rankings
        ROW_NUMBER() OVER (ORDER BY total_units_sold DESC) AS volume_rank,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY total_units_sold DESC) AS volume_rank_in_category,
        
        -- Performance categories
        CASE 
            WHEN ROW_NUMBER() OVER (ORDER BY total_revenue DESC) <= 10 THEN 'Top 10'
            WHEN ROW_NUMBER() OVER (ORDER BY total_revenue DESC) <= 20 THEN 'Top 20'
            WHEN ROW_NUMBER() OVER (ORDER BY total_revenue DESC) > (SELECT COUNT(*) FROM product_aggregates) - 10 THEN 'Bottom 10'
            ELSE 'Middle'
        END AS performance_tier,
        
        -- Sales velocity (units per day)
        ROUND(
            (total_units_sold::numeric / NULLIF(days_on_sale, 0)),
            2
        ) AS units_per_day
        
    FROM product_aggregates
)

SELECT * FROM ranked
ORDER BY revenue_rank
