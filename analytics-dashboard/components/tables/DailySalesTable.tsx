'use client'

import { formatCurrency, formatNumber } from '@/lib/utils'
import type { DailySalesSummary } from '@/types'

export function DailySalesTable({ data }: { data: DailySalesSummary[] }) {
  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="overflow-x-auto max-h-96 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0" style={{ background: 'var(--surface-2)' }}>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Date', 'Revenue', 'Profit', 'Margin', 'Transactions', 'Units', 'Avg Order'].map(h => (
              <th key={h} className="text-left py-3 px-2 text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => (
            <tr key={row.date}
              className="transition-colors cursor-default"
              style={{ borderBottom: '1px solid var(--border-soft)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-row)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <td className="py-2.5 px-2 font-medium tabular-nums" style={{ color: 'var(--text)' }}>{row.date}</td>
              <td className="py-2.5 px-2 tabular-nums font-medium" style={{ color: 'var(--accent)' }}>{formatCurrency(Number(row.total_revenue))}</td>
              <td className="py-2.5 px-2 tabular-nums" style={{ color: 'var(--green)' }}>{formatCurrency(Number(row.total_profit))}</td>
              <td className="py-2.5 px-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>{row.profit_margin_pct}%</td>
              <td className="py-2.5 px-2 tabular-nums" style={{ color: 'var(--text)' }}>{formatNumber(row.total_transactions)}</td>
              <td className="py-2.5 px-2 tabular-nums" style={{ color: 'var(--text)' }}>{formatNumber(row.total_units_sold)}</td>
              <td className="py-2.5 px-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>{formatCurrency(Number(row.average_transaction_value))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
