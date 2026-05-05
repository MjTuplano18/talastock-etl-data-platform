# Pipeline 1 — Data Generator

**DAG ID**: `data_generator_pipeline`  
**Schedule**: Manual trigger only  
**Triggers**: `warehouse_etl_pipeline` on success  
**File**: `airflow/dags/data_generator_pipeline.py`

---

## What it does

Generates realistic synthetic sales and product data for a Filipino mini grocery. This simulates the "source system" — the data that would normally come from a POS or ERP.

The generated data intentionally includes real-world messiness: missing values, duplicate records, inconsistent column names, and wrong data types. This makes the downstream ETL pipelines meaningful to build and test.

---

## Task flow

```
validate_environment
        │
   generate_data          ← runs generate_data.py with configurable params
        │
   verify_output          ← checks that output files exist and have rows
        │
  report_summary          ← logs product count, sales count, total revenue
        │
trigger_warehouse_etl     ← fires warehouse_etl_pipeline automatically
```

![Data generator pipeline graph view](visuals/airflow-data-generator.png)

---

## Configurable parameters

You can override these when triggering the DAG manually via **Trigger DAG w/ config** in the Airflow UI, or from the dashboard Pipeline Controls panel.

| Parameter | Default | Description |
|---|---|---|
| `products` | 100 | Number of products to generate |
| `sales` | 10000 | Number of sales transactions |
| `months` | 6 | Date range for sales data |

Example config JSON:
```json
{ "products": 150, "sales": 20000, "months": 12 }
```

---

## Output files

All files are written to `data-generator/output/` inside the Airflow container (mounted from `data-platform/data-generator/output/`).

| File | Format | Description |
|---|---|---|
| `products.csv` | CSV | Product catalog (SKU, name, category, brand, price, cost) |
| `sales_standard.csv` | CSV | Clean sales transactions |
| `sales_variant1.csv` | CSV | Same data, different column names |
| `sales_variant2.csv` | CSV | Same data, different column order |
| `sales_api_format.json` | JSON | Nested API-style format |
| `sales_nested.json` | JSON | Deeply nested format |
| `sales_flat.json` | JSON | Flat JSON array |
| `sales_formatted.xlsx` | Excel | Multi-sheet workbook |
| `sales_messy_excel.xlsx` | Excel | Merged cells, inconsistent headers |
| `sales_alternative.tsv` | TSV | Tab-separated, different column order |
| `sales_messy_encoding.csv` | CSV | Mixed encoding issues |
| `DATA_DICTIONARY.md` | Markdown | Auto-generated field documentation |

---

## Data patterns

The generator applies realistic business patterns so the data is useful for analytics:

**Temporal patterns**
- Morning peak: 7–9 AM (breakfast rush) — 30% of daily sales
- Evening peak: 5–7 PM (dinner rush) — 40% of daily sales
- Night: 8–10 PM — 20% of daily sales
- Off-peak: 10 AM–5 PM — 10% of daily sales

**Day-of-week patterns**
- Saturday: +20% sales volume
- Sunday: +15% sales volume

**Payday patterns**
- 15th of month: +50% sales volume
- 30th/31st of month: +50% sales volume

**Product popularity (Pareto distribution)**
- Top 20% of products → 60% of sales
- Middle 30% → 30% of sales
- Bottom 50% → 10% of sales

**Intentional data quality issues**
- 8% missing values (product name, payment method)
- 2.5% duplicate transaction IDs
- 5% wrong data types (e.g. `"₱50.00"` instead of `50.00`)
- 3% invalid values (negative quantities, zero prices)

---

## Product catalog

Products are based on real Filipino brands across 5 categories:

| Category | Example brands |
|---|---|
| Food | Lucky Me, Nissin, Payless, Argentina |
| Beverage | Coca-Cola, Pepsi, Nescafé, San Miguel |
| Essentials | Datu Puti, Silver Swan, UFC, Del Monte |
| Household | Tide, Surf, Downy, Joy |
| Personal Care | Safeguard, Palmolive, Colgate, Head & Shoulders |

---

## How to trigger manually

**From Airflow UI:**
1. Go to http://localhost:8080
2. Find `data_generator_pipeline`
3. Click **▶** → **Trigger DAG w/ config**
4. Paste your config JSON (or leave empty for defaults)

**From the dashboard:**
1. Go to http://localhost:3001/pipeline
2. Expand **Pipeline Controls**
3. Set products / sales / months
4. Click **Trigger** on the Data Generator card

**From the command line:**
```bash
docker exec airflow-airflow-scheduler-1 \
  airflow dags trigger data_generator_pipeline \
  --conf '{"products": 100, "sales": 10000, "months": 6}'
```

---

## Key files

| File | Purpose |
|---|---|
| `data-generator/generate_data.py` | Main entry point, CLI args |
| `data-generator/config.py` | All generation parameters |
| `data-generator/generators/products.py` | Product generation logic |
| `data-generator/generators/sales.py` | Sales generation logic |
| `data-generator/generators/patterns.py` | Temporal pattern functions |
| `data-generator/generators/quality_issues.py` | Intentional data issues |
| `data-generator/exporters/` | One file per export format |
