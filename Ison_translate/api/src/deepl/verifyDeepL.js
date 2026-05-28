/**
 * DeepL API key and Voice endpoint health check.
 *
 * Result is cached with a TTL so join_session and /health avoid blocking on
 * a live DeepL round-trip on every request after the first check.
 * Concurrent callers share a single in-flight verification via cached.pending.
 */
import { config } from '../config.js'

const VERIFY_TIMEOUT_MS = 8000
const VERIFY_TTL_MS = 5 * 60 * 1000

/** @type {{ checked: boolean, ok: boolean, error: string | null, checkedAt: number, pending: Promise<{ checked: boolean, ok: boolean, error: string | null }> | null }} */
let cached = { checked: false, ok: false, error: null, checkedAt: 0, pending: null }

function isCacheStale() {
  if (!cached.checked) return true
  return Date.now() - cached.checkedAt > VERIFY_TTL_MS
}

/**
 * Verifies that DEEPL_AUTH_KEY is valid for the Voice API.
 *
 * Makes a minimal POST to /v3/voice/realtime (no WebSocket opened).
 *
 * @returns {Promise<{ checked: boolean, ok: boolean, error: string | null }>}
 */
export async function verifyDeepLAccess() {
  if (!config.deeplAuthKey) {
    cached = {
      checked: true,
      ok: false,
      error: 'DEEPL_AUTH_KEY is not set in api/.env',
      checkedAt: Date.now(),
      pending: null,
    }
    return cached
  }

  if (!isCacheStale()) {
    return cached
  }

  if (cached.pending) {
    return cached.pending
  }

  cached.checked = false

  cached.pending = (async () => {
    try {
      const response = await fetch(`${config.deeplApiUrl}/v3/voice/realtime`, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${config.deeplAuthKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_format: 'json',
          source_media_content_type: 'audio/pcm;encoding=s16le;rate=16000',
          source_language: 'en',
          source_language_mode: 'fixed',
          target_languages: ['de'],
        }),
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      })

      if (!response.ok) {
        const body = await response.text()
        let message = body
        try {
          message = JSON.parse(body).message ?? body
        } catch {
          // keep raw body
        }
        cached = {
          checked: true,
          ok: false,
          error: `DeepL rejected API key (${response.status}): ${message}`,
          checkedAt: Date.now(),
          pending: null,
        }
        return cached
      }

      cached = {
        checked: true,
        ok: true,
        error: null,
        checkedAt: Date.now(),
        pending: null,
      }
      return cached
    } catch (err) {
      cached = {
        checked: true,
        ok: false,
        error: err instanceof Error ? err.message : 'DeepL connectivity check failed',
        checkedAt: Date.now(),
        pending: null,
      }
      return cached
    }
  })()

  return cached.pending
}

/**
 * Synchronous read of the last verification result.
 * Use this on the hot path (join_session) instead of await verifyDeepLAccess().
 */
export function getDeepLStatus() {
  if (isCacheStale() && !cached.pending) {
    return { checked: false, ok: false, error: cached.error }
  }
  return cached
}
