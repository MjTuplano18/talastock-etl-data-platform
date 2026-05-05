export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 w-48 rounded-xl" style={{ background: 'var(--border)' }} />

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 h-28"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="w-9 h-9 rounded-xl mb-3" style={{ background: 'var(--border)' }} />
            <div className="h-3 w-16 rounded mb-2" style={{ background: 'var(--border)' }} />
            <div className="h-7 w-24 rounded" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>

      {/* Chart skeletons */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl h-80"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }} />
        <div className="rounded-2xl h-80"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }} />
      </div>
    </div>
  )
}
