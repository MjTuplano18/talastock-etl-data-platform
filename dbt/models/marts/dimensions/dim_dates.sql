/*
  Dimension Model: Dates
  
  Purpose: Create a date dimension table for time-based analysis
  
  Business Logic:
  - Generate surrogate key (date_key)
  - Extract date components (year, month, day, quarter)
  - Add business flags (weekend, payday, holiday)
  - Enable time-based filtering and grouping
*/

{{
  config(
    materialized='table',
    unique_key='date_key'
  )
}}

WITH sales_dates AS (
    -- Get all unique dates from sales
    SELECT DISTINCT DATE(timestamp) AS date
    FROM {{ source('raw', 'sales') }}
),

date_spine AS (
    SELECT
        -- Surrogate key (YYYYMMDD format)
        TO_CHAR(date, 'YYYYMMDD')::integer AS date_key,
        
        -- Full date
        date,
        
        -- Year components
        EXTRACT(YEAR FROM date) AS year,
        EXTRACT(QUARTER FROM date) AS quarter,
        
        -- Month components
        EXTRACT(MONTH FROM date) AS month_number,
        TO_CHAR(date, 'Month') AS month_name,
        TO_CHAR(date, 'Mon') AS month_short_name,
        
        -- Week components
        EXTRACT(WEEK FROM date) AS week_of_year,
        EXTRACT(DOW FROM date) AS day_of_week_number,  -- 0=Sunday, 6=Saturday
        TO_CHAR(date, 'Day') AS day_of_week_name,
        TO_CHAR(date, 'Dy') AS day_of_week_short_name,
        
        -- Day components
        EXTRACT(DAY FROM date) AS day_of_month,
        EXTRACT(DOY FROM date) AS day_of_year,
        
        -- Business flags
        CASE 
            WHEN EXTRACT(DOW FROM date) IN (0, 6) THEN true 
            ELSE false 
        END AS is_weekend,
        
        CASE 
            WHEN EXTRACT(DOW FROM date) BETWEEN 1 AND 5 THEN true 
            ELSE false 
        END AS is_weekday,
        
        -- Payday flags (15th and 30th/31st of month)
        CASE 
            WHEN EXTRACT(DAY FROM date) IN (15, 30, 31) THEN true
            ELSE false
        END AS is_payday,
        
        -- Month position
        CASE 
            WHEN EXTRACT(DAY FROM date) <= 10 THEN 'Early'
            WHEN EXTRACT(DAY FROM date) <= 20 THEN 'Mid'
            ELSE 'Late'
        END AS month_period,
        
        -- Quarter name
        'Q' || EXTRACT(QUARTER FROM date) || ' ' || EXTRACT(YEAR FROM date) AS quarter_name,
        
        -- Month-Year
        TO_CHAR(date, 'Mon YYYY') AS month_year,
        
        -- Fiscal period (assuming fiscal year = calendar year)
        EXTRACT(YEAR FROM date) AS fiscal_year,
        EXTRACT(QUARTER FROM date) AS fiscal_quarter
        
    FROM sales_dates
)

SELECT * FROM date_spine
ORDER BY date
