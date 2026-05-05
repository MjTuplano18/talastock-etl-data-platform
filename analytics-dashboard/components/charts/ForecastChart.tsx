'use client'

import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { ForecastActualRow, ForecastRow } from '@/types'

interface ForecastChartProps {
  actuals:   ForecastActualRow[]
  forecasts: ForecastRow[]
  category:  string
}

interface ChartPoint {
  date:             string
  actual:           number | null
  predicted:        number | null
  lower:            number | null
  upper:            number | null
  isForecast:       boolean
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        minWidth: 160,
      }}
    >
      <p className="font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{label}</p>
      {payload.map((p: any) => {
        if (p.name === 'CI Band' || p.value == null) return null
        return (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span style={{ color: p.color ?? 'var(--text-muted)' }}>{p.name}</span>
            <span className="font-medium tabular-nums" style={{ color: 'var(--text)' }}>
              {formatCurrency(p.value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function ForecastChart({ actuals, forecasts, category }: ForecastChartProps) {
  // Merge actuals + forecasts into a single timeline
  const actualMap = new Map<string, ForecastActualRow>()
  for (const a of actuals.filter(r => r.category === category)) {
    actualMap.set(a.date, a)
  }

  const forecastMap = new Map<string, ForecastRow>()
  for (const f of forecasts.filter(r => r.category === category)) {
    forecastMap.set(f.forecast_date, f)
  }

  // Collect all dates
  const allDates = Array.from(
    new Set([...actualMap.keys(), ...forecastMap.keys()])
  ).sort()

  const data: ChartPoint[] = allDates.map(date => {
    const a = actualMap.get(date)
    const f = forecastMap.get(date)
    return {
      date:       date.slice(5),  // MM-DD
      actual:     a ? a.actual_revenue : null,
      predicted:  f ? f.predicted_revenue : (a?.predicted_revenue ?? null),
      lower:      f ? f.confidence_lower  : (a?.confidence_lower  ?? null),
      upper:      f ? f.confidence_upper  : (a?.confidence_upper  ?? null),
      isForecast: !!f && !a,
    }
  })

  // Find where forecast starts (first date without actual)
  const splitDate = data.find(d => d.isForecast)?.date ?? null

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data for {category}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

        <XAxis
          dataKey="date"
          stroke="var(--text-muted)"
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="var(--text-muted)"
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
          width={48}
        />

        <Tooltip content={<CustomTooltip />} />

        {/* Today reference line */}
        {splitDate && (
          <ReferenceLine
            x={splitDate}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            label={{ value: 'Today', position: 'top', fontSize: 9, fill: 'var(--text-muted)' }}
          />
        )}

        {/* Confidence interval band */}
        <Area
          type="monotone"
          dataKey="upper"
          stroke="none"
          fill="#F472B6"
          fillOpacity={0.12}
          name="CI Band"
          legendType="none"
          connectNulls
        />
        <Area
          type="monotone"
          dataKey="lower"
          stroke="none"
          fill="var(--bg)"
          fillOpacity={1}
          name="CI Band"
          legendType="none"
          connectNulls
        />

        {/* Actual revenue */}
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#60A5FA"
          strokeWidth={2}
          dot={false}
          name="Actual"
          connectNulls={false}
        />

        {/* Predicted revenue */}
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#F472B6"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          name="Forecast"
          connectNulls
        />

        <Legend
          wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 8 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
