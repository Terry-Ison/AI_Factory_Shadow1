<<<<<<< Updated upstream
import { getPrisma } from '../persistence/prisma.js'
import { config } from '../config.js'

/**
 * @param {string} userId
 * @param {string | null | undefined} globalRole
 */
export async function loadMembershipClaims(userId, globalRole) {
  const prisma = getPrisma()
  let membership = await prisma.organizationmembership.findFirst({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  })
  if (!membership) {
    membership = await prisma.organizationmembership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  return {
    globalRole: globalRole ?? null,
    orgId: membership?.organizationId ?? null,
    orgRole: membership?.orgRole ?? null,
    membershipStatus: membership?.status ?? null,
=======
import { config } from '../config.js'
import { getPrisma } from '../persistence/prisma.js'

/**
 * Load primary org membership for JWT claims.
 * @param {string} userId
 * @returns {Promise<{ orgId?: string, orgRole?: string, membershipStatus?: string, globalRole?: string }>}
 */
export async function loadMembershipClaims(userId, globalRole) {
  if (globalRole === 'super_admin') {
    return { globalRole: 'super_admin' }
  }

  const prisma = getPrisma()
  const membership = await prisma.organizationMembership.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: { organization: { select: { isActive: true } } },
  })

  if (!membership || !membership.organization.isActive) {
    return {}
  }

  return {
    orgId: membership.organizationId,
    orgRole: membership.orgRole,
    membershipStatus: membership.status,
>>>>>>> Stashed changes
  }
}

/**
<<<<<<< Updated upstream
=======
 * Promote user to super_admin if email matches SUPER_ADMIN_EMAIL.
>>>>>>> Stashed changes
 * @param {{ id: string, email: string, globalRole?: string | null }} user
 */
export async function maybePromoteSuperAdmin(user) {
  const email = config.superAdminEmail?.toLowerCase().trim()
  if (!email || user.email.toLowerCase() !== email) return user
  if (user.globalRole === 'super_admin') return user

  const prisma = getPrisma()
<<<<<<< Updated upstream
  return prisma.user.update({
    where: { id: user.id },
    data: { globalRole: 'super_admin' },
  })
}

/**
 * @param {{ slug?: string, inviteCode?: string }} input
 */
export async function resolveOrganization(input) {
  const prisma = getPrisma()
  if (input.inviteCode) {
    return prisma.organization.findFirst({
      where: { inviteCode: input.inviteCode, isActive: true },
    })
  }
  if (input.slug) {
    return prisma.organization.findFirst({
      where: { slug: input.slug.toLowerCase(), isActive: true },
    })
  }
  return null
=======
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { globalRole: 'super_admin' },
  })
  return updated
}

/**
 * @param {{ organizationSlug?: string, inviteCode?: string }} params
 */
export async function resolveOrganization(params) {
  const slug = params.organizationSlug?.trim().toLowerCase()
  const inviteCode = params.inviteCode?.trim()

  if (slug && inviteCode) {
    throw new Error('Provide organizationSlug or inviteCode, not both')
  }
  if (!slug && !inviteCode) return null

  const prisma = getPrisma()
  const org = slug
    ? await prisma.organization.findFirst({ where: { slug, isActive: true } })
    : await prisma.organization.findFirst({ where: { inviteCode, isActive: true } })

  if (!org) {
    throw new Error('Organization not found or inactive')
  }
  return org
>>>>>>> Stashed changes
}
