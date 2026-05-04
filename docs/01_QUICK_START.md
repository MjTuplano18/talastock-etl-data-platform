# Data Platform - Quick Start Guide

## 🚀 What You've Built

An **Enterprise Data Platform** for learning data engineering concepts:
- ✅ Phase 1: Data Generator (realistic business data)
- ✅ Phase 2: Apache Airflow ETL Pipeline (data processing)
- ✅ Phase 3: Data Warehouse & Analytics (PostgreSQL + pgAdmin)

---

## 📁 Project Structure

```
data-platform/
├── data-generator/          # Phase 1: Generate realistic data
│   ├── output/              # Raw data (100 products, 10,198 sales)
│   └── processed/           # Cleaned data (output from Airflow)
│
├── airflow/                 # Phase 2: ETL orchestration
│   ├── dags/                # Pipeline definitions
│   │   ├── hello_world_dag.py
│   │   ├── sales_etl_pipeline.py
│   │   └── warehouse_etl_pipeline.py  # NEW!
│   └── docker-compose.yml   # Docker setup
│
├── warehouse/               # Phase 3: Data warehouse
│   ├── schema/              # SQL table definitions
│   ├── quick-queries.sql    # Sample analytics queries
│   └── docker-compose.yml   # PostgreSQL + pgAdmin
│
├── PHASE_2_COMPLETION_SUMMARY.md
├── PHASE_3_COMPLETION_SUMMARY.md  # NEW!
└── QUICK_START.md           # This file
```

---

## 🎯 Quick Commands

### Start Everything
```bash
# Start warehouse (PostgreSQL + pgAdmin)
cd data-platform/warehouse
docker-compose up -d

# Start Airflow
cd data-platform/airflow
docker-compose up -d
```

**Access Points:**
- Airflow UI: http://localhost:8080 (admin/admin)
- pgAdmin: http://localhost:5050 (admin@talastock.com/admin)

### Stop Everything
```bash
cd data-platform/warehouse && docker-compose down
cd data-platform/airflow && docker-compose down
```

### Generate New Data
```bash
cd data-platform/data-generator
python generate_data.py
```

### Copy Data to Airflow
```bash
# Products
docker cp data-platform/data-generator/output/products.csv airflow-airflow-scheduler-1:/opt/airflow/data-generator/output/

# Sales
docker cp data-platform/data-generator/output/sales_standard.csv airflow-airflow-scheduler-1:/opt/airflow/data-generator/output/
```

### Retrieve Processed Data
```bash
# Copy all processed files
docker cp airflow-airflow-scheduler-1:/opt/airflow/data-generator/processed/ data-platform/data-generator/
```

---

## 📊 Current Data

### Raw Data (Input)
- **Location**: `data-generator/output/`
- **Products**: 100 items across 5 categories
- **Sales**: 10,198 transactions over 6 months
- **Revenue**: ₱1,006,672.47

### Cleaned Data (Airflow Output)
- **Location**: `data-generator/processed/`
- **Products**: 100 items with profit margins
- **Sales**: 10,073 validated transactions with time fields
- **Quality Report**: JSON summary

### Warehouse Data (PostgreSQL)
- **Location**: PostgreSQL database (port 5433)
- **Schemas**: raw, staging, analytics
- **Tables**: 11 tables total
- **Fact Table**: 10,073 sales transactions
- **Dimensions**: Products, Dates, Times
- **Aggregates**: Daily summary, product performance, category performance

---

## 🎓 Learning Resources

1. **AIRFLOW_LEARNING_GUIDE.md** - Complete Airflow tutorial
2. **SALES_ETL_PIPELINE_GUIDE.md** - Pipeline deep dive
3. **PHASE_2_COMPLETION_SUMMARY.md** - Phase 2 accomplishments
4. **PHASE_3_COMPLETION_SUMMARY.md** - Phase 3 accomplishments
5. **warehouse/README.md** - Warehouse documentation
6. **warehouse/PGADMIN_SETUP.md** - pgAdmin setup guide
7. **warehouse/quick-queries.sql** - 15 sample analytics queries

---

## 🚀 Next Steps

### Option 1: Explore Your Warehouse
- Open pgAdmin: http://localhost:5050
- Connect to warehouse (see PGADMIN_SETUP.md)
- Run queries from `warehouse/quick-queries.sql`
- Analyze business metrics and trends

### Option 2: Continue to Phase 4 (dbt)
- Install dbt for data transformations
- Replace SQL scripts with dbt models
- Add data quality tests
- Generate documentation

### Option 3: Continue to Phase 5 (Dashboard)
- Build Next.js analytics dashboard
- Connect to warehouse
- Create charts and visualizations
- Real-time business metrics

### Option 4: Enhance Current Work
- Add more data quality checks
- Implement incremental loads
- Add email alerts
- Create more complex pipelines

---

## 💡 Key Concepts Learned

### Phase 1 & 2:
- **ETL**: Extract, Transform, Load pattern
- **Airflow**: Workflow orchestration
- **DAGs**: Directed Acyclic Graphs (pipelines)
- **Tasks**: Individual units of work
- **Operators**: PythonOperator, BashOperator
- **Data Quality**: Cleaning, validation, enrichment
- **Docker**: Container management

### Phase 3:
- **OLTP vs OLAP**: Operational vs analytical databases
- **Data Warehouse**: Three-layer architecture (Raw → Staging → Analytics)
- **Star Schema**: Fact and dimension tables
- **Surrogate Keys**: Auto-generated keys vs natural keys
- **Aggregates**: Pre-calculated metrics for performance
- **SQL Transformations**: Complex queries, joins, window functions
- **pgAdmin**: Visual database management

---

## 🐛 Troubleshooting

### Airflow UI not accessible?
```bash
docker-compose ps  # Check if services are running
docker-compose logs -f airflow-webserver  # Check logs
```

### pgAdmin not accessible?
```bash
cd data-platform/warehouse
docker-compose ps  # Check if services are running
docker logs talastock-pgadmin  # Check logs
```

### DAG not showing up?
- Wait 30 seconds for Airflow to scan
- Check for Python errors: `python dags/your_dag.py`
- Restart scheduler: `docker-compose restart airflow-scheduler`

### Warehouse connection failed?
- Check warehouse is running: `docker ps --filter "name=talastock-warehouse"`
- Verify network: `docker network ls | grep data-platform`
- Check logs: `docker logs talastock-warehouse`

### Files not found in pipeline?
- Copy files to scheduler container (not webserver)
- Verify: `docker exec airflow-airflow-scheduler-1 ls /opt/airflow/data-generator/output/`

---

## 📞 Need Help?

1. Check the logs in Airflow UI or pgAdmin
2. Read the comprehensive guides (see Learning Resources)
3. Review the completion summaries
4. Check Docker container logs
5. Run sample queries from `warehouse/quick-queries.sql`

---

**Status**: Phase 3 Complete ✅  
**Branch**: `feature/airflow-etl-pipeline`  
**Next**: Phase 4 (dbt), Phase 5 (Dashboard), or Phase 6 (ML)

---

**Congratulations! You've built a complete data platform!** 🎉
