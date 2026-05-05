'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2, SkipForward } from 'lucide-react'
import type { DagRunHistory, AirflowDagRun } from '@/types'

const DAG_META: Record<string, { label: string; color: string; step: string }> = {
  data_generator_pipeline: { label: 'Data Generator', color: '#FBBF24', step: '01' },
  sales_etl_pipeline:      { label: 'Sales ETL',       color: '#60A5FA', step: '02' },
  warehouse_etl_pipeline:  { label: 'Warehouse ETL',   color: '#9B6DFF', step: '03' },
  dbt_pipeline:            { label: 'dbt Transform',   color: '#4ADE80', step: '04' },
  forecasting_pipeline:    { label: 'Forecasting',     color: '#F472B6', step: '05' },
}

const STATE_CFG = {
  success: { label: 'Success', color: '#4ADE80', Icon: CheckCircle2 },
  failed:  { label: 'Failed',  color: '#F87171', Icon: XCircle },
  running: { label: 'Running', color: '#60A5FA', Icon: Loader2 },
  queued:  { label: 'Queued',  color: '#FBBF24', Icon: Clock },
  skipped: { label: 'Skipped', color: '#9B6DFF', Icon: SkipForward },
} as const

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '—'
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  const secs = Math.floor((e - s) / 1000)
  if (secs < 60)   return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
}

function formatAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 0)  return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0)  return `${mins}m ago`
  return 'just now'
}

export function DagRunHistory() {
  const [data, setData]       = useState<DagRunHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchRuns = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/airflow/runs?limit=5')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRuns() }, [fetchRuns])

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--card-bg)' }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>DAG Run History</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Last 5 runs per pipeline</p>
        </div>
        <button
          onClick={fetchRuns}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="px-5 py-4 text-xs" style={{ color: '#F87171' }}>
          Could not reach Airflow: {error}
        </div>
      )}

      {/* DAG rows */}
      <div className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
        {(loading && data.length === 0 ? Object.keys(DAG_META) : data.map(d => d.dag_id)).map(dagId => {
          const meta = DAG_META[dagId]
          const dagData = data.find(d => d.dag_id === dagId)
          const runs: AirflowDagRun[] = dagData?.runs ?? []
          const latest = runs[0]
          const latestCfg = latest ? (STATE_CFG[latest.state] ?? STATE_CFG.queued) : null

          return (
            <div key={dagId} className="px-5 py-4">
              {/* DAG header row */}
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}
                >
                  {meta.step}
                </span>
                <span className="text-sm font-medium flex-1" style={{ color: 'var(--text)' }}>
                  {meta.label}
                </span>
                {latestCfg && latest && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <latestCfg.Icon
                      className={`w-3.5 h-3.5 ${latest.state === 'running' ? 'animate-spin' : ''}`}
                      style={{ color: latestCfg.color }}
                    />
                    <span className="text-xs" style={{ color: latestCfg.color }}>{latestCfg.label}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      · {formatAgo(latest.end_date ?? latest.start_date)}
                    </span>
                  </div>
                )}
                {!latestCfg && !loading && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No runs yet</span>
                )}
              </div>

              {/* Run dots */}
              {runs.length > 0 && (
                <div className="flex items-center gap-2 pl-9">
                  {runs.map((run, i) => {
                    const cfg = STATE_CFG[run.state] ?? STATE_CFG.queued
                    const { Icon } = cfg
                    return (
                      <div
                        key={run.dag_run_id}
                        className="group relative flex flex-col items-center gap-1"
                        title={`${run.state} · ${formatDuration(run.start_date, run.end_date)} · ${formatAgo(run.end_date ?? run.start_date)}`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-default"
                          style={{
                            background: `${cfg.color}18`,
                            border: `1px solid ${cfg.color}30`,
                            opacity: i === 0 ? 1 : 0.6 + (runs.length - i) * 0.08,
                          }}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 ${run.state === 'running' ? 'animate-spin' : ''}`}
                            style={{ color: cfg.color }}
                          />
                        </div>
                        <span className="text-[9px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {formatDuration(run.start_date, run.end_date)}
                        </span>

                        {/* Tooltip */}
                        <div
                          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px]"
                          style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                          }}
                        >
                          <p className="font-medium" style={{ color: cfg.color }}>{cfg.label}</p>
                          <p style={{ color: 'var(--text-muted)' }}>{formatAgo(run.end_date ?? run.start_date)}</p>
                          <p style={{ color: 'var(--text-muted)' }}>Duration: {formatDuration(run.start_date, run.end_date)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {loading && runs.length === 0 && (
                <div className="flex gap-2 pl-9">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-7 h-7 rounded-lg animate-pulse"
                      style={{ background: 'var(--border)' }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
