import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { createPendingSession, getPrisma } from '../persistence/index.js'
import { config } from '../config.js'
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

router.post('/sessions', sessionCreateLimiter, async (_req, res) => {
  const session = createSession()
  void createPendingSession(session.sessionId)
  res.status(201).json({
    sessionId: session.sessionId,
    createdAt: session.createdAt,
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
