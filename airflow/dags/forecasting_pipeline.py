"""
Forecasting Pipeline DAG - Sales Revenue Forecasting

Generates 30-day revenue forecasts per product category using a
linear trend model with business-pattern multipliers:
  - Weekend boost  (+20%)
  - Payday boost   (+50% on 15th and 30th/31st)
  - 7-day rolling average as baseline

Flow:
  1. validate_warehouse   — check forecast tables exist, create if not
  2. evaluate_accuracy    — score previous forecasts against actuals
  3. train_and_forecast   — fit model per category, write forecast_sales
  4. report_summary       — log MAPE, RMSE, row counts

Triggered by: dbt_pipeline (via TriggerDagRunOperator) or manually.
Schedule: weekly (Sunday 03:00) to retrain on fresh data.

Author: Talastock Data Platform Team
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

# ── Config ────────────────────────────────────────────────────

WAREHOUSE_CONFIG = {
    'host':     'talastock-warehouse',
    'port':     5432,
    'database': 'talastock_warehouse',
    'user':     'warehouse_user',
    'password': 'warehouse_pass',
}

FORECAST_HORIZON_DAYS = 30
MIN_HISTORY_DAYS      = 14   # need at least 2 weeks to fit a trend
CONFIDENCE_LEVEL      = 0.80  # 80% prediction interval

# Business-pattern multipliers (match data-generator config)
WEEKEND_MULTIPLIER = 1.20
PAYDAY_MULTIPLIER  = 1.50   # applied on 15th and 30th/31st

# ── Default args ──────────────────────────────────────────────

default_args = {
    'owner':            'talastock',
    'depends_on_past':  False,
    'email_on_failure': False,
    'email_on_retry':   False,
    'retries':          1,
    'retry_delay':      timedelta(minutes=5),
}

# ── DAG ───────────────────────────────────────────────────────

dag = DAG(
    'forecasting_pipeline',
    default_args=default_args,
    description='Weekly sales forecasting — linear trend per category with business multipliers',
    schedule_interval='0 3 * * 0',   # Every Sunday at 03:00
    start_date=datetime(2026, 5, 1),
    catchup=False,
    tags=['forecast', 'ml', 'production'],
)

# ── Task 1: Validate warehouse ────────────────────────────────

def validate_warehouse():
    """Ensure forecast tables exist; create them if missing."""
    import psycopg2

    print("=" * 60)
    print("TASK 1: Validating Warehouse — Forecast Tables")
    print("=" * 60)

    conn = psycopg2.connect(**WAREHOUSE_CONFIG)
    cur  = conn.cursor()

    try:
        # forecast_sales
        cur.execute("""
            CREATE TABLE IF NOT EXISTS analytics.forecast_sales (
                id                  SERIAL PRIMARY KEY,
                forecast_date       DATE           NOT NULL,
                category            VARCHAR(100)   NOT NULL,
                predicted_revenue   NUMERIC(12, 2) NOT NULL,
                predicted_units     INTEGER        NOT NULL,
                confidence_lower    NUMERIC(12, 2) NOT NULL,
                confidence_upper    NUMERIC(12, 2) NOT NULL,
                model_version       VARCHAR(50)    NOT NULL DEFAULT 'linear_trend_v1',
                trained_on_days     INTEGER        NOT NULL,
                mape                NUMERIC(6, 3),
                rmse                NUMERIC(12, 4),
                generated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                dag_run_id          VARCHAR(255),
                UNIQUE (forecast_date, category)
            )
        """)

        # forecast_accuracy
        cur.execute("""
            CREATE TABLE IF NOT EXISTS analytics.forecast_accuracy (
                id                  SERIAL PRIMARY KEY,
                forecast_date       DATE           NOT NULL,
                category            VARCHAR(100)   NOT NULL,
                predicted_revenue   NUMERIC(12, 2) NOT NULL,
                actual_revenue      NUMERIC(12, 2) NOT NULL,
                absolute_error      NUMERIC(12, 2),
                pct_error           NUMERIC(8, 4),
                evaluated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (forecast_date, category)
            )
        """)

        conn.commit()
        print("✅ Forecast tables ready")

        # Check how much historical data we have
        cur.execute("SELECT COUNT(*), MIN(date), MAX(date) FROM analytics.daily_sales_summary")
        row = cur.fetchone()
        print(f"\n📊 Historical data: {row[0]} days ({row[1]} → {row[2]})")

        if row[0] < MIN_HISTORY_DAYS:
            raise ValueError(
                f"Not enough history: {row[0]} days < {MIN_HISTORY_DAYS} minimum. "
                "Run the full pipeline first to generate data."
            )

        print("✅ Sufficient history for forecasting")
        print("=" * 60)

    finally:
        cur.close()
        conn.close()


validate_task = PythonOperator(
    task_id='validate_warehouse',
    python_callable=validate_warehouse,
    dag=dag,
)

# ── Task 2: Evaluate previous forecast accuracy ───────────────

def evaluate_accuracy(**context):
    """
    Compare previous forecasts against actuals that have now arrived.
    Writes to forecast_accuracy and logs MAPE per category.
    """
    import psycopg2
    from psycopg2.extras import execute_values

    print("=" * 60)
    print("TASK 2: Evaluating Previous Forecast Accuracy")
    print("=" * 60)

    conn = psycopg2.connect(**WAREHOUSE_CONFIG)
    cur  = conn.cursor()

    try:
        # Find forecasts where actuals now exist
        cur.execute("""
            SELECT
                f.forecast_date,
                f.category,
                f.predicted_revenue,
                d.total_revenue AS actual_revenue
            FROM analytics.forecast_sales f
            JOIN analytics.daily_sales_summary d
              ON f.forecast_date = d.date
             AND f.category = (
                 -- Map category forecast to daily summary via fact_sales
                 SELECT p.category
                 FROM analytics.fact_sales fs
                 JOIN analytics.dim_products p ON fs.product_key = p.product_key
                 JOIN analytics.dim_dates    dd ON fs.date_key    = dd.date_key
                 WHERE dd.date = f.forecast_date
                   AND p.category = f.category
                 LIMIT 1
             )
            WHERE f.forecast_date <= CURRENT_DATE
              AND NOT EXISTS (
                  SELECT 1 FROM analytics.forecast_accuracy a
                  WHERE a.forecast_date = f.forecast_date
                    AND a.category      = f.category
              )
        """)
        rows = cur.fetchall()

        if not rows:
            print("ℹ️  No new actuals to evaluate yet")
            print("=" * 60)
            return

        records = []
        for forecast_date, category, predicted, actual in rows:
            abs_err = abs(float(actual) - float(predicted))
            pct_err = (abs_err / float(actual) * 100) if float(actual) > 0 else None
            records.append((forecast_date, category, predicted, actual, abs_err, pct_err))

        execute_values(cur, """
            INSERT INTO analytics.forecast_accuracy
                (forecast_date, category, predicted_revenue, actual_revenue,
                 absolute_error, pct_error)
            VALUES %s
            ON CONFLICT (forecast_date, category) DO NOTHING
        """, records)
        conn.commit()

        # Log summary
        mape_values = [r[5] for r in records if r[5] is not None]
        if mape_values:
            overall_mape = sum(mape_values) / len(mape_values)
            print(f"\n📈 Evaluated {len(records)} forecast-actual pairs")
            print(f"   Overall MAPE: {overall_mape:.2f}%")
        print("✅ Accuracy evaluation complete")
        print("=" * 60)

    finally:
        cur.close()
        conn.close()


evaluate_task = PythonOperator(
    task_id='evaluate_accuracy',
    python_callable=evaluate_accuracy,
    dag=dag,
)

# ── Task 3: Train model and generate forecasts ────────────────

def train_and_forecast(**context):
    """
    For each category:
      1. Pull daily revenue from daily_sales_summary + category breakdown
      2. Fit linear trend on the last 60 days
      3. Apply weekend / payday multipliers to each forecast date
      4. Compute 80% prediction interval from residual std
      5. Upsert into forecast_sales
    """
    import psycopg2
    from psycopg2.extras import execute_values
    import numpy as np
    from datetime import date, timedelta
    import math

    print("=" * 60)
    print("TASK 3: Training Models & Generating Forecasts")
    print("=" * 60)

    dag_run_id = context.get('dag_run').run_id if context.get('dag_run') else 'manual'

    conn = psycopg2.connect(**WAREHOUSE_CONFIG)
    cur  = conn.cursor()

    try:
        # ── Pull category-level daily revenue ─────────────────
        # We aggregate fact_sales by date + category for the last 90 days
        cur.execute("""
            SELECT
                d.date,
                p.category,
                SUM(f.total_amount)::float  AS revenue,
                SUM(f.quantity)::int        AS units
            FROM analytics.fact_sales f
            JOIN analytics.dim_products p ON f.product_key = p.product_key
            JOIN analytics.dim_dates    d ON f.date_key    = d.date_key
            WHERE d.date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.date, p.category
            ORDER BY p.category, d.date
        """)
        rows = cur.fetchall()

        if not rows:
            raise ValueError("No sales data found in the last 90 days")

        # Organise by category
        from collections import defaultdict
        cat_data: dict[str, list] = defaultdict(list)
        for sale_date, category, revenue, units in rows:
            cat_data[category].append((sale_date, revenue, units))

        print(f"\n📦 Categories found: {list(cat_data.keys())}")

        # ── Forecast horizon ──────────────────────────────────
        today      = date.today()
        start_date = today + timedelta(days=1)
        end_date   = today + timedelta(days=FORECAST_HORIZON_DAYS)

        forecast_records = []
        model_metrics    = {}

        for category, history in cat_data.items():
            history.sort(key=lambda x: x[0])

            if len(history) < MIN_HISTORY_DAYS:
                print(f"  ⚠️  {category}: only {len(history)} days — skipping")
                continue

            dates    = [h[0] for h in history]
            revenues = [h[1] for h in history]
            units    = [h[2] for h in history]

            # ── Linear trend fit ──────────────────────────────
            # x = day index (0, 1, 2, …), y = revenue
            x = np.arange(len(revenues), dtype=float)
            y = np.array(revenues, dtype=float)

            # Least-squares: y = slope * x + intercept
            x_mean = x.mean()
            y_mean = y.mean()
            slope     = np.sum((x - x_mean) * (y - y_mean)) / np.sum((x - x_mean) ** 2)
            intercept = y_mean - slope * x_mean

            # Residuals for prediction interval
            y_pred_train = slope * x + intercept
            residuals    = y - y_pred_train
            residual_std = residuals.std()

            # MAPE on training data
            nonzero = y > 0
            mape = float(np.mean(np.abs(residuals[nonzero] / y[nonzero])) * 100) if nonzero.any() else 0.0
            rmse = float(np.sqrt(np.mean(residuals ** 2)))

            # Average units-per-revenue ratio for unit prediction
            avg_units_per_revenue = (
                np.mean(np.array(units, dtype=float) / np.where(y > 0, y, 1))
            )

            model_metrics[category] = {'mape': round(mape, 3), 'rmse': round(rmse, 4)}
            trained_on_days = len(history)

            # 80% CI z-score ≈ 1.282
            z = 1.282

            # ── Generate forecasts ────────────────────────────
            forecast_day = start_date
            day_offset   = len(history)  # continue from end of training

            while forecast_day <= end_date:
                # Base prediction from linear trend
                base = slope * day_offset + intercept
                base = max(base, 0.0)  # revenue can't be negative

                # Business multipliers
                multiplier = 1.0
                weekday = forecast_day.weekday()  # 0=Mon, 6=Sun
                if weekday >= 5:  # Saturday or Sunday
                    multiplier *= WEEKEND_MULTIPLIER

                dom = forecast_day.day  # day of month
                if dom in (15, 30, 31):
                    multiplier *= PAYDAY_MULTIPLIER

                predicted_revenue = round(base * multiplier, 2)

                # Prediction interval (scale by multiplier too)
                margin = z * residual_std * multiplier
                lower  = round(max(predicted_revenue - margin, 0.0), 2)
                upper  = round(predicted_revenue + margin, 2)

                predicted_units = max(1, round(predicted_revenue * avg_units_per_revenue))

                forecast_records.append((
                    forecast_day,
                    category,
                    predicted_revenue,
                    predicted_units,
                    lower,
                    upper,
                    'linear_trend_v1',
                    trained_on_days,
                    round(mape, 3),
                    round(rmse, 4),
                    datetime.now(),
                    dag_run_id,
                ))

                forecast_day += timedelta(days=1)
                day_offset   += 1

            print(f"  ✅ {category}: MAPE={mape:.1f}%  RMSE=₱{rmse:,.0f}  ({trained_on_days} training days)")

        # ── Upsert forecasts ──────────────────────────────────
        if forecast_records:
            execute_values(cur, """
                INSERT INTO analytics.forecast_sales (
                    forecast_date, category,
                    predicted_revenue, predicted_units,
                    confidence_lower, confidence_upper,
                    model_version, trained_on_days,
                    mape, rmse,
                    generated_at, dag_run_id
                ) VALUES %s
                ON CONFLICT (forecast_date, category)
                DO UPDATE SET
                    predicted_revenue = EXCLUDED.predicted_revenue,
                    predicted_units   = EXCLUDED.predicted_units,
                    confidence_lower  = EXCLUDED.confidence_lower,
                    confidence_upper  = EXCLUDED.confidence_upper,
                    mape              = EXCLUDED.mape,
                    rmse              = EXCLUDED.rmse,
                    generated_at      = EXCLUDED.generated_at,
                    dag_run_id        = EXCLUDED.dag_run_id
            """, forecast_records)
            conn.commit()

            print(f"\n✅ Upserted {len(forecast_records)} forecast rows")
            print(f"   Horizon: {start_date} → {end_date}")
        else:
            print("⚠️  No forecast records generated")

        # Push metrics to XCom for the report task
        context['ti'].xcom_push(key='model_metrics', value=model_metrics)
        context['ti'].xcom_push(key='forecast_count', value=len(forecast_records))

        print("=" * 60)

    finally:
        cur.close()
        conn.close()


forecast_task = PythonOperator(
    task_id='train_and_forecast',
    python_callable=train_and_forecast,
    dag=dag,
)

# ── Task 4: Report summary ────────────────────────────────────

def report_summary(**context):
    """Log final summary of the forecasting run."""
    import psycopg2

    print("=" * 60)
    print("TASK 4: Forecasting Pipeline Complete — Summary")
    print("=" * 60)

    metrics       = context['ti'].xcom_pull(key='model_metrics',  task_ids='train_and_forecast') or {}
    forecast_count = context['ti'].xcom_pull(key='forecast_count', task_ids='train_and_forecast') or 0

    print(f"\n📊 Forecast rows written: {forecast_count}")
    print(f"   Horizon: {FORECAST_HORIZON_DAYS} days")

    if metrics:
        print("\n🎯 Model Accuracy (training data):")
        for cat, m in metrics.items():
            print(f"   {cat:<20} MAPE={m['mape']:.1f}%  RMSE=₱{m['rmse']:,.0f}")

        avg_mape = sum(m['mape'] for m in metrics.values()) / len(metrics)
        print(f"\n   Average MAPE: {avg_mape:.1f}%")
        grade = "Excellent" if avg_mape < 10 else "Good" if avg_mape < 20 else "Fair"
        print(f"   Model grade : {grade}")

    # Quick DB check
    try:
        conn = psycopg2.connect(**WAREHOUSE_CONFIG)
        cur  = conn.cursor()
        cur.execute("""
            SELECT category, COUNT(*) AS days, MIN(forecast_date), MAX(forecast_date)
            FROM analytics.forecast_sales
            WHERE forecast_date >= CURRENT_DATE
            GROUP BY category ORDER BY category
        """)
        rows = cur.fetchall()
        print("\n📅 Active forecasts in warehouse:")
        for cat, days, min_d, max_d in rows:
            print(f"   {cat:<20} {days} days  ({min_d} → {max_d})")
        conn.close()
    except Exception as e:
        print(f"⚠️  Could not query warehouse: {e}")

    print("\n✅ Forecasting pipeline complete!")
    print("   View results at: /forecast in the analytics dashboard")
    print("=" * 60)


summary_task = PythonOperator(
    task_id='report_summary',
    python_callable=report_summary,
    dag=dag,
)

# ── Task dependencies ─────────────────────────────────────────
#
#  validate_warehouse
#         ↓
#  evaluate_accuracy
#         ↓
#  train_and_forecast
#         ↓
#   report_summary
#

validate_task >> evaluate_task >> forecast_task >> summary_task
