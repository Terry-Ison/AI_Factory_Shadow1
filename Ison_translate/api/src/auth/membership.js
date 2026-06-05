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
  }
}

/**
 * @param {{ id: string, email: string, globalRole?: string | null }} user
 */
export async function maybePromoteSuperAdmin(user) {
  const email = config.superAdminEmail?.toLowerCase().trim()
  if (!email || user.email.toLowerCase() !== email) return user
  if (user.globalRole === 'super_admin') return user

  const prisma = getPrisma()
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
}
