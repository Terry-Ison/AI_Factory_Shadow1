import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { API_URL } from '../config'
import type {
  JoinSessionPayload,
  PeerJoinedMessage,
  SelfTranscriptMessage,
  SessionJoinAck,
  SessionStateMessage,
  TranslationResultMessage,
  WebRtcSignalMessage,
} from '../types'

type Handlers = {
  onTranslationResult?: (msg: TranslationResultMessage) => void
  onSelfTranscript?: (msg: SelfTranscriptMessage) => void
  onWebRtcSignal?: (msg: WebRtcSignalMessage) => void
  onPeerJoined?: (msg: PeerJoinedMessage) => void
  onPeerLeft?: () => void
  onSessionState?: (msg: SessionStateMessage) => void
  onConnectedChange?: (connected: boolean) => void
  onErrorMessage?: (message: string) => void
}

const CONNECT_TIMEOUT_MS = 10000
const JOIN_TIMEOUT_MS = 10000

let sharedSocket: Socket | null = null
let listenerCount = 0

function getSharedSocket() {
  if (!sharedSocket) {
    sharedSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: CONNECT_TIMEOUT_MS,
    })
  }
  return sharedSocket
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}

export function useWebSocket(handlers: Handlers) {
  const handlersRef = useRef(handlers)
  const [connected, setConnected] = useState(false)
  const joinPayloadRef = useRef<JoinSessionPayload | null>(null)
  const activeSessionRef = useRef(false)

  handlersRef.current = handlers

  useEffect(() => {
    const socket = getSharedSocket()
    listenerCount += 1

    const onConnect = () => {
      setConnected(true)
      handlersRef.current.onConnectedChange?.(true)
    }

    const onDisconnect = () => {
      setConnected(false)
      handlersRef.current.onConnectedChange?.(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', (err: Error) => {
      handlersRef.current.onErrorMessage?.(
        `Cannot reach server${API_URL ? ` at ${API_URL}` : ''}: ${err.message}`,
      )
    })
    socket.on('translation_result', (msg: TranslationResultMessage) => {
      handlersRef.current.onTranslationResult?.(msg)
    })
    socket.on('self_transcript', (msg: SelfTranscriptMessage) => {
      handlersRef.current.onSelfTranscript?.(msg)
    })
    socket.on('webrtc_signal', (msg: WebRtcSignalMessage) => {
      handlersRef.current.onWebRtcSignal?.(msg)
    })
    socket.on('peer_joined', (msg: PeerJoinedMessage) => {
      handlersRef.current.onPeerJoined?.(msg)
    })
    socket.on('peer_left', () => {
      handlersRef.current.onPeerLeft?.()
    })
    socket.on('session_state', (msg: SessionStateMessage) => {
      handlersRef.current.onSessionState?.(msg)
    })
    socket.on('error_message', (msg: { message?: string }) => {
      if (msg?.message) handlersRef.current.onErrorMessage?.(msg.message)
    })
    socket.on('session_status', (msg: { message?: string }) => {
      if (msg?.message) handlersRef.current.onErrorMessage?.(msg.message)
    })

    if (socket.connected) {
      setConnected(true)
    }

    return () => {
      listenerCount -= 1
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.removeAllListeners('connect_error')
      socket.removeAllListeners('translation_result')
      socket.removeAllListeners('self_transcript')
      socket.removeAllListeners('webrtc_signal')
      socket.removeAllListeners('peer_joined')
      socket.removeAllListeners('peer_left')
      socket.removeAllListeners('session_state')
      socket.removeAllListeners('error_message')
      socket.removeAllListeners('session_status')

      if (listenerCount <= 0) {
        socket.disconnect()
        sharedSocket = null
        listenerCount = 0
      }
    }
  }, [])

  const connect = useCallback(() => {
    return withTimeout(
      new Promise<void>((resolve, reject) => {
        const socket = getSharedSocket()

        if (socket.connected) {
          resolve()
          return
        }

        const onConnect = () => {
          cleanup()
          resolve()
        }

        const onError = (err: Error) => {
          cleanup()
          reject(err)
        }

        const cleanup = () => {
          socket.off('connect', onConnect)
          socket.off('connect_error', onError)
        }

        socket.on('connect', onConnect)
        socket.on('connect_error', onError)
        socket.connect()
      }),
      CONNECT_TIMEOUT_MS,
      'Timed out connecting to server. Is the API running on port 3001?',
    )
  }, [])

  const disconnect = useCallback(() => {
    activeSessionRef.current = false
    joinPayloadRef.current = null
    getSharedSocket().emit('leave_session')
    getSharedSocket().disconnect()
  }, [])

  const joinSession = useCallback((payload: JoinSessionPayload) => {
    joinPayloadRef.current = {
      ...payload,
      sessionId: payload.sessionId.trim().toLowerCase(),
    }
    activeSessionRef.current = true

    const joinPromise = new Promise<SessionJoinAck>((resolve, reject) => {
      const socket = getSharedSocket()
      if (!socket.connected) {
        reject(new Error('Not connected to server'))
        return
      }

      socket.emit('join_session', joinPayloadRef.current, (ack: SessionJoinAck) => {
        resolve(ack ?? { ok: false, error: 'No response from server' })
      })
    })

    return withTimeout(joinPromise, JOIN_TIMEOUT_MS, 'Timed out joining session. Please try again.')
  }, [])

  const sendAudioChunk = useCallback((chunk: ArrayBuffer) => {
    if (!getSharedSocket().connected) return
    getSharedSocket().emit('audio_chunk', new Uint8Array(chunk))
  }, [])

  const sendWebRtcSignal = useCallback((signal: Omit<WebRtcSignalMessage, 'from'>) => {
    getSharedSocket().emit('webrtc_signal', signal)
  }, [])

  return {
    connected,
    connect,
    disconnect,
    joinSession,
    sendAudioChunk,
    sendWebRtcSignal,
  }
}
