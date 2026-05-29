import { ChevronRight, Clock, Languages, MessageSquare, Mic } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchHistorySessions, type HistorySessionSummary } from '../lib/api'
import {
  formatLangPair,
  sessionSubtitle,
  sessionTitle,
  shortSessionCode,
  statusBadge,
} from '../lib/historyDisplay'

function SessionCard({ session, onOpen }: { session: HistorySessionSummary; onOpen: () => void }) {
  const badge = statusBadge(session.status)
  const title = sessionTitle(session.participants)
  const subtitle = sessionSubtitle(session.startedAt, session.endedAt, session.status)
  const code = shortSessionCode(session.sessionId)

  const languageSummary = [
    ...new Set(session.participants.map((p) => formatLangPair(p.sourceLang, p.targetLang))),
  ].join(' · ')

  const people = session.participants.map((p) => p.displayName ?? 'Partner').join(' & ')

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full gap-4 p-4 text-left transition"
        style={{
          background: 'var(--md-surface-container-low)',
          border: '1px solid var(--md-outline-variant)',
          borderRadius: 'var(--shape-md)',
          boxShadow: 'var(--elevation-0)',
          transition: 'box-shadow 200ms',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--elevation-1)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--elevation-0)' }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Title + status badge */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 500,
                lineHeight: '1.5rem',
                letterSpacing: '0.009375rem',
                color: 'var(--md-on-surface)',
              }}
            >
              {title}
            </h2>
            {/* M3 Assist Chip as status pill */}
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

          {/* Subtitle — Body Small */}
          <p style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--md-on-surface-variant)' }}>
            {subtitle}
          </p>

          {/* Meta chips row — Label Small */}
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1"
            style={{ fontSize: '0.75rem', lineHeight: '1rem', color: 'var(--md-outline)' }}
          >
            <span className="inline-flex items-center gap-1">
              <Languages size={12} style={{ color: 'var(--md-primary)' }} />
              {languageSummary}
            </span>
            <span>{people}</span>
            <span
              className="font-mono"
              title={session.sessionId}
              style={{ color: 'var(--md-outline-variant)' }}
            >
              #{code}
            </span>
          </div>

          {/* Transcript preview */}
          {session.transcriptPreview ? (
            <p
              className="line-clamp-2 leading-relaxed"
              style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--md-on-surface-variant)' }}
            >
              <MessageSquare
                size={12}
                className="mr-1 inline"
                style={{ color: 'var(--md-outline)' }}
              />
              {session.transcriptPreview}
              {session.transcriptPreview.length >= 160 ? '…' : ''}
            </p>
          ) : null}

          {/* Media chips */}
          <div className="flex flex-wrap gap-2 pt-0.5">
            {session.hasTranscript && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  background: 'var(--md-secondary-container)',
                  color: 'var(--md-on-secondary-container)',
                  borderRadius: 'var(--shape-full)',
                  padding: '0.125rem 0.5rem',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  letterSpacing: '0.03125rem',
                  lineHeight: '1rem',
                  textTransform: 'uppercase',
                }}
              >
                <MessageSquare size={10} />
                Transcript
              </span>
            )}
            {session.hasRecording && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  background: 'var(--md-secondary-container)',
                  color: 'var(--md-on-secondary-container)',
                  borderRadius: 'var(--shape-full)',
                  padding: '0.125rem 0.5rem',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  letterSpacing: '0.03125rem',
                  lineHeight: '1rem',
                  textTransform: 'uppercase',
                }}
              >
                <Mic size={10} />
                Audio
              </span>
            )}
          </div>
        </div>

        <div
          className="flex shrink-0 items-center self-center transition-transform group-hover:translate-x-0.5"
          style={{ color: 'var(--md-outline)' }}
        >
          <ChevronRight size={20} />
        </div>
      </button>
    </li>
  )
}

export function HistoryPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<HistorySessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    void fetchHistorySessions(token)
      .then((data) => {
        if (!cancelled) setSessions(data.sessions)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load history')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <main
      className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-5 overflow-hidden p-4 md:p-6"
    >
      <header className="shrink-0">
        {/* M3 Headline Medium */}
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 400,
            lineHeight: '2.25rem',
            color: 'var(--md-on-surface)',
          }}
        >
          Your conversations
        </h1>
        <p
          className="mt-1"
          style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--md-on-surface-variant)' }}
        >
          Browse past translation sessions — who you spoke with, languages used, and what was said.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse"
                style={{
                  borderRadius: 'var(--shape-md)',
                  background: 'var(--md-surface-container)',
                }}
              />
            ))}
          </div>
        )}

        {error && (
          <div
            className="px-4 py-3 text-sm"
            style={{
              background: 'var(--md-error-container)',
              color: 'var(--md-on-error-container)',
              borderRadius: 'var(--shape-sm)',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
            style={{
              border: '1px dashed var(--md-outline-variant)',
              borderRadius: 'var(--shape-lg)',
            }}
          >
            <Clock size={40} style={{ color: 'var(--md-outline)' }} />
            <p
              style={{
                fontSize: '1rem',
                fontWeight: 500,
                lineHeight: '1.5rem',
                color: 'var(--md-on-surface)',
              }}
            >
              No conversations yet
            </p>
            <p
              className="max-w-sm"
              style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--md-on-surface-variant)' }}
            >
              When you finish a live translation session, it will appear here with transcripts and
              recordings.
            </p>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <ul className="space-y-3 pb-4">
            {sessions.map((s) => (
              <SessionCard
                key={s.sessionId}
                session={s}
                onOpen={() => navigate(`/app/history/${encodeURIComponent(s.sessionId)}`)}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
