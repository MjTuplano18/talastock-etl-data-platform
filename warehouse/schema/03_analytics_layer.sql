-- ============================================================
-- ANALYTICS LAYER - Star Schema for Business Intelligence
-- ============================================================
-- Purpose: Optimized for analytical queries
-- Star schema: fact table surrounded by dimension tables
-- ============================================================

-- Create analytics schema
CREATE SCHEMA IF NOT EXISTS analytics;

-- ============================================================
-- DIMENSION TABLES
-- ============================================================

-- dim_products: Product dimension
CREATE TABLE IF NOT EXISTS analytics.dim_products (
    product_key SERIAL PRIMARY KEY,  -- Surrogate key
    sku VARCHAR(50) UNIQUE NOT NULL,  -- Natural key
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL,
    profit_margin NUMERIC(5, 2),
    unit VARCHAR(50) NOT NULL,
    supplier VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- dim_dates: Date dimension
CREATE TABLE IF NOT EXISTS analytics.dim_dates (
    date_key INTEGER PRIMARY KEY,  -- Format: YYYYMMDD (e.g., 20260504)
    date DATE UNIQUE NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    week INTEGER NOT NULL,
    day INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,  -- 1=Monday, 7=Sunday
    day_of_week_name VARCHAR(20) NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    is_payday BOOLEAN NOT NULL,  -- 15th or 30th/31st
    is_holiday BOOLEAN DEFAULT FALSE
);

-- dim_times: Time dimension
CREATE TABLE IF NOT EXISTS analytics.dim_times (
    time_key INTEGER PRIMARY KEY,  -- Format: HHMMSS (e.g., 143000 for 2:30 PM)
    time TIME UNIQUE NOT NULL,
    hour INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    second INTEGER NOT NULL,
    time_of_day VARCHAR(20) NOT NULL,  -- Morning, Afternoon, Evening, Night
    is_peak_hour BOOLEAN NOT NULL  -- 7-9 AM, 5-7 PM, 8-10 PM
);

-- ============================================================
-- FACT TABLE
-- ============================================================

-- fact_sales: Sales transactions (center of star schema)
CREATE TABLE IF NOT EXISTS analytics.fact_sales (
    sale_key SERIAL PRIMARY KEY,  -- Surrogate key
    transaction_id VARCHAR(100) UNIQUE NOT NULL,  -- Natural key
    
    -- Foreign keys to dimensions
    product_key INTEGER NOT NULL REFERENCES analytics.dim_products(product_key),
    date_key INTEGER NOT NULL REFERENCES analytics.dim_dates(date_key),
    time_key INTEGER NOT NULL REFERENCES analytics.dim_times(time_key),
    
    -- Degenerate dimensions (attributes without separate dimension table)
    payment_method VARCHAR(50),
    customer_type VARCHAR(50),
    customer_name VARCHAR(255),
    
    -- Measures (additive facts)
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    cost NUMERIC(10, 2),  -- quantity * product cost_price
    profit NUMERIC(10, 2),  -- total_amount - cost
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- AGGREGATE TABLES (Pre-calculated metrics)
-- ============================================================

-- daily_sales_summary: Daily aggregated metrics
CREATE TABLE IF NOT EXISTS analytics.daily_sales_summary (
    date_key INTEGER PRIMARY KEY REFERENCES analytics.dim_dates(date_key),
    date DATE NOT NULL,
    total_revenue NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    total_profit NUMERIC(12, 2) NOT NULL,
    profit_margin_pct NUMERIC(5, 2),
    total_transactions INTEGER NOT NULL,
    total_units_sold INTEGER NOT NULL,
    average_transaction_value NUMERIC(10, 2),
    unique_products_sold INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- product_performance: Product-level metrics
CREATE TABLE IF NOT EXISTS analytics.product_performance (
    product_key INTEGER PRIMARY KEY REFERENCES analytics.dim_products(product_key),
    sku VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    total_revenue NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    total_profit NUMERIC(12, 2) NOT NULL,
    profit_margin_pct NUMERIC(5, 2),
    total_units_sold INTEGER NOT NULL,
    total_transactions INTEGER NOT NULL,
    average_unit_price NUMERIC(10, 2),
    revenue_rank INTEGER,
    units_rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- category_performance: Category-level metrics
CREATE TABLE IF NOT EXISTS analytics.category_performance (
    category VARCHAR(100) PRIMARY KEY,
    total_revenue NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    total_profit NUMERIC(12, 2) NOT NULL,
    profit_margin_pct NUMERIC(5, 2),
    total_units_sold INTEGER NOT NULL,
    total_transactions INTEGER NOT NULL,
    unique_products INTEGER NOT NULL,
    revenue_rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Indexes for analytics layer
-- ============================================================

-- Dimension indexes
CREATE INDEX IF NOT EXISTS idx_dim_products_category ON analytics.dim_products(category);
CREATE INDEX IF NOT EXISTS idx_dim_products_brand ON analytics.dim_products(brand);
CREATE INDEX IF NOT EXISTS idx_dim_dates_date ON analytics.dim_dates(date);
CREATE INDEX IF NOT EXISTS idx_dim_dates_year_month ON analytics.dim_dates(year, month);
CREATE INDEX IF NOT EXISTS idx_dim_times_hour ON analytics.dim_times(hour);

-- Fact table indexes
CREATE INDEX IF NOT EXISTS idx_fact_sales_product_key ON analytics.fact_sales(product_key);
CREATE INDEX IF NOT EXISTS idx_fact_sales_date_key ON analytics.fact_sales(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_sales_time_key ON analytics.fact_sales(time_key);
CREATE INDEX IF NOT EXISTS idx_fact_sales_payment_method ON analytics.fact_sales(payment_method);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fact_sales_date_product ON analytics.fact_sales(date_key, product_key);
CREATE INDEX IF NOT EXISTS idx_fact_sales_date_time ON analytics.fact_sales(date_key, time_key);

-- ============================================================
-- Comments for documentation
-- ============================================================

COMMENT ON SCHEMA analytics IS 'Analytics layer: Star schema optimized for business intelligence';
COMMENT ON TABLE analytics.dim_products IS 'Product dimension with SCD Type 2 support';
COMMENT ON TABLE analytics.dim_dates IS 'Date dimension with business calendar attributes';
COMMENT ON TABLE analytics.dim_times IS 'Time dimension with time-of-day categorization';
COMMENT ON TABLE analytics.fact_sales IS 'Sales fact table - center of star schema';
COMMENT ON TABLE analytics.daily_sales_summary IS 'Pre-aggregated daily metrics for fast dashboard queries';
COMMENT ON TABLE analytics.product_performance IS 'Pre-aggregated product metrics with rankings';
COMMENT ON TABLE analytics.category_performance IS 'Pre-aggregated category metrics';
