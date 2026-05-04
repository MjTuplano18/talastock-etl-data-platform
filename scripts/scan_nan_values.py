#!/usr/bin/env python3
"""
Comprehensive NaN Scanner for Data Warehouse
Scans all tables and identifies NaN values in numeric columns
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal
import math

# Database connection
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'talastock_warehouse',
    'user': 'warehouse_user',
    'password': 'warehouse_pass'
}

def is_nan(value):
    """Check if a value is NaN"""
    if value is None:
        return False
    if isinstance(value, (int, float, Decimal)):
        try:
            return math.isnan(float(value))
        except (ValueError, TypeError):
            return False
    return False

def scan_table_for_nan(cursor, schema, table):
    """Scan a specific table for NaN values"""
    print(f"\n{'='*80}")
    print(f"📊 Scanning: {schema}.{table}")
    print(f"{'='*80}")
    
    # Get all columns
    cursor.execute(f"""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = %s AND table_name = %s
        ORDER BY ordinal_position
    """, (schema, table))
    
    columns = cursor.fetchall()
    numeric_columns = [
        col['column_name'] for col in columns 
        if col['data_type'] in ('numeric', 'integer', 'bigint', 'real', 'double precision', 'decimal')
    ]
    
    if not numeric_columns:
        print("   ⚠️  No numeric columns found")
        return
    
    print(f"   Numeric columns: {', '.join(numeric_columns)}")
    
    # Get total row count
    cursor.execute(f"SELECT COUNT(*) as count FROM {schema}.{table}")
    total_rows = cursor.fetchone()['count']
    print(f"   Total rows: {total_rows:,}")
    
    if total_rows == 0:
        print("   ⚠️  Table is empty")
        return
    
    # Check each numeric column for NaN
    nan_found = False
    for col in numeric_columns:
        # Check for NaN values
        cursor.execute(f"""
            SELECT COUNT(*) as nan_count
            FROM {schema}.{table}
            WHERE {col} = 'NaN'::numeric
        """)
        nan_count = cursor.fetchone()['nan_count']
        
        if nan_count > 0:
            nan_found = True
            print(f"\n   🔴 FOUND NaN in column '{col}': {nan_count:,} rows ({nan_count/total_rows*100:.2f}%)")
            
            # Show sample rows with NaN
            cursor.execute(f"""
                SELECT *
                FROM {schema}.{table}
                WHERE {col} = 'NaN'::numeric
                LIMIT 5
            """)
            sample_rows = cursor.fetchall()
            
            print(f"   Sample rows with NaN in '{col}':")
            for i, row in enumerate(sample_rows, 1):
                print(f"      Row {i}: {dict(row)}")
    
    if not nan_found:
        print(f"\n   ✅ No NaN values found in any numeric columns")

def main():
    print("="*80)
    print("🔍 COMPREHENSIVE NaN SCANNER FOR DATA WAREHOUSE")
    print("="*80)
    
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print("\n✅ Connected to database successfully")
        
        # Define tables to scan
        tables_to_scan = [
            ('raw', 'products'),
            ('raw', 'sales'),
            ('staging', 'products'),
            ('staging', 'sales'),
            ('analytics', 'dim_products'),
            ('analytics', 'dim_dates'),
            ('analytics', 'dim_times'),
            ('analytics', 'fact_sales'),
            ('analytics', 'daily_sales_summary'),
            ('analytics', 'product_performance'),
            ('analytics', 'category_performance'),
        ]
        
        # Scan each table
        for schema, table in tables_to_scan:
            try:
                scan_table_for_nan(cursor, schema, table)
            except Exception as e:
                print(f"\n   ❌ Error scanning {schema}.{table}: {e}")
        
        # Summary: Count total NaN values across all tables
        print("\n" + "="*80)
        print("📊 SUMMARY: NaN VALUES BY TABLE")
        print("="*80)
        
        for schema, table in tables_to_scan:
            try:
                cursor.execute(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = %s AND table_name = %s
                    AND data_type IN ('numeric', 'integer', 'bigint', 'real', 'double precision', 'decimal')
                """, (schema, table))
                
                numeric_columns = [col['column_name'] for col in cursor.fetchall()]
                
                if numeric_columns:
                    total_nan = 0
                    for col in numeric_columns:
                        cursor.execute(f"""
                            SELECT COUNT(*) as nan_count
                            FROM {schema}.{table}
                            WHERE {col} = 'NaN'::numeric
                        """)
                        total_nan += cursor.fetchone()['nan_count']
                    
                    if total_nan > 0:
                        print(f"🔴 {schema}.{table}: {total_nan:,} NaN values")
                    else:
                        print(f"✅ {schema}.{table}: Clean (no NaN)")
            except Exception as e:
                print(f"❌ {schema}.{table}: Error - {e}")
        
        # Check for the specific date that has NaN
        print("\n" + "="*80)
        print("🔍 INVESTIGATING SPECIFIC DATES WITH NaN")
        print("="*80)
        
        cursor.execute("""
            SELECT 
                date_key,
                date,
                total_revenue,
                total_cost,
                total_profit,
                profit_margin_pct,
                total_transactions
            FROM analytics.daily_sales_summary
            WHERE total_revenue = 'NaN'::numeric
               OR total_cost = 'NaN'::numeric
               OR total_profit = 'NaN'::numeric
               OR profit_margin_pct = 'NaN'::numeric
            ORDER BY date_key
        """)
        
        nan_dates = cursor.fetchall()
        
        if nan_dates:
            print(f"\n🔴 Found {len(nan_dates)} dates with NaN values:")
            for row in nan_dates:
                print(f"\n   Date: {row['date']} (date_key: {row['date_key']})")
                print(f"   Revenue: {row['total_revenue']}")
                print(f"   Cost: {row['total_cost']}")
                print(f"   Profit: {row['total_profit']}")
                print(f"   Margin: {row['profit_margin_pct']}")
                print(f"   Transactions: {row['total_transactions']}")
                
                # Check if there are any transactions for this date in fact_sales
                cursor.execute("""
                    SELECT COUNT(*) as count
                    FROM analytics.fact_sales
                    WHERE date_key = %s
                """, (row['date_key'],))
                fact_count = cursor.fetchone()['count']
                print(f"   Transactions in fact_sales: {fact_count}")
                
                # Check if there are NaN transactions for this date
                cursor.execute("""
                    SELECT COUNT(*) as count
                    FROM analytics.fact_sales
                    WHERE date_key = %s
                      AND (total_amount = 'NaN'::numeric 
                           OR cost = 'NaN'::numeric 
                           OR profit = 'NaN'::numeric)
                """, (row['date_key'],))
                nan_fact_count = cursor.fetchone()['count']
                print(f"   NaN transactions in fact_sales: {nan_fact_count}")
        else:
            print("\n✅ No dates with NaN values found in daily_sales_summary")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*80)
        print("✅ SCAN COMPLETE")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
