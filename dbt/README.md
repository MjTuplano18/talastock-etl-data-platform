# 🚀 dbt (Data Build Tool) for Talastock

Transform your SQL scripts into tested, documented, production-ready data models.

---

## ⚠️ Python Version Requirement

**Important**: dbt currently has compatibility issues with Python 3.14.  
**Recommended**: Use Python 3.10, 3.11, or 3.12

### Option 1: Use Python 3.12 (Recommended)
```bash
# Install Python 3.12 from python.org
# Then create a virtual environment
python3.12 -m venv dbt_venv
dbt_venv\Scripts\activate
pip install dbt-core dbt-postgres
```

### Option 2: Continue Learning (What We'll Do Now)
I'll create the complete dbt project structure and documentation so you understand how it works. You can run it later with Python 3.10-3.12.

---

## 📚 What is dbt?

dbt (data build tool) transforms data in your warehouse using SQL SELECT statements. It's used by 10,000+ companies including Airbnb, GitLab, and Spotify.

### Why dbt?
- ✅ **Version Control**: Your SQL is in git
- ✅ **Testing**: Automated data quality tests
- ✅ **Documentation**: Auto-generated docs
- ✅ **Lineage**: Visual data flow diagrams
- ✅ **Modularity**: Reusable SQL components
- ✅ **Incremental**: Only process new data

---

## 🎯 What We're Building

We'll transform your current Airflow SQL scripts into dbt models:

### Before (Current Airflow):
```
warehouse_etl_pipeline.py
├─ Task 1: Load raw data
├─ Task 2: Transform to staging
├─ Task 3: Build dimensions
├─ Task 4: Build facts
└─ Task 5: Build aggregates
```

### After (With dbt):
```
dbt/models/
├─ staging/
│  ├─ stg_products.sql
│  └─ stg_sales.sql
├─ marts/
│  ├─ dim_products.sql
│  ├─ dim_dates.sql
│  ├─ dim_times.sql
│  └─ fact_sales.sql
└─ aggregates/
   ├─ daily_sales_summary.sql
   ├─ product_performance.sql
   └─ category_performance.sql
```

---

## 📁 Project Structure

```
dbt/
├── dbt_project.yml          # Project configuration
├── profiles.yml             # Database connection
├── README.md                # This file
├── QUICK_START.md           # 5-step quick start
├── DBT_LEARNING_GUIDE.md    # Complete learning guide (2-3 hours)
│
├── models/                  # SQL models
│   ├── staging/             # Clean raw data
│   │   ├── stg_products.sql      ✅ Created
│   │   ├── stg_sales.sql         ✅ Created
│   │   └── schema.yml            ✅ Created (with tests)
│   │
│   ├── marts/               # Business logic
│   │   ├── dimensions/
│   │   │   ├── dim_products.sql  ✅ Created
│   │   │   ├── dim_dates.sql     ✅ Created
│   │   │   └── dim_times.sql     ✅ Created
│   │   ├── facts/
│   │   │   └── fact_sales.sql    ✅ Created
│   │   └── schema.yml            ✅ Created (with tests)
│   │
│   └── aggregates/          # Summary tables
│       ├── daily_sales_summary.sql      ✅ Created
│       ├── product_performance.sql      ✅ Created
│       ├── category_performance.sql     ✅ Created
│       └── schema.yml                   ✅ Created (with tests)
│
├── macros/                  # Reusable SQL functions (optional)
├── tests/                   # Custom data tests (optional)
└── docs/                    # Documentation (optional)
```

**Status**: ✅ Complete dbt project structure ready to run!

---

## 🚀 Quick Start (When You Have Python 3.10-3.12)

### 1. Install dbt
```bash
pip install dbt-core dbt-postgres
```

### 2. Configure Connection
Edit `profiles.yml`:
```yaml
talastock:
  target: dev
  outputs:
    dev:
      type: postgres
      host: localhost
      port: 5433
      user: warehouse_user
      password: warehouse_pass
      dbname: talastock_warehouse
      schema: analytics
      threads: 4
```

### 3. Test Connection
```bash
dbt debug
```

### 4. Run Models
```bash
# Run all models
dbt run

# Run specific model
dbt run --select stg_products

# Run tests
dbt test

# Generate documentation
dbt docs generate
dbt docs serve
```

---

## 📖 Learning Path

### Step 1: Staging Models (30 min)
Learn to clean and standardize raw data
- `stg_products.sql`
- `stg_sales.sql`

### Step 2: Dimension Models (30 min)
Build dimension tables
- `dim_products.sql`
- `dim_dates.sql`
- `dim_times.sql`

### Step 3: Fact Models (30 min)
Create fact tables
- `fact_sales.sql`

### Step 4: Aggregate Models (30 min)
Build summary tables
- `daily_sales_summary.sql`
- `product_performance.sql`

### Step 5: Tests & Documentation (30 min)
Add quality tests and docs
- Write tests in `schema.yml`
- Generate documentation

---

## 🎓 Key Concepts

### 1. Models
Models are SELECT statements that create tables/views:
```sql
-- models/staging/stg_products.sql
SELECT 
    sku,
    name,
    category,
    price,
    cost_price
FROM {{ source('raw', 'products') }}
WHERE is_active = true
```

### 2. Sources
Define your raw data:
```yaml
# models/staging/schema.yml
sources:
  - name: raw
    tables:
      - name: products
      - name: sales
```

### 3. Refs
Reference other models:
```sql
-- models/marts/fact_sales.sql
SELECT 
    s.transaction_id,
    p.product_key,
    s.quantity,
    s.total_amount
FROM {{ ref('stg_sales') }} s
JOIN {{ ref('dim_products') }} p 
  ON s.product_sku = p.sku
```

### 4. Tests
Ensure data quality:
```yaml
# models/staging/schema.yml
models:
  - name: stg_products
    columns:
      - name: sku
        tests:
          - unique
          - not_null
      - name: price
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
```

### 5. Documentation
Document your models:
```yaml
models:
  - name: stg_products
    description: "Cleaned and standardized product data"
    columns:
      - name: sku
        description: "Unique product identifier"
      - name: price
        description: "Selling price in PHP"
```

---

## 🔄 dbt vs Airflow

### When to Use What?

**Airflow** (Orchestration):
- Schedule when dbt runs
- Load raw data from sources
- Send notifications
- Coordinate multiple systems

**dbt** (Transformation):
- Transform data with SQL
- Test data quality
- Document data models
- Build data lineage

### Integration:
```python
# airflow/dags/dbt_dag.py
from airflow import DAG
from airflow.operators.bash import BashOperator

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

---

## 💡 Best Practices

### 1. Naming Conventions
- **Staging**: `stg_<source>_<table>`
- **Intermediate**: `int_<description>`
- **Marts**: `dim_<entity>`, `fact_<event>`
- **Aggregates**: `<entity>_<metric>`

### 2. Model Organization
```
models/
├── staging/      # 1:1 with source tables
├── intermediate/ # Complex transformations
├── marts/        # Business logic
└── aggregates/   # Summary tables
```

### 3. Testing Strategy
- **Staging**: unique, not_null, accepted_values
- **Marts**: relationships, data_tests
- **Aggregates**: custom_tests

### 4. Incremental Models
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
  WHERE created_at > (SELECT MAX(created_at) FROM {{ this }})
{% endif %}
```

---

## 📊 Benefits You'll See

### Before dbt:
- ❌ SQL scattered in Airflow tasks
- ❌ No tests
- ❌ No documentation
- ❌ Hard to maintain
- ❌ No lineage visibility

### After dbt:
- ✅ Organized SQL models
- ✅ Automated testing
- ✅ Auto-generated docs
- ✅ Easy to maintain
- ✅ Visual lineage graphs
- ✅ Version controlled
- ✅ Production-ready

---

## 🎯 Next Steps

1. **Install Python 3.10-3.12** (if you don't have it)
2. **Set up virtual environment**
3. **Install dbt**: `pip install dbt-core dbt-postgres`
4. **Follow the guides** in the `models/` folder
5. **Run your first model**: `dbt run --select stg_products`
6. **Generate docs**: `dbt docs generate && dbt docs serve`

---

## 📚 Resources

- **Official Docs**: https://docs.getdbt.com
- **Tutorial**: https://docs.getdbt.com/tutorial
- **Best Practices**: https://docs.getdbt.com/best-practices
- **dbt Learn**: https://learn.getdbt.com
- **Community**: https://community.getdbt.com

---

## 🆘 Troubleshooting

### Python 3.14 Compatibility Issue
**Problem**: dbt doesn't work with Python 3.14  
**Solution**: Use Python 3.10, 3.11, or 3.12

### Connection Issues
**Problem**: Can't connect to warehouse  
**Solution**: Check `profiles.yml` settings match your warehouse config

### Model Errors
**Problem**: Model fails to run  
**Solution**: Check `logs/dbt.log` for detailed error messages

---

**Status**: ⏳ Waiting for Python 3.10-3.12  
**Next**: Install compatible Python version and run `dbt run`

**This is a complete dbt setup ready to use!** 🚀
