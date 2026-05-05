# Scripts

Python utility scripts for data quality checks and manual ETL operations.

Requires the warehouse to be running (`localhost:5433`).

```bash
pip install psycopg2-binary pandas
```

---

## scan_nan_values.py

Scans all warehouse tables for NaN values in numeric columns. Run this after any pipeline execution to verify data quality.

```bash
cd data-platform/scripts
python scan_nan_values.py
```

Expected output:
```
✅ raw.products:              0 NaN
⚠️  raw.sales:               274 NaN  (expected — from data generator)
✅ analytics.fact_sales:      0 NaN
✅ analytics.daily_sales_summary: 0 NaN
```

NaN values in `raw.*` and `staging.*` are expected — the data generator intentionally introduces ~5% wrong data types. The analytics layer should always be 0.

---

## check_data_quality.py

Runs automated quality checks: NULL values, orphaned records, calculation accuracy, data completeness.

```bash
python check_data_quality.py
```

---

## complete_manual_load.py

Runs the full ETL pipeline manually without Airflow. Useful for testing or one-off loads.

```bash
python complete_manual_load.py
```

Prerequisites:
- Warehouse running on `localhost:5433`
- Cleaned CSV files in `data-generator/processed/`
