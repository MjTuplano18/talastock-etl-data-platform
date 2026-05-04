# SQL Queries for Data Warehouse

This folder contains all SQL queries for exploring and validating your data warehouse.

## 📁 Files

### 01_quick_queries.sql
**Purpose**: Explore your data and discover business insights

**What's Inside**:
- 15 ready-to-run queries
- Top products by revenue
- Daily/monthly revenue trends
- Category performance
- Sales patterns (day of week, time of day, payday effect)
- Payment method and customer type analysis
- Overall business summary

**How to Use**:
1. Open pgAdmin: http://localhost:5050
2. Navigate to: Servers → Talastock Warehouse → Databases → talastock_warehouse
3. Right-click → Query Tool
4. Copy and paste queries from this file
5. Run them one by one or all at once

---

### 02_data_quality_check.sql
**Purpose**: Verify data integrity and quality

**What's Inside**:
- NULL value checks
- Missing cost_price detection
- Negative value checks
- Revenue calculation verification
- Orphaned records detection
- Data completeness summary
- Profit calculation validation

**How to Use**:
1. Open pgAdmin Query Tool
2. Copy and paste queries from this file
3. Run to verify your data quality
4. All checks should pass (0 issues)

---

## 🚀 Quick Start

### First Time Setup
```bash
# 1. Start warehouse (if not running)
cd data-platform/warehouse
docker-compose up -d

# 2. Open pgAdmin
http://localhost:5050
Login: admin@talastock.com / admin

# 3. Connect to warehouse
Server: talastock-warehouse
Host: talastock-warehouse
Port: 5432
Database: talastock_warehouse
Username: warehouse_user
Password: warehouse_pass
```

### Run Your First Query
```sql
-- Copy this into pgAdmin Query Tool
SELECT 
    TO_CHAR(SUM(total_revenue), 'FM₱999,999,999.00') as total_revenue,
    TO_CHAR(SUM(total_profit), 'FM₱999,999,999.00') as total_profit,
    TO_CHAR(AVG(profit_margin_pct), 'FM999.00%') as avg_profit_margin,
    SUM(total_transactions) as total_transactions
FROM analytics.daily_sales_summary;
```

---

## 📊 What You'll Discover

### Business Insights
- Which products make the most money?
- What's the payday effect on sales?
- Which time of day is busiest?
- Weekend vs weekday performance
- Payment method preferences
- Customer type behavior

### Data Quality
- Is all data loaded correctly?
- Are there any NULL values?
- Are calculations accurate?
- Is data complete across all layers?

---

## 💡 Tips

1. **Start with Query #1** (Verify Data Loaded) to confirm everything is working
2. **Run Query #15** (Overall Business Summary) to see your key metrics
3. **Explore by category** using Query #4 to understand product mix
4. **Check data quality** using `02_data_quality_check.sql` regularly

---

## 🎯 Next Steps

After exploring your data:
1. Build dbt models (transform SQL into reusable models)
2. Create a dashboard (visualize these insights)
3. Try machine learning (forecast future sales)

---

**Last Updated**: May 4, 2026  
**Status**: Production-ready ✅
