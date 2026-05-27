import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { config } from './config.js'
import { getDeepLStatus, verifyDeepLAccess } from './deepl/verifyDeepL.js'
import { registerSocketHandlers } from './socket/index.js'
import { sessionCount } from './rooms/sessionManager.js'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: config.clientOrigin,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 5e6,
})

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
  const deepl = getDeepLStatus().checked ? getDeepLStatus() : await verifyDeepLAccess()
  res.json({
    ok: true,
    deeplConfigured: Boolean(config.deeplAuthKey),
    deeplOk: deepl.ok,
    deeplError: deepl.error,
    activeSessions: sessionCount(),
  })
})

registerSocketHandlers(io)

httpServer.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`)
  void verifyDeepLAccess().then((deepl) => {
    if (!config.deeplAuthKey) {
      console.warn('Warning: DEEPL_AUTH_KEY is not set. Copy api/.env.example to api/.env')
      return
    }
    if (!deepl.ok) {
      console.error(`DeepL is NOT working: ${deepl.error}`)
    } else {
      console.log('DeepL Voice API key verified')
    }
  })
})
