# Airflow

Apache Airflow 2.9 orchestrates all five data pipelines. Runs in Docker.

---

## Quick start

```bash
# Windows
.\start-airflow.ps1

# Mac / Linux
export AIRFLOW_UID=50000
docker-compose up -d
```

UI: http://localhost:8080 — login: `admin` / `admin`

First startup takes 2–3 minutes. Check status with `docker-compose ps`.

---

## DAGs

| DAG | Schedule | Triggers |
|---|---|---|
| `data_generator_pipeline` | Manual | → `warehouse_etl_pipeline` |
| `sales_etl_pipeline` | Daily midnight | → `warehouse_etl_pipeline` |
| `warehouse_etl_pipeline` | Daily midnight | → `dbt_pipeline` |
| `dbt_pipeline` | Manual / triggered | → `forecasting_pipeline` |
| `forecasting_pipeline` | Weekly Sunday 03:00 | — |

Triggering `data_generator_pipeline` chains through all five stages automatically.

---

## Volumes

The docker-compose mounts these directories into the Airflow containers:

| Host path | Container path | Purpose |
|---|---|---|
| `airflow/dags/` | `/opt/airflow/dags/` | DAG files |
| `data-generator/` | `/opt/airflow/data-generator/` | Input/output data files |
| `dbt/` | `/opt/airflow/dbt/` | dbt project (for dbt_pipeline) |

---

## Python dependencies

Additional packages installed at container startup via `_PIP_ADDITIONAL_REQUIREMENTS` in `docker-compose.yml`:

```
dbt-core==1.7.17
dbt-postgres==1.7.17
faker==24.0.0
openpyxl==3.1.2
numpy>=1.26.0
```

---

## Useful commands

```bash
# List all DAGs
docker exec airflow-airflow-scheduler-1 airflow dags list

# Trigger a DAG
docker exec airflow-airflow-scheduler-1 airflow dags trigger data_generator_pipeline

# Trigger with config
docker exec airflow-airflow-scheduler-1 \
  airflow dags trigger data_generator_pipeline \
  --conf '{"products": 100, "sales": 10000, "months": 6}'

# Test a single task without running the full DAG
docker exec airflow-airflow-scheduler-1 \
  airflow tasks test data_generator_pipeline validate_environment 2026-05-05

# View logs
docker logs airflow-airflow-scheduler-1 --tail 100
```

---

## Pipeline guides

See `docs/` for detailed guides on each pipeline:

- `docs/02_PIPELINE_DATA_GENERATOR.md`
- `docs/03_PIPELINE_SALES_ETL.md`
- `docs/04_PIPELINE_WAREHOUSE_ETL.md`
- `docs/05_PIPELINE_DBT.md`
- `docs/06_PIPELINE_FORECASTING.md`
