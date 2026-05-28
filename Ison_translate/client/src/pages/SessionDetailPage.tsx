import { ArrowLeft, Copy, Languages, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthenticatedAudio } from '../components/AuthenticatedAudio'
import { useAuth } from '../context/AuthContext'
import { fetchHistorySession, type HistorySessionDetail } from '../lib/api'
import {
  formatDurationMs,
  formatLangPair,
  formatSessionDate,
  participantDisplayName,
  recordingLabel,
  sessionDurationMs,
  sessionTitle,
  shortSessionCode,
  statusBadge,
} from '../lib/historyDisplay'

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<HistorySessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!sessionId || !token) return
    let cancelled = false
    setLoading(true)
    void fetchHistorySession(token, decodeURIComponent(sessionId))
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load session')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId, token])

  const transcriptParagraph = useMemo(() => {
    if (!detail?.transcripts.length) return ''
    return detail.transcripts
      .filter((t) => t.role === 'source' || t.role === 'translation')
      .map((t) => t.text)
      .join(' ')
  }, [detail])

  const participantByDbId = useMemo(() => {
    const map = new Map<string, string>()
    if (!detail) return map
    for (const p of detail.participants) {
      if (p.id) map.set(p.id, participantDisplayName(p))
    }
    return map
  }, [detail])

  function copyCode() {
    if (!detail) return
    void navigator.clipboard.writeText(detail.sessionId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  if (loading) {
    return (
      <main className="mx-auto flex h-full max-w-4xl flex-col gap-4 p-4 md:p-6">
        <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
        <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        <div className="grid flex-1 gap-4 lg:grid-cols-2">
          <div className="min-h-48 animate-pulse rounded-2xl bg-white/5" />
          <div className="min-h-48 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </main>
    )
  }

  if (error || !detail) {
    return (
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <button
          type="button"
          onClick={() => navigate('/app/history')}
          className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-300 hover:underline"
        >
          <ArrowLeft size={14} />
          Back to conversations
        </button>
        <p className="text-sm text-rose-400">{error ?? 'Session not found'}</p>
      </main>
    )
  }

  const badge = statusBadge(detail.status)
  const title = sessionTitle(detail.participants)
  const code = shortSessionCode(detail.sessionId)
  const duration = formatDurationMs(sessionDurationMs(detail.startedAt, detail.endedAt))

  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col gap-5 overflow-hidden p-4 md:p-6">
      <header className="shrink-0 space-y-3">
        <button
          type="button"
          onClick={() => navigate('/app/history')}
          className="inline-flex items-center gap-1 text-sm text-indigo-300 hover:underline"
        >
          <ArrowLeft size={14} />
          All conversations
        </button>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-white">{title}</h1>
              <p className="mt-1 text-sm text-slate-400">
                {formatSessionDate(detail.startedAt)}
                {detail.endedAt ? ` · Ended ${formatSessionDate(detail.endedAt)}` : ''}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span>{duration}</span>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-300 hover:bg-white/10"
              title="Copy full session ID to rejoin or share"
            >
              Session #{code}
              <Copy size={12} />
            </button>
            {copied && <span className="text-xs text-green-400">Copied</span>}
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-h-0">
        {/* People & transcript */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/80">
          <h2 className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-slate-200">
            <Users size={16} className="text-indigo-400" />
            Who was in this call
          </h2>
          <ul className="shrink-0 divide-y divide-[var(--color-border)]">
            {detail.participants.map((p) => (
              <li key={p.id ?? p.userId} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    p.isYou ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {(p.displayName ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-100">
                    {participantDisplayName(p)}
                    {p.isInitiator && !p.isYou ? (
                      <span className="ml-2 text-xs font-normal text-slate-500">started session</span>
                    ) : null}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Languages size={11} />
                    Spoke {formatLangPair(p.sourceLang, p.targetLang)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <h2 className="shrink-0 border-b border-t border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-slate-200">
            What was said
          </h2>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {transcriptParagraph ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
                {transcriptParagraph}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                No transcript was saved for this session. Try speaking longer in your next call.
              </p>
            )}
          </div>
        </section>

        {/* Audio */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/80">
          <h2 className="shrink-0 border-b border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-slate-200">
            Audio recordings
          </h2>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {detail.recordings.length === 0 ? (
              <p className="text-sm text-slate-500">No audio was saved for this session.</p>
            ) : (
              <ul className="space-y-4">
                {detail.recordings.map((r) => {
                  const owner = r.participantId
                    ? participantByDbId.get(r.participantId)
                    : undefined
                  const label = recordingLabel(r.kind, owner)
                  const length =
                    r.durationMs && r.durationMs > 0
                      ? formatDurationMs(r.durationMs)
                      : r.finalizedAt
                        ? 'Ready to play'
                        : 'Still processing'

                  return (
                    <li
                      key={r.id}
                      className="rounded-xl border border-[var(--color-border)] bg-black/20 p-4"
                    >
                      <p className="text-sm font-medium text-slate-100">{label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{length}</p>
                      {r.finalizedAt ? (
                        <AuthenticatedAudio
                          src={r.audioUrl}
                          token={token}
                          className="mt-3 w-full"
                        />
                      ) : (
                        <p className="mt-2 text-xs text-amber-400/90">
                          This recording is still being saved.
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
