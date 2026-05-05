'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface HourlyData {
  hour: number
  transactions: number
  revenue: number
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as HourlyData
  const label = d.hour === 0 ? '12 AM' : d.hour < 12 ? `${d.hour} AM` : d.hour === 12 ? '12 PM' : `${d.hour - 12} PM`
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    }}>
      <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--text-muted)' }}>Transactions: <span style={{ color: 'var(--purple)' }}>{d.transactions.toLocaleString()}</span></p>
      <p style={{ color: 'var(--text-muted)' }}>Revenue: <span style={{ color: 'var(--accent)' }}>₱{d.revenue.toLocaleString()}</span></p>
    </div>
  )
}

// Peak hours: 7-9 AM, 11 AM-1 PM, 5-8 PM
function isPeak(hour: number) {
  return (hour >= 7 && hour <= 9) || (hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 20)
}

function hourLabel(h: number) {
  if (h === 0)  return '12 AM'
  if (h < 12)   return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

export function HourlySalesChart({ data }: { data: HourlyData[] }) {
  const filled = Array.from({ length: 24 }, (_, h) => {
    const found = data.find(d => d.hour === h)
    return found ?? { hour: h, transactions: 0, revenue: 0 }
  })

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={filled} margin={{ top: 4, right: 4, left: 0, bottom: 4 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="hour"
          stroke="var(--text-muted)"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={hourLabel}
          interval={1}
          height={28}
        />
        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover-row)' }} />
        <Bar dataKey="transactions" radius={[4, 4, 0, 0]}>
          {filled.map((d, i) => (
            <Cell key={i} fill={isPeak(d.hour) ? '#E8547A' : '#9B6DFF50'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
