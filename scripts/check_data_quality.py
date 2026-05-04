"""
Data Quality Check Script
Run this to verify data integrity in the warehouse
"""
import psycopg2
from psycopg2.extras import RealDictCursor

# Warehouse connection
WAREHOUSE_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'talastock_warehouse',
    'user': 'warehouse_user',
    'password': 'warehouse_pass'
}

def check_data_quality():
    print("\n" + "=" * 70)
    print("🔍 DATA QUALITY CHECK")
    print("=" * 70)
    
    conn = psycopg2.connect(**WAREHOUSE_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # ============================================================
        # 1. Check for NULL values in fact_sales
        # ============================================================
        print("\n📊 1. Checking for NULL values in fact_sales...")
        cur.execute("""
            SELECT 
                COUNT(*) as total_rows,
                COUNT(*) FILTER (WHERE total_amount IS NULL) as null_amount,
                COUNT(*) FILTER (WHERE profit IS NULL) as null_profit,
                COUNT(*) FILTER (WHERE cost IS NULL) as null_cost,
                COUNT(*) FILTER (WHERE total_amount IS NOT NULL 
                                 AND profit IS NOT NULL 
                                 AND cost IS NOT NULL) as valid_rows
            FROM analytics.fact_sales
        """)
        result = cur.fetchone()
        print(f"   Total Rows: {result['total_rows']:,}")
        print(f"   NULL total_amount: {result['null_amount']}")
        print(f"   NULL profit: {result['null_profit']}")
        print(f"   NULL cost: {result['null_cost']}")
        print(f"   ✅ Valid Rows: {result['valid_rows']:,}")
        
        # ============================================================
        # 2. Check for products with missing cost_price
        # ============================================================
        print("\n📦 2. Checking products with missing cost_price...")
        cur.execute("""
            SELECT 
                COUNT(*) as total_products,
                COUNT(*) FILTER (WHERE cost_price IS NULL OR cost_price = 0) as missing_cost,
                COUNT(*) FILTER (WHERE cost_price > 0) as valid_cost
            FROM analytics.dim_products
        """)
        result = cur.fetchone()
        print(f"   Total Products: {result['total_products']}")
        print(f"   Missing/Zero cost_price: {result['missing_cost']}")
        print(f"   ✅ Valid cost_price: {result['valid_cost']}")
        
        if result['missing_cost'] > 0:
            print("\n   ⚠️  Products with missing cost_price:")
            cur.execute("""
                SELECT sku, name, category, price, cost_price
                FROM analytics.dim_products
                WHERE cost_price IS NULL OR cost_price = 0
                LIMIT 10
            """)
            for row in cur.fetchall():
                print(f"      - {row['sku']}: {row['name']} (₱{row['price']}, cost: {row['cost_price']})")
        
        # ============================================================
        # 3. Check for negative values
        # ============================================================
        print("\n💰 3. Checking for negative values...")
        cur.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE total_amount < 0) as negative_amount,
                COUNT(*) FILTER (WHERE profit < 0) as negative_profit,
                COUNT(*) FILTER (WHERE quantity < 0) as negative_quantity
            FROM analytics.fact_sales
        """)
        result = cur.fetchone()
        print(f"   Negative total_amount: {result['negative_amount']}")
        print(f"   Negative profit: {result['negative_profit']}")
        print(f"   Negative quantity: {result['negative_quantity']}")
        
        if result['negative_profit'] > 0:
            print(f"\n   ℹ️  {result['negative_profit']} transactions have negative profit (sold below cost)")
        
        # ============================================================
        # 4. Check revenue calculations
        # ============================================================
        print("\n💵 4. Verifying revenue calculations...")
        cur.execute("""
            SELECT 
                SUM(total_amount) as total_revenue,
                SUM(cost) as total_cost,
                SUM(profit) as total_profit,
                ROUND((SUM(profit) / NULLIF(SUM(total_amount), 0) * 100)::numeric, 2) as profit_margin_pct
            FROM analytics.fact_sales
        """)
        result = cur.fetchone()
        print(f"   Total Revenue: ₱{result['total_revenue']:,.2f}")
        print(f"   Total Cost: ₱{result['total_cost']:,.2f}")
        print(f"   Total Profit: ₱{result['total_profit']:,.2f}")
        print(f"   Profit Margin: {result['profit_margin_pct']}%")
        
        # ============================================================
        # 5. Check for orphaned records
        # ============================================================
        print("\n🔗 5. Checking for orphaned records...")
        cur.execute("""
            SELECT COUNT(*) as orphaned_sales
            FROM analytics.fact_sales f
            LEFT JOIN analytics.dim_products p ON f.product_key = p.product_key
            WHERE p.product_key IS NULL
        """)
        result = cur.fetchone()
        print(f"   Sales without matching product: {result['orphaned_sales']}")
        
        cur.execute("""
            SELECT COUNT(*) as orphaned_dates
            FROM analytics.fact_sales f
            LEFT JOIN analytics.dim_dates d ON f.date_key = d.date_key
            WHERE d.date_key IS NULL
        """)
        result = cur.fetchone()
        print(f"   Sales without matching date: {result['orphaned_dates']}")
        
        # ============================================================
        # 6. Sample valid transactions
        # ============================================================
        print("\n✅ 6. Sample of valid transactions:")
        cur.execute("""
            SELECT 
                f.transaction_id,
                p.name as product,
                p.category,
                f.quantity,
                f.unit_price,
                f.total_amount,
                f.cost,
                f.profit
            FROM analytics.fact_sales f
            JOIN analytics.dim_products p ON f.product_key = p.product_key
            WHERE f.total_amount > 0 AND f.profit IS NOT NULL
            ORDER BY f.total_amount DESC
            LIMIT 5
        """)
        for row in cur.fetchall():
            print(f"   {row['transaction_id']}: {row['product']} ({row['category']})")
            print(f"      Qty: {row['quantity']}, Price: ₱{row['unit_price']:.2f}, Total: ₱{row['total_amount']:.2f}")
            print(f"      Cost: ₱{row['cost']:.2f}, Profit: ₱{row['profit']:.2f}")
        
        # ============================================================
        # 7. Data completeness summary
        # ============================================================
        print("\n" + "=" * 70)
        print("📈 DATA COMPLETENESS SUMMARY")
        print("=" * 70)
        
        cur.execute("""
            SELECT 
                (SELECT COUNT(*) FROM raw.products) as raw_products,
                (SELECT COUNT(*) FROM raw.sales) as raw_sales,
                (SELECT COUNT(*) FROM staging.products) as staging_products,
                (SELECT COUNT(*) FROM staging.sales) as staging_sales,
                (SELECT COUNT(*) FROM analytics.dim_products) as dim_products,
                (SELECT COUNT(*) FROM analytics.dim_dates) as dim_dates,
                (SELECT COUNT(*) FROM analytics.dim_times) as dim_times,
                (SELECT COUNT(*) FROM analytics.fact_sales) as fact_sales,
                (SELECT COUNT(*) FROM analytics.daily_sales_summary) as daily_summary,
                (SELECT COUNT(*) FROM analytics.product_performance) as product_perf,
                (SELECT COUNT(*) FROM analytics.category_performance) as category_perf
        """)
        result = cur.fetchone()
        
        print(f"\n📊 Raw Layer:")
        print(f"   Products: {result['raw_products']:,}")
        print(f"   Sales: {result['raw_sales']:,}")
        
        print(f"\n🔧 Staging Layer:")
        print(f"   Products: {result['staging_products']:,}")
        print(f"   Sales: {result['staging_sales']:,}")
        
        print(f"\n⭐ Analytics Layer:")
        print(f"   Products (dim): {result['dim_products']:,}")
        print(f"   Dates (dim): {result['dim_dates']:,}")
        print(f"   Times (dim): {result['dim_times']:,}")
        print(f"   Sales (fact): {result['fact_sales']:,}")
        print(f"   Daily Summary: {result['daily_summary']:,}")
        print(f"   Product Performance: {result['product_perf']:,}")
        print(f"   Category Performance: {result['category_perf']:,}")
        
        print("\n" + "=" * 70)
        print("✅ DATA QUALITY CHECK COMPLETE!")
        print("=" * 70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    check_data_quality()
