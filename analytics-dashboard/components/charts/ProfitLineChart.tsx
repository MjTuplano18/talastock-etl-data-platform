'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import type { DailySalesSummary } from '@/types'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)', color: 'var(--text-muted)',
    }}>
      <p style={{ marginBottom: 4 }}>{label}</p>
      <p>Profit: <span style={{ color: 'var(--purple)', fontWeight: 600 }}>
        ₱{Number(payload[0]?.value).toLocaleString()}
      </span></p>
    </div>
  )
}

export function ProfitLineChart({ data }: { data: DailySalesSummary[] }) {
  const formatted = data.map(d => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'MMM d'),
    total_profit: Number(d.total_profit),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#9B6DFF" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#5B8DEF" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="dateLabel" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" height={28} />
        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false}
          tickFormatter={v => `₱${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} width={48} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)' }} />
        <Area type="monotone" dataKey="total_profit" stroke="var(--purple)" strokeWidth={2.5}
          fill="url(#profGrad)" dot={false}
          activeDot={{ r: 5, fill: '#9B6DFF', strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
