# Concepts & Tools — Deep Explanation

This document explains every tool and concept used in this project from first principles. Read this before an interview. The goal is not just to know *what* each tool does, but to understand *why* it exists and *what problem it solves* — because that is what interviewers actually test.

---

## Table of Contents

1. [ETL — The Core Pattern](#1-etl--the-core-pattern)
2. [OLTP vs OLAP — Why Two Databases?](#2-oltp-vs-olap--why-two-databases)
3. [Apache Airflow — Orchestration](#3-apache-airflow--orchestration)
4. [Data Warehouse — Three-Layer Architecture](#4-data-warehouse--three-layer-architecture)
5. [Star Schema — Data Modeling](#5-star-schema--data-modeling)
6. [dbt — Transformations as Code](#6-dbt--transformations-as-code)
7. [Data Quality Testing](#7-data-quality-testing)
8. [Forecasting — OLS Linear Regression](#8-forecasting--ols-linear-regression)
9. [Docker — Why Containers?](#9-docker--why-containers)
10. [How to Explain This in an Interview](#10-how-to-explain-this-in-an-interview)

---

## 1. ETL — The Core Pattern

### What it means

**ETL** stands for **Extract, Transform, Load**. It is the fundamental pattern of data engineering.

- **Extract** — read data from a source (CSV file, database, API, etc.)
- **Transform** — clean it, fix types, remove duplicates, apply business rules
- **Load** — write the cleaned data to a destination (data warehouse)

### Why it exists

Raw data from real systems is messy. Prices come in as strings like `"₱50.00"`. Dates are inconsistent. Records are duplicated. Column names differ between files. You cannot run analytics on this directly — you would get wrong answers.

ETL solves this by creating a **clean, reliable copy** of the data in a separate place, purpose-built for analysis.

### The alternative (and why it fails)

You could query the source database directly for analytics. Companies do this early on. It fails because:

- **Performance**: `SELECT SUM(revenue) FROM 10M rows` is slow and locks the table
- **Availability**: While the analytics query runs, the app slows down for real users
- **History**: The source database only stores current state — you lose historical trends
- **Complexity**: Analysts need to understand the app's schema, which is designed for writes, not reads

ETL separates these concerns. The app writes to one database. Analytics reads from another.

### In this project

```
data-generator/output/products.csv
data-generator/output/sales_standard.csv
        │
        │  sales_etl_pipeline (Extract + Transform)
        ▼
data-generator/processed/products_cleaned.csv
data-generator/processed/sales_cleaned.csv
        │
        │  warehouse_etl_pipeline (Load)
        ▼
PostgreSQL warehouse (raw → staging → analytics)
```

---

## 2. OLTP vs OLAP — Why Two Databases?

This is one of the most common interview topics in data engineering.

### OLTP — Online Transaction Processing

**Purpose**: Handle the day-to-day operations of an application.

**Optimised for**:
- Fast writes (INSERT, UPDATE, DELETE)
- Single-record lookups (`SELECT * WHERE id = 123`)
- Many concurrent users

**Example query**:
```sql
INSERT INTO sales (product_id, quantity, total) VALUES ('abc', 5, 250.00);
```

**Database**: PostgreSQL, MySQL, Supabase — row-oriented storage

**Users**: The application itself (staff recording sales, customers placing orders)

---

### OLAP — Online Analytical Processing

**Purpose**: Answer business questions about historical data.

**Optimised for**:
- Complex aggregations (`SUM`, `COUNT`, `AVG` across millions of rows)
- Full table scans
- Read-heavy workloads

**Example query**:
```sql
SELECT product_name, SUM(total_amount) AS revenue
FROM fact_sales
JOIN dim_products USING (product_key)
WHERE date >= '2025-01-01'
GROUP BY product_name
ORDER BY revenue DESC;
```

**Database**: PostgreSQL warehouse, BigQuery, Snowflake, Redshift — column-oriented storage

**Users**: Analysts, dashboards, reports

---

### Why you cannot use one database for both

Imagine running this on your app database:

```sql
-- This scans 10 million rows
SELECT SUM(total_amount) FROM sales WHERE date >= '2025-01-01';
```

While this query runs:
- It holds a read lock on the `sales` table
- Every INSERT from the app is blocked or slowed
- Users experience lag
- The query itself is slow because row-oriented storage is not efficient for column scans

**The solution**: Copy data from OLTP to OLAP nightly. The app never touches the warehouse. The warehouse never touches the app.

**Real-world examples**:
- Amazon: Aurora (OLTP) + Redshift (OLAP)
- Netflix: MySQL (OLTP) + Druid (OLAP)
- Uber: PostgreSQL (OLTP) + Hive (OLAP)

**In this project**: The data generator simulates the OLTP source. The PostgreSQL warehouse is the OLAP layer.

---

## 3. Apache Airflow — Orchestration

### What it is

Apache Airflow is a **workflow orchestration platform**. It schedules, monitors, and manages data pipelines. Created by Airbnb in 2014, now used by Spotify, Netflix, Uber, and thousands of other companies.

### The problem it solves

Before Airflow, teams used cron jobs:

```bash
# Run ETL every night at 2 AM
0 2 * * * python etl.py
```

This breaks in production because:
- **No retry logic** — if it fails at 2 AM, you find out at 9 AM
- **No dependencies** — you cannot say "run task B only after task A succeeds"
- **No visibility** — you cannot see what ran, what failed, or how long it took
- **No parallelism** — tasks run sequentially even when they could run at the same time
- **No alerting** — no email when something breaks

Airflow solves all of these.

### Core concepts

#### DAG (Directed Acyclic Graph)

A DAG is your entire pipeline defined as a Python file. "Directed" means tasks flow in one direction. "Acyclic" means no loops — you cannot go back.

```python
dag = DAG(
    'sales_etl_pipeline',
    schedule_interval='@daily',   # run every day at midnight
    start_date=datetime(2026, 1, 1),
    catchup=False,
)
```

#### Task

A single unit of work. Each task does one thing.

```python
extract_task = PythonOperator(
    task_id='extract_sales',
    python_callable=extract_sales_function,
    dag=dag,
)
```

#### Operator

The *type* of task. Common operators:

| Operator | What it runs |
|---|---|
| `PythonOperator` | A Python function |
| `BashOperator` | A shell command |
| `TriggerDagRunOperator` | Another DAG |
| `PostgresOperator` | A SQL query |

#### Task dependencies

```python
# Sequential: A then B then C
task_a >> task_b >> task_c

# Parallel: B and C run at the same time after A
task_a >> [task_b, task_c]

# Fan-in: D waits for both B and C
[task_b, task_c] >> task_d
```

#### Why parallelism matters

In `sales_etl_pipeline`, extracting products and extracting sales are independent. Running them in parallel cuts the pipeline time roughly in half:

```
Sequential:  extract_products (30s) → extract_sales (30s) = 60s total
Parallel:    extract_products (30s)
             extract_sales    (30s)  = 30s total
```

#### Idempotency

A critical concept. An idempotent pipeline produces the same result no matter how many times you run it. This matters because pipelines fail and need to be re-run.

**Not idempotent** (bad):
```python
# Running twice creates duplicates
db.execute("INSERT INTO sales VALUES (...)")
```

**Idempotent** (good):
```python
# Running twice produces the same result
db.execute("TRUNCATE TABLE raw.sales")
db.execute("INSERT INTO raw.sales VALUES (...)")
```

All pipelines in this project use `TRUNCATE` before inserting — they are fully idempotent.

### In this project

Five DAGs, chained automatically:

```
data_generator_pipeline
        ↓ triggers
sales_etl_pipeline
        ↓ triggers
warehouse_etl_pipeline
        ↓ triggers
dbt_pipeline
        ↓ triggers
forecasting_pipeline
```

Triggering the first one runs the entire platform end-to-end.

---

## 4. Data Warehouse — Three-Layer Architecture

### What a data warehouse is

A data warehouse is a database designed specifically for analytics. It stores historical data, is optimised for read-heavy queries, and is completely separate from the application database.

### The three-layer architecture

This is the industry standard pattern. Every serious data team uses it.

```
raw.*          ← exact copy of source, never modified
staging.*      ← cleaned and standardised
analytics.*    ← business-ready models
```

#### Raw layer

**Purpose**: Store an exact, unmodified copy of the source data.

**Why it exists**: If your transformation logic has a bug, you can re-run it against the raw data without going back to the source. It is your audit trail.

**Rule**: Never modify raw data. Never add business logic here. Just copy.

```sql
-- raw.sales has the exact same columns as the CSV
-- including the messy ones: "₱50.00", "fifty", NaN
CREATE TABLE raw.sales (
    transaction_id VARCHAR(100),
    unit_price     NUMERIC(10,2),  -- might be NaN
    loaded_at      TIMESTAMP,      -- when we loaded it
    source_file    VARCHAR(255),   -- which file it came from
    load_id        VARCHAR(100)    -- which pipeline run
);
```

#### Staging layer

**Purpose**: Clean and standardise the raw data. Apply business rules.

**What happens here**:
- Remove duplicates (`DISTINCT ON (transaction_id)`)
- Filter invalid rows (negative quantities, NaN prices)
- Standardise column names
- Extract derived fields (year, month, hour from timestamp)
- Calculate profit margin

**Rule**: No aggregations here. One row in staging = one row in raw (minus the bad ones).

#### Analytics layer

**Purpose**: Business-ready models optimised for the questions analysts actually ask.

**What lives here**:
- Dimension tables (products, dates, times)
- Fact table (sales transactions)
- Aggregate tables (pre-calculated metrics)
- Forecast tables

**Rule**: This is what the dashboard queries. It must always be clean and fast.

---

## 5. Star Schema — Data Modeling

### What it is

Star schema is the standard way to model data in a warehouse. It has one central **fact table** surrounded by **dimension tables**. When you draw it, it looks like a star.

```
         dim_products
              │
dim_dates ── fact_sales ── dim_times
```

### Fact table

Stores **measurable events** — things that happened. Each row is one transaction.

```sql
fact_sales:
  sale_key        -- surrogate key (auto-generated integer)
  transaction_id  -- natural key (from source system)
  product_key     -- FK to dim_products
  date_key        -- FK to dim_dates
  time_key        -- FK to dim_times
  quantity        -- measure (additive)
  unit_price      -- measure (additive)
  total_amount    -- measure (additive)
  cost            -- measure (additive)
  profit          -- measure (additive)
```

**Additive measures** are values you can `SUM` across any dimension. Revenue is additive — you can sum it by product, by date, by category, or all three at once.

### Dimension tables

Store **descriptive attributes** — the context around the event.

```sql
dim_products:
  product_key     -- surrogate key
  sku             -- natural key
  name
  category
  brand
  price
  cost_price
  profit_margin

dim_dates:
  date_key        -- YYYYMMDD integer (e.g. 20260515)
  date
  year, month, day, quarter, week
  day_of_week_name
  is_weekend      -- boolean flag
  is_payday       -- boolean flag (15th, 30th, 31st)

dim_times:
  time_key        -- HHMM integer
  hour, minute
  time_period     -- Morning / Afternoon / Evening / Night
  is_peak_hour    -- boolean flag
```

### Surrogate keys vs natural keys

**Natural key**: The ID from the source system (e.g. `SKU-001`, `TXN-20260515-001`). These can change, be reused, or be inconsistent across systems.

**Surrogate key**: An auto-generated integer (`1, 2, 3...`) that is stable and consistent within the warehouse. Always use surrogate keys in fact tables.

### Why star schema instead of one big table?

You could denormalise everything into one table:

```sql
-- One big flat table
SELECT product_name, category, date, is_weekend, quantity, revenue
FROM sales_flat;
```

This seems simpler but fails at scale:
- **Storage**: Product name is repeated in every row (millions of times)
- **Updates**: If a product name changes, you update millions of rows
- **Query performance**: Aggregations on a wide table are slower than joins on a narrow fact table
- **Flexibility**: Adding a new dimension attribute requires altering a massive table

Star schema solves all of these. The fact table is narrow (just keys and measures). Dimensions are small and fast to join.

### How to query a star schema

```sql
-- Revenue by category for weekends only
SELECT
    p.category,
    SUM(f.total_amount) AS revenue
FROM analytics.fact_sales f
JOIN analytics.dim_products p ON f.product_key = p.product_key
JOIN analytics.dim_dates    d ON f.date_key    = d.date_key
WHERE d.is_weekend = true
GROUP BY p.category
ORDER BY revenue DESC;
```

This query is fast because:
- `fact_sales` is narrow — only keys and numbers
- `dim_products` and `dim_dates` are small — easy to join
- The `WHERE` filter on `dim_dates` eliminates most rows early

---

## 6. dbt — Transformations as Code

### What it is

dbt (data build tool) is a framework for writing SQL transformations. You write `SELECT` statements, and dbt turns them into tables or views in your warehouse. It handles dependencies, testing, and documentation automatically.

Used by Airbnb, GitLab, Spotify, Shopify, and 10,000+ other companies.

### The problem it solves

Before dbt, SQL transformations lived inside Airflow tasks:

```python
# Airflow task — SQL buried in Python
def build_fact_sales():
    conn.execute("""
        INSERT INTO analytics.fact_sales
        SELECT s.transaction_id, p.product_key, ...
        FROM staging.sales s
        JOIN staging.products p ON s.product_sku = p.sku
    """)
```

Problems with this approach:
- SQL is scattered across Python files — hard to find and maintain
- No version control for the SQL logic itself
- No automated tests — bad data silently reaches the dashboard
- No documentation — new team members don't know what each table means
- No lineage — you cannot see which tables depend on which

dbt fixes all of this.

### How dbt works

You write a SQL `SELECT` statement in a `.sql` file:

```sql
-- models/marts/facts/fact_sales.sql
SELECT
    s.transaction_id,
    p.product_key,
    d.date_key,
    t.time_key,
    s.quantity,
    s.unit_price,
    s.total_amount,
    s.quantity * p.cost_price AS cost,
    s.total_amount - (s.quantity * p.cost_price) AS profit
FROM {{ ref('stg_sales') }} s
JOIN {{ ref('dim_products') }} p ON s.product_sku = p.sku
JOIN {{ ref('dim_dates') }}    d ON s.sale_date   = d.date
JOIN {{ ref('dim_times') }}    t ON ...
```

dbt reads this file and runs:
```sql
CREATE TABLE analytics.fact_sales AS (
    SELECT ...
)
```

### The `ref()` function

`{{ ref('stg_sales') }}` is Jinja templating. dbt replaces it with the actual table name at runtime. More importantly, it tells dbt that `fact_sales` **depends on** `stg_sales`. dbt builds a dependency graph and runs models in the correct order automatically.

You never have to manually specify "run staging before marts" — dbt figures it out.

### Materialisation

How dbt creates the model in the database:

| Materialisation | What it creates | When to use |
|---|---|---|
| `view` | A SQL view (no data stored) | Staging models — fast to build, always fresh |
| `table` | A physical table (data stored) | Marts and aggregates — fast to query |
| `incremental` | Appends only new rows | Large fact tables — efficient for daily loads |

In this project:
- Staging models → `view` (lightweight, always reflects latest raw data)
- Dimension and fact tables → `table` (fast for dashboard queries)
- Aggregate tables → `table` (pre-calculated, instant dashboard loads)

### dbt tests

Tests are defined in `schema.yml` files alongside the models:

```yaml
models:
  - name: fact_sales
    columns:
      - name: transaction_id
        tests:
          - unique      # no duplicate transaction IDs
          - not_null    # every row must have a transaction ID
      - name: product_key
        tests:
          - not_null
          - relationships:  # every product_key must exist in dim_products
              to: ref('dim_products')
              field: product_key
      - name: payment_method
        tests:
          - accepted_values:  # only these values are allowed
              values: ['Cash', 'GCash', 'Card']
```

dbt compiles each test into a SQL query that returns failing rows. If any rows are returned, the test fails and the pipeline stops. This means bad data never reaches the dashboard.

This project has **104 tests** across 9 models.

### dbt documentation

Running `dbt docs generate` creates an interactive website showing:
- Every model with its description and column definitions
- A visual **lineage graph** showing how data flows from source to aggregate
- Test results

This is what makes dbt a professional tool — the documentation is generated from the code itself, so it is always up to date.

---

## 7. Data Quality Testing

### Why it matters

Bad data is worse than no data. If your dashboard shows revenue dropped 50%, you need to know: is it a real business problem, or did the ETL break?

Without data quality tests, you find out from a user complaint. With tests, the pipeline fails loudly before bad data reaches anyone.

### Types of tests in this project

| Test | What it checks | Example |
|---|---|---|
| `unique` | No duplicate values | `transaction_id` must be unique |
| `not_null` | No NULL values | `total_amount` cannot be NULL |
| `accepted_values` | Only allowed values | `payment_method` must be Cash, GCash, or Card |
| `relationships` | Foreign key integrity | Every `product_key` in `fact_sales` must exist in `dim_products` |

### The NaN problem in this project

The data generator intentionally introduces ~5% wrong data types to simulate real-world messiness. For example, `unit_price` might be stored as the string `"₱50.00"` or even `"fifty"`.

When Pandas tries to convert these to numbers:
- `"₱50.00"` → `50.0` ✅ (after stripping the ₱ symbol)
- `"fifty"` → `NaN` ❌ (cannot convert text to number)

`NaN` (Not a Number) is toxic in analytics. `SUM(NaN) = NaN`. One bad row contaminates the entire aggregate.

**The solution**: Filter NaN at the analytics layer, preserve it in raw and staging for audit.

```sql
-- In build_fact_sales()
WHERE s.unit_price IS NOT NULL
  AND s.unit_price != 'NaN'::numeric
  AND s.total_amount IS NOT NULL
  AND s.total_amount != 'NaN'::numeric
```

Result: raw layer has ~1.4% NaN rows. Analytics layer has 0.

---

## 8. Forecasting — OLS Linear Regression

### What it does

The `forecasting_pipeline` predicts revenue for the next 30 days, broken down by product category. It uses a simple but explainable model: **Ordinary Least Squares (OLS) linear regression**.

### Why OLS instead of Prophet or a neural network?

Three reasons:

1. **No dependencies** — OLS is implemented with NumPy, which is already in the Airflow container. Prophet requires a 500MB install.
2. **Explainability** — you can explain OLS in one equation. Neural networks are black boxes.
3. **Sufficient accuracy** — for a 30-day revenue forecast on a small dataset, a linear trend with business multipliers performs comparably to more complex models.

### How OLS works

Given historical daily revenue `y` over days `x = [0, 1, 2, ..., n]`, find the line `y = slope × x + intercept` that minimises the sum of squared errors.

```python
x = np.arange(len(revenues))
y = np.array(revenues)

x_mean = x.mean()
y_mean = y.mean()

slope     = np.sum((x - x_mean) * (y - y_mean)) / np.sum((x - x_mean) ** 2)
intercept = y_mean - slope * x_mean
```

This is the closed-form solution to linear regression — no iteration, no gradient descent, just algebra.

### Business multipliers

The linear trend gives a baseline. We then multiply by known business patterns:

```python
multiplier = 1.0

if forecast_date.weekday() >= 5:   # Saturday or Sunday
    multiplier *= 1.20              # +20% on weekends

if forecast_date.day in (15, 30, 31):  # payday dates
    multiplier *= 1.50                  # +50% on payday
```

These multipliers come from the data generator's configuration — the same patterns that were used to generate the training data.

### Prediction interval

A point estimate alone is not useful. We also compute an 80% confidence interval using the residual standard deviation:

```python
residuals    = y - (slope * x + intercept)
residual_std = residuals.std()

# 80% CI: z = 1.282
margin = 1.282 * residual_std * multiplier
lower  = max(predicted - margin, 0)
upper  = predicted + margin
```

This tells you: "we are 80% confident the actual revenue will fall between `lower` and `upper`."

### Accuracy metrics

| Metric | Formula | What it means |
|---|---|---|
| MAPE | `mean(|actual - predicted| / actual) × 100` | Average % error. < 10% = excellent, 10–20% = good |
| RMSE | `sqrt(mean((actual - predicted)²))` | Error in ₱. Lower is better. |

---

## 9. Docker — Why Containers?

### What Docker does

Docker packages an application and all its dependencies into a **container** — a lightweight, isolated environment that runs the same way on any machine.

### The problem it solves

Without Docker:
- "It works on my machine" — different Python versions, different library versions, different OS
- Setting up Airflow locally requires installing PostgreSQL, Redis, Python, and dozens of packages
- Sharing the project with a classmate means they spend hours on setup

With Docker:
- One command starts the entire stack: `docker-compose up -d`
- Every developer gets the exact same environment
- The project runs identically on Windows, Mac, and Linux

### docker-compose

`docker-compose.yml` defines multiple containers and how they connect:

```yaml
services:
  airflow-webserver:    # the Airflow UI
  airflow-scheduler:    # the task runner
  postgres:             # Airflow's metadata database
```

All containers share a Docker network, so they can talk to each other using container names as hostnames. That is why the warehouse connection uses `host: talastock-warehouse` instead of `localhost`.

### In this project

Two docker-compose stacks:

| Stack | Services | Port |
|---|---|---|
| `warehouse/docker-compose.yml` | PostgreSQL + pgAdmin | 5433, 5050 |
| `airflow/docker-compose.yml` | Airflow webserver + scheduler + Postgres | 8080 |

---

## 10. How to Explain This in an Interview

### The 60-second summary

> "I built an end-to-end data platform for a Filipino retail business. The core is a five-stage Airflow pipeline: a data generator creates realistic synthetic sales data, a sales ETL cleans it, a warehouse ETL loads it into a PostgreSQL data warehouse with a three-layer architecture — raw, staging, and analytics. The analytics layer is a star schema with a fact table for sales and dimension tables for products, dates, and times. dbt handles all the SQL transformations and runs 104 automated data quality tests on every run. On top of that, a forecasting pipeline trains a linear regression model per product category and generates 30-day revenue predictions. Everything is visible through a Next.js dashboard with pipeline controls, a data quality observability page, and a forecast chart."

### Common interview questions and how to answer them

**"What is ETL and why do you need it?"**

> "ETL stands for Extract, Transform, Load. You need it because raw data from source systems is messy — wrong types, duplicates, missing values. And you cannot run heavy analytics queries on your production database without slowing down the app. ETL creates a clean, separate copy of the data in a warehouse that is optimised for analytics."

**"What is the difference between OLTP and OLAP?"**

> "OLTP is your application database — optimised for fast writes and single-record lookups. OLAP is your analytics database — optimised for complex aggregations across millions of rows. You separate them so analytics queries don't slow down the app, and so you can store historical data that the app doesn't need."

**"Why use Airflow instead of cron?"**

> "Cron has no retry logic, no dependency management, and no visibility. If a cron job fails at 2 AM, you find out at 9 AM when someone notices the dashboard is wrong. Airflow retries automatically, manages task dependencies — so task B only runs after task A succeeds — and gives you a web UI where you can see every run, every log, and every failure in real time."

**"What is a star schema?"**

> "A star schema has one central fact table surrounded by dimension tables. The fact table stores measurable events — in our case, sales transactions — with foreign keys to the dimensions. The dimension tables store descriptive attributes — products, dates, times. This design is optimised for aggregation queries because the fact table is narrow and the dimensions are small and fast to join."

**"What is dbt and why use it?"**

> "dbt is a transformation framework where you write SQL SELECT statements and dbt turns them into tables in your warehouse. The key benefits are: your SQL is version-controlled in Git, you get automated data quality tests that run on every pipeline execution, and dbt generates documentation with a visual lineage graph showing how data flows from source to dashboard. It treats data transformations like software — with testing and documentation built in."

**"What is idempotency and why does it matter in ETL?"**

> "An idempotent pipeline produces the same result no matter how many times you run it. This matters because pipelines fail and need to be re-run. If your pipeline appends data on every run, running it twice creates duplicates. Our pipelines use TRUNCATE before INSERT, so re-running always produces a clean, correct result."

**"How does your forecasting model work?"**

> "We use Ordinary Least Squares linear regression — fitting a trend line to the last 90 days of daily revenue per category. On top of the trend, we apply business multipliers: 20% boost on weekends and 50% boost on payday dates, which are the 15th and 30th of each month. We compute an 80% prediction interval from the residual standard deviation. We chose OLS over Prophet because it has no external dependencies, runs inside the existing Airflow container, and is fully explainable — you can describe the entire model in one equation."

**"How do you handle data quality?"**

> "At three levels. First, the sales ETL pipeline filters out invalid rows — negative quantities, zero prices, unparseable dates. Second, the warehouse ETL filters NaN values before loading the fact table, so the analytics layer always has zero NaN. Third, dbt runs 104 automated tests on every pipeline run — uniqueness, not-null, accepted values, and foreign key integrity. If any test fails, the pipeline stops and the bad data never reaches the dashboard."

---

## Key Takeaways

The most important thing to understand is **why each layer exists**:

| Layer | Why it exists |
|---|---|
| Data generator | Simulates a real source system with realistic, messy data |
| Sales ETL | Cleans the mess before it enters the warehouse |
| Raw layer | Audit trail — never lose the original data |
| Staging layer | Business rules applied — clean but not yet modelled |
| Analytics layer | Optimised for the questions analysts actually ask |
| dbt | Treats SQL like software — tested, documented, version-controlled |
| Forecasting | Turns historical patterns into actionable predictions |
| Dashboard | Makes all of this visible to non-technical users |

Every tool in this stack exists because someone ran into a real problem — slow queries, broken pipelines, untested transformations, undocumented data — and built a solution. Understanding the problem each tool solves is what makes you credible in an interview.
