"""
Sales ETL Pipeline - Real Data Processing

This DAG processes the sales data generated in Phase 1:
1. Extract: Read CSV files from data-generator output
2. Transform: Clean data, handle missing values, fix data types
3. Load: Save cleaned data to processed directory

Author: Talastock Data Platform Team
Phase: 2 - Apache Airflow ETL Orchestration
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
import pandas as pd
import os
import json

# ============================================================
# Configuration
# ============================================================

# Paths (relative to Airflow home)
BASE_DIR = '/opt/airflow'
INPUT_DIR = f'{BASE_DIR}/data-generator/output'
OUTPUT_DIR = f'{BASE_DIR}/data-generator/processed'

# Files to process
PRODUCTS_FILE = f'{INPUT_DIR}/products.csv'
SALES_FILE = f'{INPUT_DIR}/sales_standard.csv'

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
    'sales_etl_pipeline',
    default_args=default_args,
    description='ETL pipeline for processing sales data from Phase 1',
    schedule_interval='@daily',  # Run once per day
    start_date=datetime(2026, 5, 1),
    catchup=False,
    tags=['etl', 'sales', 'production'],
)

# ============================================================
# Task 1: Validate Input Files
# ============================================================

def validate_input_files():
    """
    Check if input files exist and are readable
    """
    print("=" * 60)
    print("📋 TASK 1: Validating Input Files")
    print("=" * 60)
    
    files_to_check = [PRODUCTS_FILE, SALES_FILE]
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path) / 1024  # KB
            print(f"✅ Found: {os.path.basename(file_path)} ({file_size:.2f} KB)")
        else:
            print(f"❌ Missing: {file_path}")
            raise FileNotFoundError(f"Required file not found: {file_path}")
    
    print("\n✅ All input files validated successfully!")
    print("=" * 60)
    return True


validate_task = PythonOperator(
    task_id='validate_input_files',
    python_callable=validate_input_files,
    dag=dag,
)

# ============================================================
# Task 2: Extract Products Data
# ============================================================

def extract_products():
    """
    Extract products data from CSV
    """
    print("\n" + "=" * 60)
    print("📦 TASK 2: Extracting Products Data")
    print("=" * 60)
    
    # Read CSV
    df = pd.read_csv(PRODUCTS_FILE)
    
    print(f"\n📊 Products Data Summary:")
    print(f"  Total products: {len(df)}")
    print(f"  Columns: {list(df.columns)}")
    print(f"  Memory usage: {df.memory_usage(deep=True).sum() / 1024:.2f} KB")
    
    print("\n📋 First 5 products:")
    print(df.head().to_string())
    
    print("\n✅ Products extraction complete!")
    print("=" * 60)
    
    # Save to temporary location for next task
    temp_file = f'{OUTPUT_DIR}/temp_products.csv'
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df.to_csv(temp_file, index=False)
    
    return len(df)


extract_products_task = PythonOperator(
    task_id='extract_products',
    python_callable=extract_products,
    dag=dag,
)

# ============================================================
# Task 3: Extract Sales Data
# ============================================================

def extract_sales():
    """
    Extract sales data from CSV
    """
    print("\n" + "=" * 60)
    print("💰 TASK 3: Extracting Sales Data")
    print("=" * 60)
    
    # Read CSV
    df = pd.read_csv(SALES_FILE)
    
    # Convert total_amount to numeric for calculations
    df['total_amount'] = pd.to_numeric(df['total_amount'], errors='coerce')
    
    print(f"\n📊 Sales Data Summary:")
    print(f"  Total sales: {len(df)}")
    print(f"  Columns: {list(df.columns)}")
    print(f"  Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"  Total revenue: ₱{df['total_amount'].sum():,.2f}")
    print(f"  Memory usage: {df.memory_usage(deep=True).sum() / 1024:.2f} KB")
    
    print("\n📋 First 5 sales:")
    print(df.head().to_string())
    
    print("\n✅ Sales extraction complete!")
    print("=" * 60)
    
    # Save to temporary location for next task
    temp_file = f'{OUTPUT_DIR}/temp_sales.csv'
    df.to_csv(temp_file, index=False)
    
    return len(df)


extract_sales_task = PythonOperator(
    task_id='extract_sales',
    python_callable=extract_sales,
    dag=dag,
)

# ============================================================
# Task 4: Transform Products Data
# ============================================================

def transform_products():
    """
    Clean and transform products data
    """
    print("\n" + "=" * 60)
    print("🔧 TASK 4: Transforming Products Data")
    print("=" * 60)
    
    # Read temporary file
    df = pd.read_csv(f'{OUTPUT_DIR}/temp_products.csv')
    
    print(f"\n📊 Before transformation:")
    print(f"  Total rows: {len(df)}")
    print(f"  Missing values:\n{df.isnull().sum()}")
    
    # Transformations
    initial_count = len(df)
    
    # 1. Remove duplicates
    df = df.drop_duplicates(subset=['sku'])
    duplicates_removed = initial_count - len(df)
    
    # 2. Handle missing values
    df['category'] = df['category'].fillna('Uncategorized')
    df['brand'] = df['brand'].fillna('Generic')
    
    # 3. Ensure correct data types
    df['price'] = pd.to_numeric(df['price'], errors='coerce')
    df['cost_price'] = pd.to_numeric(df['cost_price'], errors='coerce')
    
    # 4. Remove invalid products (negative prices)
    df = df[df['price'] >= 0]
    df = df[df['cost_price'] >= 0]
    
    # 5. Add calculated fields
    df['profit_margin'] = ((df['price'] - df['cost_price']) / df['price'] * 100).round(2)
    
    print(f"\n✅ Transformations applied:")
    print(f"  Duplicates removed: {duplicates_removed}")
    print(f"  Missing values filled")
    print(f"  Data types corrected")
    print(f"  Profit margin calculated")
    
    print(f"\n📊 After transformation:")
    print(f"  Total rows: {len(df)}")
    print(f"  Missing values:\n{df.isnull().sum()}")
    
    print("\n✅ Products transformation complete!")
    print("=" * 60)
    
    # Save transformed data
    output_file = f'{OUTPUT_DIR}/products_cleaned.csv'
    df.to_csv(output_file, index=False)
    print(f"\n💾 Saved to: {output_file}")
    
    return len(df)


transform_products_task = PythonOperator(
    task_id='transform_products',
    python_callable=transform_products,
    dag=dag,
)

# ============================================================
# Task 5: Transform Sales Data
# ============================================================

def transform_sales():
    """
    Clean and transform sales data
    """
    print("\n" + "=" * 60)
    print("🔧 TASK 5: Transforming Sales Data")
    print("=" * 60)
    
    # Read temporary file
    df = pd.read_csv(f'{OUTPUT_DIR}/temp_sales.csv')
    
    print(f"\n📊 Before transformation:")
    print(f"  Total rows: {len(df)}")
    print(f"  Missing values:\n{df.isnull().sum()}")
    
    # Transformations
    initial_count = len(df)
    
    # 1. Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
    
    # 2. Remove rows with invalid dates
    df = df.dropna(subset=['timestamp'])
    
    # 3. Ensure correct data types
    df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(1).astype(int)
    df['unit_price'] = pd.to_numeric(df['unit_price'], errors='coerce')
    df['total_amount'] = pd.to_numeric(df['total_amount'], errors='coerce')
    
    # 4. Remove invalid sales (negative amounts)
    df = df[df['total_amount'] >= 0]
    df = df[df['quantity'] > 0]
    
    # 5. Add calculated fields
    df['year'] = df['timestamp'].dt.year
    df['month'] = df['timestamp'].dt.month
    df['day_of_week'] = df['timestamp'].dt.day_name()
    df['hour'] = df['timestamp'].dt.hour
    
    # 6. Recalculate total_amount to ensure consistency
    df['total_amount'] = (df['quantity'] * df['unit_price']).round(2)
    
    invalid_removed = initial_count - len(df)
    
    print(f"\n✅ Transformations applied:")
    print(f"  Invalid records removed: {invalid_removed}")
    print(f"  Date fields parsed")
    print(f"  Data types corrected")
    print(f"  Time-based fields added (year, month, day_of_week, hour)")
    
    print(f"\n📊 After transformation:")
    print(f"  Total rows: {len(df)}")
    print(f"  Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"  Total revenue: ₱{df['total_amount'].sum():,.2f}")
    print(f"  Missing values:\n{df.isnull().sum()}")
    
    print("\n✅ Sales transformation complete!")
    print("=" * 60)
    
    # Save transformed data
    output_file = f'{OUTPUT_DIR}/sales_cleaned.csv'
    df.to_csv(output_file, index=False)
    print(f"\n💾 Saved to: {output_file}")
    
    return len(df)


transform_sales_task = PythonOperator(
    task_id='transform_sales',
    python_callable=transform_sales,
    dag=dag,
)

# ============================================================
# Task 6: Generate Data Quality Report
# ============================================================

def generate_quality_report():
    """
    Generate a data quality report
    """
    print("\n" + "=" * 60)
    print("📊 TASK 6: Generating Data Quality Report")
    print("=" * 60)
    
    # Read cleaned data
    products_df = pd.read_csv(f'{OUTPUT_DIR}/products_cleaned.csv')
    sales_df = pd.read_csv(f'{OUTPUT_DIR}/sales_cleaned.csv')
    
    report = {
        'generated_at': datetime.now().isoformat(),
        'products': {
            'total_count': len(products_df),
            'categories': products_df['category'].nunique(),
            'brands': products_df['brand'].nunique(),
            'avg_price': float(products_df['price'].mean()),
            'avg_profit_margin': float(products_df['profit_margin'].mean()),
        },
        'sales': {
            'total_count': len(sales_df),
            'total_revenue': float(sales_df['total_amount'].sum()),
            'avg_transaction': float(sales_df['total_amount'].mean()),
            'date_range': {
                'start': str(sales_df['timestamp'].min()),
                'end': str(sales_df['timestamp'].max()),
            },
        },
    }
    
    print("\n📋 Data Quality Report:")
    print(json.dumps(report, indent=2))
    
    # Save report
    report_file = f'{OUTPUT_DIR}/quality_report.json'
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n💾 Report saved to: {report_file}")
    print("\n✅ Quality report generation complete!")
    print("=" * 60)
    
    return report


quality_report_task = PythonOperator(
    task_id='generate_quality_report',
    python_callable=generate_quality_report,
    dag=dag,
)

# ============================================================
# Task 7: Cleanup Temporary Files
# ============================================================

cleanup_task = BashOperator(
    task_id='cleanup_temp_files',
    bash_command=f'rm -f {OUTPUT_DIR}/temp_*.csv && echo "✅ Temporary files cleaned up"',
    dag=dag,
)

# ============================================================
# Task 8: Pipeline Complete
# ============================================================

def pipeline_complete():
    """
    Final task - mark pipeline as complete
    """
    print("\n" + "=" * 60)
    print("🎉 ETL PIPELINE COMPLETE!")
    print("=" * 60)
    print("\n✅ All tasks executed successfully!")
    print("\n📁 Output files:")
    print(f"  - {OUTPUT_DIR}/products_cleaned.csv")
    print(f"  - {OUTPUT_DIR}/sales_cleaned.csv")
    print(f"  - {OUTPUT_DIR}/quality_report.json")
    print("\n🚀 Data is ready for analysis!")
    print("=" * 60)


complete_task = PythonOperator(
    task_id='pipeline_complete',
    python_callable=pipeline_complete,
    dag=dag,
)

# ============================================================
# Define Task Dependencies
# ============================================================

# Visual flow:
#
#                    validate_input_files
#                           |
#              +------------+------------+
#              |                         |
#       extract_products          extract_sales
#              |                         |
#       transform_products        transform_sales
#              |                         |
#              +------------+------------+
#                           |
#                generate_quality_report
#                           |
#                  cleanup_temp_files
#                           |
#                   pipeline_complete

validate_task >> [extract_products_task, extract_sales_task]
extract_products_task >> transform_products_task
extract_sales_task >> transform_sales_task
[transform_products_task, transform_sales_task] >> quality_report_task
quality_report_task >> cleanup_task >> complete_task
