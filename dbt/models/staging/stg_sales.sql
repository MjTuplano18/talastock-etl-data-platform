/*
  Staging Model: Sales
  
  Purpose: Clean and standardize sales data from raw layer
  
  Transformations:
  - Filter out NaN values
  - Extract date/time components
  - Standardize column names
  - Add data quality checks
*/

WITH source AS (
    SELECT * FROM {{ source('raw', 'sales') }}
),

cleaned AS (
    SELECT
        -- Primary key
        transaction_id,
        
        -- Timestamp
        timestamp,
        DATE(timestamp) AS sale_date,
        timestamp::time AS sale_time,
        
        -- Product reference
        product_sku,
        product_name,
        category,
        brand,
        
        -- Transaction details
        quantity,
        unit_price,
        total_amount,
        
        -- Payment info
        payment_method,
        customer_type,
        customer_name,
        
        -- Metadata
        loaded_at,
        source_file,
        load_id
        
    FROM source
    WHERE 
        -- Filter out NaN values (data quality)
        unit_price IS NOT NULL
        AND unit_price != 'NaN'::numeric
        AND total_amount IS NOT NULL
        AND total_amount != 'NaN'::numeric
        AND quantity > 0
        AND unit_price > 0
        AND total_amount > 0
        AND payment_method NOT IN ('NaN', '')
        AND customer_type NOT IN ('NaN', '')
)

SELECT * FROM cleaned
