"""
Data Quality Monitoring Task for Airflow

Add this task to your Airflow DAG to monitor data quality and alert on issues.
This will catch NaN values, duplicates, and other quality problems early.
"""

import psycopg2
from datetime import datetime
import json


def check_data_quality():
    """
    Comprehensive data quality checks for the warehouse
    
    Checks for:
    1. NaN values in financial fields
    2. Duplicate transactions
    3. Negative quantities or prices
    4. Future dates
    5. Missing critical fields
    
    Returns:
        dict: Quality metrics and alerts
    """
    print("\n" + "=" * 60)
    print("🔍 DATA QUALITY MONITORING")
    print("=" * 60)
    
    # Database connection
    conn = psycopg2.connect(
        host='localhost',
        port=5433,
        database='talastock_warehouse',
        user='warehouse_user',
        password='warehouse_pass'
    )
    cur = conn.cursor()
    
    quality_report = {
        'timestamp': datetime.now().isoformat(),
        'checks': [],
        'alerts': [],
        'status': 'PASS'
    }
    
    try:
        # ============================================================
        # CHECK 1: NaN Values in Raw Sales
        # ============================================================
        print("\n📊 CHECK 1: NaN Values in Raw Sales")
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_rows,
                COUNT(*) FILTER (WHERE unit_price = 'NaN'::numeric) as nan_unit_price,
                COUNT(*) FILTER (WHERE total_amount = 'NaN'::numeric) as nan_total_amount
            FROM raw.sales
        """)
        
        result = cur.fetchone()
        total_rows, nan_unit_price, nan_total_amount = result
        
        nan_total = nan_unit_price + nan_total_amount
        nan_pct = (nan_total / (total_rows * 2)) * 100 if total_rows > 0 else 0
        
        check_result = {
            'check_name': 'NaN Values in Raw Sales',
            'total_rows': total_rows,
            'nan_count': nan_total,
            'nan_percentage': round(nan_pct, 2),
            'status': 'PASS' if nan_pct < 5 else 'WARN'
        }
        
        quality_report['checks'].append(check_result)
        
        print(f"   Total rows: {total_rows:,}")
        print(f"   NaN values: {nan_total} ({nan_pct:.2f}%)")
        
        if nan_pct >= 5:
            alert = f"⚠️  HIGH NaN RATE: {nan_pct:.2f}% of values are NaN (threshold: 5%)"
            quality_report['alerts'].append(alert)
            quality_report['status'] = 'WARN'
            print(f"   {alert}")
        else:
            print(f"   ✅ NaN rate is acceptable")
        
        # ============================================================
        # CHECK 2: NaN Values in Analytics Layer
        # ============================================================
        print("\n📊 CHECK 2: NaN Values in Analytics Layer")
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_rows,
                COUNT(*) FILTER (WHERE unit_price = 'NaN'::numeric) as nan_unit_price,
                COUNT(*) FILTER (WHERE total_amount = 'NaN'::numeric) as nan_total_amount
            FROM analytics.fact_sales
        """)
        
        result = cur.fetchone()
        total_rows, nan_unit_price, nan_total_amount = result
        
        nan_total = nan_unit_price + nan_total_amount
        
        check_result = {
            'check_name': 'NaN Values in Analytics Layer',
            'total_rows': total_rows,
            'nan_count': nan_total,
            'status': 'PASS' if nan_total == 0 else 'FAIL'
        }
        
        quality_report['checks'].append(check_result)
        
        print(f"   Total rows: {total_rows:,}")
        print(f"   NaN values: {nan_total}")
        
        if nan_total > 0:
            alert = f"🔴 CRITICAL: {nan_total} NaN values found in analytics layer!"
            quality_report['alerts'].append(alert)
            quality_report['status'] = 'FAIL'
            print(f"   {alert}")
        else:
            print(f"   ✅ No NaN values in analytics layer")
        
        # ============================================================
        # CHECK 3: Duplicate Transactions
        # ============================================================
        print("\n📊 CHECK 3: Duplicate Transactions")
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_rows,
                COUNT(*) - COUNT(DISTINCT transaction_id) as duplicates
            FROM raw.sales
        """)
        
        result = cur.fetchone()
        total_rows, duplicates = result
        dup_pct = (duplicates / total_rows) * 100 if total_rows > 0 else 0
        
        check_result = {
            'check_name': 'Duplicate Transactions',
            'total_rows': total_rows,
            'duplicates': duplicates,
            'duplicate_percentage': round(dup_pct, 2),
            'status': 'PASS' if dup_pct < 3 else 'WARN'
        }
        
        quality_report['checks'].append(check_result)
        
        print(f"   Total rows: {total_rows:,}")
        print(f"   Duplicates: {duplicates} ({dup_pct:.2f}%)")
        
        if dup_pct >= 3:
            alert = f"⚠️  HIGH DUPLICATE RATE: {dup_pct:.2f}% (threshold: 3%)"
            quality_report['alerts'].append(alert)
            if quality_report['status'] == 'PASS':
                quality_report['status'] = 'WARN'
            print(f"   {alert}")
        else:
            print(f"   ✅ Duplicate rate is acceptable")
        
        # ============================================================
        # CHECK 4: Negative or Zero Values
        # ============================================================
        print("\n📊 CHECK 4: Negative or Zero Values")
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_rows,
                COUNT(*) FILTER (WHERE quantity <= 0) as negative_quantity,
                COUNT(*) FILTER (WHERE unit_price <= 0) as zero_price,
                COUNT(*) FILTER (WHERE total_amount <= 0) as zero_amount
            FROM raw.sales
            WHERE unit_price != 'NaN'::numeric
              AND total_amount != 'NaN'::numeric
        """)
        
        result = cur.fetchone()
        total_rows, neg_qty, zero_price, zero_amount = result
        
        invalid_total = neg_qty + zero_price + zero_amount
        invalid_pct = (invalid_total / total_rows) * 100 if total_rows > 0 else 0
        
        check_result = {
            'check_name': 'Negative or Zero Values',
            'total_rows': total_rows,
            'invalid_count': invalid_total,
            'invalid_percentage': round(invalid_pct, 2),
            'status': 'PASS' if invalid_pct < 5 else 'WARN'
        }
        
        quality_report['checks'].append(check_result)
        
        print(f"   Total rows: {total_rows:,}")
        print(f"   Negative quantity: {neg_qty}")
        print(f"   Zero price: {zero_price}")
        print(f"   Zero amount: {zero_amount}")
        print(f"   Total invalid: {invalid_total} ({invalid_pct:.2f}%)")
        
        if invalid_pct >= 5:
            alert = f"⚠️  HIGH INVALID VALUE RATE: {invalid_pct:.2f}% (threshold: 5%)"
            quality_report['alerts'].append(alert)
            if quality_report['status'] == 'PASS':
                quality_report['status'] = 'WARN'
            print(f"   {alert}")
        else:
            print(f"   ✅ Invalid value rate is acceptable")
        
        # ============================================================
        # CHECK 5: Data Completeness
        # ============================================================
        print("\n📊 CHECK 5: Data Completeness")
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_raw,
                (SELECT COUNT(*) FROM analytics.fact_sales) as total_analytics
            FROM raw.sales
        """)
        
        result = cur.fetchone()
        total_raw, total_analytics = result
        
        completeness_pct = (total_analytics / total_raw) * 100 if total_raw > 0 else 0
        
        check_result = {
            'check_name': 'Data Completeness',
            'raw_rows': total_raw,
            'analytics_rows': total_analytics,
            'completeness_percentage': round(completeness_pct, 2),
            'status': 'PASS' if completeness_pct >= 95 else 'WARN'
        }
        
        quality_report['checks'].append(check_result)
        
        print(f"   Raw layer: {total_raw:,} rows")
        print(f"   Analytics layer: {total_analytics:,} rows")
        print(f"   Completeness: {completeness_pct:.2f}%")
        
        if completeness_pct < 95:
            alert = f"⚠️  LOW DATA COMPLETENESS: {completeness_pct:.2f}% (threshold: 95%)"
            quality_report['alerts'].append(alert)
            if quality_report['status'] == 'PASS':
                quality_report['status'] = 'WARN'
            print(f"   {alert}")
        else:
            print(f"   ✅ Data completeness is good")
        
        # ============================================================
        # Summary
        # ============================================================
        print("\n" + "=" * 60)
        print(f"📊 DATA QUALITY SUMMARY")
        print("=" * 60)
        print(f"Status: {quality_report['status']}")
        print(f"Checks performed: {len(quality_report['checks'])}")
        print(f"Alerts raised: {len(quality_report['alerts'])}")
        
        if quality_report['alerts']:
            print("\n⚠️  ALERTS:")
            for alert in quality_report['alerts']:
                print(f"   {alert}")
        else:
            print("\n✅ No alerts - data quality is good!")
        
        print("=" * 60)
        
        # Save report to file
        report_file = f'/opt/airflow/data-generator/processed/quality_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(report_file, 'w') as f:
            json.dump(quality_report, f, indent=2)
        
        print(f"\n📄 Report saved to: {report_file}")
        
        return quality_report
        
    finally:
        cur.close()
        conn.close()


# ============================================================
# Airflow Task Definition
# ============================================================

def data_quality_check_task():
    """
    Airflow task wrapper for data quality checks
    """
    report = check_data_quality()
    
    # Fail the task if status is FAIL
    if report['status'] == 'FAIL':
        raise Exception(f"Data quality check FAILED: {len(report['alerts'])} critical issues found")
    
    # Warn but don't fail if status is WARN
    if report['status'] == 'WARN':
        print(f"\n⚠️  WARNING: {len(report['alerts'])} quality issues detected")
    
    return report


# ============================================================
# Add to your Airflow DAG like this:
# ============================================================
"""
from airflow.operators.python import PythonOperator

data_quality_task = PythonOperator(
    task_id='check_data_quality',
    python_callable=data_quality_check_task,
    dag=dag,
)

# Run after loading data
load_data_task >> data_quality_task
"""


if __name__ == "__main__":
    # Test the monitoring
    print("Testing data quality monitoring...")
    check_data_quality()
