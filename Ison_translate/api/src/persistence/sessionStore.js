import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { getPrisma } from './prisma.js'

/**
 * @param {string} sessionSlug normalized session id
 */
export async function ensureSession(sessionSlug) {
  if (!config.persistEnabled) return null
  if (!config.databaseUrl) {
    persistError('ensureSession', new Error('DATABASE_URL is not set in api/.env'))
    return null
  }

  const prisma = getPrisma()
  const existing = await prisma.session.findUnique({
    where: { sessionId: sessionSlug },
  })
  if (existing) {
    if (existing.status === 'ended') {
      return prisma.session.update({
        where: { id: existing.id },
        data: { status: 'active', endedAt: null },
      })
    }
    if (existing.status === 'pending') {
      return prisma.session.update({
        where: { id: existing.id },
        data: { status: 'active' },
      })
    }
    return existing
  }

  return prisma.session.create({
    data: {
      sessionId: sessionSlug,
      status: 'active',
    },
  })
}

/**
 * @param {{ sessionDbId: string, userId: string, clientId: string, sourceLang: string, targetLang: string, isInitiator: boolean, accountUserId?: string | null }} params
 */
export async function addParticipant(params) {
  if (!config.persistEnabled) return null

  const prisma = getPrisma()
  return prisma.participant.create({
    data: {
      sessionId: params.sessionDbId,
      userId: params.userId,
      clientId: params.clientId,
      sourceLang: params.sourceLang,
      targetLang: params.targetLang,
      isInitiator: params.isInitiator,
      ...(params.accountUserId ? { accountUserId: params.accountUserId } : {}),
    },
  })
}

/**
 * @param {string} participantDbId
 */
export async function endParticipant(participantDbId) {
  if (!config.persistEnabled || !participantDbId) return

  const prisma = getPrisma()
  await prisma.participant.update({
    where: { id: participantDbId },
    data: { leftAt: new Date() },
  })
}

/**
 * @param {string} sessionDbId
 */
export async function endSession(sessionDbId) {
  if (!config.persistEnabled || !sessionDbId) return

  const prisma = getPrisma()
  await prisma.session.update({
    where: { id: sessionDbId },
    data: { status: 'ended', endedAt: new Date() },
  })
}

/**
 * @param {string} sessionSlug
 */
export async function createPendingSession(sessionSlug) {
  if (!config.persistEnabled) return null

  try {
    const prisma = getPrisma()
    return await prisma.session.upsert({
      where: { sessionId: sessionSlug },
      create: { sessionId: sessionSlug, status: 'pending' },
      update: {},
    })
  } catch (err) {
    logger.warn('[persist] createPendingSession failed:', err.message)
    return null
  }
}

export function persistError(label, err) {
  logger.warn(`[persist] ${label}:`, err instanceof Error ? err.message : String(err))
}
