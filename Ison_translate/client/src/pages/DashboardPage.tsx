import { BarChart3, Clock, Languages, PieChart, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { StatCard, type StatCardData } from '../components/StatCard'

function CardShell({
  title,
  subtitle,
  icon,
  children,
  right,
}: {
  title: string
  subtitle?: string
  icon: ReactNode
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <article
      className="min-h-0 overflow-hidden"
      style={{
        background: 'var(--md-surface-container-lowest)',
        border: '1px solid var(--md-outline-variant)',
        borderRadius: 'var(--shape-sm)',
      }}
    >
      <header className="flex items-start justify-between gap-3 px-4 py-3 md:px-5" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5" style={{ color: 'var(--md-primary)' }}>
            {icon}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium leading-5" style={{ color: 'var(--md-on-surface)' }}>
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs leading-4" style={{ color: 'var(--md-outline)' }}>
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </header>
      <div className="p-4 md:p-5">{children}</div>
    </article>
  )
}

function ProgressRow({ label, valueLabel, percent }: { label: string; valueLabel: string; percent: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm" style={{ color: 'var(--md-on-surface)' }}>
          {label}
        </span>
        <span className="shrink-0 text-xs tabular-nums" style={{ color: 'var(--md-outline)' }}>
          {valueLabel}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--md-surface-container)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(100, percent))}%`,
            background: 'var(--md-primary)',
          }}
        />
      </div>
    </div>
  )
}

export function DashboardPage() {
  // UI-only mock data.
  const stats: StatCardData[] = [
    {
      label: 'Total Users',
      value: '12,480',
      comparison: 'vs last month',
      icon: <Users size={18} />,
      trend: { value: 8.2, direction: 'up' },
      sparkline: [9200, 9800, 10100, 10800, 11200, 11800, 12480],
      accent: 'primary',
    },
    {
      label: 'Total Sessions',
      value: '84,210',
      comparison: 'vs last month',
      icon: <BarChart3 size={18} />,
      trend: { value: 12.5, direction: 'up' },
      sparkline: [62000, 68000, 71000, 75000, 79000, 82000, 84210],
      accent: 'orange',
    },
    {
      label: 'Translation Minutes',
      value: '1.24M',
      comparison: 'vs last month',
      icon: <Clock size={18} />,
      trend: { value: 5.4, direction: 'up' },
      sparkline: [980000, 1020000, 1080000, 1120000, 1160000, 1200000, 1248300],
      accent: 'sky',
    },
    {
      label: 'Words Translated',
      value: '92.4M',
      comparison: 'vs last month',
      icon: <Languages size={18} />,
      trend: { value: 2.1, direction: 'down' },
      sparkline: [94000000, 93500000, 92800000, 92200000, 91800000, 92100000, 92410700],
      accent: 'violet',
    },
  ]

  const languageMix = [
    { label: 'English → Hindi', percent: 45 },
    { label: 'Hindi → English', percent: 25 },
    { label: 'English → Spanish', percent: 15 },
    { label: 'Others', percent: 15 },
  ]

  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-5 overflow-y-auto p-4 md:p-6">
      <header
        className="shrink-0"
       
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-xl leading-10 md:text-2xl font-bold" style={{ color: 'var(--md-on-surface)' }}>
              Admin dashboard
            </h1>
            <p className="text-sm leading-4" style={{ color: 'var(--md-on-surface-variant)' }}>
              Usage analytics for your translation platform .
            </p>
          </div>
         
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="grid shrink-0 gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <CardShell title="Language Analytics" subtitle="Most used pairs" icon={<PieChart size={18} />}>
            <div className="space-y-3">
              {languageMix.map((item) => (
                <ProgressRow key={item.label} label={item.label} valueLabel={`${item.percent}%`} percent={item.percent} />
              ))}
            </div>
          </CardShell>
        </div>
      </section>

      <section className="grid shrink-0 gap-4 lg:grid-cols-3">
        <CardShell title="Most Used Languages" subtitle="Share of total usage" icon={<Languages size={18} />}>
          <div className="space-y-3">
            {languageMix.map((item) => (
              <ProgressRow key={item.label} label={item.label} valueLabel={`${item.percent}%`} percent={item.percent} />
            ))}
          </div>
        </CardShell>
      </section>
    </main>
  )
}