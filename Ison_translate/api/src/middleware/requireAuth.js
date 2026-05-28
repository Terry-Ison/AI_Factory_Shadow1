import { verifyToken } from '../auth/jwt.js'

/**
 * Extracts and verifies a Bearer JWT from Authorization header.
 * Attaches `req.user` if valid; does NOT reject — use `requireAuth` for strict gates.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      req.user = { id: payload.sub, email: payload.email, displayName: payload.displayName }
    }
  }
  next()
}

/**
 * Rejects with 401 if no valid JWT is present.
 */
export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }
    next()
  })
}
