# 🎓 dbt Learning Guide for Talastock

**Time**: 2-3 hours  
**Difficulty**: ⭐⭐⭐ Intermediate  
**Prerequisites**: Basic SQL knowledge, Python 3.10-3.12 installed

---

## 📚 Table of Contents

1. [What is dbt?](#what-is-dbt)
2. [Setup & Installation](#setup--installation)
3. [Part 1: Understanding dbt Models](#part-1-understanding-dbt-models)
4. [Part 2: Running Your First Model](#part-2-running-your-first-model)
5. [Part 3: Testing Data Quality](#part-3-testing-data-quality)
6. [Part 4: Documentation](#part-4-documentation)
7. [Part 5: Advanced Features](#part-5-advanced-features)
8. [Practice Exercises](#practice-exercises)
9. [Troubleshooting](#troubleshooting)

---

## What is dbt?

**dbt (data build tool)** transforms data in your warehouse using SQL SELECT statements.

### Before dbt:
```
❌ SQL scattered in Airflow tasks
❌ No version control for transformations
❌ No data quality tests
❌ No documentation
❌ Hard to maintain and debug
```

### After dbt:
```
✅ Organized SQL models in git
✅ Automated data quality tests
✅ Auto-generated documentation
✅ Visual lineage graphs
✅ Easy to maintain and debug
✅ Production-ready
```

### Real-World Analogy:
- **Airflow** = Factory manager (schedules when things happen)
- **dbt** = Assembly line (transforms raw materials into products)

---

## Setup & Installation

### Step 1: Check Python Version
```bash
python --version
# Should be 3.10, 3.11, or 3.12 (NOT 3.14)
```

If you have Python 3.14, download Python 3.12 from: https://www.python.org/downloads/

### Step 2: Create Virtual Environment
```bash
cd data-platform/dbt
python3.12 -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate
```

### Step 3: Install dbt
```bash
pip install dbt-core dbt-postgres
```

### Step 4: Verify Installation
```bash
dbt --version
# Should show dbt version 1.7+ and dbt-postgres adapter
```

### Step 5: Test Connection
```bash
dbt debug
```

**Expected output:**
```
Configuration:
  profiles.yml file [OK found and valid]
  dbt_project.yml file [OK found and valid]

Connection:
  host: localhost
  port: 5433
  user: warehouse_user
  database: talastock_warehouse
  schema: analytics
  Connection test: [OK connection ok]

All checks passed!
```

---

## Part 1: Understanding dbt Models

**Time**: 30 minutes

### What is a Model?

A model is a SQL SELECT statement that creates a table or view in your warehouse.

### Example: Staging Model

Open `models/staging/stg_products.sql`:

```sql
WITH source AS (
    SELECT * FROM {{ source('raw', 'products') }}
),

cleaned AS (
    SELECT
        sku,
        name,
        category,
        price,
        cost_price,
        ROUND(((price - cost_price) / price * 100)::numeric, 2) AS profit_margin_pct
    FROM source
    WHERE is_active = true
      AND price > 0
)

SELECT * FROM cleaned
```

### Key Concepts:

#### 1. **Jinja Templating** (`{{ }}`)
```sql
{{ source('raw', 'products') }}
-- Becomes: raw.products
-- Benefit: dbt tracks lineage
```

#### 2. **CTEs (Common Table Expressions)**
```sql
WITH source AS (...),
     cleaned AS (...)
SELECT * FROM cleaned
```
- Makes SQL readable
- Easy to debug step-by-step

#### 3. **Materialization**
```yaml
# In dbt_project.yml
staging:
  +materialized: view  # Creates a VIEW
marts:
  +materialized: table  # Creates a TABLE
```

**View vs Table:**
- **View**: Fast to build, slow to query (runs SQL every time)
- **Table**: Slow to build, fast to query (stores results)

---

## Part 2: Running Your First Model

**Time**: 30 minutes

### Step 1: Run Staging Models

```bash
# Run all staging models
dbt run --select staging

# Expected output:
# Running with dbt=1.7.0
# Found 8 models, 0 tests, 0 snapshots, 0 analyses, 0 macros, 0 operations, 0 seed files, 2 sources, 0 exposures, 0 metrics
# 
# Completed successfully
# 
# Done. PASS=2 WARN=0 ERROR=0 SKIP=0 TOTAL=2
```

### Step 2: Verify in pgAdmin

Open pgAdmin (http://localhost:5050) and run:

```sql
-- Check if staging views were created
SELECT * FROM analytics.stg_products LIMIT 10;
SELECT * FROM analytics.stg_sales LIMIT 10;
```

### Step 3: Run Dimension Models

```bash
# Run dimension models
dbt run --select marts.dimensions

# This will create:
# - dim_products (table)
# - dim_dates (table)
# - dim_times (table)
```

### Step 4: Verify Dimensions

```sql
-- Check dimensions
SELECT COUNT(*) FROM analytics.dim_products;  -- Should be ~100
SELECT COUNT(*) FROM analytics.dim_dates;     -- Should be ~192
SELECT COUNT(*) FROM analytics.dim_times;     -- Should be ~24
```

### Step 5: Run Fact Model

```bash
# Run fact model
dbt run --select fact_sales
```

### Step 6: Run Aggregate Models

```bash
# Run all aggregate models
dbt run --select aggregates

# This will create:
# - daily_sales_summary
# - product_performance
# - category_performance
```

### Step 7: Run Everything

```bash
# Run all models in correct order
dbt run

# dbt automatically figures out dependencies!
```

---

## Part 3: Testing Data Quality

**Time**: 30 minutes

### What are Tests?

Tests validate your data quality. They run SQL queries that should return 0 rows.

### Built-in Tests

Open `models/staging/schema.yml`:

```yaml
models:
  - name: stg_products
    columns:
      - name: sku
        tests:
          - unique        # No duplicates
          - not_null      # No NULL values
      
      - name: price
        tests:
          - not_null
```

### Run Tests

```bash
# Run all tests
dbt test

# Expected output:
# Running with dbt=1.7.0
# Found 8 models, 25 tests, 0 snapshots, 0 analyses, 0 macros, 0 operations, 0 seed files, 2 sources, 0 exposures, 0 metrics
# 
# Completed successfully
# 
# Done. PASS=25 WARN=0 ERROR=0 SKIP=0 TOTAL=25
```

### Run Tests for Specific Model

```bash
# Test only staging models
dbt test --select staging

# Test only one model
dbt test --select stg_products
```

### What if a Test Fails?

```bash
# Example failure:
# Failure in test unique_stg_products_sku (models/staging/schema.yml)
#   Got 2 results, expected 0.
# 
#   compiled SQL at target/compiled/talastock/models/staging/schema.yml/unique_stg_products_sku.sql
```

**How to debug:**
1. Open the compiled SQL file
2. Run it in pgAdmin to see which rows failed
3. Fix the data or model
4. Re-run the test

---

## Part 4: Documentation

**Time**: 30 minutes

### Generate Documentation

```bash
dbt docs generate
```

This creates:
- Model descriptions
- Column descriptions
- Lineage graphs
- Test results

### View Documentation

```bash
dbt docs serve
```

Opens browser at http://localhost:8080

### What You'll See:

1. **Project Overview**
   - All models, tests, sources
   - Project structure

2. **Model Details**
   - SQL code
   - Column descriptions
   - Tests
   - Lineage graph

3. **Lineage Graph**
   - Visual data flow
   - Click nodes to see details
   - Trace data from source to aggregate

### Add Custom Documentation

Edit `models/staging/schema.yml`:

```yaml
models:
  - name: stg_products
    description: |
      Cleaned and standardized product data from raw layer.
      
      **Transformations:**
      - Filter only active products
      - Calculate profit margin
      - Standardize column names
      
      **Data Quality:**
      - No duplicates (unique SKU)
      - No NULL values in key fields
      - Price must be positive
    
    columns:
      - name: sku
        description: "Product SKU - unique identifier for each product"
      
      - name: profit_margin_pct
        description: |
          Profit margin percentage calculated as:
          ((price - cost_price) / price) * 100
```

Re-generate docs:
```bash
dbt docs generate
dbt docs serve
```

---

## Part 5: Advanced Features

**Time**: 30 minutes

### 1. Incremental Models

For large tables, only process new data:

```sql
{{
  config(
    materialized='incremental',
    unique_key='transaction_id'
  )
}}

SELECT * FROM {{ ref('stg_sales') }}

{% if is_incremental() %}
  -- Only process new records
  WHERE loaded_at > (SELECT MAX(loaded_at) FROM {{ this }})
{% endif %}
```

Run incremental model:
```bash
dbt run --select fact_sales

# First run: processes all data
# Subsequent runs: only new data
```

### 2. Macros (Reusable SQL)

Create `macros/calculate_profit_margin.sql`:

```sql
{% macro calculate_profit_margin(price, cost) %}
    ROUND(
        (({{ price }} - {{ cost }}) / NULLIF({{ price }}, 0) * 100)::numeric,
        2
    )
{% endmacro %}
```

Use in model:
```sql
SELECT
    sku,
    name,
    {{ calculate_profit_margin('price', 'cost_price') }} AS profit_margin_pct
FROM {{ source('raw', 'products') }}
```

### 3. Variables

Define in `dbt_project.yml`:
```yaml
vars:
  start_date: '2025-01-01'
  low_stock_threshold: 10
```

Use in model:
```sql
SELECT *
FROM {{ ref('stg_sales') }}
WHERE sale_date >= '{{ var("start_date") }}'
```

Override at runtime:
```bash
dbt run --vars '{"start_date": "2025-02-01"}'
```

### 4. Seeds (CSV Data)

Add reference data:
```bash
# Create seeds/categories.csv
category,description
Beverage,Drinks and beverages
Snacks,Chips and snacks
Essentials,Daily necessities

# Load seed
dbt seed

# Reference in model
SELECT * FROM {{ ref('categories') }}
```

---

## Practice Exercises

### Exercise 1: Create a New Aggregate Model

**Task**: Create `hourly_sales_summary.sql` that aggregates sales by hour.

**Hints:**
- Use `{{ ref('fact_sales') }}`
- Join with `{{ ref('dim_times') }}`
- Group by hour
- Calculate total revenue, transactions, units sold

**Solution:**
```sql
{{
  config(
    materialized='table'
  )
}}

WITH fact_sales AS (
    SELECT * FROM {{ ref('fact_sales') }}
),

times AS (
    SELECT * FROM {{ ref('dim_times') }}
),

hourly_aggregates AS (
    SELECT
        t.hour_24,
        t.time_period,
        COUNT(*) AS total_transactions,
        SUM(f.total_amount) AS total_revenue,
        SUM(f.quantity) AS total_units_sold,
        ROUND(AVG(f.total_amount)::numeric, 2) AS avg_transaction_value
    FROM fact_sales f
    INNER JOIN times t ON f.time_key = t.time_key
    GROUP BY t.hour_24, t.time_period
)

SELECT * FROM hourly_aggregates
ORDER BY hour_24
```

Run it:
```bash
dbt run --select hourly_sales_summary
```

### Exercise 2: Add Custom Test

**Task**: Create a test that ensures total_amount = quantity * unit_price in fact_sales.

Create `tests/assert_amount_calculation.sql`:
```sql
-- Test: total_amount should equal quantity * unit_price
SELECT
    transaction_id,
    quantity,
    unit_price,
    total_amount,
    (quantity * unit_price) AS calculated_amount
FROM {{ ref('fact_sales') }}
WHERE ABS(total_amount - (quantity * unit_price)) > 0.01
```

Run test:
```bash
dbt test --select assert_amount_calculation
```

### Exercise 3: Add Documentation

**Task**: Add descriptions to `dim_dates` model.

Edit `models/marts/schema.yml`:
```yaml
- name: dim_dates
  description: |
    Date dimension table for time-based analysis.
    
    **Features:**
    - Calendar attributes (year, month, day, quarter)
    - Business flags (weekend, payday)
    - Fiscal period support
  
  columns:
    - name: date_key
      description: "Surrogate key in YYYYMMDD format (e.g., 20250101)"
    
    - name: is_payday
      description: |
        Payday flag for Filipino businesses.
        True on 15th, 30th, and 31st of each month.
```

Generate docs:
```bash
dbt docs generate
dbt docs serve
```

---

## Troubleshooting

### Problem: "dbt: command not found"

**Solution:**
```bash
# Make sure virtual environment is activated
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Verify dbt is installed
pip list | grep dbt
```

### Problem: "Could not connect to database"

**Solution:**
```bash
# Check if warehouse is running
docker ps

# Check connection settings in profiles.yml
cat profiles.yml

# Test connection
dbt debug
```

### Problem: "Compilation Error: Model not found"

**Solution:**
```bash
# Make sure you're using ref() for models
{{ ref('stg_products') }}  # ✅ Correct
stg_products               # ❌ Wrong

# Check model name matches file name
# File: stg_products.sql → ref('stg_products')
```

### Problem: "Test failed: unique_stg_products_sku"

**Solution:**
```bash
# Find the compiled test SQL
cat target/compiled/talastock/models/staging/schema.yml/unique_stg_products_sku.sql

# Run it in pgAdmin to see duplicates
# Fix the data or model
# Re-run test
dbt test --select stg_products
```

### Problem: "Python 3.14 compatibility"

**Solution:**
```bash
# Install Python 3.12
# Download from: https://www.python.org/downloads/

# Create new virtual environment with Python 3.12
python3.12 -m venv venv
venv\Scripts\activate
pip install dbt-core dbt-postgres
```

---

## Next Steps

### 1. Integrate with Airflow

Create `airflow/dags/dbt_dag.py`:
```python
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

with DAG(
    'dbt_daily_run',
    start_date=datetime(2025, 1, 1),
    schedule_interval='0 2 * * *',  # 2 AM daily
    catchup=False
) as dag:
    
    dbt_run = BashOperator(
        task_id='dbt_run',
        bash_command='cd /path/to/dbt && dbt run'
    )
    
    dbt_test = BashOperator(
        task_id='dbt_test',
        bash_command='cd /path/to/dbt && dbt test'
    )
    
    dbt_run >> dbt_test
```

### 2. Add More Models

Ideas:
- `customer_performance.sql` - Customer-level metrics
- `payment_method_analysis.sql` - Payment method trends
- `weekend_vs_weekday.sql` - Weekend vs weekday comparison

### 3. Deploy to Production

```bash
# Run in production mode
dbt run --target prod

# Full refresh
dbt run --full-refresh

# Run specific models
dbt run --select +fact_sales+  # fact_sales and all dependencies
```

### 4. Learn More

- **Official Docs**: https://docs.getdbt.com
- **dbt Learn**: https://learn.getdbt.com (free courses)
- **Best Practices**: https://docs.getdbt.com/best-practices
- **Community**: https://community.getdbt.com

---

## Summary

**What You Learned:**
- ✅ What dbt is and why it's used
- ✅ How to install and configure dbt
- ✅ How to create and run models
- ✅ How to test data quality
- ✅ How to generate documentation
- ✅ Advanced features (incremental, macros, variables)

**What You Built:**
- ✅ 2 staging models (views)
- ✅ 3 dimension models (tables)
- ✅ 1 fact model (table)
- ✅ 3 aggregate models (tables)
- ✅ 25+ data quality tests
- ✅ Complete documentation with lineage

**You're now a dbt developer!** 🚀

---

**Time to complete**: 2-3 hours  
**Status**: ⏳ Ready to run (need Python 3.10-3.12)  
**Next**: Install Python 3.12 and run `dbt run`

