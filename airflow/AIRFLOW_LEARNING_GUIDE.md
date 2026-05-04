# Apache Airflow Learning Guide - Phase 2

**Enterprise Data Platform for Talastock**

This guide will teach you Apache Airflow from scratch while building a real ETL pipeline.

---

## 📚 Table of Contents

1. [What is Apache Airflow?](#what-is-apache-airflow)
2. [Why Use Airflow?](#why-use-airflow)
3. [Core Concepts](#core-concepts)
4. [Airflow Architecture](#airflow-architecture)
5. [Your First DAG](#your-first-dag)
6. [Operators Explained](#operators-explained)
7. [Task Dependencies](#task-dependencies)
8. [Scheduling](#scheduling)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## What is Apache Airflow?

**Apache Airflow** is an open-source workflow orchestration platform created by Airbnb in 2014.

### Simple Definition:
> Airflow is a tool that helps you schedule, monitor, and manage data pipelines.

### Real-World Analogy:

**Without Airflow (Manual Process):**
```
You: "Hey Python script, extract data from CSV"
[Wait... check if done... manually run next step]
You: "Now clean the data"
[Wait... check if done... manually run next step]
You: "Now load to database"
[Something fails at 3 AM... you don't know until morning]
```

**With Airflow (Automated):**
```
You: "Airflow, run this pipeline daily at 2 AM"
Airflow: "Got it! I'll extract, clean, load, and email you if anything fails"
[You sleep peacefully while Airflow handles everything]
```

---

## Why Use Airflow?

### Problems Airflow Solves:

1. **Manual Scheduling** ❌
   - Problem: Running scripts manually or with basic cron
   - Solution: Airflow schedules automatically with rich scheduling options

2. **No Visibility** ❌
   - Problem: Can't see what's running or what failed
   - Solution: Beautiful web UI showing all pipelines and their status

3. **No Retry Logic** ❌
   - Problem: Script fails at 3 AM, you find out at 9 AM
   - Solution: Airflow retries automatically and alerts you

4. **Complex Dependencies** ❌
   - Problem: Task B needs Task A to finish first
   - Solution: Airflow manages dependencies automatically

5. **No Monitoring** ❌
   - Problem: Don't know if pipelines are slow or stuck
   - Solution: Airflow tracks duration, logs, and metrics

### Companies Using Airflow:

- **Airbnb** (created it) - 1000+ DAGs
- **Spotify** - Music recommendation pipelines
- **Netflix** - Content processing
- **Uber** - Data analytics pipelines
- **Twitter** - ML model training

---

## Core Concepts

### 1. DAG (Directed Acyclic Graph)

**What:** A DAG is your entire workflow/pipeline

**Directed:** Tasks flow in one direction (A → B → C)  
**Acyclic:** No loops (can't go back)  
**Graph:** Visual representation

**Example:**
```
Extract CSV → Clean Data → Validate → Load to DB
```

**In Code:**
```python
from airflow import DAG
from datetime import datetime

dag = DAG(
    'my_first_pipeline',
    start_date=datetime(2026, 1, 1),
    schedule_interval='@daily'  # Run every day
)
```

---

### 2. Task

**What:** A single unit of work in your pipeline

**Examples:**
- Extract data from CSV
- Clean missing values
- Load to database
- Send email notification

**In Code:**
```python
from airflow.operators.python import PythonOperator

def extract_data():
    print("Extracting data from CSV...")
    # Your extraction logic here

extract_task = PythonOperator(
    task_id='extract_csv',
    python_callable=extract_data,
    dag=dag
)
```

---

### 3. Operator

**What:** The TYPE of task you want to run

**Common Operators:**

| Operator | Purpose | Example |
|----------|---------|---------|
| `PythonOperator` | Run Python function | Clean data with pandas |
| `BashOperator` | Run bash command | `ls -la` or `python script.py` |
| `EmailOperator` | Send email | Alert on failure |
| `PostgresOperator` | Run SQL query | Load data to database |
| `HttpOperator` | Call API | Fetch data from REST API |

**Example:**
```python
from airflow.operators.bash import BashOperator

list_files = BashOperator(
    task_id='list_files',
    bash_command='ls -la /data',
    dag=dag
)
```

---

### 4. Task Dependencies

**What:** Defining the order tasks should run

**Syntax:**
```python
# Method 1: Bitshift operators (recommended)
task_a >> task_b >> task_c  # A then B then C

# Method 2: set_downstream/upstream
task_a.set_downstream(task_b)

# Multiple dependencies
task_a >> [task_b, task_c] >> task_d
# Both B and C run after A, then D runs after both finish
```

**Visual:**
```
        task_a
       /      \
   task_b    task_c
       \      /
        task_d
```

---

### 5. Schedule Interval

**What:** When your DAG should run

**Common Schedules:**

| Schedule | Meaning | Cron Expression |
|----------|---------|-----------------|
| `@once` | Run once | - |
| `@hourly` | Every hour | `0 * * * *` |
| `@daily` | Every day at midnight | `0 0 * * *` |
| `@weekly` | Every Sunday at midnight | `0 0 * * 0` |
| `@monthly` | First day of month | `0 0 1 * *` |
| `None` | Manual trigger only | - |

**Custom Schedule:**
```python
# Every day at 2 AM
schedule_interval='0 2 * * *'

# Every 15 minutes
schedule_interval='*/15 * * * *'

# Every Monday at 9 AM
schedule_interval='0 9 * * 1'
```

---

## Airflow Architecture

### Components:

```
┌─────────────────────────────────────────┐
│   Web Server (UI)                       │
│   - View DAGs                           │
│   - Monitor tasks                       │
│   - Trigger runs                        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   Scheduler                             │
│   - Reads DAG files                     │
│   - Schedules tasks                     │
│   - Manages dependencies                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   Executor                              │
│   - Runs tasks                          │
│   - Manages workers                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   Metadata Database (PostgreSQL)        │
│   - Stores DAG runs                     │
│   - Stores task states                  │
│   - Stores logs                         │
└─────────────────────────────────────────┘
```

### How It Works:

1. **You write a DAG** in Python and save it to `dags/` folder
2. **Scheduler reads the DAG** and creates task instances
3. **Executor runs the tasks** based on schedule and dependencies
4. **Web Server shows you** what's happening in real-time
5. **Metadata DB stores** all execution history

---

## Your First DAG

Let's build a simple "Hello World" DAG:

```python
# dags/hello_world_dag.py

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

# Default arguments for all tasks
default_args = {
    'owner': 'talastock',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Define the DAG
dag = DAG(
    'hello_world',
    default_args=default_args,
    description='My first Airflow DAG',
    schedule_interval='@daily',
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=['tutorial', 'hello-world'],
)

# Task 1: Python function
def say_hello():
    print("Hello from Airflow!")
    print("This is my first task")
    return "Hello World"

hello_task = PythonOperator(
    task_id='say_hello',
    python_callable=say_hello,
    dag=dag,
)

# Task 2: Bash command
date_task = BashOperator(
    task_id='print_date',
    bash_command='date',
    dag=dag,
)

# Task 3: Another Python function
def say_goodbye():
    print("Goodbye from Airflow!")
    print("Pipeline complete!")

goodbye_task = PythonOperator(
    task_id='say_goodbye',
    python_callable=say_goodbye,
    dag=dag,
)

# Define task dependencies
hello_task >> date_task >> goodbye_task
```

**What This Does:**
1. Says "Hello" (Python)
2. Prints current date (Bash)
3. Says "Goodbye" (Python)

**Visual Flow:**
```
say_hello → print_date → say_goodbye
```

---

## Operators Explained

### PythonOperator

**Use Case:** Run any Python function

```python
from airflow.operators.python import PythonOperator

def my_function(name, age):
    print(f"Hello {name}, you are {age} years old")
    return f"Processed {name}"

task = PythonOperator(
    task_id='run_python',
    python_callable=my_function,
    op_kwargs={'name': 'Maria', 'age': 25},  # Pass arguments
    dag=dag
)
```

---

### BashOperator

**Use Case:** Run shell commands

```python
from airflow.operators.bash import BashOperator

# Simple command
task1 = BashOperator(
    task_id='list_files',
    bash_command='ls -la',
    dag=dag
)

# Run Python script
task2 = BashOperator(
    task_id='run_script',
    bash_command='python /path/to/script.py',
    dag=dag
)

# Multiple commands
task3 = BashOperator(
    task_id='multiple_commands',
    bash_command='cd /data && ls -la && echo "Done"',
    dag=dag
)
```

---

### EmailOperator

**Use Case:** Send email notifications

```python
from airflow.operators.email import EmailOperator

send_email = EmailOperator(
    task_id='send_notification',
    to='admin@talastock.com',
    subject='Pipeline Complete',
    html_content='<h3>ETL pipeline finished successfully!</h3>',
    dag=dag
)
```

---

## Task Dependencies

### Simple Linear Flow:
```python
task_a >> task_b >> task_c
# A runs first, then B, then C
```

### Parallel Tasks:
```python
task_a >> [task_b, task_c]
# B and C run in parallel after A
```

### Fan-In Pattern:
```python
[task_a, task_b] >> task_c
# C waits for both A and B to finish
```

### Complex Flow:
```python
start >> [extract_csv, extract_json] >> clean_data >> [load_db, send_email] >> end
```

**Visual:**
```
                start
               /     \
      extract_csv   extract_json
               \     /
             clean_data
               /     \
          load_db   send_email
               \     /
                 end
```

---

## Scheduling

### Cron Expression Breakdown:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday=0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Examples:

```python
# Every day at 2 AM
schedule_interval='0 2 * * *'

# Every Monday at 9 AM
schedule_interval='0 9 * * 1'

# Every 15 minutes
schedule_interval='*/15 * * * *'

# First day of every month at midnight
schedule_interval='0 0 1 * *'

# Weekdays at 6 PM
schedule_interval='0 18 * * 1-5'
```

---

## Error Handling

### Retries:

```python
default_args = {
    'retries': 3,  # Retry 3 times
    'retry_delay': timedelta(minutes=5),  # Wait 5 min between retries
    'retry_exponential_backoff': True,  # 5min, 10min, 20min
}
```

### Email Alerts:

```python
default_args = {
    'email': ['admin@talastock.com'],
    'email_on_failure': True,  # Email if task fails
    'email_on_retry': False,   # Don't email on retry
}
```

### Task Timeout:

```python
task = PythonOperator(
    task_id='long_running_task',
    python_callable=my_function,
    execution_timeout=timedelta(hours=1),  # Kill after 1 hour
    dag=dag
)
```

---

## Best Practices

### 1. Idempotency

**What:** Running the same task multiple times produces the same result

**Bad (Not Idempotent):**
```python
def bad_insert():
    # This will create duplicates if run twice!
    db.execute("INSERT INTO sales VALUES (...)")
```

**Good (Idempotent):**
```python
def good_insert():
    # Delete first, then insert (or use UPSERT)
    db.execute("DELETE FROM sales WHERE date = '2026-05-04'")
    db.execute("INSERT INTO sales VALUES (...)")
```

---

### 2. Keep Tasks Small

**Bad:**
```python
def do_everything():
    extract_data()
    clean_data()
    validate_data()
    load_data()
    send_email()
```

**Good:**
```python
extract_task >> clean_task >> validate_task >> load_task >> email_task
```

**Why:** If validation fails, you don't have to re-extract and re-clean

---

### 3. Use XComs for Small Data

**What:** XComs let tasks pass small data between each other

```python
def extract():
    data = fetch_from_api()
    return data  # Push to XCom

def transform(**context):
    data = context['ti'].xcom_pull(task_ids='extract')  # Pull from XCom
    cleaned = clean(data)
    return cleaned

extract_task >> transform_task
```

**Warning:** Only use for small data (< 1 MB). For large data, use files or databases.

---

### 4. Use Variables for Configuration

```python
from airflow.models import Variable

# Set in Airflow UI: Admin → Variables
data_path = Variable.get("data_path", default_var="/data")
api_key = Variable.get("api_key")
```

---

### 5. Tag Your DAGs

```python
dag = DAG(
    'sales_etl',
    tags=['production', 'sales', 'daily'],  # Easy to filter in UI
)
```

---

## Next Steps

Now that you understand the basics, let's build our real ETL pipeline:

1. **Extract** data from generated CSV files
2. **Transform** (clean, validate)
3. **Load** to staging database

Ready to build? Let's go! 🚀

