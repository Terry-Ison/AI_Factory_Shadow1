import { config } from '../config.js'

export function historyTokenFromRequest(req) {
  const header = req.headers.authorization ?? ''
  if (header.startsWith('Bearer ')) return header.slice(7)
  const query = req.query?.token
  return typeof query === 'string' ? query : ''
}

export function historyAuthMiddleware(req, res, next) {
  if (!config.historyApiKey) {
    next()
    return
  }

  if (historyTokenFromRequest(req) !== config.historyApiKey) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
