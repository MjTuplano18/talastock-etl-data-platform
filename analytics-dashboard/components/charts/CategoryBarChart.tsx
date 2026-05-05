'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { CategoryPerformance } from '@/types'

const COLORS = ['#E8547A', '#9B6DFF', '#5B8DEF', '#4ADE80', '#FBBF24']

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as CategoryPerformance
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    }}>
      <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>{d.category}</p>
      <p style={{ color: 'var(--text-muted)' }}>Revenue: <span style={{ color: 'var(--accent)' }}>₱{Number(d.total_revenue).toLocaleString()}</span></p>
      <p style={{ color: 'var(--text-muted)' }}>Margin: <span style={{ color: 'var(--green)' }}>{d.profit_margin_pct}%</span></p>
    </div>
  )
}

export function CategoryBarChart({ data }: { data: CategoryPerformance[] }) {
  const formatted = data.map(d => ({ ...d, total_revenue: Number(d.total_revenue) }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 4 }} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false}
          tickFormatter={v => v.length > 8 ? v.slice(0,8)+'…' : v} height={28} />
        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false}
          tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} width={48} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover-row)' }} />
        <Bar dataKey="total_revenue" radius={[6, 6, 0, 0]}>
          {formatted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
