-- ============================================================
-- DATA QUALITY CHECK
-- Run this in pgAdmin Query Tool to verify data integrity
-- ============================================================

-- 1. Check for NULL values in fact_sales
SELECT 
    '1. NULL Check in fact_sales' as check_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE total_amount IS NULL) as null_amount,
    COUNT(*) FILTER (WHERE profit IS NULL) as null_profit,
    COUNT(*) FILTER (WHERE cost IS NULL) as null_cost,
    COUNT(*) FILTER (WHERE total_amount IS NOT NULL 
                     AND profit IS NOT NULL 
                     AND cost IS NOT NULL) as valid_rows
FROM analytics.fact_sales;

-- 2. Check products with missing cost_price
SELECT 
    '2. Products with missing cost_price' as check_name,
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE cost_price IS NULL OR cost_price = 0) as missing_cost,
    COUNT(*) FILTER (WHERE cost_price > 0) as valid_cost
FROM analytics.dim_products;

-- 3. List products with missing cost_price (if any)
SELECT 
    '3. Products with missing cost_price (details)' as check_name,
    sku, 
    name, 
    category, 
    price, 
    cost_price
FROM analytics.dim_products
WHERE cost_price IS NULL OR cost_price = 0
LIMIT 10;

-- 4. Check for negative values
SELECT 
    '4. Negative Values Check' as check_name,
    COUNT(*) FILTER (WHERE total_amount < 0) as negative_amount,
    COUNT(*) FILTER (WHERE profit < 0) as negative_profit,
    COUNT(*) FILTER (WHERE quantity < 0) as negative_quantity,
    COUNT(*) FILTER (WHERE total_amount >= 0 AND profit >= 0 AND quantity >= 0) as all_positive
FROM analytics.fact_sales;

-- 5. Revenue calculations verification
SELECT 
    '5. Revenue Calculations' as check_name,
    TO_CHAR(SUM(total_amount), 'FM₱999,999,999.00') as total_revenue,
    TO_CHAR(SUM(cost), 'FM₱999,999,999.00') as total_cost,
    TO_CHAR(SUM(profit), 'FM₱999,999,999.00') as total_profit,
    TO_CHAR(ROUND((SUM(profit) / NULLIF(SUM(total_amount), 0) * 100)::numeric, 2), 'FM999.00%') as profit_margin_pct
FROM analytics.fact_sales;

-- 6. Check for orphaned records
SELECT 
    '6. Orphaned Records Check' as check_name,
    (SELECT COUNT(*) 
     FROM analytics.fact_sales f
     LEFT JOIN analytics.dim_products p ON f.product_key = p.product_key
     WHERE p.product_key IS NULL) as sales_without_product,
    (SELECT COUNT(*) 
     FROM analytics.fact_sales f
     LEFT JOIN analytics.dim_dates d ON f.date_key = d.date_key
     WHERE d.date_key IS NULL) as sales_without_date,
    (SELECT COUNT(*) 
     FROM analytics.fact_sales f
     LEFT JOIN analytics.dim_times t ON f.time_key = t.time_key
     WHERE t.time_key IS NULL) as sales_without_time;

-- 7. Sample of valid transactions
SELECT 
    f.transaction_id,
    p.name as product,
    p.category,
    f.quantity,
    TO_CHAR(f.unit_price, 'FM₱999.00') as unit_price,
    TO_CHAR(f.total_amount, 'FM₱999.00') as total_amount,
    TO_CHAR(f.cost, 'FM₱999.00') as cost,
    TO_CHAR(f.profit, 'FM₱999.00') as profit
FROM analytics.fact_sales f
JOIN analytics.dim_products p ON f.product_key = p.product_key
WHERE f.total_amount > 0 AND f.profit IS NOT NULL
ORDER BY f.total_amount DESC
LIMIT 10;

-- 8. Data completeness summary
SELECT 
    'raw.products' as table_name,
    (SELECT COUNT(*) FROM raw.products) as row_count
UNION ALL
SELECT 'raw.sales', (SELECT COUNT(*) FROM raw.sales)
UNION ALL
SELECT 'staging.products', (SELECT COUNT(*) FROM staging.products)
UNION ALL
SELECT 'staging.sales', (SELECT COUNT(*) FROM staging.sales)
UNION ALL
SELECT 'analytics.dim_products', (SELECT COUNT(*) FROM analytics.dim_products)
UNION ALL
SELECT 'analytics.dim_dates', (SELECT COUNT(*) FROM analytics.dim_dates)
UNION ALL
SELECT 'analytics.dim_times', (SELECT COUNT(*) FROM analytics.dim_times)
UNION ALL
SELECT 'analytics.fact_sales', (SELECT COUNT(*) FROM analytics.fact_sales)
UNION ALL
SELECT 'analytics.daily_sales_summary', (SELECT COUNT(*) FROM analytics.daily_sales_summary)
UNION ALL
SELECT 'analytics.product_performance', (SELECT COUNT(*) FROM analytics.product_performance)
UNION ALL
SELECT 'analytics.category_performance', (SELECT COUNT(*) FROM analytics.category_performance);

-- 9. Check for transactions with profit issues
SELECT 
    '9. Profit Calculation Issues' as check_name,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE profit = total_amount - cost) as correct_profit_calc,
    COUNT(*) FILTER (WHERE ABS(profit - (total_amount - cost)) > 0.01) as incorrect_profit_calc
FROM analytics.fact_sales;

-- 10. Top 5 most profitable transactions
SELECT 
    f.transaction_id,
    p.name as product,
    f.quantity,
    TO_CHAR(f.total_amount, 'FM₱999,999.00') as revenue,
    TO_CHAR(f.profit, 'FM₱999,999.00') as profit,
    TO_CHAR((f.profit / NULLIF(f.total_amount, 0) * 100), 'FM999.00%') as margin
FROM analytics.fact_sales f
JOIN analytics.dim_products p ON f.product_key = p.product_key
ORDER BY f.profit DESC
LIMIT 5;

-- ============================================================
-- SUMMARY: If all checks pass, you should see:
-- - 0 NULL values in fact_sales
-- - 0 products with missing cost_price
-- - 0 orphaned records
-- - All row counts matching across layers
-- - Valid revenue calculations
-- ============================================================
