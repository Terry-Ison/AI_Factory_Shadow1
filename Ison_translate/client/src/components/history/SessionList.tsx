import { ArrowLeft, Clock, MessageSquare } from 'lucide-react'
import type { HistorySession, HistoryUser } from '@/data/historyDummy'
import { languageLabel } from '@/config'
import { cn } from '@/lib/utils'

type Props = {
  user: HistoryUser
  sessions: HistorySession[]
  selectedSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onBack: () => void
}

export function SessionList({
  user,
  sessions,
  selectedSessionId,
  onSelectSession,
  onBack,
}: Props) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground md:hidden"
        >
          <ArrowLeft size={14} />
          All users
        </button>
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
            {user.initials}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-card-foreground">{user.name}</h2>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </header>

      <ul className="flex-1 space-y-1 overflow-y-auto p-2">
        {sessions.map((session) => {
          const isSelected = selectedSessionId === session.id
          return (
            <li key={session.id}>
              <button
                type="button"
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:border-border hover:bg-muted/50',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{session.title}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {session.sessionId}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{session.date}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {session.duration}
                  </span>
                  <span>
                    {languageLabel(session.sourceLang)} → {languageLabel(session.targetLang)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare size={12} />
                    with {session.partnerName}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
