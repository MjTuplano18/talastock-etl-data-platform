# 🐍 Python Utility Scripts

Utility scripts for data quality monitoring and manual ETL operations.

---

## 📁 Available Scripts

### 1. scan_nan_values.py
**Purpose**: Comprehensive NaN scanner for all warehouse tables

**What it does**:
- Scans all 11 tables in the warehouse
- Identifies NaN values in numeric columns
- Shows sample rows with NaN
- Generates summary report

**When to use**:
- After running ETL pipeline
- To verify data quality
- When investigating data issues
- Before building dashboards

**How to run**:
```bash
cd data-platform/scripts
python scan_nan_values.py
```

**Expected output**:
```
✅ raw.products: Clean (no NaN)
🔴 raw.sales: 274 NaN values (expected)
✅ analytics.fact_sales: Clean (no NaN)
✅ analytics.daily_sales_summary: Clean (no NaN)
```

---

### 2. check_data_quality.py
**Purpose**: Run automated data quality checks

**What it does**:
- Checks for NULL values
- Validates data completeness
- Verifies calculations
- Detects anomalies

**When to use**:
- Regular quality monitoring
- Before generating reports
- After data updates
- As part of CI/CD pipeline

**How to run**:
```bash
cd data-platform/scripts
python check_data_quality.py
```

---

### 3. add_data_quality_monitoring.py
**Purpose**: Add quality monitoring to Airflow pipeline

**What it does**:
- Creates quality check tasks
- Sets up alerts
- Monitors 5 quality metrics
- Generates quality reports

**When to use**:
- Setting up production monitoring
- Adding quality gates to pipeline
- Implementing data SLAs

**How to run**:
```bash
cd data-platform/scripts
python add_data_quality_monitoring.py
```

**What it monitors**:
1. NaN values in raw sales
2. NaN values in analytics layer
3. Duplicate transactions
4. Negative or zero values
5. Data completeness

---

### 4. complete_manual_load.py
**Purpose**: Run ETL pipeline manually (without Airflow)

**What it does**:
- Loads data from CSV files
- Transforms data through all layers
- Builds fact and dimension tables
- Creates aggregate tables

**When to use**:
- Testing ETL logic
- Debugging pipeline issues
- Running ETL without Airflow
- One-time data loads

**How to run**:
```bash
cd data-platform/scripts
python complete_manual_load.py
```

**Prerequisites**:
- Warehouse must be running
- CSV files must exist in `data-generator/processed/`
- Database connection configured

---

## 🚀 Quick Start

### First Time Setup
```bash
# 1. Make sure warehouse is running
cd data-platform/warehouse
docker-compose up -d

# 2. Navigate to scripts folder
cd ../scripts

# 3. Run your first scan
python scan_nan_values.py
```

### Regular Usage
```bash
# After running Airflow pipeline
python scan_nan_values.py

# Check data quality
python check_data_quality.py
```

---

## 📊 Script Dependencies

All scripts require:
- Python 3.8+
- psycopg2 (PostgreSQL adapter)
- pandas (for data processing)
- Warehouse running on localhost:5433

**Install dependencies**:
```bash
pip install psycopg2-binary pandas
```

---

## 🔧 Configuration

### Database Connection
All scripts use these default settings:
```python
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'talastock_warehouse',
    'user': 'warehouse_user',
    'password': 'warehouse_pass'
}
```

**To change**: Edit the `DB_CONFIG` dictionary in each script.

---

## 📈 Expected Results

### scan_nan_values.py
```
✅ Analytics layer: 0 NaN (perfect!)
⚠️ Raw/Staging: 274 NaN (expected)
✅ All aggregate tables: Clean
```

### check_data_quality.py
```
✅ NULL Check: 0 issues
✅ Orphaned Records: 0 issues
✅ Calculations: Valid
✅ Data Completeness: 98.6%
```

---

## 🆘 Troubleshooting

### "Connection refused"
**Problem**: Warehouse not running  
**Solution**: 
```bash
cd data-platform/warehouse
docker-compose up -d
```

### "Module not found"
**Problem**: Missing dependencies  
**Solution**:
```bash
pip install psycopg2-binary pandas
```

### "Permission denied"
**Problem**: Database credentials incorrect  
**Solution**: Check `DB_CONFIG` in script

---

## 💡 Tips

1. **Run scan after every ETL** to verify data quality
2. **Check quality before reports** to ensure accuracy
3. **Use manual load for testing** before deploying to Airflow
4. **Monitor regularly** to catch issues early

---

## 📚 Related Documentation

- **Data Quality Report**: `../docs/03_DATA_QUALITY_REPORT.md`
- **Scan Results**: `../docs/05_SCAN_RESULTS_SUMMARY.md`
- **Troubleshooting**: `../docs/06_TROUBLESHOOTING.md`
- **SQL Queries**: `../warehouse/sql/README.md`

---

**Last Updated**: May 4, 2026  
**Status**: Production-ready ✅
