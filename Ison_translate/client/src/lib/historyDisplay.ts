import { languageLabel } from '../config'

export type HistoryParticipantView = {
  userId: string
  sourceLang: string
  targetLang: string
  isInitiator?: boolean
  displayName?: string | null
  isYou?: boolean
}

/** Short shareable code from a session UUID (e.g. 384FED16). */
export function shortSessionCode(sessionId: string): string {
  return sessionId.replace(/-/g, '').slice(0, 8).toUpperCase()
}

export function formatGuestLabel(userId: string): string {
  if (userId.startsWith('guest-')) return 'Guest'
  if (userId.length > 16) return 'Partner'
  return userId
}

export function participantDisplayName(p: HistoryParticipantView): string {
  if (p.isYou) return 'You'
  return p.displayName?.trim() || formatGuestLabel(p.userId)
}

export function formatLangPair(source: string, target: string): string {
  const s = languageLabel(source)
  const t = languageLabel(target)
  if (source === target) return s
  return `${s} → ${t}`
}

export function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffDays === 0) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' })
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return 'Under a second'
  if (ms < 60_000) return `${Math.round(ms / 1000)} sec`
  const min = Math.floor(ms / 60_000)
  const sec = Math.round((ms % 60_000) / 1000)
  if (min < 60) return sec > 0 ? `${min} min ${sec} sec` : `${min} min`
  const hr = Math.floor(min / 60)
  const rm = min % 60
  return rm > 0 ? `${hr} hr ${rm} min` : `${hr} hr`
}

export function sessionDurationMs(startedAt: string, endedAt: string | null): number {
  const start = new Date(startedAt).getTime()
  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  return Math.max(0, end - start)
}

export function sessionTitle(participants: HistoryParticipantView[]): string {
  const others = participants.filter((p) => !p.isYou)
  const langs = [...new Set(participants.map((p) => p.sourceLang))]

  if (others.length === 0) {
    if (langs.length === 1) return `${languageLabel(langs[0])} session`
    return 'Solo session'
  }

  const partner = participantDisplayName(others[0])
  if (langs.length >= 2) {
    return `With ${partner} · ${languageLabel(langs[0])} & ${languageLabel(langs[1])}`
  }
  return `Conversation with ${partner}`
}

export function sessionSubtitle(
  startedAt: string,
  endedAt: string | null,
  status: string,
): string {
  const duration = formatDurationMs(sessionDurationMs(startedAt, endedAt))
  const when = formatRelativeDate(startedAt)
  if (status === 'active') return `${when} · Still open · ${duration} so far`
  return `${when} · ${duration}`
}

export function statusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'active':
      return { label: 'In progress', className: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' }
    case 'ended':
      return { label: 'Completed', className: 'bg-slate-500/15 text-slate-300 ring-slate-500/30' }
    case 'pending':
      return { label: 'Waiting', className: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' }
    default:
      return { label: status, className: 'bg-slate-500/15 text-slate-300 ring-slate-500/30' }
  }
}

export function recordingLabel(kind: 'source_uplink' | 'target_tts', participantName?: string): string {
  if (kind === 'source_uplink') {
    return participantName ? `${participantName}'s voice` : 'Your voice'
  }
  return participantName ? `Translation for ${participantName}` : 'Translated audio'
}
