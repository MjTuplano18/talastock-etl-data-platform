import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  color?: 'pink' | 'purple' | 'blue' | 'green' | 'amber'
  change?: number | null  // % change vs previous period, null = no comparison
}

const colorMap = {
  pink:   { var: 'var(--accent)',  bg: 'rgba(232,84,122,0.1)',  border: 'rgba(232,84,122,0.25)' },
  purple: { var: 'var(--purple)', bg: 'rgba(155,109,255,0.1)', border: 'rgba(155,109,255,0.25)' },
  blue:   { var: 'var(--blue)',   bg: 'rgba(91,141,239,0.1)',  border: 'rgba(91,141,239,0.25)'  },
  green:  { var: 'var(--green)',  bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)'  },
  amber:  { var: 'var(--amber)',  bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)'  },
}

export function MetricCard({ label, value, sub, icon: Icon, color = 'pink', change }: MetricCardProps) {
  const c = colorMap[color]

  const changeColor = change == null ? undefined
    : change > 0  ? 'var(--green)'
    : change < 0  ? '#F87171'
    : 'var(--text-muted)'

  const ChangeIcon = change == null ? null
    : change > 0  ? TrendingUp
    : change < 0  ? TrendingDown
    : Minus

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${c.border}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
      }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: c.bg }}>
        <Icon className="w-4 h-4" style={{ color: c.var }} />
      </div>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>{value}</p>

      {/* Period-over-period change */}
      {change != null && ChangeIcon && (
        <div className="flex items-center gap-1 mt-1.5">
          <ChangeIcon className="w-3 h-3" style={{ color: changeColor }} />
          <span className="text-[11px] font-medium" style={{ color: changeColor }}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>vs prev period</span>
        </div>
      )}

      {/* Sub text (shown when no change) */}
      {sub && change == null && (
        <p className="text-xs mt-1" style={{ color: c.var }}>{sub}</p>
      )}
    </div>
  )
}
