-- ============================================================
-- QUICK QUERIES TO EXPLORE YOUR DATA WAREHOUSE
-- Run these in pgAdmin Query Tool (http://localhost:5050)
-- ============================================================

-- ============================================================
-- 1. VERIFY DATA LOADED
-- ============================================================

-- Check row counts in all tables
SELECT 'raw.products' as table_name, COUNT(*) as row_count FROM raw.products
UNION ALL
SELECT 'raw.sales', COUNT(*) FROM raw.sales
UNION ALL
SELECT 'staging.products', COUNT(*) FROM staging.products
UNION ALL
SELECT 'staging.sales', COUNT(*) FROM staging.sales
UNION ALL
SELECT 'analytics.dim_products', COUNT(*) FROM analytics.dim_products
UNION ALL
SELECT 'analytics.dim_dates', COUNT(*) FROM analytics.dim_dates
UNION ALL
SELECT 'analytics.dim_times', COUNT(*) FROM analytics.dim_times
UNION ALL
SELECT 'analytics.fact_sales', COUNT(*) FROM analytics.fact_sales
UNION ALL
SELECT 'analytics.daily_sales_summary', COUNT(*) FROM analytics.daily_sales_summary
UNION ALL
SELECT 'analytics.product_performance', COUNT(*) FROM analytics.product_performance
UNION ALL
SELECT 'analytics.category_performance', COUNT(*) FROM analytics.category_performance;

-- ============================================================
-- 2. TOP 10 PRODUCTS BY REVENUE
-- ============================================================

SELECT 
    product_name,
    category,
    TO_CHAR(total_revenue, 'FM₱999,999,999.00') as revenue,
    total_units_sold,
    total_transactions,
    TO_CHAR(profit_margin_pct, 'FM999.00%') as margin,
    revenue_rank
FROM analytics.product_performance
ORDER BY revenue_rank
LIMIT 10;

-- ============================================================
-- 3. DAILY REVENUE TREND (Last 30 Days)
-- ============================================================

SELECT 
    TO_CHAR(date, 'Mon DD, YYYY') as date,
    TO_CHAR(total_revenue, 'FM₱999,999.00') as revenue,
    total_transactions as txns,
    TO_CHAR(average_transaction_value, 'FM₱999.00') as avg_txn,
    total_units_sold as units
FROM analytics.daily_sales_summary
ORDER BY date DESC
LIMIT 30;

-- ============================================================
-- 4. CATEGORY PERFORMANCE
-- ============================================================

SELECT 
    category,
    TO_CHAR(total_revenue, 'FM₱999,999,999.00') as revenue,
    TO_CHAR(total_profit, 'FM₱999,999,999.00') as profit,
    TO_CHAR(profit_margin_pct, 'FM999.00%') as margin,
    total_units_sold as units,
    unique_products as products,
    revenue_rank as rank
FROM analytics.category_performance
ORDER BY revenue_rank;

-- ============================================================
-- 5. SALES BY DAY OF WEEK
-- ============================================================

SELECT 
    d.day_of_week_name,
    COUNT(*) as transactions,
    TO_CHAR(SUM(f.total_amount), 'FM₱999,999,999.00') as total_revenue,
    TO_CHAR(AVG(f.total_amount), 'FM₱999.00') as avg_transaction,
    SUM(f.quantity) as units_sold
FROM analytics.fact_sales f
JOIN analytics.dim_dates d ON f.date_key = d.date_key
GROUP BY d.day_of_week_name, d.day_of_week
ORDER BY d.day_of_week;

-- ============================================================
-- 6. SALES BY TIME OF DAY
-- ============================================================

SELECT 
    t.time_of_day,
    t.is_peak_hour,
    COUNT(*) as transactions,
    TO_CHAR(SUM(f.total_amount), 'FM₱999,999,999.00') as total_revenue,
    TO_CHAR(AVG(f.total_amount), 'FM₱999.00') as avg_transaction,
    SUM(f.quantity) as units_sold
FROM analytics.fact_sales f
JOIN analytics.dim_times t ON f.time_key = t.time_key
GROUP BY t.time_of_day, t.is_peak_hour
ORDER BY total_revenue DESC;

-- ============================================================
-- 7. WEEKEND vs WEEKDAY PERFORMANCE
-- ============================================================

SELECT 
    CASE WHEN d.is_weekend THEN 'Weekend' ELSE 'Weekday' END as period,
    COUNT(*) as transactions,
    TO_CHAR(SUM(f.total_amount), 'FM₱999,999,999.00') as total_revenue,
    TO_CHAR(AVG(f.total_amount), 'FM₱999.00') as avg_transaction,
    SUM(f.quantity) as units_sold
FROM analytics.fact_sales f
JOIN analytics.dim_dates d ON f.date_key = d.date_key
GROUP BY d.is_weekend
ORDER BY d.is_weekend;

-- ============================================================
-- 8. PAYDAY EFFECT (15th and 30th)
-- ============================================================

SELECT 
    CASE WHEN d.is_payday THEN 'Payday' ELSE 'Regular Day' END as day_type,
    COUNT(*) as transactions,
    TO_CHAR(SUM(f.total_amount), 'FM₱999,999,999.00') as total_revenue,
    TO_CHAR(AVG(f.total_amount), 'FM₱999.00') as avg_transaction,
    SUM(f.quantity) as units_sold
FROM analytics.fact_sales f
JOIN analytics.dim_dates d ON f.date_key = d.date_key
GROUP BY d.is_payday
ORDER BY d.is_payday DESC;

-- ============================================================
-- 9. PAYMENT METHOD BREAKDOWN
-- ============================================================

SELECT 
    payment_method,
    COUNT(*) as transactions,
    TO_CHAR(SUM(total_amount), 'FM₱999,999,999.00') as total_revenue,
    TO_CHAR(AVG(total_amount), 'FM₱999.00') as avg_transaction,
    ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM analytics.fact_sales) * 100), 2) as pct_of_total
FROM analytics.fact_sales
GROUP BY payment_method
ORDER BY total_revenue DESC;

-- ============================================================
-- 10. CUSTOMER TYPE ANALYSIS
-- ============================================================

SELECT 
    customer_type,
    COUNT(*) as transactions,
    TO_CHAR(SUM(total_amount), 'FM₱999,999,999.00') as total_revenue,
    TO_CHAR(AVG(total_amount), 'FM₱999.00') as avg_transaction,
    SUM(quantity) as units_sold
FROM analytics.fact_sales
GROUP BY customer_type
ORDER BY total_revenue DESC;

-- ============================================================
-- 11. MONTHLY REVENUE TREND
-- ============================================================

SELECT 
    d.year,
    d.month,
    d.month_name,
    COUNT(*) as transactions,
    TO_CHAR(SUM(f.total_amount), 'FM₱999,999,999.00') as total_revenue,
    TO_CHAR(SUM(f.profit), 'FM₱999,999,999.00') as total_profit,
    SUM(f.quantity) as units_sold
FROM analytics.fact_sales f
JOIN analytics.dim_dates d ON f.date_key = d.date_key
GROUP BY d.year, d.month, d.month_name
ORDER BY d.year, d.month;

-- ============================================================
-- 12. BEST SELLING PRODUCTS BY CATEGORY
-- ============================================================

WITH ranked_products AS (
    SELECT 
        category,
        product_name,
        total_revenue,
        total_units_sold,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY total_revenue DESC) as rank
    FROM analytics.product_performance
)
SELECT 
    category,
    product_name,
    TO_CHAR(total_revenue, 'FM₱999,999.00') as revenue,
    total_units_sold as units
FROM ranked_products
WHERE rank <= 3
ORDER BY category, rank;

-- ============================================================
-- 13. PROFIT MARGIN ANALYSIS
-- ============================================================

SELECT 
    p.category,
    COUNT(*) as products,
    TO_CHAR(AVG(p.profit_margin), 'FM999.00%') as avg_margin,
    TO_CHAR(MIN(p.profit_margin), 'FM999.00%') as min_margin,
    TO_CHAR(MAX(p.profit_margin), 'FM999.00%') as max_margin
FROM analytics.dim_products p
GROUP BY p.category
ORDER BY AVG(p.profit_margin) DESC;

-- ============================================================
-- 14. HOURLY SALES PATTERN
-- ============================================================

SELECT 
    t.hour,
    t.time_of_day,
    t.is_peak_hour,
    COUNT(*) as transactions,
    TO_CHAR(SUM(f.total_amount), 'FM₱999,999.00') as total_revenue,
    SUM(f.quantity) as units_sold
FROM analytics.fact_sales f
JOIN analytics.dim_times t ON f.time_key = t.time_key
GROUP BY t.hour, t.time_of_day, t.is_peak_hour
ORDER BY t.hour;

-- ============================================================
-- 15. OVERALL BUSINESS SUMMARY
-- ============================================================

SELECT 
    TO_CHAR(SUM(total_revenue), 'FM₱999,999,999.00') as total_revenue,
    TO_CHAR(SUM(total_cost), 'FM₱999,999,999.00') as total_cost,
    TO_CHAR(SUM(total_profit), 'FM₱999,999,999.00') as total_profit,
    TO_CHAR(AVG(profit_margin_pct), 'FM999.00%') as avg_profit_margin,
    SUM(total_transactions) as total_transactions,
    SUM(total_units_sold) as total_units_sold,
    TO_CHAR(AVG(average_transaction_value), 'FM₱999.00') as avg_transaction_value,
    COUNT(*) as days_of_data
FROM analytics.daily_sales_summary;
