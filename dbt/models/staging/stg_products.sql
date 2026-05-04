/*
  Staging Model: Products
  
  Purpose: Clean and standardize product data from raw layer
  
  Transformations:
  - Filter only active products
  - Calculate profit margin
  - Standardize column names
  - Add data quality checks
*/

WITH source AS (
    SELECT * FROM {{ source('raw', 'products') }}
),

cleaned AS (
    SELECT
        -- Primary key
        sku,
        
        -- Product details
        name,
        category,
        brand,
        
        -- Pricing
        price,
        cost_price,
        ROUND(
            ((price - cost_price) / NULLIF(price, 0) * 100)::numeric, 
            2
        ) AS profit_margin_pct,
        
        -- Status
        is_active,
        
        -- Metadata
        created_at,
        updated_at,
        loaded_at,
        source_file,
        load_id
        
    FROM source
    WHERE is_active = true
      AND price > 0
      AND cost_price >= 0
)

SELECT * FROM cleaned
