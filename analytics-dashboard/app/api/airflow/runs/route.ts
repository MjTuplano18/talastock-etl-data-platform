import { NextRequest, NextResponse } from 'next/server'

const AIRFLOW_BASE = process.env.AIRFLOW_API_URL || 'http://localhost:8080'
const AIRFLOW_USER = process.env.AIRFLOW_USER    || 'admin'
const AIRFLOW_PASS = process.env.AIRFLOW_PASS    || 'admin'

const basicAuth = Buffer.from(`${AIRFLOW_USER}:${AIRFLOW_PASS}`).toString('base64')

const DAG_IDS = [
  'data_generator_pipeline',
  'sales_etl_pipeline',
  'warehouse_etl_pipeline',
  'dbt_pipeline',
  'forecasting_pipeline',
]

// GET /api/airflow/runs?limit=5
// Returns the last N runs for every DAG, plus task instance counts.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5'), 20)

  try {
    const results = await Promise.allSettled(
      DAG_IDS.map(async (dag_id) => {
        const res = await fetch(
          `${AIRFLOW_BASE}/api/v1/dags/${dag_id}/dagRuns?limit=${limit}&order_by=-execution_date`,
          {
            headers: { Authorization: `Basic ${basicAuth}` },
            cache: 'no-store',
          }
        )
        if (!res.ok) return { dag_id, runs: [], error: `HTTP ${res.status}` }
        const data = await res.json()
        return { dag_id, runs: data.dag_runs ?? [] }
      })
    )

    const payload = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      return { dag_id: DAG_IDS[i], runs: [], error: 'fetch failed' }
    })

    return NextResponse.json(payload)
  } catch (err) {
    console.error('Airflow runs route error:', err)
    return NextResponse.json({ error: 'Failed to reach Airflow' }, { status: 502 })
  }
}
