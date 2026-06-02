import {
  AudioLines,
  BarChart3,
  Clock,
  Database,
  FileText,
  Languages,
  LineChart,
  PieChart,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'

type Stat = {
  label: string
  value: string
  helper: string
  icon: ReactNode
}

type SeriesPoint = { label: string; value: number }

function StatCard({ stat }: { stat: Stat }) {
  return (
    <article
      className="p-4 md:p-5"
      style={{
        background: 'var(--md-surface-container-lowest)',
        border: '1px solid var(--md-outline-variant)',
        borderRadius: 'var(--shape-sm)',
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center"
          style={{
            background: 'var(--md-primary-container)',
            color: 'var(--md-on-primary-container)',
            borderRadius: 'var(--shape-full)',
          }}
        >
          {stat.icon}
        </span>
        <span className="text-xs" style={{ color: 'var(--md-outline)' }}>
          Last 30 days
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl leading-8 md:text-3xl md:leading-10" style={{ color: 'var(--md-on-surface)' }}>
            {stat.value}
          </p>
          <p className="text-sm font-medium leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>
            {stat.label}
          </p>
          <p className="mt-1 text-xs leading-4" style={{ color: 'var(--md-outline)' }}>
            {stat.helper}
          </p>
        </div>
      </div>
    </article>
  )
}

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

function MiniLineChart({ points, color }: { points: SeriesPoint[]; color: string }) {
  const values = points.map((p) => p.value)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)

  // SVG viewbox: x=[0..100], y=[0..40] (top=0)
  const stepX = points.length <= 1 ? 0 : 100 / (points.length - 1)
  const path = points
    .map((p, idx) => {
      const x = idx * stepX
      const y = 40 - ((p.value - min) / range) * 40
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 40" className="h-16 w-full">
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`${path} L 100 40 L 0 40 Z`} fill={color} opacity="0.10" />
    </svg>
  )
}

function MiniBars({ points, color }: { points: SeriesPoint[]; color: string }) {
  const values = points.map((p) => p.value)
  const max = Math.max(...values, 1)
  const barW = 100 / Math.max(points.length * 1.6, 1)
  const gap = barW * 0.6

  return (
    <svg viewBox="0 0 100 40" className="h-16 w-full">
      {points.map((p, idx) => {
        const h = (p.value / max) * 38
        const x = idx * (barW + gap)
        const y = 40 - h
        return (
          <rect
            key={p.label}
            x={x}
            y={y}
            width={barW}
            height={h}
            rx={2}
            fill={color}
            opacity={idx === points.length - 1 ? 0.95 : 0.55}
          />
        )
      })}
    </svg>
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
  const stats: Stat[] = [
    { label: 'Total Users', value: '12,480', helper: 'All registered accounts', icon: <Users size={18} /> },
    // { label: 'Active Users Today', value: '1,964', helper: 'Users active in last 24h', icon: <Activity size={18} /> },
    { label: 'Total Sessions', value: '84,210', helper: 'Translation sessions created', icon: <BarChart3 size={18} /> },
    { label: 'Active Sessions', value: '128', helper: 'Currently in progress', icon: <LineChart size={18} /> },
    { label: 'Total Translation Minutes', value: '1,248,300', helper: 'Audio minutes processed', icon: <Clock size={18} /> },
    { label: 'Total Words Translated', value: '92,410,700', helper: 'Across all language pairs', icon: <Languages size={18} /> },
    { label: 'Monthly Usage', value: '94,200 min', helper: 'This month (so far)', icon: <AudioLines size={18} /> },
    // { label: 'Storage Used (Transcripts/Recordings)', value: '342 GB', helper: 'Used by generated assets', icon: <Database size={18} /> },
  ]

  const sessionsPerDay: SeriesPoint[] = [
    { label: 'Mon', value: 1020 },
    { label: 'Tue', value: 1110 },
    { label: 'Wed', value: 980 },
    { label: 'Thu', value: 1210 },
    { label: 'Fri', value: 1330 },
    { label: 'Sat', value: 890 },
    { label: 'Sun', value: 940 },
  ]

  const minutesPerDay: SeriesPoint[] = [
    { label: 'Mon', value: 15400 },
    { label: 'Tue', value: 17800 },
    { label: 'Wed', value: 16200 },
    { label: 'Thu', value: 19100 },
    { label: 'Fri', value: 20700 },
    { label: 'Sat', value: 12800 },
    { label: 'Sun', value: 13600 },
  ]

  const languageMix = [
    { label: 'English → Hindi', percent: 45 },
    { label: 'Hindi → English', percent: 25 },
    { label: 'English → Spanish', percent: 15 },
    { label: 'Others', percent: 15 },
  ]

  const todaysTranscripts = [
    { label: 'Generated', value: 250, tone: 'primary' as const },
    { label: 'Exported', value: 45, tone: 'neutral' as const },
    { label: 'Pending', value: 3, tone: 'warning' as const },
  ]

  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-5 overflow-y-auto p-4 md:p-6">
      <header
        className="shrink-0 p-5 md:p-6"
        style={{
          background: 'var(--md-surface-container-lowest)',
          border: '1px solid var(--md-outline-variant)',
          borderRadius: 'var(--shape-sm)',
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl leading-10 md:text-4xl md:leading-[3rem]" style={{ color: 'var(--md-on-surface)' }}>
              Admin dashboard
            </h1>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--md-on-surface-variant)' }}>
              Usage analytics for your translation platform (UI-only sample data).
            </p>
          </div>
          {/* <div className="flex flex-wrap items-center gap-2">
            <span className="md-chip" style={{ background: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}>
              Live view
            </span>
            <span className="md-chip" style={{ background: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}>
              Last 7 days
            </span>
            <span className="md-chip" style={{ background: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}>
              All regions
            </span>
          </div> */}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="grid shrink-0 gap-4">
        {/* <CardShell
          title="Usage Analytics"
          subtitle="Sessions per day"
          icon={<LineChart size={18} />}
          right={<span className="text-xs tabular-nums" style={{ color: 'var(--md-outline)' }}>Avg 1,069/day</span>}
        >
          <MiniLineChart points={sessionsPerDay} color="var(--md-primary)" />
          <div className="mt-3 flex justify-between gap-2 text-xs" style={{ color: 'var(--md-outline)' }}>
            {sessionsPerDay.map((p) => (
              <span key={p.label} className="w-full text-center">
                {p.label}
              </span>
            ))}
          </div>
        </CardShell> */}

        <div className="grid gap-4 md:grid-cols-2">
          {/* <CardShell
            title="Translation Minutes"
            subtitle="Last 7 days"
            icon={<AudioLines size={18} />}
            right={<span className="text-xs tabular-nums" style={{ color: 'var(--md-outline)' }}>Total 113.6k</span>}
          >
            <MiniBars points={minutesPerDay} color="var(--md-secondary)" />
            <div className="mt-3 flex justify-between gap-2 text-xs" style={{ color: 'var(--md-outline)' }}>
              {minutesPerDay.map((p) => (
                <span key={p.label} className="w-full text-center">
                  {p.label}
                </span>
              ))}
            </div>
          </CardShell> */}

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

        <CardShell title="Transcript Activity" subtitle="Today's transcripts" icon={<FileText size={18} />}>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {todaysTranscripts.map((row) => {
              const maxTranscript = Math.max(...todaysTranscripts.map((t) => t.value), 1)
              const barPercent = Math.round((row.value / maxTranscript) * 100)
              const color =
                row.tone === 'warning'
                  ? '#f59e0b'
                  : row.tone === 'neutral'
                    ? 'var(--md-outline)'
                    : 'var(--md-primary)'
              const bg =
                row.tone === 'warning'
                  ? 'color-mix(in srgb, #f59e0b 14%, transparent)'
                  : row.tone === 'neutral'
                    ? 'var(--md-surface-container)'
                    : 'var(--md-primary-container)'

              return (
                <div
                  key={row.label}
                  className="rounded-md p-3"
                  style={{
                    background: bg,
                    border: '1px solid var(--md-outline-variant)',
                  }}
                >
                  <p className="text-xl leading-7 tabular-nums" style={{ color: 'var(--md-on-surface)' }}>
                    {row.value}
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                    {row.label}
                  </p>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full"
                    style={{ background: 'color-mix(in srgb, var(--md-outline) 18%, transparent)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${barPercent}%`, background: color, opacity: 0.85 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardShell>

        {/* <CardShell title="Storage Used" subtitle="Transcripts and recordings" icon={<Database size={18} />}>
          <div className="space-y-4">
            <ProgressRow label="Recordings" valueLabel="248 GB" percent={72} />
            <ProgressRow label="Transcripts" valueLabel="76 GB" percent={22} />
            <ProgressRow label="Exports / archives" valueLabel="18 GB" percent={6} />
            <div
              className="flex items-center justify-between gap-3 rounded-md px-3 py-2"
              style={{ background: 'var(--md-surface-container)' }}
            >
              <span className="text-xs" style={{ color: 'var(--md-outline)' }}>
                Total
              </span>
              <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--md-on-surface)' }}>
                342 GB
              </span>
            </div>
          </div>
        </CardShell> */}
      </section>
    </main>
  )
}