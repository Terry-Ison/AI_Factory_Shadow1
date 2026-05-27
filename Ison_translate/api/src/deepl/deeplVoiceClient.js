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
import { config } from '../config.js'

/** Incoming mic audio from the browser (16 kHz mono PCM). */
const SOURCE_MEDIA_TYPE = 'audio/pcm;encoding=s16le;rate=16000'
/** Translated speech returned to the partner (WebM/Opus packets for streaming playback). */
const TARGET_MEDIA_TYPE = 'audio/webm;codecs=opus'

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

      ws.on('open', () => {
        this.ready = true
        resolve(undefined)
      })

      ws.on('message', (raw) => {
        try {
          const message = JSON.parse(raw.toString())
          this.handleMessage(message)
        } catch (err) {
          this.onError(err instanceof Error ? err : new Error(String(err)))
        }
      })

      ws.on('error', (err) => {
        this.onError(err)
        reject(err)
      })

      ws.on('close', () => {
        this.ready = false
        this.onClose()
      })
    })
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
        message_format: 'json',
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
    this.sendQueue = this.sendQueue.then(() => this._sendAudioChunkNow(chunk))
    return this.sendQueue
  }

  /** Sends one chunk over the open WebSocket (base64-encoded per DeepL JSON protocol). */
  async _sendAudioChunkNow(chunk) {
    if (this.closed) return
    await this.ensureConnected()
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    this.ws.send(
      JSON.stringify({
        source_media_chunk: {
          data: chunk.toString('base64'),
        },
      }),
    )
  }

  /**
   * Normalises DeepL WebSocket messages into a small set of internal event kinds
   * consumed by the socket layer (source_transcript, target_transcript, target_media).
   */
  handleMessage(message) {
    if (message.error) {
      this.onError(
        new Error(
          message.error.error_message ||
            `DeepL error ${message.error.error_code ?? ''}`.trim(),
        ),
      )
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
      this.onEvent({
        kind: 'target_media',
        language: chunk.language,
        contentType: chunk.content_type,
        headers: chunk.headers,
        data: chunk.data ?? [],
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ end_of_source_media: {} }))
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
      console.error(`[DeepL ${key}]`, err.message)
      params.onClientError?.(err.message)
    },
    onClose: () => {
      clientStreams.delete(key)
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
