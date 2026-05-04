/*
  Fact Model: Sales
  
  Purpose: Create a fact table for sales transactions
  
  Business Logic:
  - Join with dimension tables
  - Calculate derived metrics (cost, profit)
  - Create surrogate keys for dimensions
  - Optimized for analytical queries
*/

{{
  config(
    materialized='table',
    unique_key='sale_key'
  )
}}

WITH sales AS (
    SELECT * FROM {{ ref('stg_sales') }}
),

products AS (
    SELECT * FROM {{ ref('dim_products') }}
),

dates AS (
    SELECT * FROM {{ ref('dim_dates') }}
),

times AS (
    SELECT * FROM {{ ref('dim_times') }}
),

final AS (
    SELECT
        -- Surrogate key
        ROW_NUMBER() OVER (ORDER BY s.transaction_id) AS sale_key,
        
        -- Natural key
        s.transaction_id,
        
        -- Foreign keys to dimensions
        p.product_key,
        d.date_key,
        t.time_key,
        
        -- Degenerate dimensions (transaction-level attributes)
        s.payment_method,
        s.customer_type,
        s.customer_name,
        
        -- Measures (additive facts)
        s.quantity,
        s.unit_price,
        s.total_amount,
        
        -- Calculated measures
        (s.quantity * p.cost_price) AS cost,
        (s.total_amount - (s.quantity * p.cost_price)) AS profit,
        
        -- Metadata
        s.loaded_at
        
    FROM sales s
    INNER JOIN products p ON s.product_sku = p.sku
    INNER JOIN dates d ON s.sale_date = d.date
    INNER JOIN times t ON DATE_TRUNC('hour', s.sale_time::time) = t.time
)

SELECT * FROM final
