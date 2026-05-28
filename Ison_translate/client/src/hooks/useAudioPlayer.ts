import { useCallback, useEffect, useRef } from 'react'

const PCM_SAMPLE_RATE = 24000
const DEFAULT_WEBM_MIME = 'audio/webm; codecs=opus'

function base64ToBytes(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function normalizeMimeType(contentType?: string) {
  if (!contentType) return DEFAULT_WEBM_MIME
  const cleaned = contentType.replace(/;+\s*$/, '').trim()
  if (cleaned.includes('webm') && cleaned.includes('opus')) {
    return 'audio/webm; codecs=opus'
  }
  if (cleaned.includes('pcm')) return 'pcm'
  return cleaned
}

/** Parse sample rate from DeepL PCM content-type, e.g. audio/pcm;encoding=s16le;rate=24000 */
function pcmSampleRateFromContentType(contentType?: string) {
  const match = contentType?.match(/rate=(\d+)/i)
  return match ? Number(match[1]) : PCM_SAMPLE_RATE
}

function pcmToFloat32(bytes: Uint8Array) {
  const aligned = bytes.byteOffset % 2 === 0 ? bytes : bytes.slice()
  const int16 = new Int16Array(aligned.buffer, aligned.byteOffset, aligned.byteLength / 2)
  const float32 = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff)
  }
  return float32
}

class TranslatedAudioPlayer {
  private audioEl: HTMLAudioElement
  private mediaSource: MediaSource | null = null
  private sourceBuffer: SourceBuffer | null = null
  private mimeType = DEFAULT_WEBM_MIME
  private appendQueue: Uint8Array[] = []
  private mediaReady = false
  private objectUrl: string | null = null

  private pcmContext: AudioContext | null = null
  private pcmQueue: Promise<void> = Promise.resolve()
  private pcmNextStart = 0
  private pcmCoalesceParts: Uint8Array[] = []
  private pcmCoalesceRate = PCM_SAMPLE_RATE
  private pcmCoalesceTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    this.audioEl = document.createElement('audio')
    this.audioEl.autoplay = true
    this.audioEl.volume = 1
    this.audioEl.style.display = 'none'
    document.body.appendChild(this.audioEl)
  }

  async prime() {
    if (this.pcmContext?.state === 'suspended') {
      await this.pcmContext.resume()
    }
    try {
      await this.audioEl.play()
    } catch {
      // will play once chunks arrive after user gesture
    }
  }

  enqueueMedia(chunks: string[], contentType?: string) {
    if (!chunks.length) return

    const kind = normalizeMimeType(contentType)
    if (kind === 'pcm') {
      const sampleRate = pcmSampleRateFromContentType(contentType)
      // DeepL sends many small PCM sub-packets per message; merge into one buffer
      // so Web Audio schedules one continuous segment instead of N×10ms gaps.
      const parts = chunks.map((c) => base64ToBytes(c))
      const totalBytes = parts.reduce((sum, p) => sum + p.length, 0)
      if (!totalBytes) return
      const merged = new Uint8Array(totalBytes)
      let offset = 0
      for (const part of parts) {
        merged.set(part, offset)
        offset += part.length
      }
      this.schedulePcmCoalesced(merged, sampleRate)
      return
    }

    this.ensureMediaSource(kind)
    for (const chunk of chunks) {
      this.appendQueue.push(base64ToBytes(chunk))
    }
    this.pumpMediaQueue()
  }

  enqueuePcmBase64(base64: string, sampleRate = PCM_SAMPLE_RATE) {
    this.enqueuePcmBytes(base64ToBytes(base64), sampleRate)
  }

  private ensureMediaSource(mimeType: string) {
    if (this.mediaSource) return

    this.mimeType = mimeType
    this.mediaSource = new MediaSource()
    this.objectUrl = URL.createObjectURL(this.mediaSource)
    this.audioEl.src = this.objectUrl

    this.mediaSource.addEventListener('sourceopen', () => {
      if (!this.mediaSource) return
      try {
        this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mimeType)
        this.sourceBuffer.mode = 'sequence'
        this.sourceBuffer.addEventListener('updateend', () => this.pumpMediaQueue())
        this.mediaReady = true
        this.pumpMediaQueue()
        void this.audioEl.play().catch(() => {})
      } catch {
        this.resetMediaSource()
      }
    })
  }

  private pumpMediaQueue() {
    if (!this.mediaReady || !this.sourceBuffer || this.sourceBuffer.updating) return

    const next = this.appendQueue.shift()
    if (!next) return

    try {
      this.sourceBuffer.appendBuffer(new Uint8Array(next))
      void this.audioEl.play().catch(() => {})
    } catch {
      this.resetMediaSource()
    }
  }

  private resetMediaSource() {
    this.appendQueue = []
    this.mediaReady = false
    this.sourceBuffer = null
    if (this.mediaSource && this.mediaSource.readyState === 'open') {
      try {
        this.mediaSource.endOfStream()
      } catch {
        // ignore
      }
    }
    this.mediaSource = null
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }
  }

  private schedulePcmCoalesced(bytes: Uint8Array, sampleRate: number) {
    this.pcmCoalesceParts.push(bytes)
    this.pcmCoalesceRate = sampleRate
    if (this.pcmCoalesceTimer) return
    this.pcmCoalesceTimer = setTimeout(() => this.flushPcmCoalesce(), 30)
  }

  private flushPcmCoalesce() {
    this.pcmCoalesceTimer = null
    const parts = this.pcmCoalesceParts
    this.pcmCoalesceParts = []
    if (!parts.length) return
    const totalBytes = parts.reduce((sum, p) => sum + p.length, 0)
    if (!totalBytes) return
    const merged = new Uint8Array(totalBytes)
    let offset = 0
    for (const part of parts) {
      merged.set(part, offset)
      offset += part.length
    }
    this.enqueuePcmBytes(merged, this.pcmCoalesceRate)
  }

  private enqueuePcmBytes(bytes: Uint8Array, sampleRate = PCM_SAMPLE_RATE) {
    this.pcmQueue = this.pcmQueue.then(() => this.playPcmChunk(bytes, sampleRate))
  }

  private async playPcmChunk(bytes: Uint8Array, sampleRate: number) {
    if (!bytes.length) return

    if (!this.pcmContext) {
      this.pcmContext = new AudioContext()
    }
    const ctx = this.pcmContext
    if (ctx.state === 'suspended') await ctx.resume()

    const float32 = pcmToFloat32(bytes)
    if (!float32.length) return

    const buffer = ctx.createBuffer(1, float32.length, sampleRate)
    buffer.copyToChannel(float32, 0)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    const now = ctx.currentTime
    const queuedAhead = this.pcmNextStart - now
    if (queuedAhead > 1.5 || this.pcmNextStart < now - 0.15) {
      this.pcmNextStart = now
      if (queuedAhead > 1.5) return // discard stale audio
    }
    const startAt = Math.max(now, this.pcmNextStart)
    source.start(startAt)
    this.pcmNextStart = startAt + buffer.duration

  }

  destroy() {
    if (this.pcmCoalesceTimer) {
      clearTimeout(this.pcmCoalesceTimer)
      this.pcmCoalesceTimer = null
    }
    this.pcmCoalesceParts = []
    this.resetMediaSource()
    this.audioEl.pause()
    this.audioEl.removeAttribute('src')
    this.audioEl.remove()
    void this.pcmContext?.close()
    this.pcmContext = null
  }
}

export function useAudioPlayer() {
  const playerRef = useRef<TranslatedAudioPlayer | null>(null)

  useEffect(() => {
    playerRef.current = new TranslatedAudioPlayer()
    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [])

  const prime = useCallback(async () => {
    await playerRef.current?.prime()
  }, [])

  const enqueueTranslatedAudio = useCallback(
    (chunks: string[], contentType?: string) => {
      playerRef.current?.enqueueMedia(chunks, contentType)
    },
    [],
  )

  const enqueuePcmBase64 = useCallback((base64: string, sampleRate = PCM_SAMPLE_RATE) => {
    playerRef.current?.enqueuePcmBase64(base64, sampleRate)
  }, [])

  return { enqueueTranslatedAudio, enqueuePcmBase64, prime }
}
