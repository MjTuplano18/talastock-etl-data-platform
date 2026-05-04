# Data Warehouse - PostgreSQL

## 🎯 Overview

This is the **Talastock Data Warehouse** - a separate PostgreSQL database optimized for analytics (OLAP). It's completely independent from the operational database (OLTP).

---

## 🏗️ Architecture

### Three-Layer Design

```
┌─────────────────────────────────────────┐
│  RAW LAYER (raw schema)                 │
│  - Exact copy of source data            │
│  - No transformations                   │
│  - Audit trail                          │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  STAGING LAYER (staging schema)         │
│  - Cleaned data                         │
│  - Validated types                      │
│  - Standardized format                  │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  ANALYTICS LAYER (analytics schema)     │
│  - Star schema                          │
│  - Fact & dimension tables              │
│  - Pre-aggregated metrics               │
└─────────────────────────────────────────┘
```

---

## 📊 Schema Design

### Raw Layer (`raw` schema)

**Purpose**: Store unchanged data from source files

**Tables**:
- `raw.products` - Exact copy of products CSV
- `raw.sales` - Exact copy of sales CSV

**Columns include**:
- All source columns
- `loaded_at` - When data was loaded
- `source_file` - Which file it came from
- `load_id` - Batch identifier

---

### Staging Layer (`staging` schema)

**Purpose**: Cleaned and validated data

**Tables**:
- `staging.products` - Cleaned products with constraints
- `staging.sales` - Cleaned sales with extracted time dimensions

**Transformations applied**:
- Remove duplicates
- Handle missing values
- Fix data types
- Add calculated fields
- Extract time dimensions

---

### Analytics Layer (`analytics` schema)

**Purpose**: Star schema optimized for business intelligence

#### Dimension Tables:

**`dim_products`** - Product attributes
- `product_key` (surrogate key)
- `sku` (natural key)
- Product details (name, category, brand, price, cost)
- SCD Type 2 support (valid_from, valid_to)

**`dim_dates`** - Date dimension
- `date_key` (YYYYMMDD format)
- Calendar attributes (year, month, week, day)
- Business attributes (is_weekend, is_payday, is_holiday)

**`dim_times`** - Time dimension
- `time_key` (HHMMSS format)
- Time attributes (hour, minute, second)
- Time-of-day categories (Morning, Afternoon, Evening, Night)
- Peak hour indicators

#### Fact Table:

**`fact_sales`** - Sales transactions (center of star)
- `sale_key` (surrogate key)
- `transaction_id` (natural key)
- Foreign keys to all dimensions
- Measures: quantity, unit_price, total_amount, cost, profit

#### Aggregate Tables:

**`daily_sales_summary`** - Daily metrics
- Total revenue, cost, profit
- Transaction count, units sold
- Average transaction value

**`product_performance`** - Product metrics
- Revenue, cost, profit by product
- Units sold, transaction count
- Rankings

**`category_performance`** - Category metrics
- Revenue, cost, profit by category
- Units sold, unique products

---

## 🚀 Quick Start

### Start the Warehouse (with pgAdmin)

```bash
cd data-platform/warehouse
docker-compose up -d
```

This starts:
- ✅ PostgreSQL warehouse (port 5433)
- ✅ pgAdmin web UI (port 5050)

### Access pgAdmin (Visual Database UI)

Open your browser:
```
http://localhost:5050
```

**Login:**
- Email: `admin@talastock.com`
- Password: `admin`

**See `PGADMIN_SETUP.md` for detailed setup instructions!**

### Check Status

```bash
docker ps --filter "name=talastock"
```

### Connect to Warehouse (Command Line)

```bash
docker exec -it talastock-warehouse psql -U warehouse_user -d talastock_warehouse
```

### Stop Everything

```bash
docker-compose down
```

---

## 🔌 Connection Details

- **Host**: localhost
- **Port**: 5433 (to avoid conflict with default PostgreSQL)
- **Database**: talastock_warehouse
- **User**: warehouse_user
- **Password**: warehouse_pass

**Connection String**:
```
postgresql://warehouse_user:warehouse_pass@localhost:5433/talastock_warehouse
```

---

## 📝 Useful Commands

### List all schemas
```sql
\dn
```

### List tables in a schema
```sql
\dt raw.*
\dt staging.*
\dt analytics.*
```

### Describe a table
```sql
\d+ analytics.fact_sales
```

### Count rows in a table
```sql
SELECT COUNT(*) FROM analytics.fact_sales;
```

### View sample data
```sql
SELECT * FROM analytics.fact_sales LIMIT 10;
```

---

## 📊 Sample Queries

### Daily Revenue
```sql
SELECT 
    date,
    total_revenue,
    total_transactions,
    average_transaction_value
FROM analytics.daily_sales_summary
ORDER BY date DESC
LIMIT 30;
```

### Top 10 Products
```sql
SELECT 
    product_name,
    category,
    total_revenue,
    total_units_sold,
    revenue_rank
FROM analytics.product_performance
ORDER BY revenue_rank
LIMIT 10;
```

### Sales by Category
```sql
SELECT 
    category,
    total_revenue,
    total_profit,
    profit_margin_pct,
    revenue_rank
FROM analytics.category_performance
ORDER BY revenue_rank;
```

### Sales by Day of Week
```sql
SELECT 
    d.day_of_week_name,
    SUM(f.total_amount) as total_revenue,
    COUNT(*) as transaction_count,
    AVG(f.total_amount) as avg_transaction
FROM analytics.fact_sales f
JOIN analytics.dim_dates d ON f.date_key = d.date_key
GROUP BY d.day_of_week_name, d.day_of_week
ORDER BY d.day_of_week;
```

### Peak Hours Analysis
```sql
SELECT 
    t.hour,
    t.time_of_day,
    t.is_peak_hour,
    SUM(f.total_amount) as total_revenue,
    COUNT(*) as transaction_count
FROM analytics.fact_sales f
JOIN analytics.dim_times t ON f.time_key = t.time_key
GROUP BY t.hour, t.time_of_day, t.is_peak_hour
ORDER BY t.hour;
```

---

## 🔧 Maintenance

### Backup Database
```bash
docker exec talastock-warehouse pg_dump -U warehouse_user talastock_warehouse > backup.sql
```

### Restore Database
```bash
docker exec -i talastock-warehouse psql -U warehouse_user talastock_warehouse < backup.sql
```

### View Logs
```bash
docker logs talastock-warehouse
```

### Restart Warehouse
```bash
docker-compose restart
```

---

## 📚 Next Steps

1. **Modify Airflow ETL** - Add tasks to load data into warehouse
2. **Populate Dimensions** - Load dim_products, dim_dates, dim_times
3. **Load Fact Table** - Load fact_sales from staging
4. **Calculate Metrics** - Populate aggregate tables
5. **Query Analytics** - Run business intelligence queries

---

## 🎓 Learning Resources

### Star Schema Design
- Fact tables store measurable events (sales)
- Dimension tables store descriptive attributes (products, dates)
- Foreign keys connect fact to dimensions
- Optimized for aggregation queries (SUM, COUNT, AVG)

### OLTP vs OLAP
- **OLTP** (Operational): Fast writes, single-record lookups
- **OLAP** (Analytical): Complex aggregations, scanning millions of rows
- **Separation**: Keeps analytics from slowing down the app

### Three-Layer Architecture
- **Raw**: Audit trail, unchanged data
- **Staging**: Cleaned, validated data
- **Analytics**: Business-ready models

---

**Status**: Warehouse Ready ✅  
**Next**: Modify Airflow ETL to load data
