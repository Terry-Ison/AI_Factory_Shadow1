import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { config } from './config.js'
import { getDeepLStatus, verifyDeepLAccess } from './deepl/verifyDeepL.js'
import { hasGlobalDefaultProvider } from './voice/providerResolver.js'
import { globalErrorHandler } from './middleware/errorHandler.js'
import authRouter from './routes/auth.js'
import historyRouter from './routes/history.js'
import sessionsRouter from './routes/sessions.js'
import usersRouter from './routes/users.js'
import adminVoiceProvidersRouter from './routes/adminVoiceProviders.js'
import orgVoiceProvidersRouter from './routes/orgVoiceProviders.js'
import adminOrganizationsRouter from './routes/adminOrganizations.js'
import adminAnalyticsRouter from './routes/adminAnalytics.js'
import { getDatabaseStatus, verifyDatabaseConnection } from './utils/verifyDatabase.js'
import { sessionCount } from './rooms/sessionManager.js'

async function healthPayload() {
  let voiceConfigured = false
  try {
    voiceConfigured = await hasGlobalDefaultProvider()
  } catch {
    voiceConfigured = false
  }
  const status = getDeepLStatus()
  const deepl = status.checked ? status : await verifyDeepLAccess()
  const dbStatus = getDatabaseStatus()
  const db = dbStatus.checked ? dbStatus : await verifyDatabaseConnection()
  return {
    ok: true,
    databaseConfigured: Boolean(config.databaseUrl),
    databaseOk: db.ok,
    databaseError: db.error,
    deeplConfigured: voiceConfigured,
    deeplOk: deepl.ok,
    deeplError: deepl.error,
  }
}

/**
 * Build and return the configured Express application (no HTTP/Socket binding).
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: config.clientOrigin }))
  app.use(express.json())
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  app.get('/health', async (_req, res) => {
    res.json(await healthPayload())
  })

  app.get('/admin/health', async (_req, res) => {
    res.json({ ...(await healthPayload()), activeSessions: sessionCount() })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/admin/voice-providers', adminVoiceProvidersRouter)
  app.use('/api/admin/organization/voice-providers', orgVoiceProvidersRouter)
  app.use('/api/admin/organizations', adminOrganizationsRouter)
  app.use('/api/admin/analytics', adminAnalyticsRouter)
  app.use('/api', sessionsRouter)
  app.use('/api/history', historyRouter)
  app.use(globalErrorHandler)

  return app
}
