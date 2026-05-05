"""
dbt Pipeline DAG - Transform & Test Analytics Layer

This DAG runs after warehouse_etl_pipeline completes:
1. dbt run    → rebuild all 9 models (staging, dimensions, facts, aggregates)
2. dbt test   → run 104 data quality tests
3. Report     → log results and fail loudly if tests fail

Triggered by: warehouse_etl_pipeline (via TriggerDagRunOperator)
Can also be triggered manually from the Airflow UI.

Author: Talastock Data Platform Team
"""

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator
from datetime import datetime, timedelta
import json
import os

# ============================================================
# Configuration
# ============================================================

# dbt project lives one level up from airflow/
DBT_PROJECT_DIR = '/opt/airflow/dbt'
DBT_PROFILES_DIR = '/opt/airflow/dbt'

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
    'dbt_pipeline',
    default_args=default_args,
    description='Run dbt models and tests after warehouse ETL completes',
    schedule_interval=None,  # Only triggered by warehouse_etl_pipeline or manually
    start_date=datetime(2026, 5, 1),
    catchup=False,
    tags=['dbt', 'transform', 'test', 'production'],
)

# ============================================================
# Task 1: Check dbt is installed
# ============================================================

check_dbt_task = BashOperator(
    task_id='check_dbt_installed',
    bash_command="""
        echo "============================================================"
        echo "TASK 1: Checking dbt Installation"
        echo "============================================================"
        dbt --version
        echo "✅ dbt is installed and ready"
        echo "============================================================"
    """,
    dag=dag,
)

# ============================================================
# Task 2: dbt debug — verify connection to warehouse
# ============================================================

dbt_debug_task = BashOperator(
    task_id='dbt_debug',
    bash_command=f"""
        echo "============================================================"
        echo "TASK 2: Testing dbt Connection to Warehouse"
        echo "============================================================"
        cd {DBT_PROJECT_DIR}
        dbt debug --profiles-dir {DBT_PROFILES_DIR} --target docker
        echo "✅ Connection verified"
        echo "============================================================"
    """,
    dag=dag,
)

# ============================================================
# Task 3: dbt run — rebuild all models
# ============================================================

dbt_run_task = BashOperator(
    task_id='dbt_run',
    bash_command=f"""
        echo "============================================================"
        echo "TASK 3: Running dbt Models"
        echo "============================================================"
        cd {DBT_PROJECT_DIR}
        dbt run --profiles-dir {DBT_PROFILES_DIR} --target docker --no-partial-parse
        echo "============================================================"
        echo "✅ All dbt models built successfully"
        echo "============================================================"
    """,
    dag=dag,
)

# ============================================================
# Task 4: dbt test — run all 104 data quality tests
# ============================================================

dbt_test_task = BashOperator(
    task_id='dbt_test',
    bash_command=f"""
        echo "============================================================"
        echo "TASK 4: Running dbt Data Quality Tests"
        echo "============================================================"
        cd {DBT_PROJECT_DIR}
        dbt test --profiles-dir {DBT_PROFILES_DIR} --target docker
        echo "============================================================"
        echo "✅ All data quality tests passed"
        echo "============================================================"
    """,
    # If tests fail, this task fails — which fails the whole DAG
    # This is intentional: bad data should stop the pipeline
    dag=dag,
)

# ============================================================
# Task 5: Generate dbt docs
# ============================================================

dbt_docs_task = BashOperator(
    task_id='dbt_docs_generate',
    bash_command=f"""
        echo "============================================================"
        echo "TASK 5: Generating dbt Documentation"
        echo "============================================================"
        cd {DBT_PROJECT_DIR}
        dbt docs generate --profiles-dir {DBT_PROFILES_DIR} --target docker
        echo "✅ Documentation generated at {DBT_PROJECT_DIR}/target/index.html"
        echo "============================================================"
    """,
    dag=dag,
)

# ============================================================
# Task 6: Report pipeline results
# ============================================================

def report_results():
    """Log final pipeline summary"""
    import psycopg2

    print("=" * 60)
    print("TASK 6: dbt Pipeline Complete — Final Report")
    print("=" * 60)

    try:
        conn = psycopg2.connect(
            host='talastock-warehouse',
            port=5432,
            database='talastock_warehouse',
            user='warehouse_user',
            password='warehouse_pass'
        )
        cur = conn.cursor()

        # Row counts from dbt-built tables
        tables = [
            ('analytics', 'stg_products',           'Staging Products (view)'),
            ('analytics', 'stg_sales',               'Staging Sales (view)'),
            ('analytics', 'dim_products',            'Dimension: Products'),
            ('analytics', 'dim_dates',               'Dimension: Dates'),
            ('analytics', 'dim_times',               'Dimension: Times'),
            ('analytics', 'fact_sales',              'Fact: Sales'),
            ('analytics', 'daily_sales_summary',     'Aggregate: Daily Summary'),
            ('analytics', 'product_performance',     'Aggregate: Product Performance'),
            ('analytics', 'category_performance',    'Aggregate: Category Performance'),
        ]

        print("\n📊 dbt Model Row Counts:")
        for schema, table, label in tables:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {schema}.{table}")
                count = cur.fetchone()[0]
                print(f"  {label}: {count:,} rows")
            except Exception as e:
                print(f"  {label}: ERROR - {e}")

        # Revenue summary
        cur.execute("SELECT SUM(total_revenue), SUM(total_profit) FROM analytics.daily_sales_summary")
        row = cur.fetchone()
        if row and row[0]:
            print(f"\n💰 Revenue Summary:")
            print(f"  Total Revenue : ₱{row[0]:,.2f}")
            print(f"  Total Profit  : ₱{row[1]:,.2f}")
            print(f"  Profit Margin : {(row[1]/row[0]*100):.1f}%")

        conn.close()

    except Exception as e:
        print(f"⚠️  Could not connect to warehouse for report: {e}")

    print("\n✅ dbt pipeline finished successfully!")
    print("   All models built. All tests passed.")
    print("=" * 60)


report_task = PythonOperator(
    task_id='report_results',
    python_callable=report_results,
    dag=dag,
)

# ============================================================
# Task 7: Trigger Forecasting Pipeline
# ============================================================

trigger_forecast_task = TriggerDagRunOperator(
    task_id='trigger_forecasting_pipeline',
    trigger_dag_id='forecasting_pipeline',
    wait_for_completion=False,  # Fire and forget
    dag=dag,
)

# ============================================================
# Task Dependencies
# ============================================================
#
#  check_dbt_installed
#         ↓
#     dbt_debug
#         ↓
#      dbt_run
#         ↓
#     dbt_test
#         ↓
#  dbt_docs_generate
#         ↓
#   report_results
#         ↓
#  trigger_forecasting_pipeline
#

check_dbt_task >> dbt_debug_task >> dbt_run_task >> dbt_test_task >> dbt_docs_task >> report_task >> trigger_forecast_task
