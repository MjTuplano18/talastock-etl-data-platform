'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Search, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { ProductPerformance } from '@/types'

const PAGE_SIZE = 15

type SortKey = 'revenue_rank' | 'total_revenue' | 'total_profit' | 'profit_margin_pct' | 'total_units_sold'
type SortDir = 'asc' | 'desc'

interface Column {
  key: SortKey | null
  label: string
}

const COLUMNS: Column[] = [
  { key: 'revenue_rank',      label: 'Rank'     },
  { key: null,                label: 'Product'  },
  { key: null,                label: 'Category' },
  { key: 'total_revenue',     label: 'Revenue'  },
  { key: 'total_profit',      label: 'Profit'   },
  { key: 'profit_margin_pct', label: 'Margin'   },
  { key: 'total_units_sold',  label: 'Units'    },
]

interface Props {
  data: ProductPerformance[]
  categories: string[]
}

export function ProductsTable({ data, categories }: Props) {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('all')
  const [sortKey, setSortKey]   = useState<SortKey>('revenue_rank')
  const [sortDir, setSortDir]   = useState<SortDir>('asc')

  function handleSort(key: SortKey | null) {
    if (!key) return
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const filtered = useMemo(() => {
    let rows = data.filter(row => {
      const matchSearch = !search ||
        row.product_name.toLowerCase().includes(search.toLowerCase()) ||
        row.sku.toLowerCase().includes(search.toLowerCase())
      const matchCat = category === 'all' || row.category === category
      return matchSearch && matchCat
    })

    rows = [...rows].sort((a, b) => {
      const av = Number(a[sortKey])
      const bv = Number(b[sortKey])
      return sortDir === 'asc' ? av - bv : bv - av
    })

    return rows
  }, [data, search, category, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage   = Math.min(page, Math.max(1, totalPages))
  const start      = (safePage - 1) * PAGE_SIZE
  const pageData   = filtered.slice(start, start + PAGE_SIZE)

  function SortIcon({ col }: { col: Column }) {
    if (!col.key) return null
    if (sortKey !== col.key) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3" style={{ color: 'var(--accent)' }} />
      : <ChevronDown className="w-3 h-3" style={{ color: 'var(--accent)' }} />
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search product or SKU…"
            className="w-full pl-8 pr-8 py-2 rounded-xl text-xs outline-none transition-all"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#E8547A60')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="all">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {COLUMNS.map(col => (
                <th
                  key={col.label}
                  className="text-left py-3 px-2 text-xs font-medium select-none"
                  style={{
                    color: sortKey === col.key ? 'var(--text)' : 'var(--text-muted)',
                    cursor: col.key ? 'pointer' : 'default',
                  }}
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm"
                  style={{ color: 'var(--text-muted)' }}>
                  No products match your search
                </td>
              </tr>
            ) : pageData.map(row => (
              <tr key={row.product_key}
                className="transition-colors cursor-default"
                style={{ borderBottom: '1px solid var(--border-soft)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-row)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="py-2.5 px-2 tabular-nums text-xs" style={{ color: 'var(--text-muted)' }}>
                  #{row.revenue_rank}
                </td>
                <td className="py-2.5 px-2">
                  <p className="font-medium" style={{ color: 'var(--text)' }}>{row.product_name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{row.sku}</p>
                </td>
                <td className="py-2.5 px-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(155,109,255,0.1)', color: 'var(--purple)', border: '1px solid rgba(155,109,255,0.25)' }}>
                    {row.category}
                  </span>
                </td>
                <td className="py-2.5 px-2 tabular-nums font-medium" style={{ color: 'var(--accent)' }}>
                  {formatCurrency(Number(row.total_revenue))}
                </td>
                <td className="py-2.5 px-2 tabular-nums" style={{ color: 'var(--green)' }}>
                  {formatCurrency(Number(row.total_profit))}
                </td>
                <td className="py-2.5 px-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {row.profit_margin_pct}%
                </td>
                <td className="py-2.5 px-2 tabular-nums" style={{ color: 'var(--text)' }}>
                  {formatNumber(row.total_units_sold)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Showing <span style={{ color: 'var(--text)' }}>{start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)}</span>
            {' '}of <span style={{ color: 'var(--text)' }}>{filtered.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i-1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) => p === '...'
                ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs"
                    style={{ color: 'var(--text-muted)' }}>…</span>
                : <button key={p} onClick={() => setPage(p as number)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium"
                    style={safePage === p
                      ? { background: 'linear-gradient(135deg, #E8547A, #9B6DFF)', color: '#fff' }
                      : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
                    }>{p}</button>
              )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
