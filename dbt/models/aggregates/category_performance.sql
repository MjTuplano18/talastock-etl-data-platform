/*
  Aggregate Model: Category Performance
  
  Purpose: Pre-aggregate category-level metrics for category analysis
  
  Business Logic:
  - Group by category
  - Calculate sales, revenue, profit metrics
  - Compare categories
  - Identify best/worst performing categories
*/

{{
  config(
    materialized='table',
    unique_key='category'
  )
}}

WITH fact_sales AS (
    SELECT * FROM {{ ref('fact_sales') }}
),

products AS (
    SELECT * FROM {{ ref('dim_products') }}
),

category_aggregates AS (
    SELECT
        -- Category
        p.category,
        
        -- Product diversity
        COUNT(DISTINCT p.product_key) AS total_products,
        COUNT(DISTINCT p.brand) AS total_brands,
        
        -- Sales metrics
        COUNT(*) AS total_transactions,
        SUM(f.quantity) AS total_units_sold,
        
        -- Revenue metrics
        SUM(f.total_amount) AS total_revenue,
        SUM(f.cost) AS total_cost,
        SUM(f.profit) AS total_profit,
        
        -- Profit margin
        ROUND(
            (SUM(f.profit) / NULLIF(SUM(f.total_amount), 0) * 100)::numeric,
            2
        ) AS profit_margin_pct,
        
        -- Average metrics
        ROUND(AVG(f.total_amount)::numeric, 2) AS average_transaction_value,
        ROUND(AVG(f.quantity)::numeric, 2) AS average_units_per_transaction,
        ROUND(AVG(p.price)::numeric, 2) AS average_product_price,
        
        -- Customer metrics
        COUNT(DISTINCT f.customer_name) AS unique_customers,
        
        -- Payment method breakdown
        COUNT(*) FILTER (WHERE f.payment_method = 'Cash') AS cash_transactions,
        COUNT(*) FILTER (WHERE f.payment_method = 'GCash') AS gcash_transactions,
        COUNT(*) FILTER (WHERE f.payment_method = 'Card') AS card_transactions,
        
        -- Customer type breakdown
        COUNT(*) FILTER (WHERE f.customer_type = 'walk-in') AS walkin_transactions,
        COUNT(*) FILTER (WHERE f.customer_type = 'regular') AS regular_transactions,
        COUNT(*) FILTER (WHERE f.customer_type = 'wholesale') AS wholesale_transactions
        
    FROM fact_sales f
    INNER JOIN products p ON f.product_key = p.product_key
    GROUP BY p.category
),

ranked AS (
    SELECT
        *,
        
        -- Revenue rankings
        ROW_NUMBER() OVER (ORDER BY total_revenue DESC) AS revenue_rank,
        ROUND(
            (total_revenue / SUM(total_revenue) OVER () * 100)::numeric,
            2
        ) AS revenue_share_pct,
        
        -- Profit rankings
        ROW_NUMBER() OVER (ORDER BY total_profit DESC) AS profit_rank,
        ROUND(
            (total_profit / SUM(total_profit) OVER () * 100)::numeric,
            2
        ) AS profit_share_pct,
        
        -- Volume rankings
        ROW_NUMBER() OVER (ORDER BY total_units_sold DESC) AS volume_rank,
        ROUND(
            (total_units_sold::numeric / SUM(total_units_sold) OVER () * 100)::numeric,
            2
        ) AS volume_share_pct,
        
        -- Performance tier
        CASE 
            WHEN ROW_NUMBER() OVER (ORDER BY total_revenue DESC) = 1 THEN 'Top Performer'
            WHEN ROW_NUMBER() OVER (ORDER BY total_revenue DESC) = (SELECT COUNT(*) FROM category_aggregates) THEN 'Needs Attention'
            ELSE 'Average'
        END AS performance_tier
        
    FROM category_aggregates
)

SELECT * FROM ranked
ORDER BY revenue_rank
