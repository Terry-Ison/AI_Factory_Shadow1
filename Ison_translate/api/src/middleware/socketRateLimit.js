import { config } from '../config.js'
import { logger } from '../utils/logger.js'

/**
 * Per-socket rolling-window rate limiter for audio_chunk payloads.
 */
export function createAudioRateLimiter() {
  /** @type {Map<string, { bytes: number, resetAt: number }>} */
  const buckets = new Map()
  const maxBytes = config.maxAudioBytesPerSec

  function checkAudioRate(socketId, chunkLength) {
    const now = Date.now()
    let bucket = buckets.get(socketId)

    if (!bucket || now >= bucket.resetAt) {
      bucket = { bytes: 0, resetAt: now + 1000 }
      buckets.set(socketId, bucket)
    }

    bucket.bytes += chunkLength

    if (bucket.bytes > maxBytes) {
      logger.warn(`Audio rate limit exceeded for socket ${socketId}`)
      return false
    }

    return true
  }

  function clearSocket(socketId) {
    buckets.delete(socketId)
  }

  return { checkAudioRate, clearSocket }
}
