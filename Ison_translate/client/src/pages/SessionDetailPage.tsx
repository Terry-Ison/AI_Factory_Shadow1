import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  FileAudio,
  Languages,
  MessageSquare,
  Mic,
  Timer,
  UserRound,
  Users,
} from 'lucide-react'
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

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Timer
  label: string
  value: string | number
}) {
  return (
    <div
      className="flex min-h-20 items-center gap-3 p-3"
      style={{
        background: 'var(--md-surface-container)',
        border: '1px solid var(--md-outline-variant)',
        borderRadius: 'var(--shape-sm)',
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center"
        style={{
          background: 'var(--md-secondary-container)',
          borderRadius: 'var(--shape-full)',
          color: 'var(--md-on-secondary-container)',
        }}
      >
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-5" style={{ color: 'var(--md-on-surface)' }}>
          {value}
        </p>
        <p className="text-xs leading-4" style={{ color: 'var(--md-outline)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

function Panel({
  title,
  icon: Icon,
  children,
  className = '',
  headerRight,
}: {
  title: string
  icon: typeof Users
  children: React.ReactNode
  className?: string
  headerRight?: React.ReactNode
}) {
  return (
    <section
      className={`flex min-h-0 flex-col ${className}`}
      style={{
        background: 'var(--md-surface-container-lowest)',
        border: '1px solid var(--md-outline-variant)',
        borderRadius: 'var(--shape-sm)',
      }}
    >
      <header
        className="flex shrink-0 items-center justify-between gap-2 px-4 py-3"
        style={{
          borderBottom: '1px solid var(--md-outline-variant)',
          color: 'var(--md-on-surface)',
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={17} style={{ color: 'var(--md-primary)' }} />
          <h2 className="text-sm font-medium leading-5">{title}</h2>
        </div>
        {headerRight}
      </header>
      {children}
    </section>
  )
}

function AudioRecordingsPanel({
  recordings,
  participantByDbId,
  token,
}: {
  recordings: HistorySessionDetail['recordings']
  participantByDbId: Map<string, string>
  token: string | null
}) {
  const [open, setOpen] = useState(true)

  return (
    <section
      className="shrink-0"
      style={{
        background: 'var(--md-surface-container-lowest)',
        border: '1px solid var(--md-outline-variant)',
        borderRadius: 'var(--shape-sm)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[var(--md-surface-container)]/50"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <FileAudio size={17} style={{ color: 'var(--md-primary)' }} />
          <h2 className="text-sm font-medium leading-5" style={{ color: 'var(--md-on-surface)' }}>
            Audio recordings
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
            style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
          >
            {recordings.length}
          </span>
        </div>
        <ChevronDown
          size={18}
          className="shrink-0 text-[var(--md-outline)] transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div
          className="border-t border-[var(--md-outline-variant)] p-4"
          style={{ borderColor: 'var(--md-outline-variant)' }}
        >
          {recordings.length === 0 ? (
            <div className="flex min-h-24 flex-col items-center justify-center gap-2 text-center">
              <Mic size={28} style={{ color: 'var(--md-outline)' }} />
              <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                No audio was saved for this session.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recordings.map((r) => {
                const owner = r.participantId ? participantByDbId.get(r.participantId) : undefined
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
                    className="flex flex-col p-3"
                    style={{
                      background: 'var(--md-surface-container)',
                      border: '1px solid var(--md-outline-variant)',
                      borderRadius: 'var(--shape-sm)',
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium leading-5" style={{ color: 'var(--md-on-surface)' }}>
                          {label}
                        </p>
                        <p className="text-xs leading-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                          {length}
                        </p>
                      </div>
                      <FileAudio size={17} className="shrink-0" style={{ color: 'var(--md-primary)' }} />
                    </div>
                    {r.finalizedAt ? (
                      <AuthenticatedAudio src={r.audioUrl} token={token} className="mt-auto w-full" />
                    ) : (
                      <p className="text-xs" style={{ color: '#f59e0b' }}>
                        This recording is still being saved.
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

function LoadingState() {
  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <div className="h-10 w-36 animate-pulse" style={{ background: 'var(--md-surface-container)', borderRadius: 'var(--shape-full)' }} />
      <div className="h-48 animate-pulse" style={{ background: 'var(--md-surface-container)', borderRadius: 'var(--shape-sm)' }} />
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="animate-pulse" style={{ background: 'var(--md-surface-container)', borderRadius: 'var(--shape-sm)' }} />
        <div className="animate-pulse" style={{ background: 'var(--md-surface-container)', borderRadius: 'var(--shape-sm)' }} />
      </div>
    </main>
  )
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
    setError(null)
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

  const participantByDbId = useMemo(() => {
    const map = new Map<string, string>()
    if (!detail) return map
    for (const p of detail.participants) {
      if (p.id) map.set(p.id, participantDisplayName(p))
    }
    return map
  }, [detail])

  const languageSummary = useMemo(() => {
    if (!detail) return ''
    return [...new Set(detail.participants.map((p) => formatLangPair(p.sourceLang, p.targetLang)))].join(' / ')
  }, [detail])

  function copyCode() {
    if (!detail) return
    void navigator.clipboard.writeText(detail.sessionId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  if (loading) return <LoadingState />

  if (error || !detail) {
    return (
      <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
        <button
          type="button"
          onClick={() => navigate('/app/history')}
          className="md-btn md-btn-text mb-4 gap-1"
          style={{ paddingLeft: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          All conversations
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
  const sourceMessages = detail.transcripts.filter((t) => t.role === 'source' || t.role === 'translation')

  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-4 overflow-hidden p-4 md:p-6">
      <button
        type="button"
        onClick={() => navigate('/app/history')}
        className="md-btn md-btn-text w-fit gap-1"
        style={{ paddingLeft: '0.5rem' }}
      >
        <ArrowLeft size={16} />
        All conversations
      </button>

      <header
        className="shrink-0"
     
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: 'var(--md-primary-container)',
                  color: 'var(--md-on-primary-container)',
                }}
              >
                <MessageSquare size={13} />
                Session detail
              </span>
              <span
                style={{
                  ...badge.style,
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

            <h1 className="text-2xl leading-8 md:text-4xl md:leading-[3rem]" style={{ color: 'var(--md-on-surface)' }}>
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--md-on-surface-variant)' }}>
              {formatSessionDate(detail.startedAt)}
              {detail.endedAt ? ` / Ended ${formatSessionDate(detail.endedAt)}` : ' / Still open'}
            </p>
          </div>

          <button
            type="button"
            onClick={copyCode}
            className="md-chip shrink-0 font-mono text-xs"
            title="Copy full session ID"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            #{code}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailStat icon={Timer} label="Duration" value={duration} />
          <DetailStat icon={Users} label="Participants" value={detail.participants.length} />
          <DetailStat icon={MessageSquare} label="Transcript lines" value={sourceMessages.length} />
          <DetailStat icon={FileAudio} label="Recordings" value={detail.recordings.length} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        <div className="grid min-h-0 shrink-0 gap-4 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <Panel title="Participants" icon={Users} className="shrink-0">
            <ul>
              {detail.participants.map((p, idx) => {
                const name = participantDisplayName(p)
                return (
                  <li
                    key={p.id ?? p.userId}
                    className="flex items-center gap-3 px-4 py-3"
                    style={idx > 0 ? { borderTop: '1px solid var(--md-outline-variant)' } : undefined}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold"
                      style={{
                        background: p.isYou ? 'var(--md-primary-container)' : 'var(--md-surface-container-high)',
                        borderRadius: 'var(--shape-full)',
                        color: p.isYou ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                      }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-5" style={{ color: 'var(--md-on-surface)' }}>
                        {name}
                        {p.isYou ? (
                          <span className="ml-2 text-xs font-normal" style={{ color: 'var(--md-primary)' }}>
                            You
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs leading-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                        <Languages size={12} />
                        {formatLangPair(p.sourceLang, p.targetLang)}
                      </p>
                    </div>
                    {p.isInitiator ? (
                      <span className="rounded-full px-2 py-1 text-xs" style={{ background: 'var(--md-surface-container)', color: 'var(--md-outline)' }}>
                        Host
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel title="Session info" icon={CalendarDays} className="shrink-0">
            <div className="space-y-3 p-4 text-sm leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>
              <div>
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--md-outline)' }}>
                  Languages
                </p>
                <p className="mt-1" style={{ color: 'var(--md-on-surface)' }}>
                  {languageSummary || 'Unavailable'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--md-outline)' }}>
                  Full session ID
                </p>
                <p className="mt-1 break-all font-mono text-xs" style={{ color: 'var(--md-on-surface)' }}>
                  {detail.sessionId}
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <Panel title="Transcript" icon={MessageSquare} className="min-h-[min(28rem,50vh)] lg:min-h-[min(32rem,60vh)]">
          <div className="max-h-[min(32rem,60vh)] min-h-0 overflow-y-auto p-4">
            {sourceMessages.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center gap-2 text-center">
                <MessageSquare size={34} style={{ color: 'var(--md-outline)' }} />
                <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                  No transcript was saved for this session.
                </p>
              </div>
            ) : (
              <ol className="space-y-3">
                {sourceMessages.map((t) => {
                  const speaker = t.participantId ? participantByDbId.get(t.participantId) : undefined
                  const isTranslation = t.role === 'translation'
                  return (
                    <li
                      key={t.id}
                      className="flex gap-3"
                    >
                      <div
                        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center"
                        style={{
                          background: isTranslation ? 'var(--md-secondary-container)' : 'var(--md-primary-container)',
                          borderRadius: 'var(--shape-full)',
                          color: isTranslation ? 'var(--md-on-secondary-container)' : 'var(--md-on-primary-container)',
                        }}
                      >
                        {isTranslation ? <Languages size={15} /> : <UserRound size={15} />}
                      </div>
                      <article
                        className="min-w-0 flex-1 p-3"
                        style={{
                          background: 'var(--md-surface-container)',
                          border: '1px solid var(--md-outline-variant)',
                          borderRadius: 'var(--shape-sm)',
                        }}
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-4" style={{ color: 'var(--md-outline)' }}>
                          <span style={{ color: 'var(--md-on-surface)', fontWeight: 500 }}>
                            {isTranslation ? 'Translation' : speaker ?? 'Speaker'}
                          </span>
                          <span>{t.language.toUpperCase()}</span>
                          <span>{formatSessionDate(t.recordedAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6" style={{ color: 'var(--md-on-surface-variant)' }}>
                          {t.text}
                        </p>
                      </article>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </Panel>
        </div>

        <AudioRecordingsPanel
          recordings={detail.recordings}
          participantByDbId={participantByDbId}
          token={token}
        />
      </div>
    </main>
  )
}
