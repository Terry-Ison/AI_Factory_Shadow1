import {
  Clock,
  Eye,
  FileAudio,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TablePagination } from '@/components/ui/TablePagination'
import { cn } from '@/lib/utils'
import { useAuth } from '../context/AuthContext'
import { fetchHistorySessions, type HistorySessionSummary } from '../lib/api'
import {
  formatDurationMs,
  formatLangPair,
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

function SessionActionsMenu({ onView, onDelete }: { onView: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const itemClass =
    'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-[var(--md-on-surface)] outline-none hover:bg-[var(--md-surface-container)] focus:bg-[var(--md-surface-container)]'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--md-on-surface-variant)] transition hover:bg-[var(--md-surface-container)]"
          aria-label="Session actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-36 p-1">
        <button
          type="button"
          className={itemClass}
          onClick={() => {
            onView()
            setOpen(false)
          }}
        >
          <Eye size={15} />
          View
        </button>
        <button
          type="button"
          className={cn(itemClass, 'text-red-600 hover:bg-red-500/10 focus:bg-red-500/10')}
          onClick={() => {
            onDelete()
            setOpen(false)
          }}
        >
          <Trash2 size={15} />
          Delete
        </button>
      </PopoverContent>
    </Popover>
  )
}

function SessionsTable({
  sessions: rows,
  onView,
  onDelete,
}: {
  sessions: HistorySessionSummary[]
  onView: (session: HistorySessionSummary) => void
  onDelete: (session: HistorySessionSummary) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-[var(--md-outline-variant)] hover:bg-transparent">
          <TableHead className="pl-4 text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)]">Session</TableHead>
          <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)] md:table-cell">Participants</TableHead>
          <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)] lg:table-cell">Languages</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)]">Status</TableHead>
          <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)] sm:table-cell">Duration</TableHead>
          <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)] xl:table-cell">When</TableHead>
          <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)] lg:table-cell">Assets</TableHead>
          <TableHead className="w-12 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--md-outline)]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((session) => {
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
            <TableRow
              key={session.sessionId}
              className="cursor-pointer border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container)]/60"
              onClick={() => onView(session)}
            >
              <TableCell className="pl-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{
                      background:
                        session.status === 'active'
                          ? 'var(--md-primary-container)'
                          : 'var(--md-surface-container-high)',
                      borderRadius: 'var(--shape-sm)',
                      color:
                        session.status === 'active'
                          ? 'var(--md-on-primary-container)'
                          : 'var(--md-on-surface-variant)',
                    }}
                  >
                    {session.status === 'active' ? <Mic size={16} /> : <MessageSquare size={16} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--md-on-surface)]">{title}</p>
                    <p className="truncate font-mono text-xs text-[var(--md-outline)]">#{code}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--md-on-surface-variant)] md:hidden">{subtitle}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden max-w-[10rem] truncate text-[var(--md-on-surface-variant)] md:table-cell">
                {people || `${session.participantCount} participants`}
              </TableCell>
              <TableCell className="hidden max-w-[10rem] truncate text-[var(--md-on-surface-variant)] lg:table-cell">
                {languageSummary || '—'}
              </TableCell>
              <TableCell>
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" style={badge.style}>
                  {badge.label}
                </span>
              </TableCell>
              <TableCell className="hidden text-[var(--md-on-surface-variant)] sm:table-cell">{duration}</TableCell>
              <TableCell className="hidden text-[var(--md-on-surface-variant)] xl:table-cell">{subtitle}</TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {session.hasTranscript && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--md-secondary-container)] px-2 py-0.5 text-[0.6875rem] text-[var(--md-on-secondary-container)]">
                      <MessageSquare size={11} />
                      Text
                    </span>
                  )}
                  {session.hasRecording && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--md-outline-variant)] px-2 py-0.5 text-[0.6875rem] text-[var(--md-on-surface-variant)]">
                      <FileAudio size={11} />
                      Audio
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                <SessionActionsMenu
                  onView={() => onView(session)}
                  onDelete={() => onDelete(session)}
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function TableLoadingState() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-14 animate-pulse border-b border-[var(--md-outline-variant)]"
          style={{ background: 'var(--md-surface-container)' }}
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  useEffect(() => {
    setPage(1)
  }, [query, filter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const paginatedSessions = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredSessions.slice(start, start + pageSize)
  }, [filteredSessions, pageSize, safePage])

  const openSession = (session: HistorySessionSummary) => {
    navigate(`/app/history/${encodeURIComponent(session.sessionId)}`)
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden p-4 md:p-6">
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <header
          className="shrink-0 overflow-hidden"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-xl leading-10 md:text-2xl font-bold" style={{ color: 'var(--md-on-surface)' }}>
                Your conversations
              </h1>
              <p className="text-sm leading-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                Review past translation sessions, saved transcripts, recordings, languages, and people in one focused place.
              </p>
            </div>
          </div>
        </header>

        <section
          className="flex min-h-0 flex-1 flex-col "
          style={{
            background: 'var(--md-surface-container-lowest)',
            border: '1px solid var(--md-outline-variant)',
            borderRadius: 'var(--shape-sm)',
          }}
        >
          <div
            className="flex shrink-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderBottom: '1px solid var(--md-outline-variant)' }}
          >
            <label
              className="flex py-1.5 flex-1 items-center gap-3 px-3"
              style={{
                border: '1px solid var(--md-outline-variant)',
                borderRadius: 'var(--shape-sm)',
                color: 'var(--md-on-surface-variant)',
              }}
            >
              <Search size={18} />
              <input
                type="text"
                name="search"
                id="search"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people, languages, transcripts, or session codes"
                className="min-w-0 flex-1 bg-transparent text-sm "
              />
            </label>

            <Select value={filter} onValueChange={(value) => setFilter(value as HistoryFilter)}>
              <SelectTrigger
                size="default"
                className="py-2 gap-2 border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-3 text-[var(--md-on-surface)] shadow-none hover:bg-[var(--md-surface-container-high)]"
              >
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-[9.5rem]">
                {filters.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {loading && <TableLoadingState />}

            {error && (
              <div
                className="m-4 px-4 py-3 text-sm"
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
              <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
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
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
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
              <SessionsTable
                sessions={paginatedSessions}
                onView={openSession}
                onDelete={(session) => window.alert(`Delete session #${shortSessionCode(session.sessionId)} — wire to API when ready.`)}
              />
            )}
          </div>

          {!loading && !error && filteredSessions.length > 0 && (
            <TablePagination
              page={safePage}
              pageSize={pageSize}
              total={filteredSessions.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </section>
      </div>
    </main>
  )
}
