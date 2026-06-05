import jwt from 'jsonwebtoken'
import { config } from '../config.js'

/**
 * @param {{ id: string, email: string, displayName: string, globalRole?: string | null, orgId?: string | null, orgRole?: string | null, membershipStatus?: string | null }} user
 */
export function signToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
  }
  if (user.globalRole) payload.globalRole = user.globalRole
  if (user.orgId) payload.orgId = user.orgId
  if (user.orgRole) payload.orgRole = user.orgRole
  if (user.membershipStatus) payload.membershipStatus = user.membershipStatus

  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

/**
 * @param {string} token
 */
export function verifyToken(token) {
  try {
    return /** @type {any} */ (jwt.verify(token, config.jwtSecret))
  } catch {
    return null
  }
}

/**
 * @param {Record<string, unknown>} user
 */
export function buildAuthUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    defaultSourceLang: user.defaultSourceLang,
    defaultTargetLang: user.defaultTargetLang,
    createdAt: user.createdAt,
    globalRole: user.globalRole ?? null,
    orgId: user.orgId ?? null,
    orgRole: user.orgRole ?? null,
    membershipStatus: user.membershipStatus ?? null,
  }
}
