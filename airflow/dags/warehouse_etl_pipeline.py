"""
Warehouse ETL Pipeline - Load Data into PostgreSQL Data Warehouse

This DAG extends the sales ETL pipeline to load data into the warehouse:
1. Extract & Transform: Use cleaned CSV files from Phase 2
2. Load Raw: Load into raw layer
3. Load Staging: Transform and load into staging layer
4. Build Dimensions: Create dimension tables
5. Build Fact: Create fact table
6. Calculate Metrics: Generate aggregate tables

Author: Talastock Data Platform Team
Phase: 3 - Data Warehouse & Analytics
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator
from datetime import datetime, timedelta
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os

# ============================================================
# Configuration
# ============================================================

# Paths
BASE_DIR = '/opt/airflow'
INPUT_DIR = f'{BASE_DIR}/data-generator/processed'

# Files to process (cleaned data from Phase 2)
PRODUCTS_FILE = f'{INPUT_DIR}/products_cleaned.csv'
SALES_FILE = f'{INPUT_DIR}/sales_cleaned.csv'

# Warehouse connection
WAREHOUSE_CONFIG = {
    'host': 'talastock-warehouse',
    'port': 5432,
    'database': 'talastock_warehouse',
    'user': 'warehouse_user',
    'password': 'warehouse_pass'
}

# ============================================================
# Helper Functions
# ============================================================

def get_warehouse_connection():
    """Create connection to warehouse"""
    return psycopg2.connect(**WAREHOUSE_CONFIG)

def execute_query(query, params=None):
    """Execute a query and return results"""
    conn = get_warehouse_connection()
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        conn.commit()
        return cur.fetchall() if cur.description else None
    finally:
        cur.close()
        conn.close()

# ============================================================
# Default Arguments
# ============================================================

default_args = {
    'owner': 'talastock',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

# ============================================================
# Create DAG
# ============================================================

dag = DAG(
    'warehouse_etl_pipeline',
    default_args=default_args,
    description='ETL pipeline for loading data into PostgreSQL warehouse',
    schedule_interval='@daily',
    start_date=datetime(2026, 5, 1),
    catchup=False,
    tags=['etl', 'warehouse', 'production'],
)

# ============================================================
# Task 1: Validate Cleaned Files
# ============================================================

def validate_cleaned_files():
    """Check if cleaned files exist"""
    print("=" * 60)
    print("📋 TASK 1: Validating Cleaned Files")
    print("=" * 60)
    
    files = [PRODUCTS_FILE, SALES_FILE]
    for file_path in files:
        if os.path.exists(file_path):
            size_kb = os.path.getsize(file_path) / 1024
            print(f"✅ Found: {os.path.basename(file_path)} ({size_kb:.2f} KB)")
        else:
            raise FileNotFoundError(f"Missing: {file_path}")
    
    print("\n✅ All files validated!")
    print("=" * 60)

validate_task = PythonOperator(
    task_id='validate_cleaned_files',
    python_callable=validate_cleaned_files,
    dag=dag,
)

# ============================================================
# Task 2: Load Raw Products
# ============================================================

def load_raw_products():
    """Load products into raw layer"""
    print("\n" + "=" * 60)
    print("📦 TASK 2: Loading Raw Products")
    print("=" * 60)
    
    # Read CSV
    df = pd.read_csv(PRODUCTS_FILE)
    print(f"  Loaded {len(df)} products from CSV")
    
    # Add metadata
    load_id = datetime.now().strftime('%Y%m%d_%H%M%S')
    df['loaded_at'] = datetime.now()
    df['source_file'] = 'products_cleaned.csv'
    df['load_id'] = load_id
    
    # Connect and load
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        # Truncate table (full refresh)
        cur.execute("TRUNCATE TABLE raw.products")
        
        # Prepare data
        columns = ['sku', 'name', 'category', 'brand', 'price', 'cost_price', 
                   'unit', 'supplier', 'loaded_at', 'source_file', 'load_id']
        values = df[columns].values.tolist()
        
        # Bulk insert
        query = f"""
            INSERT INTO raw.products ({', '.join(columns)})
            VALUES %s
        """
        execute_values(cur, query, values)
        conn.commit()
        
        print(f"✅ Loaded {len(df)} products into raw.products")
        print("=" * 60)
        
    finally:
        cur.close()
        conn.close()

load_raw_products_task = PythonOperator(
    task_id='load_raw_products',
    python_callable=load_raw_products,
    dag=dag,
)

# ============================================================
# Task 3: Load Raw Sales
# ============================================================

def load_raw_sales():
    """Load sales into raw layer"""
    print("\n" + "=" * 60)
    print("💰 TASK 3: Loading Raw Sales")
    print("=" * 60)
    
    # Read CSV
    df = pd.read_csv(SALES_FILE)
    print(f"  Loaded {len(df)} sales from CSV")
    
    # Add metadata
    load_id = datetime.now().strftime('%Y%m%d_%H%M%S')
    df['loaded_at'] = datetime.now()
    df['source_file'] = 'sales_cleaned.csv'
    df['load_id'] = load_id
    
    # Connect and load
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        # Truncate table (full refresh)
        cur.execute("TRUNCATE TABLE raw.sales")
        
        # Prepare data
        columns = ['transaction_id', 'timestamp', 'product_sku', 'product_name',
                   'category', 'brand', 'quantity', 'unit_price', 'total_amount',
                   'payment_method', 'customer_type', 'customer_name',
                   'loaded_at', 'source_file', 'load_id']
        values = df[columns].values.tolist()
        
        # Bulk insert
        query = f"""
            INSERT INTO raw.sales ({', '.join(columns)})
            VALUES %s
        """
        execute_values(cur, query, values)
        conn.commit()
        
        print(f"✅ Loaded {len(df)} sales into raw.sales")
        print("=" * 60)
        
    finally:
        cur.close()
        conn.close()

load_raw_sales_task = PythonOperator(
    task_id='load_raw_sales',
    python_callable=load_raw_sales,
    dag=dag,
)

# ============================================================
# Task 4: Load Staging Products
# ============================================================

def load_staging_products():
    """Transform raw → staging products"""
    print("\n" + "=" * 60)
    print("🔧 TASK 4: Loading Staging Products")
    print("=" * 60)
    
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        # Truncate staging table
        cur.execute("TRUNCATE TABLE staging.products CASCADE")
        
        # Transform and load
        query = """
            INSERT INTO staging.products (
                sku, name, category, brand, price, cost_price, profit_margin,
                unit, supplier, source_load_id
            )
            SELECT 
                sku,
                name,
                category,
                brand,
                price,
                cost_price,
                ROUND(((price - cost_price) / NULLIF(price, 0) * 100)::numeric, 2) as profit_margin,
                unit,
                supplier,
                load_id
            FROM raw.products
            WHERE price > 0 AND cost_price >= 0
        """
        cur.execute(query)
        rows = cur.rowcount
        conn.commit()
        
        print(f"✅ Loaded {rows} products into staging.products")
        print("=" * 60)
        
    finally:
        cur.close()
        conn.close()

load_staging_products_task = PythonOperator(
    task_id='load_staging_products',
    python_callable=load_staging_products,
    dag=dag,
)

# ============================================================
# Task 5: Load Staging Sales
# ============================================================

def load_staging_sales():
    """Transform raw → staging sales"""
    print("\n" + "=" * 60)
    print("🔧 TASK 5: Loading Staging Sales")
    print("=" * 60)
    
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        # Truncate and reload in a single transaction so retries are safe
        cur.execute("TRUNCATE TABLE staging.sales CASCADE")
        
        # Transform and load — use DISTINCT ON to deduplicate by transaction_id
        # (source CSV may contain duplicate transaction IDs; keep the first occurrence)
        query = """
            INSERT INTO staging.sales (
                transaction_id, timestamp, product_sku, product_name,
                category, brand, quantity, unit_price, total_amount,
                payment_method, customer_type, customer_name,
                sale_date, sale_time, year, month, day, day_of_week, hour,
                source_load_id
            )
            SELECT DISTINCT ON (transaction_id)
                transaction_id,
                timestamp,
                product_sku,
                product_name,
                category,
                brand,
                quantity,
                unit_price,
                total_amount,
                payment_method,
                customer_type,
                customer_name,
                timestamp::date as sale_date,
                timestamp::time as sale_time,
                EXTRACT(YEAR FROM timestamp)::integer as year,
                EXTRACT(MONTH FROM timestamp)::integer as month,
                EXTRACT(DAY FROM timestamp)::integer as day,
                TO_CHAR(timestamp, 'Day') as day_of_week,
                EXTRACT(HOUR FROM timestamp)::integer as hour,
                load_id
            FROM raw.sales
            WHERE quantity > 0 AND total_amount >= 0
            ORDER BY transaction_id, timestamp
        """
        cur.execute(query)
        rows = cur.rowcount
        conn.commit()
        
        print(f"✅ Loaded {rows} sales into staging.sales")
        print("=" * 60)
        
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

load_staging_sales_task = PythonOperator(
    task_id='load_staging_sales',
    python_callable=load_staging_sales,
    dag=dag,
)

# ============================================================
# Task 6: Build Dimension - Products
# ============================================================

def build_dim_products():
    """Build dim_products from staging"""
    print("\n" + "=" * 60)
    print("📊 TASK 6: Building dim_products")
    print("=" * 60)
    
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        # Truncate dimension table
        cur.execute("TRUNCATE TABLE analytics.dim_products CASCADE")
        
        # Load dimension
        query = """
            INSERT INTO analytics.dim_products (
                sku, name, category, brand, price, cost_price, profit_margin,
                unit, supplier, is_active
            )
            SELECT 
                sku, name, category, brand, price, cost_price, profit_margin,
                unit, supplier, TRUE as is_active
            FROM staging.products
        """
        cur.execute(query)
        rows = cur.rowcount
        conn.commit()
        
        print(f"✅ Built dim_products with {rows} products")
        print("=" * 60)
        
    finally:
        cur.close()
        conn.close()

build_dim_products_task = PythonOperator(
    task_id='build_dim_products',
    python_callable=build_dim_products,
    dag=dag,
)

# ============================================================
# Task 7: Build Dimension - Dates
# ============================================================

def build_dim_dates():
    """Build dim_dates from sales date range"""
    print("\n" + "=" * 60)
    print("📅 TASK 7: Building dim_dates")
    print("=" * 60)
    
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        # Truncate dimension table
        cur.execute("TRUNCATE TABLE analytics.dim_dates CASCADE")
        
        # Generate date dimension
        query = """
            INSERT INTO analytics.dim_dates (
                date_key, date, year, quarter, month, month_name, week, day,
                day_of_week, day_of_week_name, is_weekend, is_payday
            )
            SELECT 
                TO_CHAR(date, 'YYYYMMDD')::integer as date_key,
                date,
                EXTRACT(YEAR FROM date)::integer as year,
                EXTRACT(QUARTER FROM date)::integer as quarter,
                EXTRACT(MONTH FROM date)::integer as month,
                TO_CHAR(date, 'Month') as month_name,
                EXTRACT(WEEK FROM date)::integer as week,
                EXTRACT(DAY FROM date)::integer as day,
                EXTRACT(ISODOW FROM date)::integer as day_of_week,
                TO_CHAR(date, 'Day') as day_of_week_name,
                EXTRACT(ISODOW FROM date) IN (6, 7) as is_weekend,
                EXTRACT(DAY FROM date) IN (15, 30, 31) as is_payday
            FROM generate_series(
                (SELECT MIN(sale_date) FROM staging.sales),
                (SELECT MAX(sale_date) FROM staging.sales),
                '1 day'::interval
            ) as date
        """
        cur.execute(query)
        rows = cur.rowcount
        conn.commit()
        
        print(f"✅ Built dim_dates with {rows} dates")
        print("=" * 60)
        
    finally:
        cur.close()
        conn.close()

build_dim_dates_task = PythonOperator(
    task_id='build_dim_dates',
    python_callable=build_dim_dates,
    dag=dag,
)

# ============================================================
# Task 8: Build Dimension - Times
# ============================================================

def build_dim_times():
    """Build dim_times for all hours"""
    print("\n" + "=" * 60)
    print("⏰ TASK 8: Building dim_times")
    print("=" * 60)
    
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        # Truncate dimension table
        cur.execute("TRUNCATE TABLE analytics.dim_times CASCADE")
        
        # Generate time dimension
        # Note: generate_series doesn't support time type, use timestamp and cast
        query = """
            INSERT INTO analytics.dim_times (
                time_key, time, hour, minute, second, time_of_day, is_peak_hour
            )
            SELECT 
                TO_CHAR(ts::time, 'HH24MISS')::integer as time_key,
                ts::time as time,
                EXTRACT(HOUR FROM ts)::integer as hour,
                EXTRACT(MINUTE FROM ts)::integer as minute,
                EXTRACT(SECOND FROM ts)::integer as second,
                CASE 
                    WHEN EXTRACT(HOUR FROM ts) BETWEEN 6 AND 11 THEN 'Morning'
                    WHEN EXTRACT(HOUR FROM ts) BETWEEN 12 AND 17 THEN 'Afternoon'
                    WHEN EXTRACT(HOUR FROM ts) BETWEEN 18 AND 21 THEN 'Evening'
                    ELSE 'Night'
                END as time_of_day,
                EXTRACT(HOUR FROM ts) IN (7, 8, 9, 17, 18, 19, 20, 21, 22) as is_peak_hour
            FROM generate_series(
                '2000-01-01 00:00:00'::timestamp,
                '2000-01-01 23:00:00'::timestamp,
                '1 hour'::interval
            ) as ts
        """
        cur.execute(query)
        rows = cur.rowcount
        conn.commit()
        
        print(f"✅ Built dim_times with {rows} time slots")
        print("=" * 60)
        
    finally:
        cur.close()
        conn.close()

build_dim_times_task = PythonOperator(
    task_id='build_dim_times',
    python_callable=build_dim_times,
    dag=dag,
)

# ============================================================
# Task 9: Build Fact Table
# ============================================================

def build_fact_sales():
    """Build fact_sales from staging + dimensions"""
    print("\n" + "=" * 60)
    print("⭐ TASK 9: Building fact_sales")
    print("=" * 60)
    
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        # Truncate fact table
        cur.execute("TRUNCATE TABLE analytics.fact_sales")
        
        # Build fact table with NaN filtering
        # Round time to nearest hour to match dim_times granularity
        query = """
            INSERT INTO analytics.fact_sales (
                transaction_id, product_key, date_key, time_key,
                payment_method, customer_type, customer_name,
                quantity, unit_price, total_amount, cost, profit
            )
            SELECT 
                s.transaction_id,
                p.product_key,
                TO_CHAR(s.sale_date, 'YYYYMMDD')::integer as date_key,
                TO_CHAR(DATE_TRUNC('hour', s.sale_time::time)::time, 'HH24MISS')::integer as time_key,
                s.payment_method,
                s.customer_type,
                s.customer_name,
                s.quantity,
                s.unit_price,
                s.total_amount,
                s.quantity * p.cost_price as cost,
                s.total_amount - (s.quantity * p.cost_price) as profit
            FROM staging.sales s
            JOIN analytics.dim_products p ON s.product_sku = p.sku
            WHERE s.unit_price IS NOT NULL
              AND s.unit_price != 'NaN'::numeric
              AND s.total_amount IS NOT NULL
              AND s.total_amount != 'NaN'::numeric
              AND s.quantity > 0
              AND s.quantity IS NOT NULL
              AND p.cost_price IS NOT NULL
              AND p.cost_price != 'NaN'::numeric
              AND p.cost_price >= 0
        """
        cur.execute(query)
        rows = cur.rowcount
        conn.commit()
        
        print(f"✅ Built fact_sales with {rows} clean transactions (NaN filtered)")
        print("=" * 60)
        
    finally:
        cur.close()
        conn.close()

build_fact_sales_task = PythonOperator(
    task_id='build_fact_sales',
    python_callable=build_fact_sales,
    dag=dag,
)

# ============================================================
# Task 10: Calculate Daily Sales Summary
# ============================================================

def calculate_daily_summary():
    """Calculate daily_sales_summary metrics"""
    print("\n" + "=" * 60)
    print("📈 TASK 10: Calculating Daily Summary")
    print("=" * 60)
    
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        # Truncate aggregate table
        cur.execute("TRUNCATE TABLE analytics.daily_sales_summary")
        
        # Calculate metrics
        query = """
            INSERT INTO analytics.daily_sales_summary (
                date_key, date, total_revenue, total_cost, total_profit,
                profit_margin_pct, total_transactions, total_units_sold,
                average_transaction_value, unique_products_sold
            )
            SELECT 
                f.date_key,
                d.date,
                COALESCE(SUM(f.total_amount), 0) as total_revenue,
                COALESCE(SUM(f.cost), 0) as total_cost,
                COALESCE(SUM(f.profit), 0) as total_profit,
                CASE 
                    WHEN SUM(f.total_amount) > 0 THEN 
                        ROUND((SUM(f.profit) / SUM(f.total_amount) * 100)::numeric, 2)
                    ELSE 0
                END as profit_margin_pct,
                COUNT(*) as total_transactions,
                COALESCE(SUM(f.quantity), 0) as total_units_sold,
                ROUND(COALESCE(AVG(f.total_amount), 0)::numeric, 2) as average_transaction_value,
                COUNT(DISTINCT f.product_key) as unique_products_sold
            FROM analytics.fact_sales f
            JOIN analytics.dim_dates d ON f.date_key = d.date_key
            GROUP BY f.date_key, d.date
        """
        cur.execute(query)
        rows = cur.rowcount
        conn.commit()
        
        print(f"✅ Calculated daily summary for {rows} days")
        print("=" * 60)
        
    finally:
        cur.close()
        conn.close()

calculate_daily_summary_task = PythonOperator(
    task_id='calculate_daily_summary',
    python_callable=calculate_daily_summary,
    dag=dag,
)

# ============================================================
# Task 11: Calculate Product Performance
# ============================================================

def calculate_product_performance():
    """Calculate product_performance metrics"""
    print("\n" + "=" * 60)
    print("🏆 TASK 11: Calculating Product Performance")
    print("=" * 60)
    
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        # Truncate aggregate table
        cur.execute("TRUNCATE TABLE analytics.product_performance")
        
        # Calculate metrics
        query = """
            INSERT INTO analytics.product_performance (
                product_key, sku, product_name, category,
                total_revenue, total_cost, total_profit, profit_margin_pct,
                total_units_sold, total_transactions, average_unit_price,
                revenue_rank, units_rank
            )
            SELECT 
                p.product_key,
                p.sku,
                p.name as product_name,
                p.category,
                COALESCE(SUM(f.total_amount), 0) as total_revenue,
                COALESCE(SUM(f.cost), 0) as total_cost,
                COALESCE(SUM(f.profit), 0) as total_profit,
                CASE 
                    WHEN SUM(f.total_amount) > 0 THEN 
                        ROUND((SUM(f.profit) / SUM(f.total_amount) * 100)::numeric, 2)
                    ELSE 0
                END as profit_margin_pct,
                COALESCE(SUM(f.quantity), 0) as total_units_sold,
                COUNT(*) as total_transactions,
                ROUND(COALESCE(AVG(f.unit_price), 0)::numeric, 2) as average_unit_price,
                RANK() OVER (ORDER BY COALESCE(SUM(f.total_amount), 0) DESC) as revenue_rank,
                RANK() OVER (ORDER BY COALESCE(SUM(f.quantity), 0) DESC) as units_rank
            FROM analytics.fact_sales f
            JOIN analytics.dim_products p ON f.product_key = p.product_key
            GROUP BY p.product_key, p.sku, p.name, p.category
        """
        cur.execute(query)
        rows = cur.rowcount
        conn.commit()
        
        print(f"✅ Calculated performance for {rows} products")
        print("=" * 60)
        
    finally:
        cur.close()
        conn.close()

calculate_product_performance_task = PythonOperator(
    task_id='calculate_product_performance',
    python_callable=calculate_product_performance,
    dag=dag,
)

# ============================================================
# Task 12: Calculate Category Performance
# ============================================================

def calculate_category_performance():
    """Calculate category_performance metrics"""
    print("\n" + "=" * 60)
    print("📊 TASK 12: Calculating Category Performance")
    print("=" * 60)
    
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        # Truncate aggregate table
        cur.execute("TRUNCATE TABLE analytics.category_performance")
        
        # Calculate metrics
        query = """
            INSERT INTO analytics.category_performance (
                category, total_revenue, total_cost, total_profit, profit_margin_pct,
                total_units_sold, total_transactions, unique_products, revenue_rank
            )
            SELECT 
                p.category,
                COALESCE(SUM(f.total_amount), 0) as total_revenue,
                COALESCE(SUM(f.cost), 0) as total_cost,
                COALESCE(SUM(f.profit), 0) as total_profit,
                CASE 
                    WHEN SUM(f.total_amount) > 0 THEN 
                        ROUND((SUM(f.profit) / SUM(f.total_amount) * 100)::numeric, 2)
                    ELSE 0
                END as profit_margin_pct,
                COALESCE(SUM(f.quantity), 0) as total_units_sold,
                COUNT(*) as total_transactions,
                COUNT(DISTINCT f.product_key) as unique_products,
                RANK() OVER (ORDER BY COALESCE(SUM(f.total_amount), 0) DESC) as revenue_rank
            FROM analytics.fact_sales f
            JOIN analytics.dim_products p ON f.product_key = p.product_key
            GROUP BY p.category
        """
        cur.execute(query)
        rows = cur.rowcount
        conn.commit()
        
        print(f"✅ Calculated performance for {rows} categories")
        print("=" * 60)
        
    finally:
        cur.close()
        conn.close()

calculate_category_performance_task = PythonOperator(
    task_id='calculate_category_performance',
    python_callable=calculate_category_performance,
    dag=dag,
)

# ============================================================
# Task 13: Pipeline Complete
# ============================================================

def warehouse_pipeline_complete():
    """Final task - report completion"""
    print("\n" + "=" * 60)
    print("🎉 WAREHOUSE ETL PIPELINE COMPLETE!")
    print("=" * 60)
    
    # Get row counts
    conn = get_warehouse_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT COUNT(*) FROM analytics.fact_sales")
        sales_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM analytics.dim_products")
        products_count = cur.fetchone()[0]
        
        cur.execute("SELECT SUM(total_revenue) FROM analytics.daily_sales_summary")
        total_revenue = cur.fetchone()[0]
        
        print(f"\n📊 Warehouse Statistics:")
        print(f"  Products: {products_count}")
        print(f"  Sales Transactions: {sales_count}")
        print(f"  Total Revenue: ₱{total_revenue:,.2f}")
        
        print("\n✅ All data loaded successfully!")
        print("🎨 View in pgAdmin: http://localhost:5050")
        print("🚀 Triggering dbt pipeline next...")
        print("=" * 60)
        
    finally:
        cur.close()
        conn.close()

complete_task = PythonOperator(
    task_id='warehouse_pipeline_complete',
    python_callable=warehouse_pipeline_complete,
    dag=dag,
)

# ============================================================
# Task 14: Trigger dbt Pipeline
# ============================================================

trigger_dbt_task = TriggerDagRunOperator(
    task_id='trigger_dbt_pipeline',
    trigger_dag_id='dbt_pipeline',
    wait_for_completion=False,  # Don't block — let dbt run independently
    dag=dag,
)

# ============================================================
# Define Task Dependencies
# ============================================================

# Visual flow:
#
#                validate_cleaned_files
#                         |
#            +------------+------------+
#            |                         |
#    load_raw_products          load_raw_sales
#            |                         |
#    load_staging_products    load_staging_sales
#            |                         |
#            +------------+------------+
#                         |
#         +---------------+---------------+
#         |               |               |
#   build_dim_products  build_dim_dates  build_dim_times
#         |               |               |
#         +---------------+---------------+
#                         |
#                  build_fact_sales
#                         |
#         +---------------+---------------+
#         |               |               |
#  calculate_daily  calculate_product  calculate_category
#    _summary        _performance       _performance
#         |               |               |
#         +---------------+---------------+
#                         |
#            warehouse_pipeline_complete

validate_task >> [load_raw_products_task, load_raw_sales_task]
load_raw_products_task >> load_staging_products_task
load_raw_sales_task >> load_staging_sales_task

# Staging to dimensions - explicit dependencies
load_staging_products_task >> build_dim_products_task
load_staging_products_task >> build_dim_dates_task
load_staging_products_task >> build_dim_times_task
load_staging_sales_task >> build_dim_products_task
load_staging_sales_task >> build_dim_dates_task
load_staging_sales_task >> build_dim_times_task

# Dimensions to fact
build_dim_products_task >> build_fact_sales_task
build_dim_dates_task >> build_fact_sales_task
build_dim_times_task >> build_fact_sales_task

# Fact to aggregates
build_fact_sales_task >> calculate_daily_summary_task
build_fact_sales_task >> calculate_product_performance_task
build_fact_sales_task >> calculate_category_performance_task

# Aggregates to complete
calculate_daily_summary_task >> complete_task
calculate_product_performance_task >> complete_task
calculate_category_performance_task >> complete_task

# Complete → trigger dbt pipeline
complete_task >> trigger_dbt_task
