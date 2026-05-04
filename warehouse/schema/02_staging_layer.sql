-- ============================================================
-- STAGING LAYER - Cleaned and standardized data
-- ============================================================
-- Purpose: Clean, validate, and standardize raw data
-- Remove duplicates, handle nulls, fix data types
-- ============================================================

-- Create staging schema
CREATE SCHEMA IF NOT EXISTS staging;

-- ============================================================
-- stg_products: Cleaned products
-- ============================================================

CREATE TABLE IF NOT EXISTS staging.products (
    -- Business key
    sku VARCHAR(50) PRIMARY KEY,
    
    -- Product attributes
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    cost_price NUMERIC(10, 2) NOT NULL CHECK (cost_price >= 0),
    profit_margin NUMERIC(5, 2),  -- Calculated: (price - cost_price) / price * 100
    unit VARCHAR(50) NOT NULL,
    supplier VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_load_id VARCHAR(100)
);

-- ============================================================
-- stg_sales: Cleaned sales
-- ============================================================

CREATE TABLE IF NOT EXISTS staging.sales (
    -- Business key
    transaction_id VARCHAR(100) PRIMARY KEY,
    
    -- Transaction details
    timestamp TIMESTAMP NOT NULL,
    product_sku VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    
    -- Amounts
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    
    -- Payment and customer
    payment_method VARCHAR(50),
    customer_type VARCHAR(50),
    customer_name VARCHAR(255),
    
    -- Time dimensions (extracted from timestamp)
    sale_date DATE NOT NULL,
    sale_time TIME NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    hour INTEGER NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_load_id VARCHAR(100)
);

-- ============================================================
-- Indexes for staging layer
-- ============================================================

-- Products
CREATE INDEX IF NOT EXISTS idx_stg_products_category ON staging.products(category);
CREATE INDEX IF NOT EXISTS idx_stg_products_brand ON staging.products(brand);

-- Sales
CREATE INDEX IF NOT EXISTS idx_stg_sales_product_sku ON staging.sales(product_sku);
CREATE INDEX IF NOT EXISTS idx_stg_sales_timestamp ON staging.sales(timestamp);
CREATE INDEX IF NOT EXISTS idx_stg_sales_date ON staging.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_stg_sales_category ON staging.sales(category);

-- ============================================================
-- Comments for documentation
-- ============================================================

COMMENT ON SCHEMA staging IS 'Staging layer: Cleaned and standardized data';
COMMENT ON TABLE staging.products IS 'Cleaned products with validated data types and constraints';
COMMENT ON TABLE staging.sales IS 'Cleaned sales with extracted time dimensions';
