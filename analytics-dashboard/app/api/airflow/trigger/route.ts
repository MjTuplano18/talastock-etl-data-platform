import { NextRequest, NextResponse } from 'next/server'

const AIRFLOW_BASE = process.env.AIRFLOW_API_URL || 'http://localhost:8080'
const AIRFLOW_USER = process.env.AIRFLOW_USER    || 'airflow'
const AIRFLOW_PASS = process.env.AIRFLOW_PASS    || 'airflow'

const basicAuth = Buffer.from(`${AIRFLOW_USER}:${AIRFLOW_PASS}`).toString('base64')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dag_id, conf = {} } = body as { dag_id: string; conf?: Record<string, unknown> }

    if (!dag_id) {
      return NextResponse.json({ error: 'dag_id is required' }, { status: 400 })
    }

    const res = await fetch(`${AIRFLOW_BASE}/api/v1/dags/${dag_id}/dagRuns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({ conf }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`Airflow trigger error [${res.status}]:`, text)
      return NextResponse.json(
        { error: `Airflow returned ${res.status}`, detail: text },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Airflow trigger route error:', err)
    return NextResponse.json({ error: 'Failed to reach Airflow' }, { status: 502 })
  }
}
