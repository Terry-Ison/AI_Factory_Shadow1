import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/requireAuth.js'
import { createPendingSession, getPrisma } from '../persistence/index.js'
import { config } from '../config.js'
<<<<<<< Updated upstream
import { optionalAuth } from '../middleware/requireAuth.js'
=======
>>>>>>> Stashed changes
import { resolveVoiceConfig } from '../voice/providerResolver.js'
import {
  createSession,
  getSessionSnapshot,
  normalizeSessionId,
} from '../rooms/sessionManager.js'

const router = Router()

const sessionCreateLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sessions created. Try again later.' },
})

const DEEPL_LANGUAGES_TTL_MS = 10 * 60 * 1000
/** @type {{ value: Array<{ code: string, label: string }>, at: number }} */
let deeplLanguagesCache = { value: [], at: 0 }

router.post('/sessions', sessionCreateLimiter, async (_req, res) => {
  const session = createSession()
  void createPendingSession(session.sessionId)
  res.status(201).json({
    sessionId: session.sessionId,
    createdAt: session.createdAt,
  })
})

router.get('/languages', optionalAuth, async (req, res) => {
<<<<<<< Updated upstream
  const voiceConfig = await resolveVoiceConfig(req.user?.orgId)
  if (!voiceConfig?.apiKey) {
    res.status(503).json({ error: 'No voice provider configured' })
=======
  const orgId = req.user?.orgId ?? null
  const voiceConfig = await resolveVoiceConfig(orgId)
  const apiKey = voiceConfig?.apiKey
  const apiUrl = voiceConfig?.apiUrl ?? config.deeplApiUrl

  if (!apiKey) {
    res.status(503).json({ error: 'Voice provider is not configured' })
>>>>>>> Stashed changes
    return
  }

  if (
    deeplLanguagesCache.value.length > 0 &&
    Date.now() - deeplLanguagesCache.at < DEEPL_LANGUAGES_TTL_MS
  ) {
    res.json({ languages: deeplLanguagesCache.value, cached: true })
    return
  }

  try {
<<<<<<< Updated upstream
    const response = await fetch(`${voiceConfig.apiUrl}/v3/languages?resource=voice`, {
      headers: { Authorization: `DeepL-Auth-Key ${voiceConfig.apiKey}` },
=======
    const response = await fetch(`${apiUrl}/v3/languages?resource=voice`, {
      headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
>>>>>>> Stashed changes
      signal: AbortSignal.timeout(8_000),
    })

    if (!response.ok) {
      const body = await response.text()
      res.status(response.status).json({ error: `DeepL languages request failed: ${body}` })
      return
    }

    /** @type {Array<{ lang: string, name: string, usable_as_source?: boolean }>} */
    const payload = await response.json()
    const languages = payload
      .filter((item) => item.usable_as_source !== false)
      .map((item) => ({ code: item.lang, label: item.name }))
      .sort((a, b) => a.label.localeCompare(b.label))

    deeplLanguagesCache = { value: languages, at: Date.now() }
    res.json({ languages, cached: false })
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : 'Failed to fetch DeepL languages',
    })
  }
})

router.get('/sessions/:sessionId/invite', (req, res) => {
  const sessionId = normalizeSessionId(req.params.sessionId)
  if (!sessionId) {
    res.status(400).json({ error: 'sessionId is required' })
    return
  }
  const base = config.clientOriginPrimary.replace(/\/$/, '')
  res.json({
    sessionId,
    inviteUrl: `${base}/join/${sessionId}`,
  })
})

router.get('/sessions/:sessionId', async (req, res) => {
  const sessionId = normalizeSessionId(req.params.sessionId)

  // Check in-memory sessions first
  const snapshot = getSessionSnapshot(sessionId)
  if (snapshot) {
    res.json({
      sessionId: snapshot.sessionId,
      exists: true,
      active: true,
      participantCount: snapshot.participantCount,
      partnerConnected: snapshot.participantCount > 1,
    })
    return
  }

  // Fall back to DB lookup if persistence is enabled
  if (config.persistEnabled && config.databaseUrl) {
    try {
      const prisma = getPrisma()
      const dbSession = await prisma.session.findUnique({ where: { sessionId } })
      if (dbSession) {
        res.json({
          sessionId: dbSession.sessionId,
          exists: true,
          active: dbSession.status === 'active',
          participantCount: 0,
          partnerConnected: false,
        })
        return
      }
    } catch {
      // DB unavailable — fall through to 404
    }
  }

  res.status(404).json({ error: 'Session not found', exists: false })
})

export default router
