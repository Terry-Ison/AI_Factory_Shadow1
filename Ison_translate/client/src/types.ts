export type MicStatus = 'idle' | 'recording' | 'muted'

export type TranscriptLine = {
  id: string
  text: string
  isFinal: boolean
  timestamp: number
}

export type JoinSessionPayload = {
  sessionId: string
  userId: string
  sourceLang: string
  targetLang: string
}

export type SessionJoinAck = {
  ok: boolean
  error?: string
  clientId?: string
  sessionId?: string
  isInitiator?: boolean
  participantCount?: number
  partnerConnected?: boolean
  deeplOk?: boolean
  deeplError?: string | null
}

export type SessionStateMessage = {
  type: 'session_state'
  sessionId: string
  participantCount: number
  partnerConnected: boolean
  partnerUserId?: string | null
}

export type TranslationResultMessage = {
  type: 'translation_result'
  translation: string
  transcript?: string
  audio?: string
  audioChunks?: string[]
  audioContentType?: string
  audioSampleRate?: number
  isFinal?: boolean
}

export type SelfTranscriptMessage = {
  type: 'self_transcript'
  transcript: string
  isFinal?: boolean
}

export type WebRtcSignalMessage = {
  from: string
  type: 'offer' | 'answer' | 'ice_candidate'
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

export type PeerJoinedMessage = {
  type: 'peer_joined'
  peerId: string
  userId: string
}

export type SessionConfig = {
  sessionId: string
  userId: string
  sourceLang: string
  targetLang: string
  clientId: string
  isInitiator: boolean
}
