<<<<<<< Updated upstream
import { randomBytes, randomUUID } from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { hashPassword } from '../auth/password.js'
=======
import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
>>>>>>> Stashed changes
import { requireAuth } from '../middleware/requireAuth.js'
import { requireSuperAdmin } from '../middleware/requireRole.js'
import { getPrisma } from '../persistence/prisma.js'

const router = Router()
<<<<<<< Updated upstream
router.use(rateLimit({ windowMs: 60_000, max: 60 }))
router.use(requireAuth, requireSuperAdmin)

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatMember(membership) {
  const u = membership.user
  return {
    membershipId: membership.id,
    userId: u.id,
    email: u.email,
    displayName: u.displayName,
    orgRole: membership.orgRole,
    status: membership.status,
    joinedAt: membership.createdAt,
  }
}

async function findOrganization(prisma, orgId) {
  return prisma.organization.findUnique({ where: { id: orgId } })
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
router.use(requireSuperAdmin)

function generateInviteCode() {
  return randomBytes(8).toString('hex')
}

function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
>>>>>>> Stashed changes
}

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const skip = (page - 1) * limit
<<<<<<< Updated upstream
    const prisma = getPrisma()
    const [organizations, total] = await Promise.all([
=======

    const prisma = getPrisma()
    const [items, total] = await Promise.all([
>>>>>>> Stashed changes
      prisma.organization.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
<<<<<<< Updated upstream
        include: { _count: { select: { organizationmembership: true } } },
      }),
      prisma.organization.count(),
    ])
=======
        include: { _count: { select: { memberships: true } } },
      }),
      prisma.organization.count(),
    ])

>>>>>>> Stashed changes
    res.json({
      page,
      limit,
      total,
<<<<<<< Updated upstream
      organizations: organizations.map((o) => ({
=======
      organizations: items.map((o) => ({
>>>>>>> Stashed changes
        id: o.id,
        name: o.name,
        slug: o.slug,
        inviteCode: o.inviteCode,
        isActive: o.isActive,
<<<<<<< Updated upstream
        memberCount: o._count.organizationmembership,
=======
        memberCount: o._count.memberships,
>>>>>>> Stashed changes
        createdAt: o.createdAt,
      })),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
<<<<<<< Updated upstream
    const { name, slug, tenantAdminEmail, tenantAdminPassword, tenantAdminDisplayName } = req.body ?? {}
    if (!name?.trim()) {
      res.status(400).json({ error: 'name is required' })
      return
    }
    const prisma = getPrisma()
    const orgSlug = (slug || slugify(name)).toLowerCase()
    const inviteCode = randomBytes(8).toString('hex')
    const org = await prisma.organization.create({
      data: {
        id: randomUUID(),
        name: name.trim(),
        slug: orgSlug,
        inviteCode,
        updatedAt: new Date(),
=======
    const { name, slug, tenantAdminEmail, tenantAdminPassword, tenantAdminDisplayName } =
      req.body ?? {}

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' })
      return
    }

    const normalizedSlug = normalizeSlug(slug || name)
    if (!normalizedSlug) {
      res.status(400).json({ error: 'slug is required' })
      return
    }

    const prisma = getPrisma()
    const existing = await prisma.organization.findUnique({ where: { slug: normalizedSlug } })
    if (existing) {
      res.status(409).json({ error: 'Organization slug already exists' })
      return
    }

    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug: normalizedSlug,
        inviteCode: generateInviteCode(),
>>>>>>> Stashed changes
      },
    })

    if (tenantAdminEmail && tenantAdminPassword && tenantAdminDisplayName) {
<<<<<<< Updated upstream
=======
      const { hashPassword } = await import('../auth/password.js')
>>>>>>> Stashed changes
      const passwordHash = await hashPassword(String(tenantAdminPassword))
      const adminUser = await prisma.user.create({
        data: {
          email: String(tenantAdminEmail).toLowerCase().trim(),
          passwordHash,
          displayName: String(tenantAdminDisplayName).trim(),
        },
      })
<<<<<<< Updated upstream
      await prisma.organizationmembership.create({
        data: {
          id: randomUUID(),
=======
      await prisma.organizationMembership.create({
        data: {
>>>>>>> Stashed changes
          userId: adminUser.id,
          organizationId: org.id,
          orgRole: 'tenant_admin',
          status: 'active',
<<<<<<< Updated upstream
          updatedAt: new Date(),
=======
>>>>>>> Stashed changes
        },
      })
    }

<<<<<<< Updated upstream
    res.status(201).json({ organization: org })
  } catch (err) {
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'Organization slug already exists' })
      return
    }
    next(err)
  }
})

router.get('/:id/members', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const org = await findOrganization(prisma, req.params.id)
    if (!org) {
      res.status(404).json({ error: 'Organization not found' })
      return
    }
    const memberships = await prisma.organizationmembership.findMany({
      where: { organizationId: org.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ members: memberships.map(formatMember) })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/members', async (req, res, next) => {
  try {
    const { userId, email, password, displayName, orgRole, status } = req.body ?? {}

    const prisma = getPrisma()
    const org = await findOrganization(prisma, req.params.id)
    if (!org) {
      res.status(404).json({ error: 'Organization not found' })
      return
    }

    const role = orgRole === 'tenant_admin' ? 'tenant_admin' : 'member'
    const allowedStatuses = ['pending', 'active', 'suspended', 'rejected']
    const membershipStatus = allowedStatuses.includes(status) ? status : 'active'

    async function linkUser(user) {
      const dup = await prisma.organizationmembership.findUnique({
        where: {
          userId_organizationId: { userId: user.id, organizationId: org.id },
        },
      })
      if (dup) {
        if (dup.status === 'rejected') {
          const updated = await prisma.organizationmembership.update({
            where: { id: dup.id },
            data: { orgRole: role, status: membershipStatus, updatedAt: new Date() },
            include: { user: true },
          })
          return formatMember(updated)
        }
        return null
      }
      const membership = await prisma.organizationmembership.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          organizationId: org.id,
          orgRole: role,
          status: membershipStatus,
          updatedAt: new Date(),
        },
        include: { user: true },
      })
      return formatMember(membership)
    }

    if (userId && typeof userId === 'string') {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }
      const member = await linkUser(user)
      if (!member) {
        res.status(409).json({ error: 'User is already in this organization' })
        return
      }
      res.status(201).json({ member })
      return
    }

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'userId or email is required' })
      return
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existing) {
      const member = await linkUser(existing)
      if (!member) {
        res.status(409).json({ error: 'User is already in this organization' })
        return
      }
      res.status(201).json({ member })
      return
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'password must be at least 8 characters for new users' })
      return
    }
    if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
      res.status(400).json({ error: 'displayName is required for new users' })
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
    const member = await linkUser(newUser)
    res.status(201).json({ member })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/members/:userId', async (req, res, next) => {
  try {
    const { orgRole, status } = req.body ?? {}
    const prisma = getPrisma()
    const org = await findOrganization(prisma, req.params.id)
    if (!org) {
      res.status(404).json({ error: 'Organization not found' })
      return
    }

    const membership = await prisma.organizationmembership.findFirst({
      where: { organizationId: org.id, userId: req.params.userId },
      include: { user: true },
    })
    if (!membership) {
      res.status(404).json({ error: 'Member not found in organization' })
      return
    }

    const data = { updatedAt: new Date() }
    if (orgRole === 'tenant_admin' || orgRole === 'member') data.orgRole = orgRole
    const allowedStatuses = ['pending', 'active', 'suspended', 'rejected']
    if (allowedStatuses.includes(status)) data.status = status

    if (Object.keys(data).length === 1) {
      res.status(400).json({ error: 'Provide orgRole and/or status to update' })
      return
    }

    const updated = await prisma.organizationmembership.update({
      where: { id: membership.id },
      data,
      include: { user: true },
    })

    res.json({ member: formatMember(updated) })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const org = await findOrganization(prisma, req.params.id)
    if (!org) {
      res.status(404).json({ error: 'Organization not found' })
      return
    }

    const membership = await prisma.organizationmembership.findFirst({
      where: { organizationId: org.id, userId: req.params.userId },
    })
    if (!membership) {
      res.status(404).json({ error: 'Member not found in organization' })
      return
    }

    await prisma.organizationmembership.update({
      where: { id: membership.id },
      data: { status: 'rejected', updatedAt: new Date() },
    })

    res.json({ ok: true })
=======
    res.status(201).json({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        inviteCode: org.inviteCode,
        isActive: org.isActive,
        createdAt: org.createdAt,
      },
    })
>>>>>>> Stashed changes
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
<<<<<<< Updated upstream
    const { name, isActive, rotateInviteCode } = req.body ?? {}
    const prisma = getPrisma()
    const data = { updatedAt: new Date() }
    if (name) data.name = String(name).trim()
    if (typeof isActive === 'boolean') data.isActive = isActive
    if (rotateInviteCode) data.inviteCode = randomBytes(8).toString('hex')

    const organization = await prisma.organization.update({
      where: { id: req.params.id },
      data,
    }).catch(() => null)

    if (!organization) {
      res.status(404).json({ error: 'Organization not found' })
      return
    }
    res.json({ organization })
=======
    const { isActive, rotateInviteCode, name } = req.body ?? {}
    const prisma = getPrisma()
    const existing = await prisma.organization.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      res.status(404).json({ error: 'Organization not found' })
      return
    }

    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(name ? { name: String(name).trim() } : {}),
        ...(rotateInviteCode ? { inviteCode: generateInviteCode() } : {}),
      },
    })

    res.json({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        inviteCode: org.inviteCode,
        isActive: org.isActive,
        createdAt: org.createdAt,
      },
    })
>>>>>>> Stashed changes
  } catch (err) {
    next(err)
  }
})

export default router
