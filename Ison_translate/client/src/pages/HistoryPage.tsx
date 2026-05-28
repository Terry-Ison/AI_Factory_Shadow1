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

  const people = session.participants
    .map((p) => p.displayName ?? 'Partner')
    .join(' & ')

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 p-4 text-left transition hover:border-indigo-500/40 hover:bg-white/[0.04]"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-white group-hover:text-indigo-100">
              {title}
            </h2>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>

          <p className="text-sm text-slate-400">{subtitle}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Languages size={12} className="text-indigo-400/80" />
              {languageSummary}
            </span>
            <span>{people}</span>
            <span className="font-mono text-slate-600" title={session.sessionId}>
              #{code}
            </span>
          </div>

          {session.transcriptPreview ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">
              <MessageSquare size={12} className="mr-1 inline text-slate-600" />
              {session.transcriptPreview}
              {session.transcriptPreview.length >= 160 ? '…' : ''}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-0.5">
            {session.hasTranscript && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                <MessageSquare size={10} />
                Transcript
              </span>
            )}
            {session.hasRecording && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                <Mic size={10} />
                Audio
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center self-center text-slate-600 group-hover:text-indigo-300">
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
    setLoading(true)
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
    <main className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-5 overflow-hidden p-4 md:p-6">
      <header className="shrink-0">
        <h1 className="text-2xl font-bold text-white">Your conversations</h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse past translation sessions — who you spoke with, languages used, and what was said.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-[var(--color-border)] bg-white/5"
              />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
            <Clock size={32} className="text-slate-600" />
            <p className="text-base font-medium text-slate-300">No conversations yet</p>
            <p className="max-w-sm text-sm text-slate-500">
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
