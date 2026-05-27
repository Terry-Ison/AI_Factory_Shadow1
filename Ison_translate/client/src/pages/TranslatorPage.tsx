import { useCallback, useMemo, useRef, useState } from 'react'
import { MicControl } from '../components/MicControl'
import { SessionJoin } from '../components/SessionJoin'
import { SubtitlePanel } from '../components/SubtitlePanel'
import { languageLabel } from '../config'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { useMicCapture } from '../hooks/useMicCapture'
import { useWebRTC } from '../hooks/useWebRTC'
import { useWebSocket } from '../hooks/useWebSocket'
import type {
  SessionConfig,
  TranscriptLine,
  WebRtcSignalMessage,
} from '../types'

function createLine(text: string, isFinal: boolean): TranscriptLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    isFinal,
    timestamp: Date.now(),
  }
}

function upsertTranscriptLine(lines: TranscriptLine[], text: string, isFinal: boolean) {
  if (!text.trim()) return lines

  const next = [...lines]
  const last = next[next.length - 1]

  if (last && !last.isFinal) {
    next[next.length - 1] = { ...last, text, isFinal }
    return next
  }

  if (last && last.isFinal && last.text === text) return next

  next.push(createLine(text, isFinal))
  return next.slice(-40)
}

export function TranslatorPage() {
  const [sessionIdInput, setSessionIdInput] = useState('')
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('hi')
  const [session, setSession] = useState<SessionConfig | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [partnerConnected, setPartnerConnected] = useState(false)
  const [selfLines, setSelfLines] = useState<TranscriptLine[]>([])
  const [partnerLines, setPartnerLines] = useState<TranscriptLine[]>([])
  const [rtcSignal, setRtcSignal] = useState<WebRtcSignalMessage | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [statusHint, setStatusHint] = useState<string | null>(null)

  const userIdRef = useRef(`user-${Math.random().toString(36).slice(2, 9)}`)
  const { enqueueTranslatedAudio, prime: primeAudio } = useAudioPlayer()
  const [serverError, setServerError] = useState<string | null>(null)

  const ws = useWebSocket({
    onTranslationResult: (msg) => {
      const text = msg.translation?.trim()
      if (text) {
        setPartnerLines((lines) => upsertTranscriptLine(lines, text, Boolean(msg.isFinal)))
      }
      if (msg.audioChunks?.length) {
        void primeAudio()
        enqueueTranslatedAudio(msg.audioChunks, msg.audioContentType)
      } else if (msg.audio) {
        void primeAudio()
        enqueueTranslatedAudio([msg.audio], msg.audioContentType ?? 'audio/pcm;encoding=s16le;rate=24000')
      }
    },
    onSelfTranscript: (msg) => {
      setSelfLines((lines) => upsertTranscriptLine(lines, msg.transcript, Boolean(msg.isFinal)))
    },
    onWebRtcSignal: (msg) => setRtcSignal(msg),
    onPeerJoined: () => {
      setPartnerConnected(true)
      setStatusHint(null)
    },
    onPeerLeft: () => {
      setPartnerConnected(false)
      setStatusHint('Partner left. Waiting for someone to join the same session ID.')
    },
    onSessionState: (msg) => {
      setPartnerConnected(msg.partnerConnected)
      if (msg.partnerConnected) {
        setStatusHint(null)
      } else {
        setStatusHint(
          `Waiting for partner in session "${msg.sessionId}". Open a second tab with the same session ID.`,
        )
      }
    },
    onConnectedChange: setSocketConnected,
    onErrorMessage: (message) => setServerError(message),
  })

  const mic = useMicCapture({
    enabled: Boolean(session),
    muted,
    onChunk: ws.sendAudioChunk,
  })

  useWebRTC({
    enabled: Boolean(session),
    isInitiator: session?.isInitiator ?? false,
    localStream: mic.stream,
    onSignal: ws.sendWebRtcSignal,
    onRemoteStream: () => {},
    onSignalMessage: rtcSignal,
  })

  const handleJoin = useCallback(async () => {
    setJoinError(null)
    setServerError(null)
    setStatusHint(null)
    setJoining(true)

    try {
      await ws.connect()
      void primeAudio()

      const ack = await ws.joinSession({
        sessionId: sessionIdInput.trim(),
        userId: userIdRef.current,
        sourceLang,
        targetLang,
      })

      if (!ack.ok || !ack.clientId || !ack.sessionId) {
        setJoinError(ack.error ?? 'Could not join session')
        return
      }

      if (ack.deeplOk === false && ack.deeplError) {
        setServerError(ack.deeplError)
      }

      setSession({
        sessionId: ack.sessionId,
        userId: userIdRef.current,
        sourceLang,
        targetLang,
        clientId: ack.clientId,
        isInitiator: Boolean(ack.isInitiator),
      })
      const hasPartner = Boolean(ack.partnerConnected ?? (ack.participantCount ?? 1) > 1)
      setPartnerConnected(hasPartner)
      if (!hasPartner) {
        setStatusHint(
          `In session "${ack.sessionId}". Open a second tab, enter the same session ID with swapped languages, then join.`,
        )
      }
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join session')
    } finally {
      setJoining(false)
    }
  }, [sessionIdInput, sourceLang, targetLang, ws, primeAudio])

  const handleLeave = useCallback(() => {
    ws.disconnect()
    mic.stopCapture()
    setSession(null)
    setPartnerConnected(false)
    setSelfLines([])
    setPartnerLines([])
    setRtcSignal(null)
    setStatusHint(null)
    setServerError(null)
  }, [mic, ws])

  const badges = useMemo(
    () => ({
      self: languageLabel(sourceLang),
      partner: `${languageLabel(targetLang)} → ${languageLabel(sourceLang)}`,
    }),
    [sourceLang, targetLang],
  )

  if (!session) {
    return (
      <main className="flex min-h-full items-center justify-center p-6">
        <div>
          <SessionJoin
            sessionId={sessionIdInput}
            sourceLang={sourceLang}
            targetLang={targetLang}
            joining={joining}
            onSessionIdChange={setSessionIdInput}
            onSourceLangChange={setSourceLang}
            onTargetLangChange={setTargetLang}
            onJoin={handleJoin}
          />
          {joinError ? <p className="mt-4 text-center text-sm text-rose-400">{joinError}</p> : null}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Session {session.sessionId}</h1>
          <p className="text-sm text-slate-400">
            Speaking {languageLabel(session.sourceLang)} · Partner speaks{' '}
            {languageLabel(session.targetLang)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Share this exact session ID with your partner:{' '}
            <span className="font-mono text-indigo-300">{session.sessionId}</span>
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>User ID: {session.userId}</p>
          <p>Server: {socketConnected ? 'connected' : 'disconnected'}</p>
          <p>Mic: {mic.status}</p>
        </div>
      </header>

      <MicControl
        status={mic.status}
        muted={muted}
        partnerConnected={partnerConnected}
        onToggleMute={() => setMuted((value) => !value)}
        onLeave={handleLeave}
      />

      {statusHint ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          {statusHint}
        </p>
      ) : null}

      {serverError ? (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {serverError}
        </p>
      ) : null}

      {mic.error ? (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {mic.error}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2 lg:min-h-[420px]">
        <SubtitlePanel
          title="You said"
          badge={badges.self}
          lines={selfLines}
          emptyText="Your speech will appear here as you talk."
        />
        <SubtitlePanel
          title="Partner said (translated)"
          badge={badges.partner}
          lines={partnerLines}
          emptyText="Your partner's translated speech will appear here."
        />
      </div>
    </main>
  )
}
