import { assertDeepLConfigured, config } from '../config.js'
import {
  closeSessionStreams,
  closeStream,
  getOrCreateStream,
  segmentsToText,
} from '../deepl/deeplVoiceClient.js'
import { getDeepLStatus, verifyDeepLAccess } from '../deepl/verifyDeepL.js'
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
import { relayRtcSignal } from './rtcSignaling.js'

/**
 * @param {import('socket.io').Server} io
 */
export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('join_session', (payload, ack) => {
      try {
        const rawSessionId = String(payload?.sessionId ?? '').trim()
        const sessionId = normalizeSessionId(rawSessionId)
        const userId = String(payload?.userId ?? socket.id).trim()
        const sourceLang = normalizeLang(payload?.sourceLang)
        const targetLang = normalizeLang(payload?.targetLang)

        if (!sessionId) {
          ack?.({ ok: false, error: 'sessionId is required' })
          return
        }

        const result = joinSession(
          sessionId,
          socket.id,
          { userId, sourceLang, targetLang },
          io,
        )

        if (result.error) {
          ack?.({ ok: false, error: result.error })
          return
        }

        socket.join(result.sessionId)

        const deepl = getDeepLStatus()

        ack?.({
          ok: true,
          type: 'session_joined',
          clientId: result.clientId,
          sessionId: result.sessionId,
          isInitiator: result.isInitiator,
          participantCount: result.participantCount,
          partnerConnected: result.participantCount > 1,
          deeplOk: deepl.ok,
          deeplError: deepl.error,
        })

        broadcastSessionState(io, result.sessionId)

        if (result.peer && config.deeplAuthKey) {
          preconnectDeepL(io, result.sessionId, socket.id)
          preconnectDeepL(io, result.sessionId, result.peer.socketId)
        }

        if (!deepl.checked) {
          void verifyDeepLAccess()
        }
      } catch (err) {
        ack?.({
          ok: false,
          error: err instanceof Error ? err.message : 'Failed to join session',
        })
      }
    })

    socket.on('audio_chunk', async (chunk) => {
      try {
        if (!config.deeplAuthKey) {
          emitError(socket, 'DeepL API key is not configured on the server (api/.env)')
          return
        }

        const deepl = getDeepLStatus().checked ? getDeepLStatus() : await verifyDeepLAccess()
        if (!deepl.ok) {
          emitError(socket, deepl.error ?? 'DeepL is not available')
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

        if (!peer) {
          socket.emit('session_status', {
            type: 'session_status',
            message: 'Waiting for a partner to join the same session ID before translation can start.',
          })
          return
        }

        const buffer = normalizeAudioChunk(chunk)
        if (!buffer.length) return

        const targetLang = speaker.targetLang

        const stream = getOrCreateStream({
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
        await stream.sendAudioChunk(buffer)
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
  if (event.kind === 'source_transcript') {
    const concluded = segmentsToText(event.concluded)
    const tentative = segmentsToText(event.tentative)
    const transcript = [concluded, tentative].filter(Boolean).join(' ').trim()
    if (!transcript) return

    io.to(speakerSocketId).emit('self_transcript', {
      type: 'self_transcript',
      transcript,
      isFinal: Boolean(concluded),
    })
  }

  if (event.kind === 'target_transcript') {
    const concluded = segmentsToText(event.concluded)
    const tentative = segmentsToText(event.tentative)
    const translation = [concluded, tentative].filter(Boolean).join(' ').trim()
    if (!translation) return

    io.to(partnerSocketId).emit('translation_result', {
      type: 'translation_result',
      translation,
      isFinal: Boolean(concluded),
    })
  }

  if (event.kind === 'target_media') {
    const packets = event.data ?? []
    if (!packets.length) return

    io.to(partnerSocketId).emit('translation_result', {
      type: 'translation_result',
      translation: event.text ?? '',
      audioChunks: packets,
      audioContentType: event.contentType ?? 'audio/webm;codecs=opus',
      isFinal: false,
    })
  }
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function cleanupSocket(io, socket) {
  const result = leaveSession(socket.id)
  if (!result) return

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

export { assertDeepLConfigured }
