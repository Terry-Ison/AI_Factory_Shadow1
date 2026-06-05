import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireTenantAdmin } from '../middleware/requireRole.js'
import { getPrisma } from '../persistence/prisma.js'

const router = Router()
<<<<<<< Updated upstream
router.use(rateLimit({ windowMs: 60_000, max: 60 }))
router.use(requireAuth, requireTenantAdmin)
=======

router.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)
router.use(requireAuth)
router.use(requireTenantAdmin)
>>>>>>> Stashed changes

router.get('/', async (req, res, next) => {
  try {
    const orgId = req.user.orgId
<<<<<<< Updated upstream
    if (!orgId && req.user.globalRole !== 'super_admin') {
      res.status(403).json({ error: 'Organization context required' })
      return
    }
    const prisma = getPrisma()
    const catalog = await prisma.voiceprovider.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    const links = orgId
      ? await prisma.organizationvoiceprovider.findMany({ where: { organizationId: orgId } })
      : []
    const linkByProvider = new Map(links.map((l) => [l.voiceProviderId, l]))
=======
    if (!orgId) {
      res.status(403).json({ error: 'Organization context required' })
      return
    }

    const prisma = getPrisma()
    const [catalog, orgLinks] = await Promise.all([
      prisma.voiceProvider.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, type: true, apiUrl: true, isActive: true },
      }),
      prisma.organizationVoiceProvider.findMany({ where: { organizationId: orgId } }),
    ])

    const linkByProvider = new Map(orgLinks.map((l) => [l.voiceProviderId, l]))
>>>>>>> Stashed changes

    res.json({
      providers: catalog.map((p) => {
        const link = linkByProvider.get(p.id)
        return {
<<<<<<< Updated upstream
          id: p.id,
          name: p.name,
          type: p.type,
          apiUrl: p.apiUrl,
          isActive: p.isActive,
=======
          ...p,
>>>>>>> Stashed changes
          enabled: link?.enabled ?? false,
          isDefault: link?.isDefault ?? false,
        }
      }),
    })
  } catch (err) {
    next(err)
  }
})

router.put('/', async (req, res, next) => {
  try {
    const orgId = req.user.orgId
    if (!orgId) {
      res.status(403).json({ error: 'Organization context required' })
      return
    }
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
    const { providers } = req.body ?? {}
    if (!Array.isArray(providers)) {
      res.status(400).json({ error: 'providers array is required' })
      return
    }
<<<<<<< Updated upstream
    const enabled = providers.filter((p) => p.enabled)
    const defaults = enabled.filter((p) => p.isDefault)
    if (defaults.length !== 1) {
      res.status(400).json({ error: 'Exactly one enabled provider must be default' })
=======

    const enabledDefaults = providers.filter((p) => p.enabled && p.isDefault)
    if (enabledDefaults.length !== 1) {
      res.status(400).json({ error: 'Exactly one enabled provider must be marked as default' })
>>>>>>> Stashed changes
      return
    }

    const prisma = getPrisma()
<<<<<<< Updated upstream
    await prisma.organizationvoiceprovider.deleteMany({ where: { organizationId: orgId } })
    await prisma.organizationvoiceprovider.createMany({
      data: providers.map((p) => ({
        organizationId: orgId,
        voiceProviderId: p.voiceProviderId,
        enabled: Boolean(p.enabled),
        isDefault: Boolean(p.isDefault),
      })),
    })

    const updated = await prisma.organizationvoiceprovider.findMany({
      where: { organizationId: orgId },
      include: { voiceprovider: true },
    })

    res.json({
      providers: updated.map((l) => ({
        id: l.voiceprovider.id,
        name: l.voiceprovider.name,
        type: l.voiceprovider.type,
        apiUrl: l.voiceprovider.apiUrl,
        isActive: l.voiceprovider.isActive,
=======
    const ids = providers.map((p) => p.voiceProviderId).filter(Boolean)
    const activeCount = await prisma.voiceProvider.count({
      where: { id: { in: ids }, isActive: true },
    })
    if (activeCount !== ids.length) {
      res.status(400).json({ error: 'One or more voice provider ids are invalid or inactive' })
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.organizationVoiceProvider.deleteMany({ where: { organizationId: orgId } })
      for (const p of providers) {
        if (!p.voiceProviderId) continue
        await tx.organizationVoiceProvider.create({
          data: {
            organizationId: orgId,
            voiceProviderId: p.voiceProviderId,
            enabled: Boolean(p.enabled),
            isDefault: Boolean(p.isDefault),
          },
        })
      }
    })

    const orgLinks = await prisma.organizationVoiceProvider.findMany({
      where: { organizationId: orgId },
      include: {
        voiceProvider: {
          select: { id: true, name: true, type: true, apiUrl: true, isActive: true },
        },
      },
    })

    res.json({
      providers: orgLinks.map((l) => ({
        ...l.voiceProvider,
>>>>>>> Stashed changes
        enabled: l.enabled,
        isDefault: l.isDefault,
      })),
    })
  } catch (err) {
    next(err)
  }
})

export default router
