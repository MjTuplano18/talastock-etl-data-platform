'use client'

interface PageHeaderProps {
  title: string
  subtitle: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-1 h-5 rounded-full"
          style={{ background: 'linear-gradient(180deg, #E8547A, #9B6DFF)' }} />
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </h1>
      </div>
      <p className="text-xs pl-4" style={{ color: 'var(--text-muted)' }}>
        {subtitle}
      </p>
    </div>
  )
}
