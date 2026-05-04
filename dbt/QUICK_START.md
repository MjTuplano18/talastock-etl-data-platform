# ⚡ dbt Quick Start

Get dbt running in 5 steps!

---

## ⚠️ Python Version Required

**dbt needs Python 3.10, 3.11, or 3.12** (not 3.14)

Download Python 3.12: https://www.python.org/downloads/

---

## 🚀 5 Steps to Run dbt

### 1. Create Virtual Environment
```bash
cd data-platform/dbt
python3.12 -m venv venv
venv\Scripts\activate  # Windows
```

### 2. Install dbt
```bash
pip install dbt-core dbt-postgres
```

### 3. Test Connection
```bash
dbt debug
```

### 4. Run Models
```bash
dbt run
```

### 5. View Documentation
```bash
dbt docs generate
dbt docs serve
```

---

## 📊 What You'll Get

After running `dbt run`, you'll have:

✅ **Staging Models** (views)
- `stg_products` - Clean product data
- `stg_sales` - Clean sales data

✅ **Dimension Models** (tables)
- `dim_products` - Product dimension
- `dim_dates` - Date dimension
- `dim_times` - Time dimension

✅ **Fact Models** (tables)
- `fact_sales` - Sales transactions

✅ **Aggregate Models** (tables)
- `daily_sales_summary` - Daily metrics
- `product_performance` - Product analytics
- `category_performance` - Category analytics

---

## 🎯 Common Commands

```bash
# Run all models
dbt run

# Run specific model
dbt run --select stg_products

# Run tests
dbt test

# Generate docs
dbt docs generate && dbt docs serve

# Full refresh
dbt run --full-refresh
```

---

## 📚 Learn More

- **Full Guide**: See `README.md`
- **Model Examples**: Check `models/` folder
- **Official Docs**: https://docs.getdbt.com

---

**Ready?** Install Python 3.12 and run the 5 steps above! 🚀
