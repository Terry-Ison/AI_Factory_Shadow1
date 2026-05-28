import { verifyToken } from '../auth/jwt.js'
import { config } from '../config.js'
import {
  closeSessionStreams,
  closeStream,
  getOrCreateStream,
  segmentsToText,
} from '../deepl/deeplVoiceClient.js'
import { getDeepLStatus, verifyDeepLAccess } from '../deepl/verifyDeepL.js'
import { createAudioRateLimiter } from '../middleware/socketRateLimit.js'
import {
  getClient,
  getPeer,
  getSessionBySocket,
  getSessionSnapshot,
  joinSession,
  leaveSession,
  normalizeLang,
  normalizeSessionId,
} from '../rooms/sessionManager.js'
import {
  appendSourceAudio,
  appendTargetTts,
  appendTranscript,
  addParticipant,
  closeParticipantRecordings,
  endParticipant,
  endSession,
  ensureSession,
  openParticipantRecordings,
  packetsToBuffers,
} from '../persistence/index.js'
import { relayRtcSignal } from './rtcSignaling.js'

const { checkAudioRate, clearSocket: clearAudioRate } = createAudioRateLimiter()

/**
 * @param {import('socket.io').Server} io
 */
export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('join_session', async (payload, ack) => {
      try {
        const rawSessionId = String(payload?.sessionId ?? '').trim()
        const sessionId = normalizeSessionId(rawSessionId)
        const sourceLang = normalizeLang(payload?.sourceLang)

        // Prefer stable account id when a valid JWT is supplied
        let accountUserId = null
        let displayName = null
        if (payload?.authToken) {
          const claims = verifyToken(payload.authToken)
          if (claims) {
            accountUserId = claims.sub
            displayName = claims.displayName
          }
        }
        const userId = accountUserId ?? String(payload?.userId ?? socket.id).trim()

        if (!sessionId) {
          ack?.({ ok: false, error: 'sessionId is required' })
          return
        }

        const result = joinSession(
          sessionId,
          socket.id,
          { userId, sourceLang },
          io,
        )

        if (result.error) {
          ack?.({ ok: false, error: result.error })
          return
        }

        socket.join(result.sessionId)

        const status = getDeepLStatus()
        const deepl = status.checked ? status : await verifyDeepLAccess()

        ack?.({
          ok: true,
          type: 'session_joined',
          clientId: result.clientId,
          sessionId: result.sessionId,
          isInitiator: result.isInitiator,
          participantCount: result.participantCount,
          partnerConnected: result.participantCount > 1,
          sourceLang,
          targetLang: result.resolvedTargetLang,
          deeplOk: deepl.ok,
          deeplError: deepl.error,
        })

        broadcastSessionState(io, result.sessionId)

        if (result.peer) {
          io.to(result.peer.socketId).emit('peer_joined', {
            type: 'peer_joined',
            peerId: socket.id,
            userId,
            // Inform first user their target lang is now resolved
            targetLang: result.peerResolvedTargetLang,
          })
        }

        if (result.peer && config.deeplAuthKey) {
          preconnectDeepL(io, result.sessionId, socket.id)
          preconnectDeepL(io, result.sessionId, result.peer.socketId)
        }

        if (!deepl.checked) {
          void verifyDeepLAccess()
        }

        void persistParticipantJoin(socket.id, result.sessionId, {
          userId,
          clientId: result.clientId,
          sourceLang,
          targetLang: result.resolvedTargetLang,
          isInitiator: result.isInitiator,
          accountUserId,
          displayName,
        })
      } catch (err) {
        ack?.({
          ok: false,
          error: err instanceof Error ? err.message : 'Failed to join session',
        })
      }
    })

    socket.on('audio_chunk', (chunk) => {
      try {
        const buffer = normalizeAudioChunk(chunk)
        if (!buffer.length) return

        if (!checkAudioRate(socket.id, buffer.length)) {
          emitError(socket, 'Audio rate limit exceeded. Slow down or check your microphone.')
          return
        }

        if (!config.deeplAuthKey) {
          emitError(socket, 'DeepL API key is not configured on the server (api/.env)')
          return
        }

        const status = getDeepLStatus()
        if (!status.checked) {
          void verifyDeepLAccess()
        } else if (!status.ok) {
          emitError(socket, status.error ?? 'DeepL is not available')
          return
        }

        const ctx = getSessionBySocket(socket.id)
        if (!ctx) {
          emitError(socket, 'Not in a session. Please join again.')
          return
        }

        const { session } = ctx
        const speaker = getClient(session, socket.id)
        const peer = getPeer(session, socket.id)
        if (!speaker) return

        // No partner yet — silently discard; client already blocks mic until partner connects
        if (!peer) return

        const targetLang = speaker.targetLang

        let stream = speaker.deeplClient
        if (!stream) {
          stream = getOrCreateStream({
            sessionId: session.id,
            socketId: socket.id,
            sourceLang: speaker.sourceLang,
            targetLang,
            onEvent: (event) => {
              handleDeepLEvent(io, socket.id, peer.client.socketId, event)
            },
            onClientError: (message) => {
              emitError(io.to(socket.id), message)
            },
          })
          speaker.deeplClient = stream
        }

        appendSourceAudio(socket.id, buffer)

        void stream.sendAudioChunk(buffer).catch((err) => {
          emitError(socket, err instanceof Error ? err.message : 'Audio processing failed')
        })
      } catch (err) {
        emitError(socket, err instanceof Error ? err.message : 'Audio processing failed')
      }
    })

    socket.on('webrtc_signal', (signal) => {
      const ctx = getSessionBySocket(socket.id)
      if (!ctx) return
      relayRtcSignal(io, ctx.session, socket.id, signal ?? {})
    })

    socket.on('leave_session', () => {
      cleanupSocket(io, socket)
    })

    socket.on('disconnect', () => {
      clearAudioRate(socket.id)
      cleanupSocket(io, socket)
    })
  })
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} sessionId
 * @param {string} socketId
 */
function preconnectDeepL(io, sessionId, socketId) {
  const ctx = getSessionBySocket(socketId)
  if (!ctx) return

  const { session } = ctx
  const speaker = getClient(session, socketId)
  const peer = getPeer(session, socketId)
  if (!speaker || !peer) return

  const stream = getOrCreateStream({
    sessionId,
    socketId,
    sourceLang: speaker.sourceLang,
    targetLang: speaker.targetLang,
    onEvent: (event) => {
      handleDeepLEvent(io, socketId, peer.client.socketId, event)
    },
    onClientError: (message) => {
      emitError(io.to(socketId), message)
    },
  })

  void stream.ensureConnected().catch((err) => {
    emitError(io.to(socketId), err.message)
  })
}

function broadcastSessionState(io, sessionId) {
  const snapshot = getSessionSnapshot(sessionId)
  if (!snapshot) return

  for (const client of snapshot.clients) {
    const peer = snapshot.clients.find((c) => c.socketId !== client.socketId) ?? null
    io.to(client.socketId).emit('session_state', {
      type: 'session_state',
      sessionId: snapshot.sessionId,
      participantCount: snapshot.participantCount,
      partnerConnected: snapshot.participantCount > 1,
      partnerUserId: peer?.userId ?? null,
    })
  }
}

function emitError(target, message) {
  target.emit('error_message', {
    type: 'error_message',
    message,
  })
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} speakerSocketId
 * @param {string} partnerSocketId
 * @param {Record<string, unknown>} event
 */
function handleDeepLEvent(io, speakerSocketId, partnerSocketId, event) {
  const speakerCtx = getSessionBySocket(speakerSocketId)
  const speaker = speakerCtx ? getClient(speakerCtx.session, speakerSocketId) : null
  const partner = speakerCtx ? getPeer(speakerCtx.session, speakerSocketId) : null

  if (event.kind === 'source_transcript') {
    const concluded = segmentsToText(event.concluded)
    const transcript = concluded
    if (!transcript) return

    io.to(speakerSocketId).emit('self_transcript', {
      type: 'self_transcript',
      transcript,
      isFinal: Boolean(concluded),
    })

    if (speaker?.dbSessionId) {
      void appendTranscript({
        sessionDbId: speaker.dbSessionId,
        participantDbId: speaker.participantDbId,
        role: 'source',
        language: speaker.sourceLang,
        text: transcript,
        isFinal: true,
      })
    }
  }

  if (event.kind === 'target_transcript') {
    const concluded = segmentsToText(event.concluded)
    const translation = concluded
    if (!translation) return

    io.to(partnerSocketId).emit('translation_result', {
      type: 'translation_result',
      translation,
      isFinal: Boolean(concluded),
    })

    if (speaker?.dbSessionId && partner?.client) {
      void appendTranscript({
        sessionDbId: speaker.dbSessionId,
        participantDbId: partner.client.participantDbId,
        role: 'translation',
        language: speaker.targetLang,
        text: translation,
        isFinal: true,
      })
    }
  }

  if (event.kind === 'target_media') {
    const packets = event.data ?? []
    if (!packets.length) return

    appendTargetTts(partnerSocketId, packetsToBuffers(packets))

    io.to(partnerSocketId).emit('translation_result', {
      type: 'translation_result',
      translation: event.text ?? '',
      audioChunks: packets,
      audioContentType: event.contentType ?? 'audio/pcm;encoding=s16le;rate=24000',
      isFinal: false,
    })
  }
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
async function persistParticipantJoin(socketId, sessionSlug, meta) {
  const dbSession = await ensureSession(sessionSlug)
  if (!dbSession) return

  const participant = await addParticipant({
    sessionDbId: dbSession.id,
    userId: meta.userId,
    clientId: meta.clientId,
    sourceLang: meta.sourceLang,
    targetLang: meta.targetLang,
    isInitiator: meta.isInitiator,
    accountUserId: meta.accountUserId ?? null,
  })
  if (!participant) return

  const ctx = getSessionBySocket(socketId)
  if (!ctx) return

  const client = getClient(ctx.session, socketId)
  if (!client) return

  client.dbSessionId = dbSession.id
  client.participantDbId = participant.id

  await openParticipantRecordings({
    socketId,
    sessionDbId: dbSession.id,
    participantDbId: participant.id,
  })
}

function cleanupSocket(io, socket) {
  const result = leaveSession(socket.id)
  if (!result) return

  const leaving = result.leaving
  if (leaving?.participantDbId) {
    void endParticipant(leaving.participantDbId)
  }
  void closeParticipantRecordings(socket.id)
  if (result.sessionEmpty && leaving?.dbSessionId) {
    void endSession(leaving.dbSessionId)
  }

  closeStream(result.sessionId, socket.id)

  if (result.sessionEmpty) {
    closeSessionStreams(result.sessionId)
  }

  if (result.peer) {
    io.to(result.peer.client.socketId).emit('peer_left', {
      type: 'peer_left',
      peerId: socket.id,
    })
  }

  if (!result.sessionEmpty) {
    broadcastSessionState(io, result.sessionId)
  }
}

/** @param {unknown} chunk */
function normalizeAudioChunk(chunk) {
  if (Buffer.isBuffer(chunk)) return chunk
  if (chunk instanceof ArrayBuffer) return Buffer.from(chunk)
  if (ArrayBuffer.isView(chunk)) {
    return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)
  }
  if (Array.isArray(chunk)) return Buffer.from(chunk)
  if (chunk && typeof chunk === 'object') {
    const obj = /** @type {{ type?: string, data?: number[] }} */ (chunk)
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return Buffer.from(obj.data)
    }
  }
  return Buffer.alloc(0)
}
