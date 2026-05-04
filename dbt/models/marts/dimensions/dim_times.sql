/*
  Dimension Model: Times
  
  Purpose: Create a time dimension table for intraday analysis
  
  Business Logic:
  - Generate surrogate key (time_key)
  - Extract time components (hour, minute)
  - Add business periods (morning, afternoon, evening)
  - Enable time-of-day analysis
*/

{{
  config(
    materialized='table',
    unique_key='time_key'
  )
}}

WITH sales_times AS (
    -- Get all unique hours from sales (truncated to hour)
    SELECT DISTINCT DATE_TRUNC('hour', timestamp::time) AS time
    FROM {{ source('raw', 'sales') }}
),

time_spine AS (
    SELECT
        -- Surrogate key (HHMM format, e.g., 0900 for 9:00 AM)
        TO_CHAR(time, 'HH24MI')::integer AS time_key,
        
        -- Full time
        time::time AS time,
        
        -- Hour components
        EXTRACT(HOUR FROM time) AS hour_24,
        CASE 
            WHEN EXTRACT(HOUR FROM time) = 0 THEN 12
            WHEN EXTRACT(HOUR FROM time) <= 12 THEN EXTRACT(HOUR FROM time)
            ELSE EXTRACT(HOUR FROM time) - 12
        END AS hour_12,
        
        -- AM/PM
        CASE 
            WHEN EXTRACT(HOUR FROM time) < 12 THEN 'AM'
            ELSE 'PM'
        END AS am_pm,
        
        -- Formatted time strings
        TO_CHAR(time, 'HH24:MI') AS time_24h_format,
        TO_CHAR(time, 'HH12:MI AM') AS time_12h_format,
        
        -- Business periods
        CASE 
            WHEN EXTRACT(HOUR FROM time) BETWEEN 6 AND 11 THEN 'Morning'
            WHEN EXTRACT(HOUR FROM time) BETWEEN 12 AND 17 THEN 'Afternoon'
            WHEN EXTRACT(HOUR FROM time) BETWEEN 18 AND 21 THEN 'Evening'
            ELSE 'Night'
        END AS time_period,
        
        -- Detailed business periods
        CASE 
            WHEN EXTRACT(HOUR FROM time) BETWEEN 6 AND 8 THEN 'Early Morning'
            WHEN EXTRACT(HOUR FROM time) BETWEEN 9 AND 11 THEN 'Late Morning'
            WHEN EXTRACT(HOUR FROM time) BETWEEN 12 AND 14 THEN 'Lunch Time'
            WHEN EXTRACT(HOUR FROM time) BETWEEN 15 AND 17 THEN 'Afternoon'
            WHEN EXTRACT(HOUR FROM time) BETWEEN 18 AND 20 THEN 'Evening'
            WHEN EXTRACT(HOUR FROM time) BETWEEN 21 AND 23 THEN 'Late Evening'
            ELSE 'Night'
        END AS detailed_time_period,
        
        -- Peak hours flag (typical retail peak: 10-12, 17-19)
        CASE 
            WHEN EXTRACT(HOUR FROM time) BETWEEN 10 AND 12 THEN true
            WHEN EXTRACT(HOUR FROM time) BETWEEN 17 AND 19 THEN true
            ELSE false
        END AS is_peak_hour,
        
        -- Business hours flag (6 AM - 10 PM)
        CASE 
            WHEN EXTRACT(HOUR FROM time) BETWEEN 6 AND 22 THEN true
            ELSE false
        END AS is_business_hours
        
    FROM sales_times
)

SELECT * FROM time_spine
ORDER BY time
