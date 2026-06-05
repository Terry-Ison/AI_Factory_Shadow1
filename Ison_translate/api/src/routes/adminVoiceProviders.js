import { Router } from 'express'
import rateLimit from 'express-rate-limit'
<<<<<<< Updated upstream
import { randomUUID } from 'crypto'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireSuperAdmin } from '../middleware/requireRole.js'
import { encryptSecret, decryptSecret } from '../utils/secretCrypto.js'
import { getPrisma } from '../persistence/prisma.js'
import { invalidateDeepLStatus } from '../deepl/verifyDeepL.js'

const router = Router()
router.use(rateLimit({ windowMs: 60_000, max: 60 }))
router.use(requireAuth, requireSuperAdmin)

const VOICE_PROVIDER_TYPES = ['deepl']
const DEFAULT_VOICE_PROVIDER_TYPE = 'deepl'

function normalizeType(type) {
  return VOICE_PROVIDER_TYPES.includes(type) ? type : DEFAULT_VOICE_PROVIDER_TYPE
}

function previewApiKey(ciphertext) {
  if (!ciphertext) return null
  try {
    const key = decryptSecret(ciphertext)
    if (!key) return null
    const edge = 4
    if (key.length <= edge * 2) return `${key.slice(0, 2)}••••`
    return `${key.slice(0, edge)}••••${key.slice(-edge)}`
  } catch {
    return null
  }
}
=======
import { encryptSecret } from '../utils/secretCrypto.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireSuperAdmin } from '../middleware/requireRole.js'
import { getPrisma } from '../persistence/prisma.js'

const router = Router()

const adminLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
})

router.use(adminLimiter)
router.use(requireAuth)
router.use(requireSuperAdmin)
>>>>>>> Stashed changes

function maskProvider(p) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    apiUrl: p.apiUrl,
    isActive: p.isActive,
<<<<<<< Updated upstream
    isGlobalDefault: p.isGlobalDefault,
    hasApiKey: Boolean(p.apiKeyCiphertext),
    apiKeyPreview: previewApiKey(p.apiKeyCiphertext),
=======
    hasApiKey: Boolean(p.apiKeyCiphertext),
>>>>>>> Stashed changes
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

router.get('/', async (_req, res, next) => {
  try {
    const prisma = getPrisma()
<<<<<<< Updated upstream
    const providers = await prisma.voiceprovider.findMany({ orderBy: { createdAt: 'desc' } })
=======
    const providers = await prisma.voiceProvider.findMany({ orderBy: { name: 'asc' } })
>>>>>>> Stashed changes
    res.json({ providers: providers.map(maskProvider) })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
<<<<<<< Updated upstream
    const { name, type, apiUrl, apiKey, isActive, isGlobalDefault } = req.body ?? {}
=======
    const { name, type, apiUrl, apiKey, isActive } = req.body ?? {}
>>>>>>> Stashed changes
    if (!name || !apiUrl || !apiKey) {
      res.status(400).json({ error: 'name, apiUrl, and apiKey are required' })
      return
    }
<<<<<<< Updated upstream
    const prisma = getPrisma()
    const provider = await prisma.$transaction(async (tx) => {
      if (isGlobalDefault === true) {
        await tx.voiceprovider.updateMany({ data: { isGlobalDefault: false } })
      }
      return tx.voiceprovider.create({
        data: {
          id: randomUUID(),
          name: String(name).trim(),
          type: normalizeType(type),
          apiUrl: String(apiUrl).replace(/\/$/, ''),
          apiKeyCiphertext: encryptSecret(String(apiKey)),
          isActive: isActive !== false,
          isGlobalDefault: isGlobalDefault === true,
          updatedAt: new Date(),
        },
      })
    })
    if (isGlobalDefault === true) invalidateDeepLStatus()
=======

    const prisma = getPrisma()
    const provider = await prisma.voiceProvider.create({
      data: {
        name: String(name).trim(),
        type: type === 'deepl' ? 'deepl' : 'deepl',
        apiUrl: String(apiUrl).replace(/\/$/, ''),
        apiKeyCiphertext: encryptSecret(String(apiKey)),
        isActive: isActive !== false,
      },
    })
>>>>>>> Stashed changes
    res.status(201).json({ provider: maskProvider(provider) })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
<<<<<<< Updated upstream
    const { name, apiUrl, apiKey, isActive, isGlobalDefault } = req.body ?? {}
    const prisma = getPrisma()
    const existing = await prisma.voiceprovider.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      res.status(404).json({ error: 'Provider not found' })
      return
    }

    if (existing.isGlobalDefault && isActive === false) {
      res.status(400).json({
        error: 'Cannot deactivate the global default provider. Set another provider as global default first.',
      })
      return
    }

    const provider = await prisma.$transaction(async (tx) => {
      if (isGlobalDefault === true) {
        await tx.voiceprovider.updateMany({ data: { isGlobalDefault: false } })
      }
      const data = { updatedAt: new Date() }
      if (name) data.name = String(name).trim()
      if (apiUrl) data.apiUrl = String(apiUrl).replace(/\/$/, '')
      if (apiKey) data.apiKeyCiphertext = encryptSecret(String(apiKey))
      if (typeof isActive === 'boolean') data.isActive = isActive
      if (typeof isGlobalDefault === 'boolean') data.isGlobalDefault = isGlobalDefault
      return tx.voiceprovider.update({
        where: { id: req.params.id },
        data,
      })
    })

    if (isGlobalDefault === true || existing.isGlobalDefault) invalidateDeepLStatus()
=======
    const { name, apiUrl, apiKey, isActive, type } = req.body ?? {}
    const prisma = getPrisma()
    const existing = await prisma.voiceProvider.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      res.status(404).json({ error: 'Voice provider not found' })
      return
    }

    const provider = await prisma.voiceProvider.update({
      where: { id: req.params.id },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(apiUrl ? { apiUrl: String(apiUrl).replace(/\/$/, '') } : {}),
        ...(apiKey ? { apiKeyCiphertext: encryptSecret(String(apiKey)) } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(type === 'deepl' ? { type: 'deepl' } : {}),
      },
    })
>>>>>>> Stashed changes
    res.json({ provider: maskProvider(provider) })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
<<<<<<< Updated upstream
    const existing = await prisma.voiceprovider.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      res.status(404).json({ error: 'Provider not found' })
      return
    }
    if (existing.isGlobalDefault) {
      res.status(400).json({
        error: 'Cannot delete the global default provider. Set another provider as global default first.',
      })
      return
    }

    const inUse = await prisma.organizationvoiceprovider.count({
      where: { voiceProviderId: req.params.id },
    })
    if (inUse > 0) {
      await prisma.voiceprovider.update({
        where: { id: req.params.id },
        data: { isActive: false, updatedAt: new Date() },
=======
    const existing = await prisma.voiceProvider.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      res.status(404).json({ error: 'Voice provider not found' })
      return
    }

    const usage = await prisma.organizationVoiceProvider.count({
      where: { voiceProviderId: req.params.id },
    })
    if (usage > 0) {
      await prisma.voiceProvider.update({
        where: { id: req.params.id },
        data: { isActive: false },
>>>>>>> Stashed changes
      })
      res.json({ ok: true, deactivated: true })
      return
    }
<<<<<<< Updated upstream
    await prisma.voiceprovider.delete({ where: { id: req.params.id } })
    res.json({ ok: true, deactivated: false })
  } catch (err) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Provider not found' })
      return
    }
=======

    await prisma.voiceProvider.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
>>>>>>> Stashed changes
    next(err)
  }
})

export default router
