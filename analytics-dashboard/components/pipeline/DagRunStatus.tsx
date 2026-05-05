'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, CheckCircle2, XCircle, Clock, SkipForward, RefreshCw } from 'lucide-react'

interface DagRun {
  dag_run_id: string
  dag_id: string
  state: 'queued' | 'running' | 'success' | 'failed' | 'skipped'
  execution_date: string
  start_date: string | null
  end_date: string | null
}

interface ActiveRun {
  runId: string
  dagId: string
}

interface DagRunStatusProps {
  activeRuns: ActiveRun[]
}

const DAG_LABELS: Record<string, string> = {
  data_generator_pipeline: 'Data Generator',
  sales_etl_pipeline:      'Sales ETL',
  warehouse_etl_pipeline:  'Warehouse ETL',
  dbt_pipeline:            'dbt Transform',
}

const STATE_CONFIG = {
  queued:  { label: 'Queued',   color: '#FBBF24', Icon: Clock },
  running: { label: 'Running',  color: '#60A5FA', Icon: Loader2 },
  success: { label: 'Success',  color: '#4ADE80', Icon: CheckCircle2 },
  failed:  { label: 'Failed',   color: '#F87171', Icon: XCircle },
  skipped: { label: 'Skipped',  color: '#9B6DFF', Icon: SkipForward },
} as const

const POLL_INTERVAL_MS = 5000  // poll every 5 seconds while runs are active

export function DagRunStatus({ activeRuns }: DagRunStatusProps) {
  const [runs, setRuns] = useState<Record<string, DagRun>>({})
  const [polling, setPolling] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (activeRuns.length === 0) return

    setPolling(true)
    const results = await Promise.allSettled(
      activeRuns.map(({ runId, dagId }) =>
        fetch(`/api/airflow/status?dag_id=${dagId}&run_id=${encodeURIComponent(runId)}`)
          .then(r => r.ok ? r.json() as Promise<DagRun> : null)
      )
    )

    const updated: Record<string, DagRun> = {}
    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        updated[activeRuns[i].runId] = result.value
      }
    })

    setRuns(prev => ({ ...prev, ...updated }))
    setPolling(false)
  }, [activeRuns])

  // Initial fetch + polling while any run is active
  useEffect(() => {
    if (activeRuns.length === 0) return

    fetchStatus()

    const hasActiveRun = Object.values(runs).some(
      r => r.state === 'queued' || r.state === 'running'
    )

    if (!hasActiveRun && Object.keys(runs).length > 0) return

    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [activeRuns, fetchStatus, runs])

  if (activeRuns.length === 0) return null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--card-bg)' }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Active Runs</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Live status — polling every 5 seconds
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <RefreshCw className={`w-3 h-3 ${polling ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Run rows */}
      <div className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
        {activeRuns.map(({ runId, dagId }) => {
          const run = runs[runId]
          const state = run?.state ?? 'queued'
          const cfg = STATE_CONFIG[state] ?? STATE_CONFIG.queued
          const { Icon } = cfg

          const elapsed = run?.start_date
            ? formatElapsed(run.start_date, run.end_date)
            : null

          return (
            <div key={runId} className="px-5 py-4 flex items-center gap-4">
              {/* Status icon */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${cfg.color}18` }}
              >
                <Icon
                  className={`w-4 h-4 ${state === 'running' ? 'animate-spin' : ''}`}
                  style={{ color: cfg.color }}
                />
              </div>

              {/* DAG name + run ID */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                  {DAG_LABELS[dagId] ?? dagId}
                </p>
                <p className="text-[10px] font-mono truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {runId}
                </p>
              </div>

              {/* Elapsed */}
              {elapsed && (
                <span className="text-xs tabular-nums flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {elapsed}
                </span>
              )}

              {/* State badge */}
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{
                  background: `${cfg.color}18`,
                  color: cfg.color,
                  border: `1px solid ${cfg.color}30`,
                }}
              >
                {cfg.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────

function formatElapsed(startDate: string, endDate: string | null): string {
  const start = new Date(startDate).getTime()
  const end   = endDate ? new Date(endDate).getTime() : Date.now()
  const secs  = Math.floor((end - start) / 1000)

  if (secs < 60)  return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
}
