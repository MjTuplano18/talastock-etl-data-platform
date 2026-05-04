"""
Hello World DAG - Your First Airflow Pipeline

This is a simple tutorial DAG that demonstrates:
1. How to create a DAG
2. How to create tasks
3. How to set task dependencies
4. How to use PythonOperator and BashOperator

Author: Talastock Data Platform Team
Phase: 2 - Apache Airflow ETL Orchestration
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

# ============================================================
# STEP 1: Define Default Arguments
# ============================================================
# These apply to ALL tasks in this DAG unless overridden

default_args = {
    'owner': 'talastock',              # Who owns this DAG
    'depends_on_past': False,          # Don't wait for previous runs
    'email_on_failure': False,         # Don't email on failure (for now)
    'email_on_retry': False,           # Don't email on retry
    'retries': 1,                      # Retry once if task fails
    'retry_delay': timedelta(minutes=5),  # Wait 5 minutes before retry
}

# ============================================================
# STEP 2: Create the DAG
# ============================================================

dag = DAG(
    # DAG ID (must be unique across all DAGs)
    'hello_world',
    
    # Apply default args to all tasks
    default_args=default_args,
    
    # Description shown in Airflow UI
    description='My first Airflow DAG - Hello World tutorial',
    
    # When to run: @daily means every day at midnight
    # Other options: @hourly, @weekly, @monthly, or cron expression
    schedule_interval='@daily',
    
    # When this DAG should start running
    start_date=datetime(2026, 1, 1),
    
    # Don't backfill (run for past dates)
    catchup=False,
    
    # Tags for filtering in UI
    tags=['tutorial', 'hello-world', 'learning'],
)

# ============================================================
# STEP 3: Define Task Functions
# ============================================================

def say_hello():
    """
    Task 1: Print a hello message
    
    This is a simple Python function that will be executed by Airflow
    """
    print("=" * 60)
    print("🎉 Hello from Apache Airflow!")
    print("=" * 60)
    print("\nThis is my first Airflow task!")
    print("I'm running inside a PythonOperator")
    print("\nCurrent time:", datetime.now())
    print("=" * 60)
    
    # You can return data to pass to other tasks (via XCom)
    return "Hello World from Task 1"


def process_data():
    """
    Task 2: Simulate data processing
    
    This shows how you might process data in a real pipeline
    """
    print("\n" + "=" * 60)
    print("📊 Processing Data...")
    print("=" * 60)
    
    # Simulate some data processing
    data = {
        'products': 100,
        'sales': 9950,
        'revenue': 1056894.56
    }
    
    print("\nData Summary:")
    for key, value in data.items():
        print(f"  {key}: {value}")
    
    print("\n✅ Data processing complete!")
    print("=" * 60)
    
    return data


def say_goodbye():
    """
    Task 3: Print a goodbye message
    
    This is the final task in our pipeline
    """
    print("\n" + "=" * 60)
    print("👋 Goodbye from Apache Airflow!")
    print("=" * 60)
    print("\nPipeline execution complete!")
    print("All tasks finished successfully")
    print("\nNext run scheduled for tomorrow")
    print("=" * 60)


# ============================================================
# STEP 4: Create Tasks (Operators)
# ============================================================

# Task 1: Python function
hello_task = PythonOperator(
    task_id='say_hello',           # Unique ID for this task
    python_callable=say_hello,     # Function to execute
    dag=dag,                       # Which DAG this belongs to
)

# Task 2: Bash command (print current date)
date_task = BashOperator(
    task_id='print_date',
    bash_command='date',           # Simple bash command
    dag=dag,
)

# Task 3: Python function (process data)
process_task = PythonOperator(
    task_id='process_data',
    python_callable=process_data,
    dag=dag,
)

# Task 4: Bash command (list files)
list_files_task = BashOperator(
    task_id='list_files',
    bash_command='echo "Listing data directory:" && ls -la',
    dag=dag,
)

# Task 5: Python function (goodbye)
goodbye_task = PythonOperator(
    task_id='say_goodbye',
    python_callable=say_goodbye,
    dag=dag,
)

# ============================================================
# STEP 5: Define Task Dependencies (Execution Order)
# ============================================================

# Method 1: Using >> operator (recommended)
# This creates a linear flow: A → B → C → D → E

hello_task >> date_task >> process_task >> list_files_task >> goodbye_task

# Visual representation:
#
#   say_hello → print_date → process_data → list_files → say_goodbye
#

# Alternative syntax (same result):
# hello_task.set_downstream(date_task)
# date_task.set_downstream(process_task)
# process_task.set_downstream(list_files_task)
# list_files_task.set_downstream(goodbye_task)

# ============================================================
# EXPLANATION OF WHAT HAPPENS:
# ============================================================
#
# 1. Airflow Scheduler reads this file
# 2. Creates a DAG called "hello_world"
# 3. Schedules it to run daily at midnight
# 4. When triggered, executes tasks in order:
#    - say_hello (prints hello message)
#    - print_date (shows current date)
#    - process_data (simulates data processing)
#    - list_files (lists directory contents)
#    - say_goodbye (prints goodbye message)
# 5. If any task fails, it retries once after 5 minutes
# 6. You can view progress in Airflow Web UI
#
# ============================================================
