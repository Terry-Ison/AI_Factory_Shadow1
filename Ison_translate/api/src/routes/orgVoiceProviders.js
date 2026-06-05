import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireTenantAdmin } from '../middleware/requireRole.js'
import { getPrisma } from '../persistence/prisma.js'

const router = Router()
router.use(rateLimit({ windowMs: 60_000, max: 60 }))
router.use(requireAuth, requireTenantAdmin)

router.get('/', async (req, res, next) => {
  try {
    const orgId = req.user.orgId
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

    res.json({
      providers: catalog.map((p) => {
        const link = linkByProvider.get(p.id)
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          apiUrl: p.apiUrl,
          isActive: p.isActive,
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
    const { providers } = req.body ?? {}
    if (!Array.isArray(providers)) {
      res.status(400).json({ error: 'providers array is required' })
      return
    }
    const enabled = providers.filter((p) => p.enabled)
    const defaults = enabled.filter((p) => p.isDefault)
    if (defaults.length !== 1) {
      res.status(400).json({ error: 'Exactly one enabled provider must be default' })
      return
    }

    const prisma = getPrisma()
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
        enabled: l.enabled,
        isDefault: l.isDefault,
      })),
    })
  } catch (err) {
    next(err)
  }
})

export default router
