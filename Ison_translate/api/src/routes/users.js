import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { hashPassword } from '../auth/password.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireTenantAdmin } from '../middleware/requireRole.js'
import { getPrisma } from '../persistence/prisma.js'

const router = Router()

const usersLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

router.use(usersLimiter)
router.use(requireAuth)
router.use(requireTenantAdmin)

function membershipUser(membership) {
  const u = membership.user
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    defaultSourceLang: u.defaultSourceLang,
    defaultTargetLang: u.defaultTargetLang,
    orgRole: membership.orgRole,
    status: membership.status,
    createdAt: u.createdAt,
    joinedAt: membership.createdAt,
  }
}

function membershipEntry(membership) {
  return {
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    organizationSlug: membership.organization.slug,
    orgRole: membership.orgRole,
    status: membership.status,
    joinedAt: membership.createdAt,
  }
}

function superAdminUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    defaultSourceLang: user.defaultSourceLang,
    defaultTargetLang: user.defaultTargetLang,
    globalRole: user.globalRole ?? null,
    createdAt: user.createdAt,
    memberships: (user.organizationmembership ?? []).map(membershipEntry),
  }
}

function isSuperAdmin(req) {
  return req.user?.globalRole === 'super_admin'
}

function orgIdFromReq(req) {
  return req.user.orgId
}

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const skip = (page - 1) * limit
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const prisma = getPrisma()

    if (isSuperAdmin(req)) {
      const organizationId =
        typeof req.query.organizationId === 'string' ? req.query.organizationId : undefined

      const where = organizationId
        ? {
            organizationmembership: {
              some: {
                organizationId,
                ...(status ? { status } : {}),
              },
            },
          }
        : status
          ? { organizationmembership: { some: { status } } }
          : {}

      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            organizationmembership: {
              include: { organization: true },
              ...(organizationId || status
                ? {
                    where: {
                      ...(organizationId ? { organizationId } : {}),
                      ...(status ? { status } : {}),
                    },
                  }
                : {}),
            },
          },
        }),
        prisma.user.count({ where }),
      ])

      res.json({ page, limit, total, users: items.map(superAdminUser) })
      return
    }

    const orgId = orgIdFromReq(req)
    if (!orgId) {
      res.status(403).json({ error: 'Organization context required' })
      return
    }

    const where = { organizationId: orgId, ...(status ? { status } : {}) }

    const [items, total] = await Promise.all([
      prisma.organizationmembership.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      }),
      prisma.organizationmembership.count({ where }),
    ])

    res.json({ page, limit, total, users: items.map(membershipUser) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()

    if (isSuperAdmin(req)) {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
          organizationmembership: {
            include: { organization: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }
      res.json({ user: superAdminUser(user) })
      return
    }

    const orgId = orgIdFromReq(req)
    if (!orgId) {
      res.status(403).json({ error: 'Organization context required' })
      return
    }
    const membership = await prisma.organizationmembership.findFirst({
      where: { organizationId: orgId, userId: req.params.id },
      include: { user: true },
    })
    if (!membership) {
      res.status(404).json({ error: 'User not found in organization' })
      return
    }
    res.json({ user: membershipUser(membership) })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const orgId = orgIdFromReq(req)
    if (!orgId) {
      res.status(403).json({ error: 'Organization context required' })
      return
    }
    const { email, password, displayName, orgRole } = req.body ?? {}

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

    const role = orgRole === 'tenant_admin' ? 'tenant_admin' : 'member'
    const prisma = getPrisma()

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      const dup = await prisma.organizationmembership.findUnique({
        where: { userId_organizationId: { userId: existing.id, organizationId: orgId } },
      })
      if (dup) {
        res.status(409).json({ error: 'User is already in this organization' })
        return
      }
      const membership = await prisma.organizationmembership.create({
        data: { userId: existing.id, organizationId: orgId, orgRole: role, status: 'active' },
        include: { user: true },
      })
      res.status(201).json({ user: membershipUser(membership) })
      return
    }

    const passwordHash = await hashPassword(password)
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        displayName: displayName.trim(),
      },
    })
    const membership = await prisma.organizationmembership.create({
      data: { userId: newUser.id, organizationId: orgId, orgRole: role, status: 'active' },
      include: { user: true },
    })

    res.status(201).json({ user: membershipUser(membership) })
  } catch (err) {
    next(err)
  }
})

router.put('/:id/status', async (req, res, next) => {
  try {
    const orgId = orgIdFromReq(req)
    if (!orgId) {
      res.status(403).json({ error: 'Organization context required' })
      return
    }
    const { status } = req.body ?? {}
    const allowed = ['pending', 'active', 'suspended', 'rejected']
    if (!allowed.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` })
      return
    }

    const prisma = getPrisma()
    const membership = await prisma.organizationmembership.findFirst({
      where: { organizationId: orgId, userId: req.params.id },
      include: { user: true },
    })
    if (!membership) {
      res.status(404).json({ error: 'User not found in organization' })
      return
    }

    const updated = await prisma.organizationmembership.update({
      where: { id: membership.id },
      data: { status },
      include: { user: true },
    })

    res.json({ user: membershipUser(updated) })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const orgId = orgIdFromReq(req)
    if (!orgId) {
      res.status(403).json({ error: 'Organization context required' })
      return
    }
    if (req.params.id === req.user.id) {
      res.status(400).json({ error: 'Cannot remove yourself' })
      return
    }

    const prisma = getPrisma()
    const membership = await prisma.organizationmembership.findFirst({
      where: { organizationId: orgId, userId: req.params.id },
    })
    if (!membership) {
      res.status(404).json({ error: 'User not found in organization' })
      return
    }

    await prisma.organizationmembership.update({
      where: { id: membership.id },
      data: { status: 'rejected' },
    })

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
