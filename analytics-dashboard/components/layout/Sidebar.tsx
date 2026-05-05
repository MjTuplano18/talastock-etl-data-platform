'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, Package, Activity, Database, Sun, Moon, ShieldCheck, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'

const navItems = [
  { label: 'Overview',  href: '/',          icon: LayoutDashboard },
  { label: 'Sales',     href: '/sales',     icon: TrendingUp },
  { label: 'Products',  href: '/products',  icon: Package },
  { label: 'Pipeline',  href: '/pipeline',  icon: Activity },
  { label: 'Quality',   href: '/quality',   icon: ShieldCheck },
  { label: 'Forecast',  href: '/forecast',  icon: Brain },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))' }}>
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Talastock</p>
            <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--purple)' }}>Data Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200')}
              style={active ? {
                background: 'var(--active-nav)',
                border: '1px solid var(--active-border)',
                color: 'var(--text)',
              } : {
                color: 'var(--text-muted)',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0"
                style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
              <span style={{ fontWeight: active ? 500 : 400 }}>{label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--accent)' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" style={{ color: 'var(--amber)' }} />
            : <Moon className="w-4 h-4" style={{ color: 'var(--purple)' }} />
          }
          <span className="text-xs">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Warehouse connected</p>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>dbt 1.7 · Airflow 2.9</p>
        </div>
      </div>
    </aside>
  )
}
