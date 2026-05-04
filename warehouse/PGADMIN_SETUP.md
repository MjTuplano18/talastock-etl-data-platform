# pgAdmin Setup Guide

## 🎨 Access pgAdmin

pgAdmin is now running! Open your browser and go to:

```
http://localhost:5050
```

**Login Credentials:**
- Email: `admin@talastock.com`
- Password: `admin`

---

## 🔌 Connect to the Warehouse

Once you're logged into pgAdmin, follow these steps:

### Step 1: Add New Server

1. Right-click on **"Servers"** in the left sidebar
2. Click **"Register" → "Server..."**

### Step 2: General Tab

- **Name**: `Talastock Warehouse`

### Step 3: Connection Tab

Fill in these details:

- **Host name/address**: `talastock-warehouse` (the container name)
- **Port**: `5432` (internal Docker port, not 5433)
- **Maintenance database**: `talastock_warehouse`
- **Username**: `warehouse_user`
- **Password**: `warehouse_pass`
- ✅ Check **"Save password"**

### Step 4: Click Save

You should now see the warehouse connected!

---

## 📊 Explore the Database

### View Schemas

1. Expand **"Talastock Warehouse"**
2. Expand **"Databases"**
3. Expand **"talastock_warehouse"**
4. Expand **"Schemas"**

You'll see:
- ✅ `raw` - Raw data layer
- ✅ `staging` - Cleaned data layer
- ✅ `analytics` - Star schema layer

### View Tables

1. Expand any schema (e.g., `analytics`)
2. Expand **"Tables"**
3. You'll see all tables:
   - `fact_sales`
   - `dim_products`
   - `dim_dates`
   - `dim_times`
   - `daily_sales_summary`
   - `product_performance`
   - `category_performance`

### View Table Structure

1. Right-click on any table
2. Click **"Properties"**
3. Go to **"Columns"** tab to see all fields

### View Data (when loaded)

1. Right-click on any table
2. Click **"View/Edit Data" → "All Rows"**
3. See the data in a nice grid

### Run SQL Queries

1. Right-click on **"talastock_warehouse"**
2. Click **"Query Tool"**
3. Write SQL and click **Execute** (▶️)

Example query:
```sql
SELECT * FROM analytics.fact_sales LIMIT 10;
```

---

## 🎨 Cool Features to Try

### 1. ER Diagram (Visual Schema)

1. Right-click on **"talastock_warehouse"**
2. Click **"ERD For Database"**
3. See a visual diagram of all tables and relationships!

### 2. Table Statistics

1. Right-click on any table
2. Click **"Properties"**
3. Go to **"Statistics"** tab
4. See row counts, size, indexes

### 3. Export Data

1. Right-click on any table
2. Click **"Import/Export Data"**
3. Export to CSV, Excel, etc.

### 4. Backup Database

1. Right-click on **"talastock_warehouse"**
2. Click **"Backup..."**
3. Save a backup file

---

## 🚀 Quick Tips

### Refresh View
If you don't see new tables/data:
- Right-click on **"Tables"**
- Click **"Refresh"**

### Dark Mode
- Click the **gear icon** (⚙️) in top right
- Go to **"Preferences"**
- Change theme to **"Dark"**

### Multiple Query Tabs
- Click **"Query Tool"** multiple times
- Each opens a new tab
- Run different queries simultaneously

---

## 🐛 Troubleshooting

### Can't connect to warehouse?

Make sure both containers are running:
```bash
docker ps --filter "name=talastock"
```

Both should show "Up" status.

### Connection refused?

Use `talastock-warehouse` as hostname (not `localhost`).
Docker containers communicate using container names.

### Forgot password?

Check `docker-compose.yml` for credentials:
- User: `warehouse_user`
- Password: `warehouse_pass`

---

## 📝 What's Next?

Once we load data into the warehouse, you'll be able to:
- ✅ Browse 10,073 sales records
- ✅ View 100 products
- ✅ See pre-calculated metrics
- ✅ Run analytics queries
- ✅ Create visual reports
- ✅ Export data to Excel

---

**Enjoy exploring your data warehouse!** 🎉
