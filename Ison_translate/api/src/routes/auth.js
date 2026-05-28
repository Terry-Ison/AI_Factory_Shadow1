import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { signToken } from '../auth/jwt.js'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { getPrisma } from '../persistence/prisma.js'
import { config } from '../config.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

function safeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    defaultSourceLang: user.defaultSourceLang,
    defaultTargetLang: user.defaultTargetLang,
    createdAt: user.createdAt,
  }
}

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    if (!config.persistEnabled) {
      res.status(503).json({ error: 'Persistence is disabled (PERSIST_ENABLED=false)' })
      return
    }

    const { email, password, displayName } = req.body ?? {}

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'email is required' })
      return
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'password must be at least 8 characters' })
      return
    }
    if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
      res.status(400).json({ error: 'displayName is required' })
      return
    }

    const prisma = getPrisma()
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      res.status(409).json({ error: 'An account with that email already exists' })
      return
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        displayName: displayName.trim(),
      },
    })

    const token = signToken(user)
    res.status(201).json({ token, user: safeUser(user) })
  } catch (err) {
    next(err)
  }
})

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {}

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' })
      return
    }

    const prisma = getPrisma()
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = signToken(user)
    res.json({ token, user: safeUser(user) })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ user: safeUser(user) })
  } catch (err) {
    next(err)
  }
})

router.patch('/me/languages', requireAuth, async (req, res, next) => {
  try {
    const { defaultSourceLang, defaultTargetLang } = req.body ?? {}
    const prisma = getPrisma()
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(defaultSourceLang ? { defaultSourceLang } : {}),
        ...(defaultTargetLang ? { defaultTargetLang } : {}),
      },
    })
    res.json({ user: safeUser(user) })
  } catch (err) {
    next(err)
  }
})

export default router
