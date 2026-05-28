import { randomUUID } from 'node:crypto'

/** @typedef {{ socketId: string, userId: string, sourceLang: string, targetLang: string, dbSessionId?: string, participantDbId?: string, deeplClient?: import('../deepl/deeplVoiceClient.js').DeepLVoiceClient }} SessionClient */

/** @typedef {{ id: string, clients: Map<string, SessionClient>, createdAt: number }} Session */

/** @type {Map<string, Session>} */
const sessions = new Map()

/** @type {Map<string, { sessionId: string, clientKey: string }>} */
const socketIndex = new Map()

function clientKey(userId, socketId) {
  return `${userId}:${socketId}`
}

export function normalizeSessionId(sessionId) {
  return String(sessionId || '').trim().toLowerCase()
}

/**
 * Create a new empty session with a server-generated UUID.
 * @returns {{ sessionId: string, createdAt: number }}
 */
export function createSession() {
  const sessionId = randomUUID()
  const session = { id: sessionId, clients: new Map(), createdAt: Date.now() }
  sessions.set(sessionId, session)
  return { sessionId, createdAt: session.createdAt }
}

/**
 * Remove clients whose sockets are no longer connected.
 * @param {Session} session
 * @param {import('socket.io').Server} io
 */
export function pruneSession(session, io) {
  for (const [key, client] of [...session.clients.entries()]) {
    if (!io.sockets.sockets.has(client.socketId)) {
      session.clients.delete(key)
      socketIndex.delete(client.socketId)
    }
  }
}

/**
 * Evict sessions with no connected clients older than maxAgeMs.
 * @param {number} maxAgeMs
 * @returns {number} number of sessions removed
 */
export function cleanupIdleSessions(maxAgeMs) {
  const now = Date.now()
  let removed = 0
  for (const [id, session] of sessions) {
    if (session.clients.size === 0 && now - session.createdAt > maxAgeMs) {
      sessions.delete(id)
      removed++
    }
  }
  return removed
}

/**
 * @param {string} sessionId
 * @param {string} socketId
 * @param {{ userId: string, sourceLang: string, targetLang?: string }} meta
 * @param {import('socket.io').Server} [io]
 */
export function joinSession(sessionId, socketId, meta, io) {
  sessionId = normalizeSessionId(sessionId)

  if (!sessionId) {
    return { error: 'sessionId is required' }
  }

  let session = sessions.get(sessionId)
  if (!session) {
    session = { id: sessionId, clients: new Map(), createdAt: Date.now() }
    sessions.set(sessionId, session)
  }

  if (io) {
    pruneSession(session, io)
  }

  // Same browser tab reconnecting with a new socket id
  for (const [key, client] of [...session.clients.entries()]) {
    if (client.userId === meta.userId && client.socketId !== socketId) {
      session.clients.delete(key)
      socketIndex.delete(client.socketId)
    }
  }

  if (session.clients.size >= 2) {
    const alreadyJoined = [...session.clients.values()].some((c) => c.socketId === socketId)
    if (!alreadyJoined) {
      return {
        error:
          'Session is full (max 2 participants). Leave and rejoin, or use a new session ID.',
      }
    }
  }

  const mySourceLang = normalizeLang(meta.sourceLang)
  const key = clientKey(meta.userId, socketId)

  // Find existing partner before adding this client
  const existingPeer = [...session.clients.values()].find((c) => c.socketId !== socketId)

  // Auto-resolve target langs from partner's source when both are present
  let myTargetLang = existingPeer ? existingPeer.sourceLang : mySourceLang
  if (existingPeer) {
    existingPeer.targetLang = mySourceLang
  }

  const entry = {
    socketId,
    userId: meta.userId,
    sourceLang: mySourceLang,
    targetLang: myTargetLang,
  }

  session.clients.set(key, entry)
  socketIndex.set(socketId, { sessionId, clientKey: key })

  const peers = [...session.clients.values()].filter((c) => c.socketId !== socketId)
  const isInitiator = session.clients.size === 1

  return {
    sessionId,
    clientId: socketId,
    isInitiator,
    peer: peers[0] ?? null,
    participantCount: session.clients.size,
    resolvedTargetLang: myTargetLang,
    peerResolvedTargetLang: existingPeer ? mySourceLang : null,
  }
}

export function getSessionBySocket(socketId) {
  const index = socketIndex.get(socketId)
  if (!index) return null
  const session = sessions.get(index.sessionId)
  if (!session) return null
  return { session, clientKey: index.clientKey }
}

export function getPeer(session, socketId) {
  for (const [key, client] of session.clients) {
    if (client.socketId !== socketId) {
      return { key, client }
    }
  }
  return null
}

export function getClient(session, socketId) {
  for (const client of session.clients.values()) {
    if (client.socketId === socketId) return client
  }
  return null
}

export function leaveSession(socketId) {
  const index = socketIndex.get(socketId)
  if (!index) return null

  const session = sessions.get(index.sessionId)
  socketIndex.delete(socketId)

  if (!session) return null

  const leaving = session.clients.get(index.clientKey)
  session.clients.delete(index.clientKey)

  const peer = getPeer(session, socketId)

  if (session.clients.size === 0) {
    sessions.delete(index.sessionId)
  }

  return {
    sessionId: index.sessionId,
    leaving,
    peer,
    sessionEmpty: session.clients.size === 0,
  }
}

export function sessionCount() {
  return sessions.size
}

export function normalizeLang(code) {
  return String(code || 'en')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
}

export function getSessionSnapshot(sessionId) {
  const session = sessions.get(normalizeSessionId(sessionId))
  if (!session) return null
  return {
    sessionId: session.id,
    participantCount: session.clients.size,
    clients: [...session.clients.values()].map((c) => ({
      socketId: c.socketId,
      userId: c.userId,
    })),
  }
}
