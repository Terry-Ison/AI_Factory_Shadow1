import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { buildAuthUser, signToken } from '../auth/jwt.js'
import {
  loadMembershipClaims,
  maybePromoteSuperAdmin,
  resolveOrganization,
} from '../auth/membership.js'
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

<<<<<<< Updated upstream
=======
/**
 * @param {import('@prisma/client').User & { orgId?: string, orgRole?: string, membershipStatus?: string }} user
 */
function safeUser(user) {
  return buildAuthUser(user)
}

/**
 * @param {import('@prisma/client').User} user
 */
>>>>>>> Stashed changes
async function issueAuthResponse(user) {
  const promoted = await maybePromoteSuperAdmin(user)
  const claims = await loadMembershipClaims(promoted.id, promoted.globalRole)
  const tokenUser = {
    id: promoted.id,
    email: promoted.email,
    displayName: promoted.displayName,
    defaultSourceLang: promoted.defaultSourceLang,
    defaultTargetLang: promoted.defaultTargetLang,
    createdAt: promoted.createdAt,
    globalRole: promoted.globalRole ?? claims.globalRole ?? null,
    orgId: claims.orgId ?? null,
    orgRole: claims.orgRole ?? null,
    membershipStatus: claims.membershipStatus ?? null,
  }
<<<<<<< Updated upstream
  return { token: signToken(tokenUser), user: buildAuthUser(tokenUser) }
=======
  return { token: signToken(tokenUser), user: safeUser(tokenUser) }
>>>>>>> Stashed changes
}

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    if (!config.persistEnabled) {
      res.status(503).json({ error: 'Persistence is disabled (PERSIST_ENABLED=false)' })
      return
    }

    const { email, password, displayName, organizationSlug, inviteCode } = req.body ?? {}

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
    if (organizationSlug && inviteCode) {
      res.status(400).json({ error: 'Provide organizationSlug or inviteCode, not both' })
      return
    }

    const prisma = getPrisma()
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      res.status(409).json({ error: 'An account with that email already exists' })
      return
    }

    let org = null
<<<<<<< Updated upstream
    if (organizationSlug || inviteCode) {
      org = await resolveOrganization({
        slug: organizationSlug,
        inviteCode,
      })
      if (!org) {
        res.status(400).json({ error: 'Organization not found or inactive' })
        return
      }
=======
    try {
      org = await resolveOrganization({ organizationSlug, inviteCode })
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid organization' })
      return
>>>>>>> Stashed changes
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        displayName: displayName.trim(),
        ...(org
          ? {
              memberships: {
                create: {
                  organizationId: org.id,
                  orgRole: 'member',
                  status: 'pending',
                },
              },
            }
          : {}),
      },
    })

<<<<<<< Updated upstream
    if (org) {
      await prisma.organizationmembership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          orgRole: 'member',
          status: 'pending',
          updatedAt: new Date(),
        },
      })
    }

=======
>>>>>>> Stashed changes
    const auth = await issueAuthResponse(user)
    res.status(201).json(auth)
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
    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

<<<<<<< Updated upstream
=======
    user = await maybePromoteSuperAdmin(user)
>>>>>>> Stashed changes
    const auth = await issueAuthResponse(user)
    res.json(auth)
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
<<<<<<< Updated upstream
    const promoted = await maybePromoteSuperAdmin(user)
    const claims = await loadMembershipClaims(promoted.id, promoted.globalRole)
    res.json({
      user: buildAuthUser({
        ...promoted,
        orgId: claims.orgId,
        orgRole: claims.orgRole,
        membershipStatus: claims.membershipStatus,
=======
    const claims = await loadMembershipClaims(user.id, user.globalRole)
    res.json({
      user: safeUser({
        ...user,
        globalRole: user.globalRole ?? claims.globalRole ?? null,
        orgId: claims.orgId ?? null,
        orgRole: claims.orgRole ?? null,
        membershipStatus: claims.membershipStatus ?? null,
>>>>>>> Stashed changes
      }),
    })
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
    const claims = await loadMembershipClaims(user.id, user.globalRole)
    res.json({
<<<<<<< Updated upstream
      user: buildAuthUser({
        ...user,
        orgId: claims.orgId,
        orgRole: claims.orgRole,
        membershipStatus: claims.membershipStatus,
=======
      user: safeUser({
        ...user,
        globalRole: user.globalRole ?? claims.globalRole ?? null,
        orgId: claims.orgId ?? null,
        orgRole: claims.orgRole ?? null,
        membershipStatus: claims.membershipStatus ?? null,
>>>>>>> Stashed changes
      }),
    })
  } catch (err) {
    next(err)
  }
})

export default router
