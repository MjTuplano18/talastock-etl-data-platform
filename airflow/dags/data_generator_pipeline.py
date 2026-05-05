"""
Data Generator Pipeline DAG

Generates fresh synthetic sales and product data for the Talastock data platform.
Runs the data-generator Python script inside the Airflow container and produces
CSV/JSON/Excel output files that the warehouse_etl_pipeline then loads.

Flow:
  data_generator_pipeline  →  warehouse_etl_pipeline  →  dbt_pipeline

Can be triggered:
  - Manually from the Airflow UI
  - Via the analytics dashboard UI (POST /api/v1/dags/data_generator_pipeline/dagRuns)

Author: Talastock Data Platform Team
"""

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator
from datetime import datetime, timedelta
import os

# ============================================================
# Configuration
# ============================================================

DATA_GENERATOR_DIR = '/opt/airflow/data-generator'

# Default generation parameters — can be overridden via dag_run.conf
DEFAULT_PRODUCTS = 100
DEFAULT_SALES    = 10000
DEFAULT_MONTHS   = 6

# ============================================================
# Default Arguments
# ============================================================

default_args = {
    'owner': 'talastock',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=2),
}

# ============================================================
# Create DAG
# ============================================================

dag = DAG(
    'data_generator_pipeline',
    default_args=default_args,
    description='Generate synthetic sales and product data for the warehouse',
    schedule_interval=None,  # Manual trigger only
    start_date=datetime(2026, 5, 1),
    catchup=False,
    tags=['generator', 'data', 'production'],
    params={
        'products': DEFAULT_PRODUCTS,
        'sales':    DEFAULT_SALES,
        'months':   DEFAULT_MONTHS,
    },
)

# ============================================================
# Task 1: Validate environment
# ============================================================

validate_task = BashOperator(
    task_id='validate_environment',
    bash_command=f"""
        echo "============================================================"
        echo "TASK 1: Validating Environment"
        echo "============================================================"
        echo "Python version:"
        python --version
        echo ""
        echo "Checking dependencies..."
        python -c "import pandas, faker, numpy, openpyxl; print('✅ All dependencies available')"
        echo ""
        echo "Data generator directory:"
        ls {DATA_GENERATOR_DIR}/
        echo "✅ Environment validated"
        echo "============================================================"
    """,
    dag=dag,
)

# ============================================================
# Task 2: Generate data
# ============================================================

def run_data_generator(**context):
    """Run the data generator with configurable parameters"""
    import subprocess
    import sys

    # Read params from dag_run.conf or use defaults
    conf = context.get('dag_run').conf or {}
    products = int(conf.get('products', DEFAULT_PRODUCTS))
    sales    = int(conf.get('sales',    DEFAULT_SALES))
    months   = int(conf.get('months',   DEFAULT_MONTHS))

    print("=" * 60)
    print("TASK 2: Generating Data")
    print("=" * 60)
    print(f"  Products : {products}")
    print(f"  Sales    : {sales}")
    print(f"  Months   : {months}")
    print("=" * 60)

    result = subprocess.run(
        [
            sys.executable,
            f'{DATA_GENERATOR_DIR}/generate_data.py',
            '--products', str(products),
            '--sales',    str(sales),
            '--months',   str(months),
        ],
        cwd=DATA_GENERATOR_DIR,
        capture_output=True,
        text=True,
    )

    # Print stdout so it shows in Airflow logs
    if result.stdout:
        print(result.stdout)

    if result.returncode != 0:
        print("STDERR:", result.stderr)
        raise RuntimeError(f"Data generator failed with exit code {result.returncode}")

    print("✅ Data generation complete")
    print("=" * 60)

generate_task = PythonOperator(
    task_id='generate_data',
    python_callable=run_data_generator,
    dag=dag,
)

# ============================================================
# Task 3: Verify output files
# ============================================================

verify_task = BashOperator(
    task_id='verify_output',
    bash_command=f"""
        echo "============================================================"
        echo "TASK 3: Verifying Output Files"
        echo "============================================================"
        OUTPUT_DIR="{DATA_GENERATOR_DIR}/output"

        for f in products.csv sales_standard.csv sales_flat.json; do
            if [ -f "$OUTPUT_DIR/$f" ]; then
                SIZE=$(wc -l < "$OUTPUT_DIR/$f")
                echo "✅ $f — $SIZE lines"
            else
                echo "❌ MISSING: $f"
                exit 1
            fi
        done

        echo ""
        echo "All output files verified!"
        echo "============================================================"
    """,
    dag=dag,
)

# ============================================================
# Task 4: Report summary
# ============================================================

def report_summary(**context):
    """Log a summary of what was generated"""
    import pandas as pd

    print("=" * 60)
    print("TASK 4: Generation Summary")
    print("=" * 60)

    try:
        products_df = pd.read_csv(f'{DATA_GENERATOR_DIR}/output/products.csv')
        sales_df    = pd.read_csv(f'{DATA_GENERATOR_DIR}/output/sales_standard.csv')

        print(f"\n📦 Products generated : {len(products_df)}")
        print(f"   Categories         : {products_df['category'].nunique()}")
        print(f"   Brands             : {products_df['brand'].nunique()}")

        sales_df['total_amount'] = pd.to_numeric(sales_df['total_amount'], errors='coerce')
        print(f"\n💰 Sales generated    : {len(sales_df)}")
        print(f"   Total revenue      : ₱{sales_df['total_amount'].sum():,.2f}")
        print(f"   Date range         : {sales_df['timestamp'].min()} → {sales_df['timestamp'].max()}")

        print(f"\n📁 Output directory   : {DATA_GENERATOR_DIR}/output/")
        print("\n✅ Data generator pipeline complete!")
        print("   Next: trigger warehouse_etl_pipeline to load this data")

    except Exception as e:
        print(f"⚠️  Could not read summary: {e}")

    print("=" * 60)

summary_task = PythonOperator(
    task_id='report_summary',
    python_callable=report_summary,
    dag=dag,
)

# ============================================================
# Task 5: Trigger warehouse ETL (optional — runs automatically)
# ============================================================

trigger_warehouse_task = TriggerDagRunOperator(
    task_id='trigger_warehouse_etl',
    trigger_dag_id='warehouse_etl_pipeline',
    wait_for_completion=False,  # Fire and forget — warehouse runs independently
    dag=dag,
)

# ============================================================
# Task Dependencies
# ============================================================
#
#  validate_environment
#         ↓
#    generate_data
#         ↓
#    verify_output
#         ↓
#   report_summary
#         ↓
#  trigger_warehouse_etl   ← automatically kicks off the full pipeline
#

validate_task >> generate_task >> verify_task >> summary_task >> trigger_warehouse_task
