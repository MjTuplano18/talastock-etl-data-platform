# Sales ETL Pipeline Guide

## Overview

The `sales_etl_pipeline` DAG is a production-ready ETL pipeline that processes the sales data generated in Phase 1. It demonstrates real-world data engineering patterns including extraction, transformation, data quality checks, and cleanup.

---

## Pipeline Architecture

```
                    validate_input_files
                           |
              +------------+------------+
              |                         |
       extract_products          extract_sales
              |                         |
       transform_products        transform_sales
              |                         |
              +------------+------------+
                           |
                generate_quality_report
                           |
                  cleanup_temp_files
                           |
                   pipeline_complete
```

---

## Task Breakdown

### Task 1: validate_input_files
**Type**: PythonOperator  
**Purpose**: Verify that input files exist and are readable

**What it does**:
- Checks if `products.csv` exists
- Checks if `sales_standard.csv` exists
- Reports file sizes
- Fails the pipeline if files are missing

**Why it's important**: Prevents the pipeline from running if data is missing, saving time and resources.

---

### Task 2: extract_products
**Type**: PythonOperator  
**Purpose**: Read products data from CSV

**What it does**:
- Reads `products.csv` using pandas
- Displays data summary (row count, columns, memory usage)
- Shows first 5 products
- Saves to temporary file for next task

**Output**: Temporary file `temp_products.csv`

---

### Task 3: extract_sales
**Type**: PythonOperator  
**Purpose**: Read sales data from CSV

**What it does**:
- Reads `sales_standard.csv` using pandas
- Displays data summary (row count, date range, total revenue)
- Shows first 5 sales
- Saves to temporary file for next task

**Output**: Temporary file `temp_sales.csv`

**Note**: Tasks 2 and 3 run in **parallel** (at the same time) because they don't depend on each other!

---

### Task 4: transform_products
**Type**: PythonOperator  
**Purpose**: Clean and transform products data

**Transformations**:
1. **Remove duplicates** - Based on SKU
2. **Handle missing values**:
   - Fill missing categories with "Uncategorized"
   - Fill missing brands with "Generic"
3. **Fix data types**:
   - Convert price to numeric
   - Convert cost_price to numeric
   - Convert stock_quantity to integer
4. **Remove invalid data**:
   - Remove products with negative prices
5. **Add calculated fields**:
   - Calculate profit_margin: `((price - cost_price) / price) * 100`

**Output**: `products_cleaned.csv`

---

### Task 5: transform_sales
**Type**: PythonOperator  
**Purpose**: Clean and transform sales data

**Transformations**:
1. **Parse dates** - Convert sale_date to datetime
2. **Remove invalid dates** - Drop rows with unparseable dates
3. **Fix data types**:
   - Convert quantity to integer
   - Convert unit_price to numeric
   - Convert total_amount to numeric
4. **Remove invalid data**:
   - Remove sales with negative amounts
   - Remove sales with zero quantity
5. **Add time-based fields**:
   - Extract year, month, day_of_week, hour
6. **Recalculate totals** - Ensure `total_amount = quantity * unit_price`

**Output**: `sales_cleaned.csv`

**Note**: Tasks 4 and 5 also run in **parallel**!

---

### Task 6: generate_quality_report
**Type**: PythonOperator  
**Purpose**: Create a data quality report

**What it generates**:
```json
{
  "generated_at": "2026-05-04T10:00:00",
  "products": {
    "total_count": 100,
    "categories": 5,
    "brands": 15,
    "avg_price": 125.50,
    "avg_profit_margin": 35.2
  },
  "sales": {
    "total_count": 9950,
    "total_revenue": 1056894.56,
    "avg_transaction": 106.22,
    "date_range": {
      "start": "2025-11-01",
      "end": "2026-04-30"
    }
  }
}
```

**Output**: `quality_report.json`

---

### Task 7: cleanup_temp_files
**Type**: BashOperator  
**Purpose**: Remove temporary files

**What it does**:
- Deletes `temp_products.csv`
- Deletes `temp_sales.csv`

**Why it's important**: Keeps the file system clean and prevents disk space issues.

---

### Task 8: pipeline_complete
**Type**: PythonOperator  
**Purpose**: Mark pipeline as complete

**What it does**:
- Prints success message
- Lists all output files
- Confirms data is ready for analysis

---

## How to Run the Pipeline

### Option 1: Automatic (Scheduled)

The pipeline runs automatically every day at midnight. Just wait for it to run!

### Option 2: Manual Trigger (Recommended for Testing)

1. **Open Airflow UI**: http://localhost:8080
2. **Find the DAG**: Look for `sales_etl_pipeline` in the DAG list
3. **Turn it ON**: Toggle the switch on the left (if it's off)
4. **Trigger it**: Click the "Play" button (▶️) on the right
5. **Click "Trigger DAG"**
6. **Watch it run**: Click on the DAG name to see the graph view

### Option 3: Command Line

```bash
docker exec airflow-airflow-webserver-1 airflow dags trigger sales_etl_pipeline
```

---

## Viewing Results

### View Logs

1. Click on any task in the graph view
2. Click "Log" in the popup
3. See the detailed output

### View Processed Files

```bash
# List processed files
docker exec airflow-airflow-webserver-1 ls -lh /opt/airflow/data-generator/processed/

# View quality report
docker exec airflow-airflow-webserver-1 cat /opt/airflow/data-generator/processed/quality_report.json
```

### Copy Files to Your Computer

```bash
# Copy all processed files
docker cp airflow-airflow-webserver-1:/opt/airflow/data-generator/processed/ data-platform/data-generator/
```

---

## Understanding Parallel Execution

Notice how some tasks run at the same time:

```
extract_products  ←→  extract_sales  (parallel)
       ↓                    ↓
transform_products ←→ transform_sales (parallel)
```

**Why?** Because they don't depend on each other! This makes the pipeline faster.

**Sequential tasks** (one after another):
```
validate → extract → transform → quality_report → cleanup → complete
```

---

## Data Quality Checks

The pipeline performs these quality checks:

### Products
- ✅ No duplicate SKUs
- ✅ No missing categories or brands
- ✅ All prices are positive
- ✅ All data types are correct
- ✅ Profit margins calculated

### Sales
- ✅ All dates are valid
- ✅ No negative amounts
- ✅ All quantities are positive
- ✅ Total amounts match (quantity × unit_price)
- ✅ Time-based fields extracted

---

## Common Issues and Solutions

### Issue: "File not found"

**Solution**: Copy the data files into the container:
```bash
docker cp data-platform/data-generator/output/products.csv airflow-airflow-webserver-1:/opt/airflow/data-generator/output/
docker cp data-platform/data-generator/output/sales_standard.csv airflow-airflow-webserver-1:/opt/airflow/data-generator/output/
```

### Issue: "DAG not showing up"

**Solution**: Wait 30 seconds for Airflow to scan for new DAGs, then refresh the page.

### Issue: Task failed

**Solution**: 
1. Click on the failed task (red box)
2. Click "Log"
3. Read the error message
4. Fix the issue in the DAG file
5. Restart Airflow: `docker-compose restart`

---

## Next Steps

After running this pipeline successfully:

1. **Analyze the cleaned data** - Use pandas or Excel to explore
2. **Build more pipelines**:
   - Incremental loads (only process new data)
   - Data validation (check for anomalies)
   - Load to database (PostgreSQL, Supabase)
3. **Add monitoring**:
   - Email alerts on failure
   - Slack notifications
   - Custom metrics
4. **Optimize performance**:
   - Process data in chunks
   - Use parallel processing
   - Cache intermediate results

---

## Key Learnings

From this pipeline, you learned:

- ✅ How to structure a real ETL pipeline
- ✅ How to use PythonOperator for data processing
- ✅ How to use BashOperator for system commands
- ✅ How to create parallel tasks
- ✅ How to pass data between tasks (via files)
- ✅ How to generate data quality reports
- ✅ How to clean up temporary files
- ✅ How to handle errors gracefully

---

## Production Considerations

For production use, you'd want to add:

1. **Error handling** - Retry logic, fallback strategies
2. **Monitoring** - Alerts, dashboards, metrics
3. **Data validation** - Schema checks, business rule validation
4. **Incremental processing** - Only process new/changed data
5. **Idempotency** - Pipeline can run multiple times safely
6. **Logging** - Structured logs for debugging
7. **Testing** - Unit tests, integration tests
8. **Documentation** - Data lineage, data dictionary

We'll cover these in later phases!

---

**Status**: Ready to run  
**Next**: Trigger the pipeline and view the results!
