import type { MicStatus } from '../types'

type Props = {
  status: MicStatus
  muted: boolean
  partnerConnected: boolean
  onToggleMute: () => void
  onLeave: () => void
}

const STATUS_LABEL: Record<MicStatus, string> = {
  idle: 'Idle',
  recording: 'Recording',
  muted: 'Muted',
}

const STATUS_COLOR: Record<MicStatus, string> = {
  idle: 'bg-muted-foreground',
  recording: 'bg-green-500',
  muted: 'bg-amber-500',
}

export function MicControl({ status, muted, partnerConnected, onToggleMute, onLeave }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[status]}`} />
        <span className="text-sm font-medium text-card-foreground">Mic: {STATUS_LABEL[status]}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            partnerConnected
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {partnerConnected ? 'Partner connected' : 'Waiting for partner'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMute}
          className="rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90"
        >
          Leave
        </button>
      </div>
    </div>
  )
}
