import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchAnalytics, type Analytics } from '../../lib/adminApi'

function formatDuration(ms: number) {
<<<<<<< Updated upstream
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
=======
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins} min`
  return `${(mins / 60).toFixed(1)} hr`
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    fetchAnalytics(token)
=======
    void fetchAnalytics(token)
>>>>>>> Stashed changes
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load analytics'))
  }, [token])

<<<<<<< Updated upstream
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
=======
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>
        Organization analytics
      </h1>
      {error && <p className="mt-2 text-sm" style={{ color: 'var(--md-error)' }}>{error}</p>}
      {!data ? (
        <p className="mt-4" style={{ color: 'var(--md-on-surface-variant)' }}>Loading…</p>
      ) : (
        <>
          <p className="mt-2 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            {new Date(data.from).toLocaleDateString()} – {new Date(data.to).toLocaleDateString()}
          </p>
          <div className="mt-6 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Sessions" value={String(data.sessionCount)} />
            <Stat label="Ended sessions" value={String(data.endedSessionCount)} />
            <Stat label="Total duration" value={formatDuration(data.totalDurationMs)} />
            <Stat label="Active members" value={String(data.activeMembers)} />
            <Stat label="Pending members" value={String(data.pendingMembers)} />
            <Stat label="Transcript segments" value={String(data.transcriptSegmentCount)} />
            <Stat label="Recordings" value={String(data.recordingCount)} />
            <Stat label="Recording storage" value={formatBytes(data.recordingBytes)} />
          </div>
          {Object.keys(data.languagePairs).length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                Language pairs
              </h2>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(data.languagePairs).map(([pair, count]) => (
                  <li key={pair}>{pair}: {count}</li>
                ))}
              </ul>
            </div>
          )}
        </>
>>>>>>> Stashed changes
      )}
    </div>
  )
}
<<<<<<< Updated upstream
=======

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--md-surface-container)', borderRadius: 'var(--shape-lg)' }}
    >
      <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>{label}</p>
      <p className="mt-1 text-lg font-semibold" style={{ color: 'var(--md-on-surface)' }}>{value}</p>
    </div>
  )
}
>>>>>>> Stashed changes
