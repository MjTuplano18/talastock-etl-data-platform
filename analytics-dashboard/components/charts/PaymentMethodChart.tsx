'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface PaymentData {
  method: string
  transactions: number
  revenue: number
  pct: number
}

const METHOD_COLORS: Record<string, string> = {
  Cash:    '#E8547A',
  GCash:   '#9B6DFF',
  Card:    '#5B8DEF',
  Unknown: '#7B7494',
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as PaymentData
  const color = METHOD_COLORS[d.method] ?? '#E8547A'
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    }}>
      <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>{d.method}</p>
      <p style={{ color: 'var(--text-muted)' }}>Transactions: <span style={{ color: 'var(--text)' }}>{d.transactions.toLocaleString()}</span></p>
      <p style={{ color: 'var(--text-muted)' }}>Revenue: <span style={{ color: 'var(--text)' }}>{formatCurrency(d.revenue)}</span></p>
      <p style={{ color: 'var(--text-muted)' }}>Share: <span style={{ color, fontWeight: 600 }}>{d.pct}%</span></p>
    </div>
  )
}

export function PaymentMethodChart({ data }: { data: PaymentData[] }) {
  const total = data.reduce((s, d) => s + d.transactions, 0)

  return (
    <div className="flex flex-col items-center gap-5">

      {/* Donut with center label */}
      <div className="relative" style={{ width: 200, height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="transactions"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={3}
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={METHOD_COLORS[d.method] ?? '#E8547A'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {total.toLocaleString()}
          </p>
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
            transactions
          </p>
        </div>
      </div>

      {/* Legend — centered, compact */}
      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        {data.map(d => {
          const color = METHOD_COLORS[d.method] ?? '#E8547A'
          return (
            <div key={d.method} className="flex items-center justify-between w-full gap-3">
              {/* Dot + name */}
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color }} />
                <span className="text-xs" style={{ color: 'var(--text)' }}>{d.method}</span>
              </div>

              {/* Txns + pct */}
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {d.transactions.toLocaleString()}
                </span>
                <span className="text-xs font-semibold tabular-nums w-10 text-right"
                  style={{ color }}>
                  {d.pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
