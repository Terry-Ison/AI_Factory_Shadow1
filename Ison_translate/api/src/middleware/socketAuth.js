import { config } from '../config.js'
import { logger } from '../utils/logger.js'

/**
 * Socket.IO middleware: validates handshake auth token when SOCKET_SECRET is set.
 * @param {import('socket.io').Socket} socket
 * @param {(err?: Error) => void} next
 */
export function socketAuthMiddleware(socket, next) {
  if (!config.socketSecret) {
    next()
    return
  }

  const token = socket.handshake.auth?.token
  if (token !== config.socketSecret) {
    logger.warn('Socket auth rejected:', socket.id)
    next(new Error('Unauthorized'))
    return
  }

  next()
}
