/**
 * DeepL Voice API client (v3).
 *
 * DeepL uses a two-step flow:
 *   1. REST  POST /v3/voice/realtime  → ephemeral token + streaming URL
 *   2. WebSocket to that URL          → stream PCM in, transcripts + TTS out
 *
 * One DeepLVoiceClient instance is kept open per speaking user for the duration
 * of a session (see getOrCreateStream). Chunks are sent in order via sendQueue.
 */
import WebSocket from 'ws'
import { pack, unpack } from 'msgpackr'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'

/** Incoming mic audio from the browser (16 kHz mono PCM). */
const SOURCE_MEDIA_TYPE = 'audio/pcm;encoding=s16le;rate=16000'
/** Translated speech as PCM — lower decode/play latency than WebM + MediaSource. */
const TARGET_MEDIA_TYPE = 'audio/pcm;encoding=s16le;rate=24000'

const CONNECT_TIMEOUT_MS = 10_000
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000
const RATE_LIMIT_BACKOFF_MS = 15_000

export class DeepLVoiceClient {
  /**
   * @param {{ sourceLang: string, targetLang: string, onEvent: (event: Record<string, unknown>) => void, onError: (err: Error) => void, onClose: () => void }} options
   */
  constructor(options) {
    this.sourceLang = options.sourceLang
    this.targetLang = options.targetLang
    this.onEvent = options.onEvent
    this.onError = options.onError
    this.onClose = options.onClose
    this.ws = null
    this.ready = false
    this.closed = false
    /** Prevents parallel connect() calls while the first handshake is in flight. */
    this.connectPromise = null
    /** Serialises chunk sends so DeepL receives audio in capture order. */
    this.sendQueue = Promise.resolve()
    this.reconnectDelayMs = RECONNECT_BASE_MS
    this.reconnectTimer = null
    /** @type {((message: string) => void) | null} */
    this.onClientError = null
    this.rateLimitedUntil = 0
    /** Timestamp (ms) of the most recent chunk send — used for chunk-spacing guard. */
    this.lastChunkSentAt = 0
    /** Duration (ms) of the most recent chunk — determines minimum inter-chunk interval. */
    this.lastChunkDurationMs = 100
  }

  _isRateLimited() {
    return Date.now() < this.rateLimitedUntil
  }

  _markRateLimited(err) {
    const msg = err?.message ?? String(err)
    if (!/too many requests|429|rate limit/i.test(msg)) return false
    this.rateLimitedUntil = Date.now() + RATE_LIMIT_BACKOFF_MS
    this.reconnectDelayMs = RATE_LIMIT_BACKOFF_MS
    logger.warn('[DeepL] rate limited — pausing sends for', RATE_LIMIT_BACKOFF_MS, 'ms')
    return true
  }

  /**
   * Lazily opens the DeepL WebSocket. Safe to call before every chunk send;
   * no-ops when already connected or after close().
   */
  async ensureConnected() {
    if (this.closed) return
    if (this.ready && this.ws?.readyState === WebSocket.OPEN) return
    if (this.connectPromise) return this.connectPromise

    this.connectPromise = this.connect()
    try {
      await this.connectPromise
      this.reconnectDelayMs = RECONNECT_BASE_MS
    } finally {
      this.connectPromise = null
    }
  }

  /**
   * Step 2 of the DeepL flow: open the streaming WebSocket using the token
   * obtained from requestStreamingSession().
   */
  async connect() {
    const session = await this.requestStreamingSession()
    const url = `${session.streaming_url}?token=${encodeURIComponent(session.token)}`

    await new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      this.ws = ws
      let settled = false

      const finish = (fn, value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        fn(value)
      }

      const timer = setTimeout(() => {
        finish(reject, new Error('DeepL connect timeout'))
        try {
          ws.terminate()
        } catch {
          // ignore
        }
      }, CONNECT_TIMEOUT_MS)

      ws.on('open', () => {
        this.ready = true
        // Discard any chunks that queued up while connecting — they are stale
        // and would burst through the spacing guard, causing a Timeout.
        this.sendQueue = Promise.resolve()
        finish(resolve, undefined)
      })

      ws.on('message', (raw) => {
        try {
          const message = unpack(Buffer.isBuffer(raw) ? raw : Buffer.from(raw))
          this.handleMessage(message)
        } catch (err) {
          this.onError(err instanceof Error ? err : new Error(String(err)))
        }
      })

      ws.on('error', (err) => {
        this.onError(err)
        finish(reject, err)
      })

      ws.on('close', (code) => {
        this.ready = false
        if (!settled) {
          finish(reject, new Error(`DeepL WebSocket closed before open (${code})`))
          return
        }
        this.onClose()
      })
    })
  }

  _scheduleReconnect() {
    if (this.closed || this.reconnectTimer) return
    if (this._isRateLimited()) return

    const delay = this.reconnectDelayMs
    this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, RECONNECT_MAX_MS)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.closed) return
      this.ensureConnected().catch((err) => {
        logger.warn('[DeepL] reconnect failed:', err.message)
        this._scheduleReconnect()
      })
    }, delay)
  }

  /**
   * Step 1 of the DeepL flow: request a one-time streaming URL and token.
   * Language pair and media formats are fixed here for the lifetime of the stream.
   */
  async requestStreamingSession() {
    const response = await fetch(`${config.deeplApiUrl}/v3/voice/realtime`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${config.deeplAuthKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message_format: 'msgpack',
        source_media_content_type: SOURCE_MEDIA_TYPE,
        source_language: this.sourceLang,
        source_language_mode: 'fixed',
        target_languages: [this.targetLang],
        target_media_languages: [this.targetLang],
        target_media_content_type: TARGET_MEDIA_TYPE,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`DeepL session request failed (${response.status}): ${body}`)
    }

    return response.json()
  }

  /**
   * Queue a PCM chunk for delivery to DeepL. Returns when this chunk (and all
   * prior queued chunks) have been sent.
   * @param {Buffer} chunk
   */
  async sendAudioChunk(chunk) {
    if (this.closed) return
    if (this._isRateLimited()) return
    this.sendQueue = this.sendQueue.then(() => this._sendAudioChunkNow(chunk))
    return this.sendQueue
  }

  /** Sends one chunk over the open WebSocket as a MessagePack binary frame (raw bytes, no base64). */
  async _sendAudioChunkNow(chunk) {
    if (this.closed) return
    if (this._isRateLimited()) return

    // Connect first — then check spacing using the time of the actual send,
    // not the time the chunk was dequeued (which would be near-zero for burst flushes).
    await this.ensureConnected()
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('DeepL stream is not connected')
    }

    // Chunk-spacing guard: interval between sends must be ≥ half the duration of the prior chunk.
    const now = Date.now()
    const minInterval = this.lastChunkDurationMs / 2
    if (this.lastChunkSentAt > 0 && now - this.lastChunkSentAt < minInterval) {
      return
    }

    this.lastChunkSentAt = now
    // bytes / 2 = samples (s16le); samples / 16000 = seconds
    this.lastChunkDurationMs = Math.round((chunk.length / 2 / 16000) * 1000)

    this.ws.send(pack({ source_media_chunk: { data: chunk } }))
  }

  /**
   * Normalises DeepL WebSocket messages into a small set of internal event kinds
   * consumed by the socket layer (source_transcript, target_transcript, target_media).
   */
  handleMessage(message) {
    if (message.error) {
      const err = new Error(
        message.error.error_message ||
          `DeepL error ${message.error.error_code ?? ''}`.trim(),
      )
      this._markRateLimited(err)
      this.onError(err)
      return
    }

    if (message.source_transcript_update) {
      const update = message.source_transcript_update
      this.onEvent({
        kind: 'source_transcript',
        concluded: update.concluded ?? [],
        tentative: update.tentative ?? [],
      })
    }

    if (message.target_transcript_update) {
      const update = message.target_transcript_update
      this.onEvent({
        kind: 'target_transcript',
        language: update.language,
        concluded: update.concluded ?? [],
        tentative: update.tentative ?? [],
      })
    }

    if (message.target_media_chunk) {
      const chunk = message.target_media_chunk
      // In msgpack mode DeepL sends audio as raw binary (Buffer/Uint8Array).
      // Normalise to base64 strings so the existing client pipeline works unchanged.
      const rawData = chunk.data ?? []
      let data
      if (Buffer.isBuffer(rawData) || rawData instanceof Uint8Array) {
        data = rawData.length ? [Buffer.from(rawData).toString('base64')] : []
      } else if (Array.isArray(rawData)) {
        data = rawData
          .filter((item) => item != null)
          .map((item) =>
            Buffer.isBuffer(item) || item instanceof Uint8Array
              ? Buffer.from(item).toString('base64')
              : String(item),
          )
      } else {
        data = []
      }
      this.onEvent({
        kind: 'target_media',
        language: chunk.language,
        contentType: chunk.content_type,
        headers: chunk.headers,
        data,
        duration: chunk.duration,
        text: chunk.text,
      })
    }
  }

  /**
   * Gracefully ends the DeepL stream. Sends end_of_source_media so DeepL
   * finalises any tentative transcript segments before closing.
   */
  close() {
    this.closed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(pack({ end_of_source_media: {} }))
      } catch {
        // ignore
      }
      this.ws.close()
    }
    this.ws = null
    this.ready = false
  }
}

/** Active DeepL streams keyed by "sessionId:socketId" (one stream per speaker). @type {Map<string, DeepLVoiceClient>} */
const clientStreams = new Map()

function streamKey(sessionId, socketId) {
  return `${sessionId}:${socketId}`
}

/**
 * Returns the existing DeepL stream for a speaker, or creates one.
 * Callbacks (onEvent, onClientError) are refreshed on each call so the
 * current peer socket id is always used when forwarding results.
 *
 * @param {{ sessionId: string, socketId: string, sourceLang: string, targetLang: string, onEvent: (event: Record<string, unknown>) => void, onClientError?: (message: string) => void }} params
 */
export function getOrCreateStream(params) {
  const key = streamKey(params.sessionId, params.socketId)
  let stream = clientStreams.get(key)
  if (stream) {
    stream.onEvent = params.onEvent
    stream.onClientError = params.onClientError ?? null
    return stream
  }

  stream = new DeepLVoiceClient({
    sourceLang: params.sourceLang,
    targetLang: params.targetLang,
    onEvent: params.onEvent,
    onError: (err) => {
      logger.error(`[DeepL ${key}]`, err.message)
      stream.onClientError?.(err.message)
    },
    onClose: () => {
      if (stream.closed) {
        clientStreams.delete(key)
        return
      }
      stream._scheduleReconnect()
    },
  })

  stream.onClientError = params.onClientError ?? null

  clientStreams.set(key, stream)
  return stream
}

/** Tears down the DeepL stream for one speaker and removes it from the registry. */
export function closeStream(sessionId, socketId) {
  const key = streamKey(sessionId, socketId)
  const stream = clientStreams.get(key)
  if (stream) {
    stream.close()
    clientStreams.delete(key)
  }
}

/** Closes all DeepL streams when a session room is emptied. */
export function closeSessionStreams(sessionId) {
  for (const [key, stream] of clientStreams) {
    if (key.startsWith(`${sessionId}:`)) {
      stream.close()
      clientStreams.delete(key)
    }
  }
}

/** Joins DeepL transcript segment objects into a single display string. */
export function segmentsToText(segments) {
  return (segments ?? [])
    .map((s) => s.text)
    .join('')
    .trim()
}
