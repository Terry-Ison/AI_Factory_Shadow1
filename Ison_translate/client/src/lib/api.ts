const API_BASE = import.meta.env.VITE_API_URL ?? ''

function authHeaders(token: string | null | undefined): HeadersInit {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function fetchHistorySessions(token: string, page = 1, limit = 20) {
  const res = await fetch(`${API_BASE}/api/history/sessions?page=${page}&limit=${limit}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{
    page: number
    limit: number
    total: number
    sessions: HistorySessionSummary[]
  }>
}

export async function fetchHistorySession(token: string, sessionId: string) {
  const res = await fetch(`${API_BASE}/api/history/sessions/${encodeURIComponent(sessionId)}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<HistorySessionDetail>
}

export type HistoryParticipant = {
  userId: string
  sourceLang: string
  targetLang: string
  isInitiator: boolean
  isYou?: boolean
  displayName?: string | null
  joinedAt?: string
  leftAt?: string | null
}

export type HistorySessionSummary = {
  sessionId: string
  status: string
  startedAt: string
  endedAt: string | null
  participantCount: number
  participants: HistoryParticipant[]
  transcriptPreview: string | null
  hasTranscript: boolean
  hasRecording: boolean
}

export type HistoryTranscript = {
  id: string
  role: 'source' | 'translation'
  language: string
  text: string
  isFinal: boolean
  sequence: number
  recordedAt: string
  participantId: string | null
}

export type HistoryRecording = {
  id: string
  kind: 'source_uplink' | 'target_tts'
  contentType: string
  sampleRate: number
  filePath: string
  byteLength: number
  durationMs: number | null
  participantId: string | null
  finalizedAt: string | null
  audioUrl: string
}

export type HistorySessionDetail = {
  sessionId: string
  status: string
  startedAt: string
  endedAt: string | null
  participants: (HistoryParticipant & { id: string })[]
  transcripts: HistoryTranscript[]
  recordings: HistoryRecording[]
}

export function recordingAbsoluteUrl(audioUrl: string, token: string | null | undefined) {
  const base = audioUrl.startsWith('http') ? audioUrl : `${API_BASE}${audioUrl}`
  if (!token) return base
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}token=${encodeURIComponent(token)}`
}
