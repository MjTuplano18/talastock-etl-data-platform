# 📊 Talastock Data Platform

A complete data engineering platform for learning ETL, data warehousing, and analytics.

**📁 New to this project?** Check [FILE_STRUCTURE.md](FILE_STRUCTURE.md) for navigation guide.

---

## 🎯 What You've Built

### ✅ Phase 1: Data Generation
- 10,000 realistic sales transactions
- 100 Filipino products
- Multiple export formats (CSV, Excel, JSON, TSV)
- Intentional data quality issues for testing

### ✅ Phase 2: Apache Airflow
- Automated ETL pipeline
- Docker-based setup
- Sales and warehouse DAGs
- Scheduled data processing

### ✅ Phase 3: Data Warehouse
- PostgreSQL warehouse with star schema
- 3-layer architecture (raw, staging, analytics)
- 11 tables with proper relationships
- pgAdmin for visual management
- Automatic NaN filtering

---

## 📁 Project Structure

```
data-platform/
├── README.md                # ⭐ Project overview (start here)
│
├── docs/                    # 📚 All documentation
│   ├── 01_QUICK_START.md
│   ├── 02_YOUR_NEXT_STEPS.md
│   ├── 03_DATA_QUALITY_REPORT.md
│   ├── 04_SUMMARY_ALL_IMPROVEMENTS.md
│   ├── 05_SCAN_RESULTS_SUMMARY.md
│   ├── 06_TROUBLESHOOTING.md
│   └── 07_CLEANUP_SUMMARY.md
│
├── scripts/                 # 🐍 Python utility scripts
│   ├── scan_nan_values.py
│   ├── check_data_quality.py
│   ├── add_data_quality_monitoring.py
│   └── complete_manual_load.py
│
├── data-generator/          # 🎲 Generate realistic sales data
│   ├── generators/          # Data generation logic
│   ├── exporters/           # Export to various formats
│   ├── output/              # Generated data files
│   └── processed/           # Cleaned data files
│
├── airflow/                 # ⚙️ Apache Airflow ETL
│   ├── dags/                # ETL pipeline definitions
│   ├── docker-compose.yml   # Airflow setup
│   └── start-airflow.ps1    # Windows startup script
│
└── warehouse/               # 🏢 PostgreSQL Data Warehouse
    ├── schema/              # Database schema definitions
    ├── sql/                 # SQL queries for exploration
    ├── docker-compose.yml   # Warehouse setup
    └── PGADMIN_SETUP.md     # pgAdmin configuration
```

---

## 🚀 Quick Start

### 1. Start the Warehouse
```bash
cd data-platform/warehouse
docker-compose up -d
```

### 2. Start Airflow
```bash
cd data-platform/airflow
.\start-airflow.ps1
```

### 3. Access the Tools
- **Airflow UI**: http://localhost:8080 (admin/admin)
- **pgAdmin**: http://localhost:5050 (admin@talastock.com/admin)
- **Warehouse**: localhost:5433 (warehouse_user/warehouse_pass)

### 4. Run the ETL Pipeline
1. Open Airflow UI
2. Enable `warehouse_etl_pipeline` DAG
3. Trigger the DAG manually
4. Wait for completion (~2-3 minutes)

### 5. Explore Your Data
1. Open pgAdmin
2. Connect to `talastock_warehouse`
3. Open Query Tool
4. Run queries from `warehouse/sql/01_quick_queries.sql`

---

## 📊 Data Warehouse Architecture

### 3-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RAW LAYER (raw.*)                         │
│  Purpose: Store everything from source files                 │
│  Tables: products, sales                                     │
│  Rows: 100 products, 9,833 sales (includes 137 NaN)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  STAGING LAYER (staging.*)                   │
│  Purpose: Clean and transform data                           │
│  Tables: products, sales                                     │
│  Rows: 100 products, 9,833 sales (includes 137 NaN)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 ANALYTICS LAYER (analytics.*)                │
│  Purpose: Clean, validated data for analysis                 │
│  Tables:                                                     │
│    - dim_products (100 products)                             │
│    - dim_dates (206 dates)                                   │
│    - dim_times (24 hours)                                    │
│    - fact_sales (9,696 clean transactions)                   │
│    - daily_sales_summary (192 days)                          │
│    - product_performance (100 products)                      │
│    - category_performance (5 categories)                     │
│  NaN Values: 0 (automatically filtered)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Key Metrics

| Metric | Value |
|--------|-------|
| Total Revenue | ₱956,608.59 |
| Total Profit | ₱226,311 |
| Profit Margin | 23.73% |
| Clean Transactions | 9,696 |
| Data Completeness | 98.6% |
| Days of Data | 192 days |

---

## 🔍 Data Quality

### Current Status: ✅ Production-Ready

- **Analytics Layer**: 0 NaN values (perfect!)
- **Automatic Filtering**: NaN filtered on every pipeline run
- **Data Completeness**: 98.6% (exceeds 95% industry standard)
- **Quality Monitoring**: Automated checks in place

### NaN Values Explained

- **137 NaN transactions** exist in raw/staging layers (1.4%)
- **Source**: Intentionally added by data generator for testing
- **Impact**: None on analytics (automatically filtered)
- **Status**: Expected and documented

---

## 🛠️ Available Tools

### Python Scripts (in `scripts/` folder)

| Script | Purpose |
|--------|---------|
| `scan_nan_values.py` | Scan all tables for NaN values |
| `check_data_quality.py` | Run quality checks |
| `add_data_quality_monitoring.py` | Add quality monitoring to pipeline |
| `complete_manual_load.py` | Run ETL manually (without Airflow) |

**How to use**:
```bash
cd data-platform/scripts
python scan_nan_values.py
```

### SQL Queries

| File | Purpose |
|------|---------|
| `warehouse/sql/01_quick_queries.sql` | 15 queries to explore data |
| `warehouse/sql/02_data_quality_check.sql` | Validate data integrity |

---

## 📚 Documentation

### Getting Started
- **docs/01_QUICK_START.md** - Complete setup guide
- **docs/02_YOUR_NEXT_STEPS.md** - What to do next (dbt, dashboard, ML)
- **warehouse/sql/README.md** - SQL queries guide

### Technical Details
- **docs/03_DATA_QUALITY_REPORT.md** - NaN investigation and findings
- **docs/04_SUMMARY_ALL_IMPROVEMENTS.md** - What we accomplished
- **docs/05_SCAN_RESULTS_SUMMARY.md** - Latest data quality scan
- **docs/06_TROUBLESHOOTING.md** - Common issues and solutions
- **docs/07_CLEANUP_SUMMARY.md** - File organization changes

### Component Guides
- **airflow/AIRFLOW_LEARNING_GUIDE.md** - Learn Apache Airflow
- **warehouse/PGADMIN_SETUP.md** - pgAdmin configuration
- **warehouse/README.md** - Warehouse architecture

---

## 🎯 What's Next?

### Option 1: Explore Your Data (30-60 min) ⭐ RECOMMENDED
- Run queries from `warehouse/sql/01_quick_queries.sql`
- Discover business insights
- Understand data patterns

### Option 2: Build dbt (2-3 hours)
- Transform SQL into reusable models
- Add data quality tests
- Generate documentation
- Industry-standard tool

### Option 3: Build Dashboard (3-4 hours)
- Next.js web dashboard
- Interactive charts
- Real-time metrics
- Export reports

### Option 4: Try Machine Learning (4-6 hours)
- Sales forecasting
- Anomaly detection
- Customer segmentation
- Inventory optimization

**See `YOUR_NEXT_STEPS.md` for detailed guides!**

---

## 🎓 What You've Learned

### Data Engineering Concepts
- ✅ ETL (Extract, Transform, Load)
- ✅ Data warehouse architecture (raw, staging, analytics)
- ✅ Star schema design (facts and dimensions)
- ✅ Data quality management
- ✅ Automated pipelines with Airflow

### Technical Skills
- ✅ Python for data processing
- ✅ SQL for data analysis
- ✅ Docker for containerization
- ✅ PostgreSQL for data warehousing
- ✅ Apache Airflow for orchestration

### Best Practices
- ✅ Preserve raw data for audit
- ✅ Filter bad data at analytics layer
- ✅ Monitor data quality proactively
- ✅ Document everything
- ✅ Automate repetitive tasks

---

## 🎉 Congratulations!

You've built a production-ready data platform from scratch!

**What you accomplished**:
- ✅ Generated 10,000 realistic transactions
- ✅ Built automated ETL pipeline
- ✅ Created data warehouse with 11 tables
- ✅ Implemented automatic data quality filtering
- ✅ Achieved 98.6% data completeness
- ✅ Set up monitoring and documentation

**You're now a data engineer!** 🚀

---

## 📞 Need Help?

1. Check `docs/06_TROUBLESHOOTING.md` for common issues
2. Review `docs/02_YOUR_NEXT_STEPS.md` for guidance
3. Run `python scripts/scan_nan_values.py` to verify data quality
4. Explore with `warehouse/sql/01_quick_queries.sql`

---

**Last Updated**: May 4, 2026  
**Status**: Production-ready ✅  
**Data Quality**: 98.6% complete
