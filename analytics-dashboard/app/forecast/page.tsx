'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, AlertTriangle, RefreshCw,
  Brain, Target, Calendar,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ForecastChart } from '@/components/charts/ForecastChart'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { ForecastRow, ForecastActualRow, ForecastSummary } from '@/types'

// ── Types ─────────────────────────────────────────────────────

interface ForecastData {
  forecasts:    ForecastRow[]
  actuals:      ForecastActualRow[]
  summaries:    ForecastSummary[]
  has_data:     boolean
  horizon_days: number
  message?:     string
}

// ── Category colours ──────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  Food:          '#FBBF24',
  Beverage:      '#60A5FA',
  Essentials:    '#4ADE80',
  'Personal Care': '#F472B6',
  Household:     '#9B6DFF',
  Snacks:        '#FB923C',
}

function catColor(cat: string) {
  return CAT_COLORS[cat] ?? '#888'
}

// ── Page ──────────────────────────────────────────────────────

export default function ForecastPage() {
  const [data, setData]           = useState<ForecastData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [horizon, setHorizon]     = useState(30)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/forecast?days=${horizon}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: ForecastData = await res.json()
      setData(json)
      // Default to first category
      if (!activeCategory && json.summaries.length > 0) {
        setActiveCategory(json.summaries[0].category)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [horizon, activeCategory])

  useEffect(() => { fetchData() }, [fetchData])

  const categories = data?.summaries.map(s => s.category) ?? []
  const selectedSummary = data?.summaries.find(s => s.category === activeCategory)

  // Total 30-day forecast across all categories
  const totalForecast = data?.summaries.reduce((sum, s) => sum + s.total_predicted_30d, 0) ?? 0
  const avgMape = data?.summaries.length
    ? data.summaries.reduce((sum, s) => sum + (s.mape ?? 0), 0) / data.summaries.length
    : null

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Sales Forecast"
          subtitle="30-day revenue predictions per category using linear trend + business multipliers"
        />
        <div className="flex items-center gap-2">
          {/* Horizon selector */}
          <select
            value={horizon}
            onChange={e => setHorizon(Number(e.target.value))}
            className="rounded-xl px-3 py-2 text-xs outline-none"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
          </select>

          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── No data state ───────────────────────────────────── */}
      {!loading && data && !data.has_data && (
        <div
          className="rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4"
          style={{ border: '1px solid var(--border)', background: 'var(--card-bg)' }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(244,114,182,0.12)' }}>
            <Brain className="w-6 h-6" style={{ color: '#F472B6' }} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
              No forecasts yet
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {data.message ?? 'Trigger the forecasting_pipeline DAG from the Pipeline page to generate predictions.'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl px-4 py-3 text-xs flex items-center gap-2"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171' }}>
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI row ────────────────────────────────────────── */}
      {data?.has_data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Total forecast */}
            <div className="rounded-2xl p-4"
              style={{ background: 'var(--card-bg)', border: '1px solid rgba(244,114,182,0.25)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(244,114,182,0.12)' }}>
                <TrendingUp className="w-4 h-4" style={{ color: '#F472B6' }} />
              </div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                {horizon}-Day Forecast
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                {loading ? '—' : formatCurrency(totalForecast)}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#F472B6' }}>
                total predicted revenue
              </p>
            </div>

            {/* Categories */}
            <div className="rounded-2xl p-4"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(96,165,250,0.12)' }}>
                <Target className="w-4 h-4" style={{ color: '#60A5FA' }} />
              </div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Categories</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                {loading ? '—' : categories.length}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>models trained</p>
            </div>

            {/* Model accuracy */}
            <div className="rounded-2xl p-4"
              style={{
                background: 'var(--card-bg)',
                border: avgMape != null && avgMape < 20
                  ? '1px solid rgba(74,222,128,0.25)'
                  : '1px solid rgba(251,191,36,0.25)',
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                style={{ background: avgMape != null && avgMape < 20 ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.12)' }}>
                <Brain className="w-4 h-4"
                  style={{ color: avgMape != null && avgMape < 20 ? '#4ADE80' : '#FBBF24' }} />
              </div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Avg MAPE</p>
              <p className="text-2xl font-bold tabular-nums"
                style={{ color: avgMape != null && avgMape < 20 ? '#4ADE80' : '#FBBF24' }}>
                {loading || avgMape == null ? '—' : `${avgMape.toFixed(1)}%`}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {avgMape != null ? (avgMape < 10 ? 'Excellent' : avgMape < 20 ? 'Good' : 'Fair') : ''}
              </p>
            </div>

            {/* Horizon */}
            <div className="rounded-2xl p-4"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(155,109,255,0.12)' }}>
                <Calendar className="w-4 h-4" style={{ color: '#9B6DFF' }} />
              </div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Horizon</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                {horizon}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>days ahead</p>
            </div>
          </div>

          {/* ── Category tabs + chart ───────────────────────── */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--card-bg)' }}>

            {/* Tab bar */}
            <div className="flex items-center gap-1 px-4 pt-4 pb-0 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all mb-1"
                  style={activeCategory === cat ? {
                    background: `${catColor(cat)}20`,
                    color: catColor(cat),
                    border: `1px solid ${catColor(cat)}40`,
                  } : {
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid transparent',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className="px-5 pt-4 pb-5">
              {activeCategory && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {activeCategory} — Revenue Forecast
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Last 30 days actual + next {horizon} days predicted · shaded area = 80% confidence interval
                      </p>
                    </div>
                    {selectedSummary && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold tabular-nums" style={{ color: catColor(activeCategory) }}>
                          {formatCurrency(selectedSummary.total_predicted_30d)}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {horizon}d forecast · MAPE {selectedSummary.mape?.toFixed(1) ?? '—'}%
                        </p>
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <div className="h-[300px] rounded-xl animate-pulse"
                      style={{ background: 'var(--border)' }} />
                  ) : (
                    <ForecastChart
                      actuals={data?.actuals ?? []}
                      forecasts={data?.forecasts ?? []}
                      category={activeCategory}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Category summary table ──────────────────────── */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--card-bg)' }}>

            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Forecast by Category
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {horizon}-day predicted revenue with model accuracy
              </p>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-5 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-2)' }}>
              <span className="col-span-2">Category</span>
              <span className="text-right">Daily Avg</span>
              <span className="text-right">{horizon}d Total</span>
              <span className="text-right">MAPE</span>
            </div>

            {(loading ? Array(5).fill(null) : data?.summaries ?? []).map((s, i) => (
              <div
                key={s?.category ?? i}
                className="grid grid-cols-5 px-5 py-3.5 items-center transition-colors cursor-default"
                style={{ borderBottom: i < (data?.summaries.length ?? 0) - 1 ? '1px solid var(--border-soft)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-row)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => s && setActiveCategory(s.category)}
              >
                {loading || !s ? (
                  <div className="col-span-5 h-4 rounded animate-pulse" style={{ background: 'var(--border)' }} />
                ) : (
                  <>
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: catColor(s.category) }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {s.category}
                      </span>
                    </div>
                    <span className="text-sm tabular-nums text-right" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(s.avg_daily_predicted)}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-right" style={{ color: catColor(s.category) }}>
                      {formatCurrency(s.total_predicted_30d)}
                    </span>
                    <span className="text-sm tabular-nums text-right"
                      style={{ color: s.mape != null && s.mape < 20 ? '#4ADE80' : '#FBBF24' }}>
                      {s.mape != null ? `${s.mape.toFixed(1)}%` : '—'}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
