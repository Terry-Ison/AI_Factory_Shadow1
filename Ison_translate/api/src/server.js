import { createServer } from 'http'
import { Server } from 'socket.io'
import { config } from './config.js'
import { verifyDeepLAccess } from './deepl/verifyDeepL.js'
import { socketAuthMiddleware } from './middleware/socketAuth.js'
import { createApp } from './app.js'
import { disconnectPrisma } from './persistence/prisma.js'
import { verifyDatabaseConnection } from './utils/verifyDatabase.js'
import { cleanupIdleSessions } from './rooms/sessionManager.js'
import { registerSocketHandlers } from './socket/index.js'
import { logger } from './utils/logger.js'

const app = createApp()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: config.clientOrigin,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 5e6,
})

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

  void verifyDatabaseConnection().then((db) => {
    if (!config.databaseUrl) {
      logger.warn('DATABASE_URL is not set. Copy api/.env.example to api/.env')
      return
    }
    if (!db.ok) {
      logger.error(`Database is NOT reachable: ${db.error}`)
    } else {
      logger.info('Database connection verified')
    }
  })

  void verifyDeepLAccess().then((deepl) => {
    if (!deepl.ok) {
      if (deepl.error?.includes('No voice provider configured')) {
        logger.warn('No global default voice provider configured. Set one in the super-admin provider catalog.')
      } else {
        logger.error(`DeepL is NOT working: ${deepl.error}`)
      }
    } else {
      logger.info('DeepL Voice API key verified (from provider catalog)')
    }
  })
})
