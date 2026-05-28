import { ArrowLeft, Clock, User } from 'lucide-react'
import type { HistorySession } from '@/data/historyDummy'
import { languageLabel } from '@/config'
import { SubtitlePanel } from '@/components/SubtitlePanel'

type Props = {
  session: HistorySession
  userName: string
  onBack: () => void
}

export function SessionDetail({ session, userName, onBack }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="shrink-0 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
        >
          <ArrowLeft size={14} />
          Back to sessions
        </button>
        <h2 className="text-lg font-bold text-foreground">{session.title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{session.date}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User size={12} />
            {userName} · Partner: {session.partnerName}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {session.duration}
          </span>
          <span className="font-mono">{session.sessionId}</span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <SubtitlePanel
          title="Speaker said"
          badge={languageLabel(session.sourceLang)}
          lines={session.selfLines}
          emptyText="No transcript recorded."
        />
        <SubtitlePanel
          title="Translated"
          badge={`${languageLabel(session.sourceLang)} → ${languageLabel(session.targetLang)}`}
          lines={session.partnerLines}
          emptyText="No translation recorded."
        />
      </div>
    </div>
  )
}
