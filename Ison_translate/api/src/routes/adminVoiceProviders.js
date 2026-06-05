import { Router } from 'express'
import rateLimit from 'express-rate-limit'
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

function maskProvider(p) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    apiUrl: p.apiUrl,
    isActive: p.isActive,
    isGlobalDefault: p.isGlobalDefault,
    hasApiKey: Boolean(p.apiKeyCiphertext),
    apiKeyPreview: previewApiKey(p.apiKeyCiphertext),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

router.get('/', async (_req, res, next) => {
  try {
    const prisma = getPrisma()
    const providers = await prisma.voiceprovider.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ providers: providers.map(maskProvider) })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, type, apiUrl, apiKey, isActive, isGlobalDefault } = req.body ?? {}
    if (!name || !apiUrl || !apiKey) {
      res.status(400).json({ error: 'name, apiUrl, and apiKey are required' })
      return
    }
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
    res.status(201).json({ provider: maskProvider(provider) })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
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
    res.json({ provider: maskProvider(provider) })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
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
      })
      res.json({ ok: true, deactivated: true })
      return
    }
    await prisma.voiceprovider.delete({ where: { id: req.params.id } })
    res.json({ ok: true, deactivated: false })
  } catch (err) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Provider not found' })
      return
    }
    next(err)
  }
})

export default router
