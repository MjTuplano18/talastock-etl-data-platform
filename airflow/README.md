# Apache Airflow - Phase 2

**Enterprise Data Platform for Talastock**

This directory contains Apache Airflow setup for orchestrating ETL pipelines.

---

## 📁 Directory Structure

```
airflow/
├── dags/                    # DAG definitions (your pipelines)
│   └── hello_world_dag.py   # Tutorial: Your first DAG
├── plugins/                 # Custom operators and hooks
├── logs/                    # Airflow execution logs
├── config/                  # Configuration files
├── requirements.txt         # Python dependencies
├── README.md               # This file
└── AIRFLOW_LEARNING_GUIDE.md  # Complete Airflow tutorial
```

---

## 🚀 Quick Start (Docker - Recommended)

### Prerequisites

1. **Install Docker Desktop:**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop
   - Verify: `docker --version`

### Step 1: Start Airflow

**Windows PowerShell:**
```powershell
cd data-platform/airflow
.\start-airflow.ps1
```

**Or manually:**
```powershell
$env:AIRFLOW_UID = 50000
docker-compose up -d
```

**Mac/Linux:**
```bash
cd data-platform/airflow
export AIRFLOW_UID=50000
docker-compose up -d
```

### Step 2: Wait for Initialization

First time startup takes 2-3 minutes. Check status:

```bash
docker-compose ps
```

All services should show "healthy" status.

### Step 3: Access Airflow UI

Open your browser and go to:
```
http://localhost:8080
```

**Login:**
- Username: `admin`
- Password: `admin`

### Step 4: Stop Airflow

```bash
docker-compose down
```

---

## 🔧 Docker Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f airflow-webserver
docker-compose logs -f airflow-scheduler
```

### Restart Services
```bash
docker-compose restart
```

### Stop and Remove Everything
```bash
docker-compose down -v
```

### Rebuild After Code Changes
```bash
docker-compose down
docker-compose up -d --build
```

---

## 🐍 Alternative: Local Installation (Python 3.11 or 3.12 Required)

**Note:** Python 3.14 is not supported by Airflow. You need Python 3.11 or 3.12.

If you have Python 3.11 or 3.12:

```bash
cd data-platform/airflow
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

$env:AIRFLOW_HOME = (Get-Location).Path
airflow db init
airflow users create --username admin --firstname Admin --lastname User --role Admin --email admin@talastock.com --password admin

# Terminal 1
airflow scheduler

# Terminal 2
airflow webserver --port 8080
```

---

## 🎯 Your First DAG

### View the Hello World DAG

1. Open Airflow UI: http://localhost:8080
2. You should see a DAG called `hello_world`
3. Click on it to see the graph view

### Trigger the DAG Manually

1. Click the "Play" button (▶️) on the right side
2. Click "Trigger DAG"
3. Watch it run in real-time!

### View Task Logs

1. Click on a task (green box)
2. Click "Log"
3. See the output from your Python functions

---

## 📊 Understanding the UI

### DAG List View

Shows all your DAGs with:
- **Toggle:** Turn DAG on/off
- **Name:** DAG ID
- **Schedule:** When it runs
- **Last Run:** Most recent execution
- **Next Run:** When it will run next

### Graph View

Visual representation of your pipeline:
- **Green boxes:** Successful tasks
- **Red boxes:** Failed tasks
- **Yellow boxes:** Running tasks
- **White boxes:** Not yet run

### Tree View

Shows historical runs:
- Each row is a DAG run
- Each column is a task
- Colors show success/failure

---

## 🔧 Common Commands

### List all DAGs
```bash
airflow dags list
```

### Test a specific task (without running full DAG)
```bash
airflow tasks test hello_world say_hello 2026-05-04
```

### Trigger a DAG manually
```bash
airflow dags trigger hello_world
```

### Pause/Unpause a DAG
```bash
airflow dags pause hello_world
airflow dags unpause hello_world
```

### View DAG structure
```bash
airflow dags show hello_world
```

---

## 🐛 Troubleshooting

### DAG not showing up?

1. **Check for Python errors:**
   ```bash
   python dags/hello_world_dag.py
   ```
   Should run without errors.

2. **Check Airflow can parse it:**
   ```bash
   airflow dags list
   ```
   Should show `hello_world` in the list.

3. **Restart scheduler:**
   - Stop scheduler (Ctrl+C)
   - Start again: `airflow scheduler`

### Port 8080 already in use?

Use a different port:
```bash
airflow webserver --port 8081
```

### Can't access UI?

Make sure both scheduler AND webserver are running in separate terminals.

---

## 📚 Learning Resources

1. **Read the Learning Guide:**
   - `AIRFLOW_LEARNING_GUIDE.md` - Complete tutorial

2. **Official Docs:**
   - https://airflow.apache.org/docs/

3. **Concepts to Master:**
   - DAGs (Directed Acyclic Graphs)
   - Operators (PythonOperator, BashOperator)
   - Task Dependencies (>> operator)
   - Scheduling (cron expressions)
   - XComs (passing data between tasks)

---

## 🎓 Next Steps

After you're comfortable with the Hello World DAG:

1. **Modify it:**
   - Add more tasks
   - Change the schedule
   - Add parallel tasks

2. **Build the real ETL pipeline:**
   - Extract data from CSV files
   - Transform (clean, validate)
   - Load to database

3. **Add monitoring:**
   - Email alerts on failure
   - Slack notifications
   - Custom metrics

---

## 🔐 Security Notes

**For Development:**
- Default SQLite database is fine
- Simple username/password auth

**For Production:**
- Use PostgreSQL for metadata database
- Enable RBAC (Role-Based Access Control)
- Use secrets backend (AWS Secrets Manager, etc.)
- Enable HTTPS
- Use strong passwords

---

## 📝 Configuration

Airflow configuration is in `airflow.cfg` (created after `airflow db init`).

**Key settings:**

```ini
[core]
dags_folder = /path/to/dags
load_examples = False  # Don't load example DAGs

[webserver]
web_server_port = 8080
base_url = http://localhost:8080

[scheduler]
dag_dir_list_interval = 30  # How often to scan for new DAGs (seconds)
```

---

## 🚀 Production Deployment

For production, you'll want:

1. **Executor:** Use CeleryExecutor or KubernetesExecutor (not SequentialExecutor)
2. **Database:** PostgreSQL (not SQLite)
3. **Message Broker:** Redis or RabbitMQ (for CeleryExecutor)
4. **Monitoring:** Prometheus + Grafana
5. **Deployment:** Docker + Kubernetes

We'll cover this in later phases!

---

## 📞 Support

If you get stuck:
1. Check the logs in `logs/` directory
2. Read `AIRFLOW_LEARNING_GUIDE.md`
3. Check Airflow documentation
4. Ask for help!

---

**Status:** Phase 2 - In Progress  
**Next:** Build real ETL pipeline for Talastock data


---

## 🎯 Available DAGs

### 1. hello_world (Tutorial)
**Purpose**: Learn Airflow basics

**Tasks**:
- `say_hello` - Print hello message
- `print_date` - Show current date
- `process_data` - Simulate data processing
- `list_files` - List directory contents
- `say_goodbye` - Print goodbye message

**Schedule**: Daily at midnight

### 2. sales_etl_pipeline (Production)
**Purpose**: Process sales data from Phase 1

**Tasks**:
1. `validate_input_files` - Check if input files exist
2. `extract_products` - Read products CSV
3. `extract_sales` - Read sales CSV
4. `transform_products` - Clean and transform products data
5. `transform_sales` - Clean and transform sales data
6. `generate_quality_report` - Create data quality report
7. `cleanup_temp_files` - Remove temporary files
8. `pipeline_complete` - Mark pipeline as complete

**Schedule**: Daily at midnight

**Input Files**:
- `/opt/airflow/data-generator/output/products.csv`
- `/opt/airflow/data-generator/output/sales_standard.csv`

**Output Files**:
- `/opt/airflow/data-generator/processed/products_cleaned.csv`
- `/opt/airflow/data-generator/processed/sales_cleaned.csv`
- `/opt/airflow/data-generator/processed/quality_report.json`

**Transformations Applied**:
- Remove duplicates
- Handle missing values
- Fix data types
- Remove invalid records
- Add calculated fields (profit_margin, year, month, day_of_week, hour)

---

## 📦 Working with Data Files

### Copy Data INTO Airflow Container

When you generate new data, copy it into the Airflow container:

```bash
# Copy products file
docker cp data-platform/data-generator/output/products.csv airflow-airflow-webserver-1:/opt/airflow/data-generator/output/

# Copy sales file
docker cp data-platform/data-generator/output/sales_standard.csv airflow-airflow-webserver-1:/opt/airflow/data-generator/output/

# Verify files
docker exec airflow-airflow-webserver-1 ls -lh /opt/airflow/data-generator/output/
```

### Copy Processed Data OUT of Airflow Container

After the ETL pipeline runs, retrieve the cleaned data:

```bash
# Copy processed products
docker cp airflow-airflow-webserver-1:/opt/airflow/data-generator/processed/products_cleaned.csv data-platform/data-generator/processed/

# Copy processed sales
docker cp airflow-airflow-webserver-1:/opt/airflow/data-generator/processed/sales_cleaned.csv data-platform/data-generator/processed/

# Copy quality report
docker cp airflow-airflow-webserver-1:/opt/airflow/data-generator/processed/quality_report.json data-platform/data-generator/processed/
```

---

## ✅ Phase 2 Progress

- [x] Docker setup complete
- [x] Hello World DAG created and tested
- [x] Real ETL pipeline created (sales_etl_pipeline)
- [x] Data files copied into container
- [ ] Manually trigger sales_etl_pipeline
- [ ] View processed data and quality report
- [ ] Build advanced pipelines (incremental loads, data validation)
