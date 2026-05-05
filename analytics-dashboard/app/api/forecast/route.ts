import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { ForecastRow, ForecastActualRow, ForecastSummary } from '@/types'

// GET /api/forecast?category=Food&days=30
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')  // optional filter
  const days     = Math.min(parseInt(searchParams.get('days') ?? '30'), 90)

  try {
    // ── Check if forecast table exists ────────────────────────
    const [tableCheck] = await query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'analytics'
          AND table_name   = 'forecast_sales'
      ) AS exists
    `)

    if (!tableCheck.exists) {
      return NextResponse.json({
        forecasts:  [],
        actuals:    [],
        summaries:  [],
        has_data:   false,
        message:    'Forecast table not yet created. Run the forecasting_pipeline DAG first.',
      })
    }

    // ── Future forecasts ──────────────────────────────────────
    const catFilter = category ? `AND category = '${category.replace(/'/g, "''")}'` : ''

    const forecasts = await query<ForecastRow>(`
      SELECT
        TO_CHAR(forecast_date, 'YYYY-MM-DD') AS forecast_date,
        category,
        predicted_revenue::float,
        predicted_units::int,
        confidence_lower::float,
        confidence_upper::float,
        model_version,
        mape::float,
        rmse::float,
        TO_CHAR(generated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS generated_at
      FROM analytics.forecast_sales
      WHERE forecast_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
        ${catFilter}
      ORDER BY category, forecast_date
    `)

    // ── Historical actuals + overlapping forecasts ────────────
    // Last 30 days of actuals joined with any forecasts for those dates
    const actuals = await query<ForecastActualRow>(`
      SELECT
        TO_CHAR(d.date, 'YYYY-MM-DD') AS date,
        p.category,
        SUM(f.total_amount)::float     AS actual_revenue,
        fs.predicted_revenue::float    AS predicted_revenue,
        fs.confidence_lower::float     AS confidence_lower,
        fs.confidence_upper::float     AS confidence_upper
      FROM analytics.fact_sales f
      JOIN analytics.dim_products p ON f.product_key = p.product_key
      JOIN analytics.dim_dates    d ON f.date_key    = d.date_key
      LEFT JOIN analytics.forecast_sales fs
             ON fs.forecast_date = d.date
            AND fs.category      = p.category
      WHERE d.date >= CURRENT_DATE - INTERVAL '30 days'
        AND d.date <  CURRENT_DATE
        ${catFilter ? catFilter.replace('category', 'p.category') : ''}
      GROUP BY d.date, p.category, fs.predicted_revenue, fs.confidence_lower, fs.confidence_upper
      ORDER BY p.category, d.date
    `)

    // ── Per-category summaries ────────────────────────────────
    const summaries = await query<ForecastSummary>(`
      SELECT
        category,
        SUM(predicted_revenue)::float                          AS total_predicted_30d,
        ROUND(AVG(predicted_revenue)::numeric, 2)::float       AS avg_daily_predicted,
        ROUND(AVG(mape)::numeric, 2)::float                    AS mape,
        COUNT(*)::int                                          AS days_forecasted
      FROM analytics.forecast_sales
      WHERE forecast_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
        ${catFilter}
      GROUP BY category
      ORDER BY total_predicted_30d DESC
    `)

    return NextResponse.json({
      forecasts,
      actuals,
      summaries,
      has_data:    forecasts.length > 0,
      horizon_days: days,
    })
  } catch (err) {
    console.error('Forecast API error:', err)
    return NextResponse.json({ error: 'Failed to fetch forecast data' }, { status: 500 })
  }
}
