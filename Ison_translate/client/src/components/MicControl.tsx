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
  idle: 'bg-slate-500',
  recording: 'bg-[var(--color-success)]',
  muted: 'bg-[var(--color-warning)]',
}

export function MicControl({ status, muted, partnerConnected, onToggleMute, onLeave }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/80 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[status]}`} />
        <span className="text-sm text-slate-300">Mic: {STATUS_LABEL[status]}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            partnerConnected
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-slate-500/20 text-slate-400'
          }`}
        >
          {partnerConnected ? 'Partner connected' : 'Waiting for partner'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMute}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-400 hover:text-white"
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="rounded-xl bg-rose-600/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
        >
          Leave
        </button>
      </div>
    </div>
  )
}
