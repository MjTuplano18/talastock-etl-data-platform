'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface CustomerTypeData {
  customer_type: string
  transactions: number
  revenue: number
  avg_order: number
}

const TYPE_COLORS: Record<string, string> = {
  'walk-in': '#E8547A',
  'regular': '#9B6DFF',
  'Unknown': '#7B7494',
}

const TYPE_LABELS: Record<string, string> = {
  'walk-in': 'Walk-in',
  'regular': 'Regular',
  'Unknown': 'Unknown',
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as CustomerTypeData
  const color = TYPE_COLORS[d.customer_type] ?? '#E8547A'
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    }}>
      <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>
        {TYPE_LABELS[d.customer_type] ?? d.customer_type}
      </p>
      <p style={{ color: 'var(--text-muted)' }}>Transactions: <span style={{ color }}>{d.transactions.toLocaleString()}</span></p>
      <p style={{ color: 'var(--text-muted)' }}>Revenue: <span style={{ color: 'var(--text)' }}>{formatCurrency(d.revenue)}</span></p>
      <p style={{ color: 'var(--text-muted)' }}>Avg order: <span style={{ color: 'var(--text)' }}>{formatCurrency(d.avg_order)}</span></p>
    </div>
  )
}

export function CustomerTypeChart({ data }: { data: CustomerTypeData[] }) {
  const formatted = data.map(d => ({
    ...d,
    label: TYPE_LABELS[d.customer_type] ?? d.customer_type,
    revenue: Number(d.revenue),
    avg_order: Number(d.avg_order),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 4 }} barSize={48}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10}
          tickLine={false} axisLine={false} height={28} />
        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover-row)' }} />
        <Bar dataKey="transactions" radius={[6, 6, 0, 0]}>
          {formatted.map((d, i) => (
            <Cell key={i} fill={TYPE_COLORS[d.customer_type] ?? '#7B7494'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
