/**
<<<<<<< Updated upstream
=======
 * Role-based access control middleware.
 */

/**
>>>>>>> Stashed changes
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
<<<<<<< Updated upstream
export async function requireSuperAdmin(req, res, next) {
=======
export function requireSuperAdmin(req, res, next) {
>>>>>>> Stashed changes
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  if (req.user.globalRole !== 'super_admin') {
<<<<<<< Updated upstream
    const { getPrisma } = await import('../persistence/prisma.js')
    const dbUser = await getPrisma().user.findUnique({ where: { id: req.user.id } })
    if (dbUser?.globalRole === 'super_admin') {
      req.user.globalRole = 'super_admin'
    } else {
      res.status(403).json({ error: 'Super admin access required' })
      return
    }
=======
    res.status(403).json({ error: 'Super admin access required' })
    return
>>>>>>> Stashed changes
  }
  next()
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
<<<<<<< Updated upstream
export async function requireTenantAdmin(req, res, next) {
=======
export function requireTenantAdmin(req, res, next) {
>>>>>>> Stashed changes
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  if (req.user.globalRole === 'super_admin') {
    next()
    return
  }
<<<<<<< Updated upstream
  if (!req.user.orgId || !req.user.orgRole || !req.user.membershipStatus) {
    const { loadMembershipClaims } = await import('../auth/membership.js')
    const { getPrisma } = await import('../persistence/prisma.js')
    const dbUser = await getPrisma().user.findUnique({ where: { id: req.user.id } })
    const claims = await loadMembershipClaims(req.user.id, dbUser?.globalRole ?? null)
    req.user.orgId = claims.orgId
    req.user.orgRole = claims.orgRole
    req.user.membershipStatus = claims.membershipStatus
    req.user.globalRole = claims.globalRole
  }
  if (
    req.user.globalRole === 'super_admin' ||
    (req.user.orgId &&
      req.user.orgRole === 'tenant_admin' &&
      req.user.membershipStatus === 'active')
  ) {
    next()
    return
  }
  res.status(403).json({ error: 'Tenant admin access required' })
=======
  if (
    !req.user.orgId ||
    req.user.orgRole !== 'tenant_admin' ||
    req.user.membershipStatus !== 'active'
  ) {
    res.status(403).json({ error: 'Tenant admin access required' })
    return
  }
  next()
>>>>>>> Stashed changes
}
