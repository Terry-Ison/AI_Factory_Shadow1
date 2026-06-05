import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchAnalytics, type Analytics } from '../../lib/adminApi'

function formatDuration(ms: number) {
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function TenantAdminAnalyticsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    fetchAnalytics(token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load analytics'))
  }, [token])

  if (error) {
    return (
      <div className="p-6">
        <p style={{ color: 'var(--md-error)' }}>{error}</p>
      </div>
    )
  }

  if (!data) {
    return <div className="p-6"><p style={{ color: 'var(--md-on-surface-variant)' }}>Loading analytics…</p></div>
  }

  const cards = [
    { label: 'Sessions', value: String(data.sessionCount) },
    { label: 'Ended sessions', value: String(data.endedSessionCount) },
    { label: 'Total duration', value: formatDuration(data.totalDurationMs) },
    { label: 'Active members', value: String(data.activeMembers) },
    { label: 'Pending members', value: String(data.pendingMembers) },
    { label: 'Transcript segments', value: String(data.transcriptSegmentCount) },
    { label: 'Recordings', value: String(data.recordingCount) },
    { label: 'Recording storage', value: formatBytes(data.recordingBytes) },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
      <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>Analytics</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
        Last 30 days for your organization.
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl p-4" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--md-on-surface-variant)' }}>{c.label}</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {Object.keys(data.languagePairs).length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>Language pairs</h2>
          <ul className="space-y-1 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            {Object.entries(data.languagePairs).map(([pair, count]) => (
              <li key={pair}>{pair}: {count} sessions</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
