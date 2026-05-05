# Setup Guide

Everything you need to get the platform running locally.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10–3.12 | https://www.python.org/downloads (for dbt only) |
| Git | Any | https://git-scm.com |

> Python 3.14 is **not** supported by dbt. Use 3.10, 3.11, or 3.12.

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/MjTuplano18/talastock-etl-data-platform.git
cd talastock-etl-data-platform/data-platform
```

---

## Step 2 — Start the data warehouse

```bash
cd warehouse
docker-compose up -d
```

This starts:
- **PostgreSQL** on port `5433` (warehouse database)
- **pgAdmin** on port `5050` (visual database UI)

Verify both are running:
```bash
docker ps --filter "name=talastock"
```

---

## Step 3 — Start Airflow

```bash
cd ../airflow

# Windows PowerShell
.\start-airflow.ps1

# Mac / Linux
export AIRFLOW_UID=50000
docker-compose up -d
```

First startup takes 2–3 minutes while Airflow initialises its database.

Check status:
```bash
docker-compose ps
```

All services should show `healthy`.

---

## Step 4 — Verify access

| Service | URL | Login |
|---|---|---|
| Airflow | http://localhost:8080 | admin / admin |
| pgAdmin | http://localhost:5050 | admin@talastock.com / admin |

---

## Step 5 — Connect pgAdmin to the warehouse

1. Open pgAdmin → right-click **Servers** → **Register → Server**
2. **General** tab: Name = `Talastock Warehouse`
3. **Connection** tab:
   - Host: `talastock-warehouse`
   - Port: `5432` (internal Docker port, not 5433)
   - Database: `talastock_warehouse`
   - Username: `warehouse_user`
   - Password: `warehouse_pass`
4. Click **Save**

---

## Step 6 — Run the full pipeline

In the Airflow UI:
1. Find `data_generator_pipeline`
2. Toggle it **on** (if paused)
3. Click the **▶ Trigger** button
4. Watch it chain through all 5 stages automatically

Total runtime: ~5–10 minutes for all stages.

---

## Step 7 — Start the analytics dashboard

```bash
cd ../analytics-dashboard
npm install
npm run dev
```

Open http://localhost:3001.

---

## Step 8 — (Optional) Set up dbt locally

dbt runs inside Airflow automatically, but you can also run it locally for development.

```bash
cd ../dbt
python3.12 -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate

pip install dbt-core==1.7.0 dbt-postgres==1.7.0

# Test connection
dbt debug

# Run all models
dbt run

# Run all tests
dbt test

# Generate and serve docs
dbt docs generate
dbt docs serve
```

---

## Environment variables

### Dashboard (`analytics-dashboard/.env.local`)

```env
WAREHOUSE_HOST=localhost
WAREHOUSE_PORT=5433
WAREHOUSE_DB=talastock_warehouse
WAREHOUSE_USER=warehouse_user
WAREHOUSE_PASSWORD=warehouse_pass

AIRFLOW_API_URL=http://localhost:8080
AIRFLOW_USER=admin
AIRFLOW_PASS=admin
```

---

## Stopping everything

```bash
# Stop Airflow
cd airflow && docker-compose down

# Stop warehouse
cd ../warehouse && docker-compose down
```

Add `-v` to also remove volumes (deletes all data):
```bash
docker-compose down -v
```
