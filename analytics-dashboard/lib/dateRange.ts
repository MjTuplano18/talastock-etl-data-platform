export type RangeKey = '30d' | '90d' | '6m' | '1y' | 'all'

export const RANGE_OPTIONS: { label: string; value: RangeKey }[] = [
  { label: '30D',  value: '30d' },
  { label: '90D',  value: '90d' },
  { label: '6M',   value: '6m'  },
  { label: '1Y',   value: '1y'  },
  { label: 'All',  value: 'all' },
]

export function getDateBounds(range: RangeKey): { from: string | null; to: string | null } {
  if (range === 'all') return { from: null, to: null }

  const to   = new Date()
  const from = new Date()

  switch (range) {
    case '30d': from.setDate(to.getDate() - 30);        break
    case '90d': from.setDate(to.getDate() - 90);        break
    case '6m':  from.setMonth(to.getMonth() - 6);       break
    case '1y':  from.setFullYear(to.getFullYear() - 1); break
  }

  return {
    from: from.toISOString().split('T')[0],
    to:   to.toISOString().split('T')[0],
  }
}

export function parseRange(param: string | undefined): RangeKey {
  const valid: RangeKey[] = ['30d', '90d', '6m', '1y', 'all']
  return valid.includes(param as RangeKey) ? (param as RangeKey) : 'all'
}

/**
 * Resolve the active date bounds from URL search params.
 * Custom from/to takes priority over preset range.
 */
export function resolveDateBounds(searchParams: {
  from?: string
  to?: string
  range?: string
}): { from: string | null; to: string | null } {
  // Custom date range from picker
  if (searchParams.from && searchParams.to) {
    return { from: searchParams.from, to: searchParams.to }
  }
  // Preset range
  if (searchParams.range) {
    return getDateBounds(parseRange(searchParams.range))
  }
  // Default: all time
  return { from: null, to: null }
}
