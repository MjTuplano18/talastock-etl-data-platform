# Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: DAG Import Error - "TypeError: unsupported operand type(s) for >>: 'list' and 'list'"

**Symptom:**
- DAG shows "DAG Import Error" in Airflow UI
- Error message: `TypeError: unsupported operand type(s) for >>: 'list' and 'list'`

**Cause:**
In Airflow, you cannot use the `>>` operator directly between two lists of tasks. This syntax is invalid:

```python
# ❌ WRONG - This causes an error
[task1, task2] >> [task3, task4, task5]
```

**Solution:**
Explicitly define each dependency:

```python
# ✅ CORRECT - Define each dependency
task1 >> task3
task1 >> task4
task1 >> task5
task2 >> task3
task2 >> task4
task2 >> task5
```

Or use a loop:

```python
# ✅ CORRECT - Using a loop
upstream_tasks = [task1, task2]
downstream_tasks = [task3, task4, task5]

for upstream in upstream_tasks:
    for downstream in downstream_tasks:
        upstream >> downstream
```

**How to Check:**
```bash
# View DAG processor logs
docker exec airflow-airflow-scheduler-1 cat /opt/airflow/logs/scheduler/latest/your_dag.py.log

# List all DAGs
docker exec airflow-airflow-scheduler-1 airflow dags list
```

---

### Issue 2: Files Not Found in Airflow Tasks

**Symptom:**
- Task fails with "File not found" error
- Files exist on your local machine but not in container

**Cause:**
Files need to be copied to the **scheduler** container, not the webserver.

**Solution:**
```bash
# Copy files to scheduler container
docker cp your-file.csv airflow-airflow-scheduler-1:/opt/airflow/path/

# Verify files are there
docker exec airflow-airflow-scheduler-1 ls /opt/airflow/path/
```

---

### Issue 3: Warehouse Connection Failed

**Symptom:**
- Task fails with "could not connect to server"
- Error: `connection refused` or `host not found`

**Cause:**
Airflow and warehouse containers are not on the same Docker network.

**Solution:**
1. Check both containers are on the same network:
```bash
docker network ls
docker network inspect data-platform
```

2. Update `airflow/docker-compose.yml`:
```yaml
networks:
  default:
    name: data-platform
    external: true
```

3. Restart Airflow:
```bash
cd data-platform/airflow
docker-compose down
docker-compose up -d
```

---

### Issue 4: DAG Not Showing Up in UI

**Symptom:**
- DAG file exists but doesn't appear in Airflow UI
- No error messages

**Cause:**
- Airflow hasn't scanned for new DAGs yet
- Python syntax error in DAG file
- DAG file not in the correct location

**Solution:**
1. Wait 30 seconds for Airflow to scan
2. Check for Python errors:
```bash
docker exec airflow-airflow-scheduler-1 python /opt/airflow/dags/your_dag.py
```
3. Restart scheduler:
```bash
docker-compose restart airflow-scheduler
```

---

### Issue 5: pgAdmin Can't Connect to Warehouse

**Symptom:**
- pgAdmin shows "could not connect to server"
- Connection times out

**Cause:**
- Incorrect connection settings
- Containers not on same network
- Warehouse not running

**Solution:**
1. Check warehouse is running:
```bash
docker ps --filter "name=talastock-warehouse"
```

2. Use correct connection settings in pgAdmin:
   - Host: `talastock-warehouse` (not `localhost`)
   - Port: `5432` (internal port, not 5433)
   - Database: `talastock_warehouse`
   - Username: `warehouse_user`
   - Password: `warehouse_pass`

3. If still failing, check network:
```bash
docker network inspect data-platform
```

---

### Issue 6: Task Stuck in "Running" State

**Symptom:**
- Task shows as running but never completes
- No progress in logs

**Cause:**
- Infinite loop in task code
- Waiting for external resource
- Deadlock

**Solution:**
1. Check task logs in Airflow UI
2. Kill the task:
```bash
# Find the task process
docker exec airflow-airflow-scheduler-1 ps aux | grep your_task

# Kill it
docker exec airflow-airflow-scheduler-1 kill <PID>
```
3. Mark task as failed and retry

---

### Issue 7: "No module named 'psycopg2'"

**Symptom:**
- Task fails with `ModuleNotFoundError: No module named 'psycopg2'`

**Cause:**
- Missing Python package in Airflow container

**Solution:**
1. Add to `airflow/requirements.txt`:
```
psycopg2-binary==2.9.9
```

2. Rebuild Airflow:
```bash
cd data-platform/airflow
docker-compose down
docker-compose up -d --build
```

---

### Issue 8: Permission Denied Errors

**Symptom:**
- Task fails with "Permission denied"
- Can't write to directory

**Cause:**
- File permissions in Docker volume

**Solution:**
```bash
# Fix permissions
docker exec -u root airflow-airflow-scheduler-1 chmod -R 777 /opt/airflow/data-generator/
```

---

## General Debugging Tips

### Check Container Status
```bash
# List all containers
docker ps -a

# Check specific container
docker ps --filter "name=airflow"
docker ps --filter "name=talastock"
```

### View Logs
```bash
# Airflow webserver
docker logs airflow-airflow-webserver-1 --tail 100

# Airflow scheduler
docker logs airflow-airflow-scheduler-1 --tail 100

# Warehouse
docker logs talastock-warehouse --tail 100

# pgAdmin
docker logs talastock-pgadmin --tail 100
```

### Restart Everything
```bash
# Restart Airflow
cd data-platform/airflow
docker-compose restart

# Restart warehouse
cd data-platform/warehouse
docker-compose restart

# Full restart (if needed)
docker-compose down
docker-compose up -d
```

### Access Container Shell
```bash
# Airflow scheduler
docker exec -it airflow-airflow-scheduler-1 bash

# Warehouse
docker exec -it talastock-warehouse bash

# pgAdmin
docker exec -it talastock-pgadmin sh
```

### Check Network Connectivity
```bash
# From Airflow to warehouse
docker exec airflow-airflow-scheduler-1 ping talastock-warehouse

# Check DNS resolution
docker exec airflow-airflow-scheduler-1 nslookup talastock-warehouse
```

---

## Quick Reference

### Airflow Commands
```bash
# List DAGs
docker exec airflow-airflow-scheduler-1 airflow dags list

# Test a task
docker exec airflow-airflow-scheduler-1 airflow tasks test dag_id task_id 2026-05-04

# Trigger a DAG
docker exec airflow-airflow-scheduler-1 airflow dags trigger dag_id

# Pause/unpause DAG
docker exec airflow-airflow-scheduler-1 airflow dags pause dag_id
docker exec airflow-airflow-scheduler-1 airflow dags unpause dag_id
```

### PostgreSQL Commands
```bash
# Connect to warehouse
docker exec -it talastock-warehouse psql -U warehouse_user -d talastock_warehouse

# Run a query
docker exec talastock-warehouse psql -U warehouse_user -d talastock_warehouse -c "SELECT COUNT(*) FROM analytics.fact_sales;"

# Backup database
docker exec talastock-warehouse pg_dump -U warehouse_user talastock_warehouse > backup.sql

# Restore database
docker exec -i talastock-warehouse psql -U warehouse_user talastock_warehouse < backup.sql
```

---

## Getting Help

1. **Check the logs first** - Most issues show up in logs
2. **Read error messages carefully** - They usually tell you what's wrong
3. **Search the error message** - Someone else has probably had the same issue
4. **Check Docker status** - Make sure containers are running
5. **Verify network connectivity** - Containers need to talk to each other

---

**Last Updated:** May 4, 2026  
**Status:** Active troubleshooting guide
