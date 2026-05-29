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

const sectionCard: React.CSSProperties = {
  background: 'var(--md-surface-container-low)',
  border: '1px solid var(--md-outline-variant)',
  borderRadius: 'var(--shape-lg)',
  boxShadow: 'var(--elevation-1)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
}

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  borderBottom: '1px solid var(--md-outline-variant)',
  flexShrink: 0,
  fontSize: '0.875rem',
  fontWeight: 500,
  letterSpacing: '0.00625rem',
  lineHeight: '1.25rem',
  color: 'var(--md-on-surface)',
}

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
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
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
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`animate-pulse ${i === 1 ? 'h-8 w-32' : 'h-24'}`}
            style={{ background: 'var(--md-surface-container)', borderRadius: 'var(--shape-md)' }}
          />
        ))}
        <div className="grid flex-1 gap-4 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="min-h-48 animate-pulse"
              style={{ background: 'var(--md-surface-container)', borderRadius: 'var(--shape-lg)' }}
            />
          ))}
        </div>
      </main>
    )
  }

  if (error || !detail) {
    return (
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        {/* M3 Text Button with leading icon */}
        <button
          type="button"
          onClick={() => navigate('/app/history')}
          className="md-btn md-btn-text mb-4 gap-1"
          style={{ paddingLeft: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          Back to conversations
        </button>
        <div
          className="px-4 py-3 text-sm"
          style={{
            background: 'var(--md-error-container)',
            color: 'var(--md-on-error-container)',
            borderRadius: 'var(--shape-sm)',
          }}
        >
          {error ?? 'Session not found'}
        </div>
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
        {/* M3 Text Button */}
        <button
          type="button"
          onClick={() => navigate('/app/history')}
          className="md-btn md-btn-text gap-1"
          style={{ paddingLeft: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          All conversations
        </button>

        {/* M3 Elevated card — session header */}
        <div
          style={{
            background: 'var(--md-surface-container)',
            border: '1px solid var(--md-outline-variant)',
            borderRadius: 'var(--shape-lg)',
            boxShadow: 'var(--elevation-1)',
            padding: '1.25rem',
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {/* M3 Title Large */}
              <h1
                style={{
                  fontSize: '1.375rem',
                  fontWeight: 400,
                  lineHeight: '1.75rem',
                  color: 'var(--md-on-surface)',
                }}
              >
                {title}
              </h1>
              <p
                className="mt-1"
                style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--md-on-surface-variant)' }}
              >
                {formatSessionDate(detail.startedAt)}
                {detail.endedAt ? ` · Ended ${formatSessionDate(detail.endedAt)}` : ''}
              </p>
            </div>
            <span
              style={{
                ...badge.style,
                flexShrink: 0,
                borderRadius: 'var(--shape-full)',
                padding: '0.125rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                lineHeight: '1rem',
                letterSpacing: '0.03125rem',
              }}
            >
              {badge.label}
            </span>
          </div>

          <div
            className="mt-4 flex flex-wrap items-center gap-3"
            style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--md-on-surface-variant)' }}
          >
            <span>{duration}</span>
            {/* M3 Outlined chip for session code */}
            <button
              type="button"
              onClick={copyCode}
              className="md-chip inline-flex items-center gap-1.5 font-mono text-xs"
              title="Copy full session ID"
            >
              Session #{code}
              <Copy size={11} />
            </button>
            {copied && (
              <span style={{ fontSize: '0.75rem', color: 'var(--md-primary)', fontWeight: 500 }}>
                Copied
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-h-0">
        {/* People & transcript */}
        <section style={sectionCard}>
          <h2 style={sectionHeader}>
            <Users size={16} style={{ color: 'var(--md-primary)' }} />
            Who was in this call
          </h2>

          <ul className="shrink-0" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
            {detail.participants.map((p, idx) => (
              <li
                key={p.id ?? p.userId}
                className="flex items-center gap-3 px-4 py-3"
                style={idx > 0 ? { borderTop: '1px solid var(--md-outline-variant)' } : undefined}
              >
                {/* M3 avatar */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-sm font-bold"
                  style={{
                    borderRadius: 'var(--shape-full)',
                    background: p.isYou
                      ? 'var(--md-primary-container)'
                      : 'var(--md-surface-container-highest)',
                    color: p.isYou
                      ? 'var(--md-on-primary-container)'
                      : 'var(--md-on-surface-variant)',
                  }}
                >
                  {(p.displayName ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p style={{ fontWeight: 500, color: 'var(--md-on-surface)', fontSize: '0.875rem' }}>
                    {participantDisplayName(p)}
                    {p.isInitiator && !p.isYou ? (
                      <span
                        className="ml-2 font-normal"
                        style={{ fontSize: '0.75rem', color: 'var(--md-outline)' }}
                      >
                        started session
                      </span>
                    ) : null}
                  </p>
                  <p
                    className="flex items-center gap-1"
                    style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}
                  >
                    <Languages size={11} />
                    Spoke {formatLangPair(p.sourceLang, p.targetLang)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <h2 style={{ ...sectionHeader, borderTop: '1px solid var(--md-outline-variant)' }}>
            What was said
          </h2>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {transcriptParagraph ? (
              <p
                className="whitespace-pre-wrap"
                style={{ fontSize: '0.875rem', lineHeight: '1.5rem', color: 'var(--md-on-surface)' }}
              >
                {transcriptParagraph}
              </p>
            ) : (
              <p style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--md-on-surface-variant)' }}>
                No transcript was saved for this session.
              </p>
            )}
          </div>
        </section>

        {/* Audio */}
        <section style={sectionCard}>
          <h2 style={sectionHeader}>
            Audio recordings
          </h2>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {detail.recordings.length === 0 ? (
              <p style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--md-on-surface-variant)' }}>
                No audio was saved for this session.
              </p>
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
                      className="p-4"
                      style={{
                        background: 'var(--md-surface-container)',
                        border: '1px solid var(--md-outline-variant)',
                        borderRadius: 'var(--shape-md)',
                      }}
                    >
                      <p
                        style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--md-on-surface)' }}
                      >
                        {label}
                      </p>
                      <p
                        className="mt-0.5"
                        style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}
                      >
                        {length}
                      </p>
                      {r.finalizedAt ? (
                        <AuthenticatedAudio
                          src={r.audioUrl}
                          token={token}
                          className="mt-3 w-full"
                        />
                      ) : (
                        <p
                          className="mt-2 text-xs"
                          style={{ color: '#f59e0b' }}
                        >
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
