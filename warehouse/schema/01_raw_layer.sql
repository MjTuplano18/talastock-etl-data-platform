-- ============================================================
-- RAW LAYER - Unchanged data from source files
-- ============================================================
-- Purpose: Store exact copy of extracted data
-- No transformations, no cleaning, just raw data
-- ============================================================

-- Create raw schema
CREATE SCHEMA IF NOT EXISTS raw;

-- ============================================================
-- raw_products: Exact copy of products CSV
-- ============================================================

CREATE TABLE IF NOT EXISTS raw.products (
    -- Source data columns (exact match to CSV)
    sku VARCHAR(50),
    name VARCHAR(255),
    category VARCHAR(100),
    brand VARCHAR(100),
    price NUMERIC(10, 2),
    cost_price NUMERIC(10, 2),
    unit VARCHAR(50),
    supplier VARCHAR(255),
    
    -- Metadata columns
    loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_file VARCHAR(255),
    load_id VARCHAR(100)
);

-- ============================================================
-- raw_sales: Exact copy of sales CSV
-- ============================================================

CREATE TABLE IF NOT EXISTS raw.sales (
    -- Source data columns (exact match to CSV)
    transaction_id VARCHAR(100),
    timestamp TIMESTAMP,
    product_sku VARCHAR(50),
    product_name VARCHAR(255),
    category VARCHAR(100),
    brand VARCHAR(100),
    quantity INTEGER,
    unit_price NUMERIC(10, 2),
    total_amount NUMERIC(10, 2),
    payment_method VARCHAR(50),
    customer_type VARCHAR(50),
    customer_name VARCHAR(255),
    
    -- Metadata columns
    loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_file VARCHAR(255),
    load_id VARCHAR(100)
);

-- ============================================================
-- Indexes for raw layer (minimal, just for loading performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_raw_products_sku ON raw.products(sku);
CREATE INDEX IF NOT EXISTS idx_raw_sales_transaction_id ON raw.sales(transaction_id);
CREATE INDEX IF NOT EXISTS idx_raw_sales_timestamp ON raw.sales(timestamp);

-- ============================================================
-- Comments for documentation
-- ============================================================

COMMENT ON SCHEMA raw IS 'Raw layer: Unchanged data from source files';
COMMENT ON TABLE raw.products IS 'Raw products data - exact copy from CSV';
COMMENT ON TABLE raw.sales IS 'Raw sales data - exact copy from CSV';
