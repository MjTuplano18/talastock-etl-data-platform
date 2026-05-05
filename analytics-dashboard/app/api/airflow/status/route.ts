import { NextRequest, NextResponse } from 'next/server'

const AIRFLOW_BASE = process.env.AIRFLOW_API_URL || 'http://localhost:8080'
const AIRFLOW_USER = process.env.AIRFLOW_USER    || 'airflow'
const AIRFLOW_PASS = process.env.AIRFLOW_PASS    || 'airflow'

const basicAuth = Buffer.from(`${AIRFLOW_USER}:${AIRFLOW_PASS}`).toString('base64')

// GET /api/airflow/status?dag_id=data_generator_pipeline&run_id=manual__2026-05-05T...
// Returns the latest run for a DAG, or a specific run if run_id is provided.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dag_id = searchParams.get('dag_id')
    const run_id = searchParams.get('run_id')

    if (!dag_id) {
      return NextResponse.json({ error: 'dag_id is required' }, { status: 400 })
    }

    let url: string
    if (run_id) {
      url = `${AIRFLOW_BASE}/api/v1/dags/${dag_id}/dagRuns/${encodeURIComponent(run_id)}`
    } else {
      // Fetch the most recent run
      url = `${AIRFLOW_BASE}/api/v1/dags/${dag_id}/dagRuns?limit=1&order_by=-execution_date`
    }

    const res = await fetch(url, {
      headers: { Authorization: `Basic ${basicAuth}` },
      // Don't cache — this is a live status poll
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `Airflow returned ${res.status}`, detail: text },
        { status: res.status }
      )
    }

    const data = await res.json()

    // Normalise: if we fetched the list, return the first item
    if (!run_id && data.dag_runs) {
      return NextResponse.json(data.dag_runs[0] ?? null)
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Airflow status route error:', err)
    return NextResponse.json({ error: 'Failed to reach Airflow' }, { status: 502 })
  }
}
