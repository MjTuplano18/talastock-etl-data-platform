'use client'

import { Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { RANGE_OPTIONS, type RangeKey } from '@/lib/dateRange'

interface RangeFilterProps {
  current: RangeKey
}

function RangeFilterInner({ current }: RangeFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function select(value: RangeKey) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      {RANGE_OPTIONS.map(opt => {
        const active = current === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => select(opt.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
            style={active ? {
              background: 'linear-gradient(135deg, #E8547A, #9B6DFF)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(232,84,122,0.3)',
            } : {
              color: 'var(--text-muted)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function RangeFilter({ current }: RangeFilterProps) {
  return (
    <Suspense fallback={<div className="h-9 w-48 rounded-xl animate-pulse" style={{ background: 'var(--surface-2)' }} />}>
      <RangeFilterInner current={current} />
    </Suspense>
  )
}
