/**
 * DeepL Voice API health check using DB-resolved provider credentials.
 */
import { resolveVoiceConfig } from '../voice/providerResolver.js'

const VERIFY_TIMEOUT_MS = 8000
const VERIFY_TTL_MS = 5 * 60 * 1000

/** @type {{ checked: boolean, ok: boolean, error: string | null, checkedAt: number, providerId: string | null, pending: Promise<{ checked: boolean, ok: boolean, error: string | null }> | null }} */
let cached = {
  checked: false,
  ok: false,
  error: null,
  checkedAt: 0,
  providerId: null,
  pending: null,
}

function isCacheStale(voiceConfig) {
  if (!cached.checked) return true
  if (Date.now() - cached.checkedAt > VERIFY_TTL_MS) return true
  if (voiceConfig?.providerId && cached.providerId !== voiceConfig.providerId) return true
  return false
}

/**
 * @param {{ apiKey: string, apiUrl: string, providerId?: string } | null | undefined} voiceConfig
 * @returns {Promise<{ checked: boolean, ok: boolean, error: string | null }>}
 */
export async function verifyDeepLAccess(voiceConfig) {
  const resolved = voiceConfig ?? (await resolveVoiceConfig(null))
  if (!resolved?.apiKey) {
    cached = {
      checked: true,
      ok: false,
      error: 'No voice provider configured. Set a global default in the provider catalog.',
      checkedAt: Date.now(),
      providerId: null,
      pending: null,
    }
    return cached
  }

  if (!isCacheStale(resolved)) {
    return cached
  }

  if (cached.pending) {
    return cached.pending
  }

  cached.checked = false

  cached.pending = (async () => {
    try {
      const response = await fetch(`${resolved.apiUrl}/v3/voice/realtime`, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${resolved.apiKey}`,
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
          providerId: resolved.providerId ?? null,
          pending: null,
        }
        return cached
      }

      cached = {
        checked: true,
        ok: true,
        error: null,
        checkedAt: Date.now(),
        providerId: resolved.providerId ?? null,
        pending: null,
      }
      return cached
    } catch (err) {
      cached = {
        checked: true,
        ok: false,
        error: err instanceof Error ? err.message : 'DeepL connectivity check failed',
        checkedAt: Date.now(),
        providerId: resolved.providerId ?? null,
        pending: null,
      }
      return cached
    }
  })()

  return cached.pending
}

/**
 * @param {{ providerId?: string } | null | undefined} [voiceConfig]
 */
export function getDeepLStatus(voiceConfig) {
  if (isCacheStale(voiceConfig) && !cached.pending) {
    return { checked: false, ok: false, error: cached.error }
  }
  return cached
}

/** Invalidate cache when global default changes. */
export function invalidateDeepLStatus() {
  cached = {
    checked: false,
    ok: false,
    error: null,
    checkedAt: 0,
    providerId: null,
    pending: null,
  }
}
