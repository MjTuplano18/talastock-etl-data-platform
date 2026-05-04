"""
Complete Manual Data Load
This script loads data through all 3 layers: Raw → Staging → Analytics
"""
import psycopg2
from psycopg2.extras import execute_values
import pandas as pd
from datetime import datetime

# Warehouse connection
WAREHOUSE_CONFIG = {
    'host': 'talastock-warehouse',
    'port': 5432,
    'database': 'talastock_warehouse',
    'user': 'warehouse_user',
    'password': 'warehouse_pass'
}

# File paths
PRODUCTS_FILE = '/opt/airflow/data-generator/processed/products_cleaned.csv'
SALES_FILE = '/opt/airflow/data-generator/processed/sales_cleaned.csv'

def complete_load():
    print("\n" + "=" * 70)
    print("🚀 COMPLETE WAREHOUSE DATA LOAD")
    print("=" * 70)
    
    conn = psycopg2.connect(**WAREHOUSE_CONFIG)
    cur = conn.cursor()
    
    try:
        # ============================================================
        # STEP 1: Clear all tables
        # ============================================================
        print("\n📋 STEP 1: Clearing all tables...")
        cur.execute("TRUNCATE TABLE raw.products, raw.sales CASCADE")
        conn.commit()  # Commit immediately
        cur.execute("TRUNCATE TABLE staging.products, staging.sales CASCADE")
        conn.commit()  # Commit immediately
        cur.execute("TRUNCATE TABLE analytics.dim_products, analytics.dim_dates, analytics.dim_times CASCADE")
        conn.commit()  # Commit immediately
        cur.execute("TRUNCATE TABLE analytics.daily_sales_summary, analytics.product_performance, analytics.category_performance CASCADE")
        conn.commit()  # Commit immediately
        print("   ✅ All tables cleared!")
        
        # ============================================================
        # STEP 2: Load Raw Products
        # ============================================================
        print("\n📦 STEP 2: Loading raw products...")
        products_df = pd.read_csv(PRODUCTS_FILE)
        products_df['loaded_at'] = datetime.now()
        products_df['source_file'] = 'products_cleaned.csv'
        products_df['load_id'] = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        columns = ['sku', 'name', 'category', 'brand', 'price', 'cost_price', 
                   'unit', 'supplier', 'loaded_at', 'source_file', 'load_id']
        values = products_df[columns].values.tolist()
        
        query = f"INSERT INTO raw.products ({', '.join(columns)}) VALUES %s"
        execute_values(cur, query, values)
        conn.commit()
        print(f"   ✅ Loaded {len(products_df)} products into raw.products")
        
        # ============================================================
        # STEP 3: Load Raw Sales
        # ============================================================
        print("\n💰 STEP 3: Loading raw sales...")
        sales_df = pd.read_csv(SALES_FILE)
        sales_df['loaded_at'] = datetime.now()
        sales_df['source_file'] = 'sales_cleaned.csv'
        sales_df['load_id'] = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        columns = ['transaction_id', 'timestamp', 'product_sku', 'product_name',
                   'category', 'brand', 'quantity', 'unit_price', 'total_amount',
                   'payment_method', 'customer_type', 'customer_name',
                   'loaded_at', 'source_file', 'load_id']
        values = sales_df[columns].values.tolist()
        
        query = f"INSERT INTO raw.sales ({', '.join(columns)}) VALUES %s"
        execute_values(cur, query, values)
        conn.commit()
        print(f"   ✅ Loaded {len(sales_df)} sales into raw.sales")
        
        # ============================================================
        # STEP 4: Transform to Staging Products
        # ============================================================
        print("\n🔧 STEP 4: Transforming to staging.products...")
        cur.execute("""
            INSERT INTO staging.products (
                sku, name, category, brand, price, cost_price, profit_margin,
                unit, supplier, source_load_id
            )
            SELECT 
                sku, name, category, brand, price, cost_price,
                ROUND(((price - cost_price) / NULLIF(price, 0) * 100)::numeric, 2) as profit_margin,
                unit, supplier, load_id
            FROM raw.products
            WHERE price > 0 AND cost_price >= 0
        """)
        rows = cur.rowcount
        conn.commit()
        print(f"   ✅ Loaded {rows} products into staging.products")
        
        # ============================================================
        # STEP 5: Transform to Staging Sales
        # ============================================================
        print("\n🔧 STEP 5: Transforming to staging.sales...")
        cur.execute("""
            INSERT INTO staging.sales (
                transaction_id, timestamp, product_sku, product_name,
                category, brand, quantity, unit_price, total_amount,
                payment_method, customer_type, customer_name,
                sale_date, sale_time, year, month, day, day_of_week, hour,
                source_load_id
            )
            SELECT 
                transaction_id, timestamp, product_sku, product_name,
                category, brand, quantity, unit_price, total_amount,
                payment_method, customer_type, customer_name,
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
        """)
        rows = cur.rowcount
        conn.commit()
        print(f"   ✅ Loaded {rows} sales into staging.sales")
        
        # ============================================================
        # STEP 6: Build dim_products
        # ============================================================
        print("\n📊 STEP 6: Building analytics.dim_products...")
        cur.execute("""
            INSERT INTO analytics.dim_products (
                sku, name, category, brand, price, cost_price, profit_margin,
                unit, supplier, is_active
            )
            SELECT 
                sku, name, category, brand, price, cost_price, profit_margin,
                unit, supplier, TRUE as is_active
            FROM staging.products
        """)
        rows = cur.rowcount
        conn.commit()
        print(f"   ✅ Built dim_products with {rows} products")
        
        # ============================================================
        # STEP 7: Build dim_dates
        # ============================================================
        print("\n📅 STEP 7: Building analytics.dim_dates...")
        cur.execute("""
            INSERT INTO analytics.dim_dates (
                date_key, date, year, quarter, month, month_name, week, day,
                day_of_week, day_of_week_name, is_weekend, is_payday
            )
            SELECT 
                TO_CHAR(date, 'YYYYMMDD')::integer as date_key,
                date, EXTRACT(YEAR FROM date)::integer as year,
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
        """)
        rows = cur.rowcount
        conn.commit()
        print(f"   ✅ Built dim_dates with {rows} dates")
        
        # ============================================================
        # STEP 8: Build dim_times
        # ============================================================
        print("\n⏰ STEP 8: Building analytics.dim_times...")
        cur.execute("""
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
        """)
        rows = cur.rowcount
        conn.commit()
        print(f"   ✅ Built dim_times with {rows} time slots")
        
        # ============================================================
        # STEP 9: Build fact_sales
        # ============================================================
        print("\n⭐ STEP 9: Building analytics.fact_sales...")
        cur.execute("""
            INSERT INTO analytics.fact_sales (
                transaction_id, product_key, date_key, time_key,
                payment_method, customer_type, customer_name,
                quantity, unit_price, total_amount, cost, profit
            )
            SELECT 
                s.transaction_id, p.product_key,
                TO_CHAR(s.sale_date, 'YYYYMMDD')::integer as date_key,
                TO_CHAR(DATE_TRUNC('hour', s.sale_time)::time, 'HH24MISS')::integer as time_key,
                s.payment_method, s.customer_type, s.customer_name,
                s.quantity, s.unit_price, s.total_amount,
                s.quantity * p.cost_price as cost,
                s.total_amount - (s.quantity * p.cost_price) as profit
            FROM staging.sales s
            JOIN analytics.dim_products p ON s.product_sku = p.sku
        """)
        rows = cur.rowcount
        conn.commit()
        print(f"   ✅ Built fact_sales with {rows} transactions")
        
        # ============================================================
        # STEP 10: Calculate daily_sales_summary
        # ============================================================
        print("\n📈 STEP 10: Calculating daily_sales_summary...")
        cur.execute("""
            INSERT INTO analytics.daily_sales_summary (
                date_key, date, total_revenue, total_cost, total_profit,
                profit_margin_pct, total_transactions, total_units_sold,
                average_transaction_value, unique_products_sold
            )
            SELECT 
                f.date_key, d.date,
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
        """)
        rows = cur.rowcount
        conn.commit()
        print(f"   ✅ Calculated daily summary for {rows} days")
        
        # ============================================================
        # STEP 11: Calculate product_performance
        # ============================================================
        print("\n🏆 STEP 11: Calculating product_performance...")
        cur.execute("""
            INSERT INTO analytics.product_performance (
                product_key, sku, product_name, category,
                total_revenue, total_cost, total_profit, profit_margin_pct,
                total_units_sold, total_transactions, average_unit_price,
                revenue_rank, units_rank
            )
            SELECT 
                p.product_key, p.sku, p.name as product_name, p.category,
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
        """)
        rows = cur.rowcount
        conn.commit()
        print(f"   ✅ Calculated performance for {rows} products")
        
        # ============================================================
        # STEP 12: Calculate category_performance
        # ============================================================
        print("\n📊 STEP 12: Calculating category_performance...")
        cur.execute("""
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
        """)
        rows = cur.rowcount
        conn.commit()
        print(f"   ✅ Calculated performance for {rows} categories")
        
        # ============================================================
        # FINAL: Summary
        # ============================================================
        print("\n" + "=" * 70)
        print("🎉 COMPLETE! Warehouse Statistics:")
        print("=" * 70)
        
        cur.execute("SELECT COUNT(*) FROM analytics.fact_sales")
        sales_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM analytics.dim_products")
        products_count = cur.fetchone()[0]
        
        cur.execute("SELECT SUM(total_revenue) FROM analytics.daily_sales_summary")
        total_revenue = cur.fetchone()[0] or 0
        
        print(f"\n📊 Final Counts:")
        print(f"   Products: {products_count}")
        print(f"   Sales Transactions: {sales_count:,}")
        print(f"   Total Revenue: ₱{total_revenue:,.2f}")
        
        print("\n✅ All data loaded successfully!")
        print("🎨 View in pgAdmin: http://localhost:5050")
        print("=" * 70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    complete_load()
