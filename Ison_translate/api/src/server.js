import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { config } from './config.js'
import { getDeepLStatus, verifyDeepLAccess } from './deepl/verifyDeepL.js'
import { globalErrorHandler } from './middleware/errorHandler.js'
import { socketAuthMiddleware } from './middleware/socketAuth.js'
import authRouter from './routes/auth.js'
import historyRouter from './routes/history.js'
import sessionsRouter from './routes/sessions.js'
import { disconnectPrisma } from './persistence/prisma.js'
import { cleanupIdleSessions, sessionCount } from './rooms/sessionManager.js'
import { registerSocketHandlers } from './socket/index.js'
import { logger } from './utils/logger.js'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: config.clientOrigin,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 5e6,
})

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
  const status = getDeepLStatus()
  const deepl = status.checked ? status : await verifyDeepLAccess()
  res.json({
    ok: true,
    deeplConfigured: Boolean(config.deeplAuthKey),
    deeplOk: deepl.ok,
    deeplError: deepl.error,
  })
})

app.get('/admin/health', async (_req, res) => {
  const status = getDeepLStatus()
  const deepl = status.checked ? status : await verifyDeepLAccess()
  res.json({
    ok: true,
    deeplConfigured: Boolean(config.deeplAuthKey),
    deeplOk: deepl.ok,
    deeplError: deepl.error,
    activeSessions: sessionCount(),
  })
})

app.use('/api/auth', authRouter)
app.use('/api', sessionsRouter)
app.use('/api/history', historyRouter)
app.use(globalErrorHandler)

io.use(socketAuthMiddleware)
registerSocketHandlers(io)

setInterval(() => {
  const removed = cleanupIdleSessions(config.sessionIdleMaxAgeMs)
  if (removed > 0) {
    logger.info(`Cleaned up ${removed} idle session(s)`)
  }
}, config.sessionCleanupIntervalMs)

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err)
})

process.on('SIGINT', () => {
  void disconnectPrisma().finally(() => process.exit(0))
})
process.on('SIGTERM', () => {
  void disconnectPrisma().finally(() => process.exit(0))
})

httpServer.listen(config.port, () => {
  logger.info(`API listening on http://localhost:${config.port}`)
  void verifyDeepLAccess().then((deepl) => {
    if (!config.deeplAuthKey) {
      logger.warn('DEEPL_AUTH_KEY is not set. Copy api/.env.example to api/.env')
      return
    }
    if (!deepl.ok) {
      logger.error(`DeepL is NOT working: ${deepl.error}`)
    } else {
      logger.info('DeepL Voice API key verified')
    }
  })
})
