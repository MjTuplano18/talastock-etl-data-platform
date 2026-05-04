/*
  Dimension Model: Products
  
  Purpose: Create a slowly changing dimension (SCD Type 1) for products
  
  Business Logic:
  - Generate surrogate key (product_key)
  - Add business-friendly column names
  - Include calculated fields
  - Ready for star schema joins
*/

{{
  config(
    materialized='table',
    unique_key='product_key'
  )
}}

WITH products AS (
    SELECT * FROM {{ ref('stg_products') }}
),

final AS (
    SELECT
        -- Surrogate key (auto-incrementing)
        ROW_NUMBER() OVER (ORDER BY sku) AS product_key,
        
        -- Natural key
        sku,
        
        -- Product attributes
        name,
        category,
        brand,
        
        -- Pricing
        price,
        cost_price,
        profit_margin_pct AS profit_margin,
        
        -- Calculated fields
        CASE 
            WHEN profit_margin_pct >= 30 THEN 'High'
            WHEN profit_margin_pct >= 15 THEN 'Medium'
            ELSE 'Low'
        END AS profit_margin_category,
        
        CASE
            WHEN price < 50 THEN 'Budget'
            WHEN price < 100 THEN 'Standard'
            ELSE 'Premium'
        END AS price_category,
        
        -- Metadata
        created_at,
        updated_at
        
    FROM products
)

SELECT * FROM final
