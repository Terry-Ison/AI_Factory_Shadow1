import { verifyToken } from '../auth/jwt.js'

/**
<<<<<<< Updated upstream
=======
 * @param {import('express').Request} req
 * @param {{ sub: string, email: string, displayName: string, globalRole?: string, orgId?: string, orgRole?: string, membershipStatus?: string }} payload
 */
function attachUser(req, payload) {
  req.user = {
    id: payload.sub,
    email: payload.email,
    displayName: payload.displayName,
    globalRole: payload.globalRole ?? null,
    orgId: payload.orgId ?? null,
    orgRole: payload.orgRole ?? null,
    membershipStatus: payload.membershipStatus ?? null,
  }
}

/**
 * Extracts and verifies a Bearer JWT from Authorization header.
 * Attaches `req.user` if valid; does NOT reject — use `requireAuth` for strict gates.
>>>>>>> Stashed changes
 * @param {import('express').Request} req
 * @param {Record<string, unknown>} payload
 */
function attachUser(req, payload) {
  req.user = {
    id: payload.sub,
    email: payload.email,
    displayName: payload.displayName,
    globalRole: payload.globalRole ?? null,
    orgId: payload.orgId ?? null,
    orgRole: payload.orgRole ?? null,
    membershipStatus: payload.membershipStatus ?? null,
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (token) {
    const payload = verifyToken(token)
    if (payload) attachUser(req, payload)
  }
  next()
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }
    next()
  })
}

<<<<<<< Updated upstream
=======
/**
 * Rejects pending/suspended members from org-scoped member features (e.g. history).
 */
>>>>>>> Stashed changes
export function requireActiveMember(req, res, next) {
  requireAuth(req, res, () => {
    const user = req.user
    if (user.globalRole === 'super_admin') {
      next()
      return
    }
    if (user.orgId && user.membershipStatus !== 'active') {
      res.status(403).json({ error: 'Organization membership is not active' })
      return
    }
    next()
  })
}
