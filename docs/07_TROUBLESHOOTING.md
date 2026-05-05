# Troubleshooting

Common issues and how to fix them.

---

## Airflow

### DAG not showing up in the UI

1. Wait 30 seconds — Airflow scans for new DAGs on a timer
2. Check for Python syntax errors:
   ```bash
   docker exec airflow-airflow-scheduler-1 python /opt/airflow/dags/your_dag.py
   ```
3. Restart the scheduler:
   ```bash
   cd data-platform/airflow
   docker-compose restart airflow-scheduler
   ```

### DAG shows "Import Error"

Open the error in the Airflow UI (click the red icon next to the DAG name). Common causes:

- **`TypeError: unsupported operand type(s) for >>: 'list' and 'list'`** — You can't use `>>` between two lists. Define each dependency explicitly:
  ```python
  # Wrong
  [task_a, task_b] >> [task_c, task_d]

  # Correct
  task_a >> task_c
  task_a >> task_d
  task_b >> task_c
  task_b >> task_d
  ```

- **`ModuleNotFoundError`** — A Python package is missing. Add it to `_PIP_ADDITIONAL_REQUIREMENTS` in `docker-compose.yml` and restart.

### Task fails with "File not found"

Files need to be in the **scheduler** container, not the webserver. Copy them:
```bash
docker cp your-file.csv airflow-airflow-scheduler-1:/opt/airflow/data-generator/output/
```

Verify:
```bash
docker exec airflow-airflow-scheduler-1 ls /opt/airflow/data-generator/output/
```

### Task stuck in "Running" state

1. Check the task logs in the Airflow UI
2. If it's genuinely stuck, mark it as failed:
   - Click the task → **Mark Failed**
3. Fix the underlying issue and re-trigger

### Port 8080 already in use

Change the webserver port in `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"
```

---

## Warehouse / pgAdmin

### pgAdmin can't connect to the warehouse

Use `talastock-warehouse` as the hostname (not `localhost`). Docker containers communicate using container names.

Correct settings:
- Host: `talastock-warehouse`
- Port: `5432` (internal port, not 5433)
- Database: `talastock_warehouse`
- Username: `warehouse_user`
- Password: `warehouse_pass`

### Warehouse connection refused from Airflow

Both containers must be on the same Docker network (`data-platform`).

Check:
```bash
docker network inspect data-platform
```

Both `airflow-airflow-scheduler-1` and `talastock-warehouse` should appear in the containers list.

If the network doesn't exist:
```bash
docker network create data-platform
```

Then restart both docker-compose stacks.

### Tables are empty after running the pipeline

1. Check the Airflow task logs for errors
2. Verify the processed files exist:
   ```bash
   docker exec airflow-airflow-scheduler-1 ls /opt/airflow/data-generator/processed/
   ```
3. If files are missing, run `sales_etl_pipeline` first

---

## dbt

### `dbt debug` fails — connection refused

The warehouse must be running before dbt can connect. Check:
```bash
docker ps --filter "name=talastock-warehouse"
```

Also verify `profiles.yml` has the correct port (`5433` for local, `5432` for Docker target).

### `dbt run` fails — model not found

Make sure you're using `ref()` to reference other models:
```sql
-- Correct
SELECT * FROM {{ ref('stg_products') }}

-- Wrong (bypasses dbt dependency tracking)
SELECT * FROM analytics.stg_products
```

### dbt test fails

1. Find the compiled test SQL in `target/compiled/talastock/`
2. Run it in pgAdmin to see which rows are failing
3. Fix the data or the model
4. Re-run: `dbt test --select model_name`

### Python 3.14 compatibility

dbt doesn't support Python 3.14. Install Python 3.12:
- https://www.python.org/downloads/

Then recreate the virtual environment:
```bash
python3.12 -m venv venv
venv\Scripts\activate
pip install dbt-core==1.7.0 dbt-postgres==1.7.0
```

---

## Forecasting pipeline

### "Not enough history" error

The forecasting pipeline requires at least 14 days of data in `analytics.fact_sales`. Run the full pipeline chain first:

1. Trigger `data_generator_pipeline`
2. Wait for all 5 stages to complete
3. Then trigger `forecasting_pipeline`

### Forecast page shows "No forecasts yet"

The `forecast_sales` table is empty. Trigger `forecasting_pipeline` from the Airflow UI or the dashboard Pipeline Controls panel.

---

## Dashboard

### Dashboard can't connect to the warehouse

Check `.env.local` in `analytics-dashboard/`:
```env
WAREHOUSE_HOST=localhost
WAREHOUSE_PORT=5433
WAREHOUSE_DB=talastock_warehouse
WAREHOUSE_USER=warehouse_user
WAREHOUSE_PASSWORD=warehouse_pass
```

Make sure the warehouse Docker container is running.

### Airflow trigger returns 401

The credentials in `.env.local` don't match the Airflow admin user. The default is `admin`/`admin` (set in `airflow/docker-compose.yml`):
```env
AIRFLOW_USER=admin
AIRFLOW_PASS=admin
```

After changing `.env.local`, restart the Next.js dev server.

---

## General Docker commands

```bash
# List all running containers
docker ps

# View logs for a container
docker logs talastock-warehouse --tail 100
docker logs airflow-airflow-scheduler-1 --tail 100

# Open a shell inside a container
docker exec -it airflow-airflow-scheduler-1 bash
docker exec -it talastock-warehouse psql -U warehouse_user -d talastock_warehouse

# Restart a specific service
docker-compose restart airflow-scheduler

# Full restart (preserves data)
docker-compose down && docker-compose up -d

# Full reset (deletes all data)
docker-compose down -v && docker-compose up -d

# Check network connectivity between containers
docker exec airflow-airflow-scheduler-1 ping talastock-warehouse
```
