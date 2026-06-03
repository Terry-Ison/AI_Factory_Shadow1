import { TrendingDown, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'

export type StatAccent = 'primary' | 'orange' | 'emerald' | 'sky' | 'violet'

export type StatCardData = {
  label: string
  value: string
  comparison?: string
  icon: ReactNode
  trend: { value: number; direction: 'up' | 'down' }
  sparkline: number[]
  accent?: StatAccent
}

const accentMap: Record<StatAccent, { iconBox: string; chart: string }> = {
  primary: {
    iconBox: 'bg-[color-mix(in_srgb,var(--md-primary)_14%,transparent)] text-[var(--md-primary)]',
    chart: 'var(--md-primary)',
  },
  orange: {
    iconBox: 'bg-orange-500/10 text-orange-600',
    chart: '#f97316',
  },
  emerald: {
    iconBox: 'bg-emerald-500/10 text-emerald-600',
    chart: '#10b981',
  },
  sky: {
    iconBox: 'bg-sky-500/10 text-sky-600',
    chart: '#0ea5e9',
  },
  violet: {
    iconBox: 'bg-violet-500/10 text-violet-600',
    chart: '#8b5cf6',
  },
}



export function StatCard({ stat }: { stat: StatCardData }) {
  const accent = accentMap[stat.accent ?? 'primary']
  const trendUp = stat.trend.direction === 'up'

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] p-5 shadow-[var(--elevation-1)]">
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-[var(--md-on-surface-variant)]">{stat.label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent.iconBox}`}>
          {stat.icon}
        </span>
      </div>

      <div className="relative z-[1] ">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-[var(--md-on-surface)] md:text-2xl md:leading-9">
          {stat.value}
        </p>
        {/* <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
          <span
            className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
              trendUp ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {trendUp ? <TrendingUp size={15} strokeWidth={2.5} /> : <TrendingDown size={15} strokeWidth={2.5} />}
            {trendUp ? '+' : '-'}
            {Math.abs(stat.trend.value)}%
          </span>
          {stat.comparison ? (
            <span className="text-[var(--md-outline)]">{stat.comparison}</span>
          ) : null}
        </div> */}
      </div>
    </article>
  )
}
