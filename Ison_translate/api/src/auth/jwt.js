import jwt from 'jsonwebtoken'
import { config } from '../config.js'

/**
 * @param {{ id: string, email: string, displayName: string }} user
 * @returns {string}
 */
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, displayName: user.displayName },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  )
}

/**
 * @param {string} token
 * @returns {{ sub: string, email: string, displayName: string } | null}
 */
export function verifyToken(token) {
  try {
    return /** @type {any} */ (jwt.verify(token, config.jwtSecret))
  } catch {
    return null
  }
}
