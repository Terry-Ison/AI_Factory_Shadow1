import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { JoinDifferentModal } from '../components/JoinDifferentModal'
import { SessionBanner } from '../components/SessionBanner'
import { SubtitlePanel } from '../components/SubtitlePanel'
import { languageLabel } from '../config'
import { useAuth } from '../context/AuthContext'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { useMicCapture } from '../hooks/useMicCapture'
import { useWebRTC } from '../hooks/useWebRTC'
import { useWebSocket } from '../hooks/useWebSocket'
import type { SessionConfig, TranscriptLine, WebRtcSignalMessage } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const MAX_TRANSCRIPT_CHARS = 12_000

async function generateSessionId(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/sessions`, { method: 'POST' })
  if (!res.ok) throw new Error('Could not create session')
  const data = await res.json()
  return data.sessionId as string
}

// ─── transcript helpers ───────────────────────────────────────────────────────

function createLine(text: string, isFinal: boolean): TranscriptLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    isFinal,
    timestamp: Date.now(),
  }
}

function appendTranscriptSegment(lines: TranscriptLine[], text: string, isFinal: boolean) {
  const trimmed = text.trim()
  if (!trimmed) return lines
  const next = [...lines]
  const last = next[next.length - 1]
  if (!last) { next.push(createLine(trimmed, isFinal)); return next }
  if (last.text === trimmed) {
    if (!last.isFinal && isFinal) next[next.length - 1] = { ...last, isFinal: true }
    return next
  }
  if (trimmed.startsWith(last.text.trim())) {
    next[next.length - 1] = { ...last, text: trimmed, isFinal: isFinal || last.isFinal }
    return trimTranscriptText(next)
  }
  if (last.text.endsWith(trimmed)) return next
  const merged = last.isFinal
    ? joinParts(last.text, trimmed)
    : (trimmed.startsWith(last.text.trim()) ? trimmed : joinParts(last.text, trimmed))
  next[next.length - 1] = { ...last, text: merged, isFinal }
  return trimTranscriptText(next)
}

function joinParts(prev: string, next: string) {
  if (!prev) return next
  if (/[ \-—]$/.test(prev) || /^[.,!?;:'")\]}]/.test(next)) return `${prev}${next}`
  return `${prev} ${next}`
}

function trimTranscriptText(lines: TranscriptLine[]) {
  const last = lines[lines.length - 1]
  if (!last || last.text.length <= MAX_TRANSCRIPT_CHARS) return lines
  const next = [...lines]
  next[next.length - 1] = { ...last, text: `…${last.text.slice(-MAX_TRANSCRIPT_CHARS)}` }
  return next
}

// ─── component ────────────────────────────────────────────────────────────────

export function TranslatorPage() {
  const { user, token, isGuest, sourceLang, pendingSessionId, clearPendingSession } = useAuth()

  const [srcLang] = useState(sourceLang)
  const [tgtLang, setTgtLang] = useState(sourceLang)

  const [session, setSession] = useState<SessionConfig | null>(null)
  const [joining, setJoining] = useState(false)
  const [muted, setMuted] = useState(false)
  const [partnerConnected, setPartnerConnected] = useState(false)
  const [selfLines, setSelfLines] = useState<TranscriptLine[]>([])
  const [partnerLines, setPartnerLines] = useState<TranscriptLine[]>([])
  const [rtcSignal, setRtcSignal] = useState<WebRtcSignalMessage | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [hasLeft, setHasLeft] = useState(false)

  const autoJoinAbortRef = useRef<AbortController | null>(null)
  const userIdRef = useRef(
    user?.id ??
      (isGuest
        ? `guest-${Math.random().toString(36).slice(2, 9)}`
        : `anon-${Math.random().toString(36).slice(2, 9)}`),
  )

  const { enqueueTranslatedAudio, prime: primeAudio } = useAudioPlayer()

  const ws = useWebSocket({
    onTranslationResult: (msg) => {
      if (msg.translation?.trim()) {
        setPartnerLines((l) =>
          appendTranscriptSegment(l, msg.translation.trim(), Boolean(msg.isFinal)),
        )
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
      setSelfLines((l) => appendTranscriptSegment(l, msg.transcript, Boolean(msg.isFinal)))
    },
    onWebRtcSignal: (msg) => setRtcSignal(msg),
    onPeerJoined: (msg) => {
      setPartnerConnected(true)
      if (msg.targetLang) {
        setTgtLang(msg.targetLang)
        setSession((s) => (s ? { ...s, targetLang: msg.targetLang! } : s))
      }
    },
    onPeerLeft: () => setPartnerConnected(false),
    onSessionState: (msg) => setPartnerConnected(msg.partnerConnected),
    onConnectedChange: setSocketConnected,
    onErrorMessage: (msg) => setServerError(msg),
  })

  const mic = useMicCapture({
    enabled: Boolean(session) && partnerConnected,
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

  // Core join logic — accepts an explicit session ID
  const joinSession = useCallback(
    async (sessionId: string) => {
      setServerError(null)
      setJoining(true)
      try {
        await ws.connect()
        void primeAudio()

        const ack = await ws.joinSession({
          sessionId,
          userId: userIdRef.current,
          sourceLang: srcLang,
          authToken: token ?? undefined,
        })

        if (!ack.ok || !ack.clientId || !ack.sessionId) {
          setServerError(ack.error ?? 'Could not join session')
          return
        }
        if (ack.deeplOk === false && ack.deeplError) setServerError(ack.deeplError)

        const resolvedTarget = ack.targetLang ?? srcLang
        setTgtLang(resolvedTarget)
        setSession({
          sessionId: ack.sessionId,
          userId: userIdRef.current,
          sourceLang: srcLang,
          targetLang: resolvedTarget,
          clientId: ack.clientId,
          isInitiator: Boolean(ack.isInitiator),
        })
        setPartnerConnected(Boolean(ack.partnerConnected ?? (ack.participantCount ?? 1) > 1))
      } catch (err) {
        setServerError(err instanceof Error ? err.message : 'Failed to join session')
      } finally {
        setJoining(false)
      }
    },
    [srcLang, ws, primeAudio, token],
  )

  // Auto-join after mount (delay avoids React Strict Mode killing socket mid-connect)
  useEffect(() => {
    autoJoinAbortRef.current?.abort()
    const ac = new AbortController()
    autoJoinAbortRef.current = ac

    const timer = window.setTimeout(() => {
      if (ac.signal.aborted) return

      async function autoJoin() {
        try {
          let sessionId: string
          if (pendingSessionId) {
            sessionId = pendingSessionId
            clearPendingSession()
          } else {
            sessionId = await generateSessionId()
          }
          if (ac.signal.aborted) return
          await joinSession(sessionId)
        } catch (err) {
          if (ac.signal.aborted) return
          setServerError(err instanceof Error ? err.message : 'Auto-join failed')
        }
      }

      void autoJoin()
    }, 150)

    return () => {
      ac.abort()
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLeave = useCallback(() => {
    ws.disconnect()
    mic.stopCapture()
    setSession(null)
    setPartnerConnected(false)
    setSelfLines([])
    setPartnerLines([])
    setRtcSignal(null)
    setServerError(null)
    setTgtLang(srcLang)
    setHasLeft(true)
  }, [mic, ws, srcLang])

  const startNewSession = useCallback(async () => {
    setHasLeft(false)
    setServerError(null)
    try {
      const sessionId = await generateSessionId()
      await joinSession(sessionId)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not create session')
    }
  }, [joinSession])

  const handleJoinDifferent = useCallback(
    async (newSessionId: string) => {
      setShowJoinModal(false)
      setHasLeft(false)
      // Leave the current session first
      ws.disconnect()
      mic.stopCapture()
      setSession(null)
      setPartnerConnected(false)
      setSelfLines([])
      setPartnerLines([])
      setRtcSignal(null)
      setServerError(null)
      setTgtLang(srcLang)

      await joinSession(newSessionId)
    },
    [joinSession, mic, ws, srcLang],
  )

  const badges = useMemo(
    () => ({
      self: languageLabel(srcLang),
      partner: partnerConnected ? languageLabel(tgtLang) : 'Waiting for partner…',
    }),
    [srcLang, tgtLang, partnerConnected],
  )

  // Post-leave idle state
  if (hasLeft && !session && !joining) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <SessionBanner
          session={null}
          joining={false}
          muted={false}
          partnerConnected={false}
          socketConnected={socketConnected}
          micStatus="idle"
          sourceLang={srcLang}
          targetLang={tgtLang}
          onLeave={() => {}}
          onToggleMute={() => {}}
          onJoinDifferent={() => setShowJoinModal(true)}
        />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
          {serverError && (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
              {serverError}
            </p>
          )}
          <div>
            <p className="mb-1 text-base font-semibold text-white">Session ended</p>
            <p className="text-sm text-slate-400">Start a fresh session or join one shared by your partner.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={startNewSession}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Start new session
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
            >
              Join a different session
            </button>
          </div>
        </div>
        {showJoinModal && (
          <JoinDifferentModal
            onConfirm={handleJoinDifferent}
            onClose={() => setShowJoinModal(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SessionBanner
        session={session}
        joining={joining}
        muted={muted}
        partnerConnected={partnerConnected}
        socketConnected={socketConnected}
        micStatus={partnerConnected ? mic.status : 'waiting for partner'}
        sourceLang={srcLang}
        targetLang={tgtLang}
        onLeave={handleLeave}
        onToggleMute={() => setMuted((v) => !v)}
        onJoinDifferent={() => setShowJoinModal(true)}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
        {/* Waiting-for-partner callout */}
        {session && !partnerConnected && (
          <div className="shrink-0 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
            <p className="text-sm font-medium text-indigo-200">
              Waiting for your partner to join…
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Share session ID{' '}
              <button
                onClick={() => navigator.clipboard.writeText(session.sessionId)}
                className="font-mono text-indigo-300 hover:underline"
                title="Click to copy"
              >
                {session.sessionId}
              </button>{' '}
              with your partner. Translation begins automatically when they connect.
            </p>
          </div>
        )}

        {serverError && (
          <p className="shrink-0 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
            {serverError}
          </p>
        )}
        {mic.error && (
          <p className="shrink-0 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
            {mic.error}
          </p>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 gap-4 [&>*]:min-h-0 lg:grid-cols-2 lg:grid-rows-1">
          <SubtitlePanel
            title="You said"
            badge={badges.self}
            lines={selfLines}
            emptyText={
              joining || !session
                ? 'Setting up your session…'
                : !partnerConnected
                  ? 'Waiting for partner to join…'
                  : 'Your speech will appear here as you talk.'
            }
          />
          <SubtitlePanel
            title="Partner said (translated)"
            badge={badges.partner}
            lines={partnerLines}
            emptyText={
              joining || !session
                ? 'Setting up your session…'
                : !partnerConnected
                  ? 'Translation will appear here once your partner joins.'
                  : "Your partner's translated speech will appear here."
            }
          />
        </div>
      </div>

      {showJoinModal && (
        <JoinDifferentModal
          onConfirm={handleJoinDifferent}
          onClose={() => setShowJoinModal(false)}
        />
      )}
    </div>
  )
}
