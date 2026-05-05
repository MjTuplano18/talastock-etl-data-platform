'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         startOfWeek, endOfWeek, isSameMonth, isSameDay,
         isWithinInterval, parseISO, addMonths, subMonths } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { RANGE_OPTIONS, type RangeKey } from '@/lib/dateRange'

// ─── URL param helpers ────────────────────────────────────────
function toParam(d: Date) { return format(d, 'yyyy-MM-dd') }
function fromParam(s: string | null): Date | null {
  if (!s) return null
  try { return parseISO(s) } catch { return null }
}

// ─── Mini calendar ────────────────────────────────────────────
interface CalendarProps {
  month: Date
  from: Date | null
  to: Date | null
  onSelect: (d: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

function Calendar({ month, from, to, onSelect, onPrevMonth, onNextMonth }: CalendarProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end:   endOfWeek(endOfMonth(month),     { weekStartsOn: 1 }),
  })

  return (
    <div className="w-full">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrevMonth} className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-row)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {format(month, 'MMMM yyyy')}
        </span>
        <button onClick={onNextMonth} className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-row)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold py-1.5"
            style={{ color: 'var(--text-muted)' }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {days.map(day => {
          const isFrom  = from && isSameDay(day, from)
          const isTo    = to   && isSameDay(day, to)
          const inRange = from && to && isWithinInterval(day, { start: from, end: to })
          const isEdge  = isFrom || isTo
          const dimmed  = !isSameMonth(day, month)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className="relative h-9 w-full text-xs font-medium transition-all"
              style={{
                color:   dimmed ? 'var(--text-muted)' : isEdge ? '#fff' : 'var(--text)',
                opacity: dimmed ? 0.35 : 1,
                background: isEdge
                  ? 'linear-gradient(135deg, #E8547A, #9B6DFF)'
                  : inRange
                  ? 'rgba(155,109,255,0.15)'
                  : 'transparent',
                borderRadius: isFrom
                  ? '8px 0 0 8px'
                  : isTo
                  ? '0 8px 8px 0'
                  : inRange
                  ? '0'
                  : '8px',
              }}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main picker ──────────────────────────────────────────────
function DateRangePickerInner() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const fromParam = searchParams.get('from')
  const toParam   = searchParams.get('to')
  const rangeParam = searchParams.get('range') as RangeKey | null

  const [open, setOpen]       = useState(false)
  const [selecting, setSelecting] = useState<'from' | 'to'>('from')
  const [tempFrom, setTempFrom]   = useState<Date | null>(fromParam ? parseISO(fromParam) : null)
  const [tempTo,   setTempTo]     = useState<Date | null>(toParam   ? parseISO(toParam)   : null)
  const [month, setMonth]         = useState<Date>(tempFrom ?? new Date(2025, 10, 1)) // Nov 2025 default

  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleDaySelect(day: Date) {
    if (selecting === 'from') {
      setTempFrom(day)
      setTempTo(null)
      setSelecting('to')
    } else {
      if (tempFrom && day < tempFrom) {
        setTempFrom(day)
        setTempTo(tempFrom)
      } else {
        setTempTo(day)
      }
      setSelecting('from')
    }
  }

  function apply() {
    if (!tempFrom || !tempTo) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('from', format(tempFrom, 'yyyy-MM-dd'))
    params.set('to',   format(tempTo,   'yyyy-MM-dd'))
    params.delete('range')
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  function selectPreset(value: RangeKey) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    params.delete('from')
    params.delete('to')
    setTempFrom(null)
    setTempTo(null)
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('from')
    params.delete('to')
    params.delete('range')
    setTempFrom(null)
    setTempTo(null)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Display label
  const hasCustom = fromParam && toParam
  const activePreset = rangeParam
  const label = hasCustom
    ? `${format(parseISO(fromParam), 'MMM d, yyyy')} – ${format(parseISO(toParam), 'MMM d, yyyy')}`
    : activePreset
    ? RANGE_OPTIONS.find(o => o.value === activePreset)?.label ?? 'All time'
    : 'All time'

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{
            background: open ? 'var(--surface-2)' : 'var(--surface-2)',
            border: `1px solid ${open ? '#E8547A60' : 'var(--border)'}`,
            color: 'var(--text)',
          }}
        >
          <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#E8547A' }} />
          <span className="text-xs font-medium">{label}</span>
        </button>
        {(hasCustom || activePreset) && (
          <button onClick={clear} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-2xl p-4 shadow-2xl"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            width: 300,
          }}
        >
          {/* Preset pills */}
          <div className="flex flex-wrap gap-1.5 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => selectPreset(opt.value)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={activePreset === opt.value && !hasCustom ? {
                  background: 'linear-gradient(135deg, #E8547A, #9B6DFF)',
                  color: '#fff',
                } : {
                  background: 'var(--surface-2)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Instruction */}
          <p className="text-[11px] mb-3 font-medium" style={{ color: 'var(--text-muted)' }}>
            {selecting === 'from' ? '① Pick start date' : '② Pick end date'}
          </p>

          {/* Calendar */}
          <Calendar
            month={month}
            from={tempFrom}
            to={tempTo}
            onSelect={handleDaySelect}
            onPrevMonth={() => setMonth(m => subMonths(m, 1))}
            onNextMonth={() => setMonth(m => addMonths(m, 1))}
          />

          {/* Selected range display + Apply */}
          <div className="mt-4 pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {tempFrom && (
                <span>
                  <span style={{ color: 'var(--text)' }}>{format(tempFrom, 'MMM d')}</span>
                  {tempTo && (
                    <> → <span style={{ color: 'var(--text)' }}>{format(tempTo, 'MMM d, yyyy')}</span></>
                  )}
                </span>
              )}
              {!tempFrom && <span>No range selected</span>}
            </div>
            <button
              onClick={apply}
              disabled={!tempFrom || !tempTo}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #E8547A, #9B6DFF)',
                color: '#fff',
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DateRangePicker() {
  return (
    <Suspense fallback={
      <div className="h-9 w-48 rounded-xl animate-pulse" style={{ background: 'var(--surface-2)' }} />
    }>
      <DateRangePickerInner />
    </Suspense>
  )
}
