interface ChartCardProps {
  title: string
  sub?: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, sub, children, className = '' }: ChartCardProps) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
      }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
      {children}
    </div>
  )
}
