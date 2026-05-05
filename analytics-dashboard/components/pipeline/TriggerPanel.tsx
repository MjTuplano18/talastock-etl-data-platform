'use client'

import { useState } from 'react'
import { Play, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface TriggerResult {
  dag_run_id: string
  state: string
  execution_date: string
}

interface TriggerPanelProps {
  onTriggered?: (runId: string, dagId: string) => void
}

const DAGS = [
  {
    id: 'data_generator_pipeline',
    label: 'Data Generator',
    description: 'Generate fresh synthetic sales & product data',
    step: '01',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.22)',
    hasParams: true,
  },
  {
    id: 'sales_etl_pipeline',
    label: 'Sales ETL',
    description: 'Clean & transform raw CSVs into processed data',
    step: '02',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.22)',
    hasParams: false,
  },
  {
    id: 'warehouse_etl_pipeline',
    label: 'Warehouse ETL',
    description: 'Load cleaned data into the PostgreSQL warehouse',
    step: '03',
    color: '#9B6DFF',
    bg: 'rgba(155,109,255,0.08)',
    border: 'rgba(155,109,255,0.22)',
    hasParams: false,
  },
  {
    id: 'dbt_pipeline',
    label: 'dbt Transform',
    description: 'Rebuild all dbt models and run data quality tests',
    step: '04',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.22)',
    hasParams: false,
  },
] as const

type DagId = typeof DAGS[number]['id']

interface TriggerState {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
  runId?: string
}

export function TriggerPanel({ onTriggered }: TriggerPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [products, setProducts] = useState(100)
  const [sales, setSales] = useState(10000)
  const [months, setMonths] = useState(6)
  const [triggerStates, setTriggerStates] = useState<Record<DagId, TriggerState>>({
    data_generator_pipeline: { status: 'idle' },
    sales_etl_pipeline:      { status: 'idle' },
    warehouse_etl_pipeline:  { status: 'idle' },
    dbt_pipeline:            { status: 'idle' },
  })

  function setDagState(dagId: DagId, state: TriggerState) {
    setTriggerStates(prev => ({ ...prev, [dagId]: state }))
  }

  async function triggerDag(dagId: DagId, conf: Record<string, unknown> = {}) {
    setDagState(dagId, { status: 'loading' })

    try {
      const res = await fetch('/api/airflow/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dag_id: dagId, conf }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        setDagState(dagId, {
          status: 'error',
          message: err.error ?? `HTTP ${res.status}`,
        })
        return
      }

      const data: TriggerResult = await res.json()
      setDagState(dagId, {
        status: 'success',
        message: `Run started`,
        runId: data.dag_run_id,
      })

      onTriggered?.(data.dag_run_id, dagId)

      // Reset to idle after 8 seconds
      setTimeout(() => setDagState(dagId, { status: 'idle' }), 8000)
    } catch {
      setDagState(dagId, { status: 'error', message: 'Could not reach Airflow' })
    }
  }

  function handleTrigger(dagId: DagId) {
    const conf = dagId === 'data_generator_pipeline'
      ? { products, sales, months }
      : {}
    triggerDag(dagId, conf)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--card-bg)' }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ borderBottom: expanded ? '1px solid var(--border)' : 'none' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-row)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(232,84,122,0.12)' }}
          >
            <Play className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Pipeline Controls
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Trigger DAGs manually from the dashboard
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
        }
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="p-5 space-y-4">

          {/* Data generator params */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#FBBF24' }}>
              Generator Parameters
            </p>
            <div className="grid grid-cols-3 gap-3">
              <ParamInput
                label="Products"
                value={products}
                min={10}
                max={500}
                onChange={setProducts}
              />
              <ParamInput
                label="Sales Records"
                value={sales}
                min={1000}
                max={100000}
                step={1000}
                onChange={setSales}
              />
              <ParamInput
                label="Months"
                value={months}
                min={1}
                max={24}
                onChange={setMonths}
              />
            </div>
          </div>

          {/* DAG trigger buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {DAGS.map(dag => {
              const state = triggerStates[dag.id]
              return (
                <DagTriggerCard
                  key={dag.id}
                  dag={dag}
                  state={state}
                  onTrigger={() => handleTrigger(dag.id)}
                />
              )
            })}
          </div>

          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Triggering Data Generator automatically chains → Sales ETL → Warehouse ETL → dbt Transform.
            You can also trigger each stage independently.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

interface ParamInputProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}

function ParamInput({ label, value, min, max, step = 1, onChange }: ParamInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
        className="w-full rounded-lg px-3 py-2 text-sm tabular-nums outline-none transition-all"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = '#FBBF24')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}

interface DagTriggerCardProps {
  dag: typeof DAGS[number]
  state: TriggerState
  onTrigger: () => void
}

function DagTriggerCard({ dag, state, onTrigger }: DagTriggerCardProps) {
  const isLoading = state.status === 'loading'
  const isSuccess = state.status === 'success'
  const isError   = state.status === 'error'

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: dag.bg, border: `1px solid ${dag.border}` }}
    >
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: dag.color }}>
          Step {dag.step}
        </p>
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{dag.label}</p>
        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {dag.description}
        </p>
      </div>

      {/* Status message */}
      {(isSuccess || isError) && (
        <div className="flex items-center gap-1.5">
          {isSuccess
            ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4ADE80' }} />
            : <XCircle     className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#F87171' }} />
          }
          <span className="text-[11px]" style={{ color: isSuccess ? '#4ADE80' : '#F87171' }}>
            {state.message}
          </span>
        </div>
      )}

      <button
        onClick={onTrigger}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: isLoading ? `${dag.color}30` : dag.color,
          color: isLoading ? dag.color : '#000',
          opacity: isLoading ? 0.8 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Play className="w-3.5 h-3.5" />
        }
        {isLoading ? 'Triggering…' : 'Trigger'}
      </button>
    </div>
  )
}
