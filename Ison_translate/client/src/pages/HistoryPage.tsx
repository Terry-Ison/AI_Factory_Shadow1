import {
  CalendarDays,
  ChevronRight,
  Clock,
  FileAudio,
  Languages,
  MessageSquare,
  Mic,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchHistorySessions, type HistorySessionSummary } from '../lib/api'
import {
  formatDurationMs,
  formatLangPair,
  formatRelativeDate,
  participantDisplayName,
  sessionDurationMs,
  sessionSubtitle,
  sessionTitle,
  shortSessionCode,
  statusBadge,
} from '../lib/historyDisplay'

type HistoryFilter = 'all' | 'transcript' | 'audio' | 'active'

const filters: { label: string; value: HistoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Transcripts', value: 'transcript' },
  { label: 'Audio', value: 'audio' },
  { label: 'Active', value: 'active' },
]

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: string | number
}) {
  return (
    <div
      className="flex min-h-15 items-center gap-3 p-4"
      style={{
        background: 'var(--md-surface-container)',
        border: '1px solid var(--md-outline-variant)',
        borderRadius: 'var(--shape-sm)',
      }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center"
        style={{
          background: 'var(--md-secondary-container)',
          borderRadius: 'var(--shape-full)',
          color: 'var(--md-on-secondary-container)',
        }}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl leading-8" style={{ color: 'var(--md-on-surface)' }}>
          {value}
        </p>
        <p className="text-xs font-medium uppercase" style={{ color: 'var(--md-outline)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

function SessionCard({ session, onOpen }: { session: HistorySessionSummary; onOpen: () => void }) {
  const badge = statusBadge(session.status)
  const title = sessionTitle(session.participants)
  const subtitle = sessionSubtitle(session.startedAt, session.endedAt, session.status)
  const code = shortSessionCode(session.sessionId)
  const duration = formatDurationMs(sessionDurationMs(session.startedAt, session.endedAt))

  const languageSummary = [
    ...new Set(session.participants.map((p) => formatLangPair(p.sourceLang, p.targetLang))),
  ].join(' / ')

  const people = session.participants.map((p) => participantDisplayName(p)).join(', ')

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group grid w-full grid-cols-[auto_1fr_auto] gap-4 p-4 text-left transition duration-200 hover:-translate-y-0.5 md:p-5"
        style={{
          background: 'var(--md-surface-container-lowest)',
          border: '1px solid var(--md-outline-variant)',
          borderRadius: 'var(--shape-sm)',
          boxShadow: 'var(--elevation-0)',
        }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center"
          style={{
            background: session.status === 'active' ? 'var(--md-primary-container)' : 'var(--md-surface-container-high)',
            borderRadius: 'var(--shape-sm)',
            color: session.status === 'active' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
          }}
        >
          {session.status === 'active' ? <Mic size={20} /> : <MessageSquare size={20} />}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                className="truncate text-base font-medium leading-6"
                style={{ color: 'var(--md-on-surface)' }}
              >
                {title}
              </h2>
              <p className="mt-1 text-sm leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>
                {subtitle}
              </p>
            </div>
            <span
              style={{
                ...badge.style,
                flexShrink: 0,
                borderRadius: 'var(--shape-full)',
                padding: '0.1875rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                lineHeight: '1rem',
              }}
            >
              {badge.label}
            </span>
          </div>

          <div className="grid gap-2 text-xs leading-4 sm:grid-cols-3" style={{ color: 'var(--md-on-surface-variant)' }}>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Languages size={13} style={{ color: 'var(--md-primary)' }} />
              <span className="truncate">{languageSummary || 'Languages unavailable'}</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Users size={13} style={{ color: 'var(--md-primary)' }} />
              <span className="truncate">{people || `${session.participantCount} participants`}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} style={{ color: 'var(--md-primary)' }} />
              {duration}
            </span>
          </div>

          {session.transcriptPreview ? (
            <p
              className="line-clamp-2 rounded-md px-3 py-2 text-sm leading-5"
              style={{
                background: 'var(--md-surface-container)',
                color: 'var(--md-on-surface-variant)',
              }}
            >
              {session.transcriptPreview}
              {session.transcriptPreview.length >= 160 ? '...' : ''}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {session.hasTranscript && (
              <span className="md-chip md-chip-tonal h-7 text-xs">
                <MessageSquare size={12} />
                Transcript
              </span>
            )}
            {session.hasRecording && (
              <span className="md-chip h-7 text-xs">
                <FileAudio size={12} />
                Audio
              </span>
            )}
            <span className="font-mono text-xs" style={{ color: 'var(--md-outline)' }}>
              #{code}
            </span>
          </div>
        </div>

        <div
          className="flex shrink-0 items-center self-center transition-transform group-hover:translate-x-1"
          style={{ color: 'var(--md-outline)' }}
        >
          <ChevronRight size={20} />
        </div>
      </button>
    </li>
  )
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-40 animate-pulse"
          style={{
            borderRadius: 'var(--shape-sm)',
            background: 'var(--md-surface-container)',
          }}
        />
      ))}
    </div>
  )
}

export function HistoryPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<HistorySessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<HistoryFilter>('all')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    setError(null)
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

  const stats = useMemo(() => {
    const transcriptCount = sessions.filter((s) => s.hasTranscript).length
    const audioCount = sessions.filter((s) => s.hasRecording).length
    const activeCount = sessions.filter((s) => s.status === 'active').length

    return { transcriptCount, audioCount, activeCount }
  }, [sessions])

  const filteredSessions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return sessions.filter((session) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'transcript' && session.hasTranscript) ||
        (filter === 'audio' && session.hasRecording) ||
        (filter === 'active' && session.status === 'active')

      if (!matchesFilter) return false
      if (!normalizedQuery) return true

      const searchable = [
        sessionTitle(session.participants),
        sessionSubtitle(session.startedAt, session.endedAt, session.status),
        shortSessionCode(session.sessionId),
        session.transcriptPreview ?? '',
        ...session.participants.flatMap((p) => [
          participantDisplayName(p),
          formatLangPair(p.sourceLang, p.targetLang),
        ]),
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(normalizedQuery)
    })
  }, [filter, query, sessions])

  const latestSession = sessions[0]

  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden p-4 md:p-6">
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <header
          className="shrink-0 overflow-hidden p-5 md:p-6"
          style={{
            background: 'var(--md-surface-container-lowest)',
            border: '1px solid var(--md-outline-variant)',
            borderRadius: 'var(--shape-sm)',
          }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl leading-10 md:text-4xl md:leading-[3rem]" style={{ color: 'var(--md-on-surface)' }}>
                Your conversations
              </h1>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--md-on-surface-variant)' }}>
                Review past translation sessions, saved transcripts, recordings, languages, and people in one focused place.
              </p>
            </div>

            {/* <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[31rem]">
              <StatTile icon={CalendarDays} label="Sessions" value={sessions.length} />
              <StatTile icon={MessageSquare} label="Transcripts" value={stats.transcriptCount} />
              <StatTile icon={FileAudio} label="Recordings" value={stats.audioCount} />
            </div> */}
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col gap-4">
          <div
            className="shrink-0 p-3"
            style={{
              background: 'var(--md-surface-container-lowest)',
              border: '1px solid var(--md-outline-variant)',
              borderRadius: 'var(--shape-sm)',
            }}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label
                className="flex min-h-12 flex-1 items-center gap-3 px-3"
                style={{
                  background: 'var(--md-surface-container)',
                  border: '1px solid var(--md-outline-variant)',
                  borderRadius: 'var(--shape-sm)',
                  color: 'var(--md-on-surface-variant)',
                }}
              >
                <Search size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search people, languages, transcripts, or session codes"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--md-on-surface)' }}
                />
              </label>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                
                {filters.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    className="md-chip shrink-0"
                    style={
                      filter === item.value
                        ? {
                            background: 'var(--md-primary-container)',
                            borderColor: 'var(--md-primary-container)',
                            color: 'var(--md-on-primary-container)',
                          }
                        : undefined
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {loading && <LoadingState />}

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
                className="flex min-h-80 flex-col items-center justify-center gap-3 px-6 py-16 text-center"
                style={{
                  background: 'var(--md-surface-container-lowest)',
                  border: '1px dashed var(--md-outline-variant)',
                  borderRadius: 'var(--shape-sm)',
                }}
              >
                <Clock size={40} style={{ color: 'var(--md-outline)' }} />
                <p className="text-base font-medium leading-6" style={{ color: 'var(--md-on-surface)' }}>
                  No conversations yet
                </p>
                <p className="max-w-sm text-sm leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Finished live translation sessions will appear here with transcripts and recordings.
                </p>
              </div>
            )}

            {!loading && !error && sessions.length > 0 && filteredSessions.length === 0 && (
              <div
                className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-center"
                style={{
                  background: 'var(--md-surface-container-lowest)',
                  border: '1px solid var(--md-outline-variant)',
                  borderRadius: 'var(--shape-sm)',
                }}
              >
                <Search size={34} style={{ color: 'var(--md-outline)' }} />
                <p className="text-base font-medium leading-6" style={{ color: 'var(--md-on-surface)' }}>
                  No matching conversations
                </p>
                <p className="max-w-sm text-sm leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Adjust the search or switch filters to see more sessions.
                </p>
              </div>
            )}

            {!loading && !error && filteredSessions.length > 0 && (
              <ul className="space-y-3 pb-4">
                {filteredSessions.map((s) => (
                  <SessionCard
                    key={s.sessionId}
                    session={s}
                    onOpen={() => navigate(`/app/history/${encodeURIComponent(s.sessionId)}`)}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
