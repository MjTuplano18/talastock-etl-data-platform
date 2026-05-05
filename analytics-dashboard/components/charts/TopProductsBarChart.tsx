'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ProductPerformance } from '@/types'

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ProductPerformance
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      fontFamily: 'Inter, sans-serif',
    }}>
      <p style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 4 }}>{d.product_name}</p>
      <p style={{ color: 'var(--text-muted)' }}>Revenue: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>₱{Number(d.total_revenue).toLocaleString()}</span></p>
      <p style={{ color: 'var(--text-muted)' }}>Units: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{d.total_units_sold.toLocaleString()}</span></p>
      <p style={{ color: 'var(--text-muted)' }}>Margin: <span style={{ color: 'var(--green)', fontWeight: 700 }}>{d.profit_margin_pct}%</span></p>
    </div>
  )
}

export function TopProductsBarChart({ data }: { data: ProductPerformance[] }) {
  const [mode, setMode] = useState<'top' | 'bottom'>('top')

  const sorted = [...data].sort((a, b) => Number(b.total_revenue) - Number(a.total_revenue))
  const displayed = mode === 'top' ? sorted.slice(0, 10) : sorted.slice(-10).reverse()
  const formatted = displayed.map(d => ({
    ...d,
    total_revenue: Number(d.total_revenue),
    shortName: d.product_name.split(' ').slice(0, 2).join(' '),
  }))

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center gap-1 mb-4 w-fit p-1 rounded-xl"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {(['top', 'bottom'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={mode === m ? {
              background: 'linear-gradient(135deg, #E8547A, #9B6DFF)',
              color: '#fff',
            } : {
              color: 'var(--text-muted)',
            }}>
            {m === 'top' ? 'Top 10' : 'Bottom 10'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 60 }} barSize={26}>
          <defs>
            <linearGradient id="barGradTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#E8547A" />
              <stop offset="100%" stopColor="#9B6DFF" />
            </linearGradient>
            <linearGradient id="barGradBottom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#F87171" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="shortName" stroke="var(--text-muted)" fontSize={9} tickLine={false}
            axisLine={false} angle={-40} textAnchor="end" interval={0} height={70} />
          <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false}
            tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} width={48} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover-row)' }} />
          <Bar dataKey="total_revenue" radius={[6, 6, 0, 0]}>
            {formatted.map((_, i) => (
              <Cell key={i}
                fill={mode === 'top'
                  ? (i === 0 ? 'url(#barGradTop)' : i < 3 ? '#E8547A' : '#9B6DFF')
                  : (i === 0 ? 'url(#barGradBottom)' : '#F8717180')
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
