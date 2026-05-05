# Pipeline 5 — Sales Forecasting

**DAG ID**: `forecasting_pipeline`  
**Schedule**: Every Sunday at 03:00 (`0 3 * * 0`)  
**Triggered by**: `dbt_pipeline` on success  
**File**: `airflow/dags/forecasting_pipeline.py`

---

## What it does

Trains a per-category revenue forecasting model using the last 90 days of sales data from the warehouse. Generates 30-day predictions with an 80% confidence interval and writes them to `analytics.forecast_sales`. Also scores previous forecasts against actuals that have since arrived.

---

## Task flow

```
validate_warehouse      ← creates forecast tables if missing, checks history
        │
evaluate_accuracy       ← scores past forecasts against actuals
        │
train_and_forecast      ← fits model per category, writes forecast_sales
        │
report_summary          ← logs MAPE, RMSE, active forecast counts
```

![Forecasting pipeline graph view](visuals/airflow-forecasting..png)

---

## Forecasting model

### Algorithm: Ordinary Least Squares (OLS) linear regression

No external ML libraries. Only NumPy, which is already in the Airflow container.

For each category:

1. Pull daily revenue from `fact_sales` joined to `dim_products` and `dim_dates` for the last 90 days
2. Fit a linear trend: `revenue = slope × day_index + intercept`
3. Apply business multipliers to each forecast date
4. Compute an 80% prediction interval from the residual standard deviation

```python
# Least-squares fit
x = np.arange(len(revenues))
slope     = np.sum((x - x.mean()) * (y - y.mean())) / np.sum((x - x.mean()) ** 2)
intercept = y.mean() - slope * x.mean()

# Prediction interval (80% CI, z = 1.282)
margin = 1.282 * residual_std * multiplier
lower  = max(predicted - margin, 0)
upper  = predicted + margin
```

### Business multipliers

Applied on top of the linear trend to capture known patterns:

| Condition | Multiplier | Rationale |
|---|---|---|
| Saturday or Sunday | ×1.20 | Weekend sales boost |
| 15th of month | ×1.50 | Payday (semi-monthly) |
| 30th or 31st of month | ×1.50 | Payday (end of month) |

### Accuracy metrics

| Metric | Formula | Interpretation |
|---|---|---|
| MAPE | `mean(|actual - predicted| / actual) × 100` | % error — lower is better |
| RMSE | `sqrt(mean((actual - predicted)²))` | Error in ₱ — lower is better |

MAPE grades: < 10% = Excellent, 10–20% = Good, > 20% = Fair.

---

## Minimum history requirement

The pipeline requires at least **14 days** of historical data per category. If a category has fewer days, it is skipped with a warning. Run the full pipeline chain at least once before triggering forecasting.

---

## Output tables

### `analytics.forecast_sales`

One row per `(forecast_date, category)`. Upserted on every run.

| Column | Type | Description |
|---|---|---|
| `forecast_date` | DATE | The date being predicted |
| `category` | VARCHAR | Product category |
| `predicted_revenue` | NUMERIC | Point estimate |
| `predicted_units` | INTEGER | Estimated units sold |
| `confidence_lower` | NUMERIC | 80% CI lower bound |
| `confidence_upper` | NUMERIC | 80% CI upper bound |
| `model_version` | VARCHAR | `linear_trend_v1` |
| `trained_on_days` | INTEGER | Days of history used |
| `mape` | NUMERIC | Training MAPE % |
| `rmse` | NUMERIC | Training RMSE in ₱ |
| `generated_at` | TIMESTAMP | When this forecast was created |
| `dag_run_id` | VARCHAR | Airflow run ID for traceability |

### `analytics.forecast_accuracy`

Populated when actuals arrive for previously forecasted dates.

| Column | Type | Description |
|---|---|---|
| `forecast_date` | DATE | The date that was forecasted |
| `category` | VARCHAR | Product category |
| `predicted_revenue` | NUMERIC | What we predicted |
| `actual_revenue` | NUMERIC | What actually happened |
| `absolute_error` | NUMERIC | `|actual - predicted|` (computed column) |
| `pct_error` | NUMERIC | `|actual - predicted| / actual × 100` (computed column) |

---

## Dashboard integration

The forecast is visualised at `/forecast` in the analytics dashboard.

- **Category tabs** — switch between categories
- **Forecast chart** — actual revenue (blue line) + predicted revenue (pink dashed) + 80% CI band
- **Today reference line** — separates historical from future
- **Category summary table** — 30-day total, daily average, MAPE per category
- **Horizon selector** — 7, 14, 30, or 60 days

The page handles the "no forecasts yet" state gracefully with a prompt to trigger the DAG.

---

## Triggering manually

**From Airflow UI:**
1. Go to http://localhost:8080
2. Find `forecasting_pipeline`
3. Click **▶ Trigger DAG**

**From the dashboard:**
1. Go to http://localhost:3001/pipeline
2. Expand **Pipeline Controls**
3. Click **Trigger** on the Forecasting card (Step 05)

**From the command line:**
```bash
docker exec airflow-airflow-scheduler-1 \
  airflow dags trigger forecasting_pipeline
```

---

## Upgrading to Prophet

The current model is intentionally simple — OLS with multipliers. If you want to upgrade to Facebook Prophet:

1. Add `prophet` to `_PIP_ADDITIONAL_REQUIREMENTS` in `airflow/docker-compose.yml`
2. Replace the fitting logic in `train_and_forecast()` with:

```python
from prophet import Prophet

df = pd.DataFrame({'ds': dates, 'y': revenues})
m = Prophet(weekly_seasonality=True, yearly_seasonality=False)
m.add_seasonality(name='payday', period=15, fourier_order=3)
m.fit(df)

future = m.make_future_dataframe(periods=30)
forecast = m.predict(future)
```

The output schema (`forecast_sales` table) stays the same — only the fitting logic changes.
