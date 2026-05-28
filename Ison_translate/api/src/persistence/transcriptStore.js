import { config } from '../config.js'
import { getPrisma } from './prisma.js'
import { persistError } from './sessionStore.js'

/**
 * @param {{ sessionDbId: string, participantDbId?: string, role: 'source' | 'translation', language: string, text: string, isFinal?: boolean }} params
 */
export async function appendTranscript(params) {
  if (!config.persistEnabled || !params.text?.trim()) return

  try {
    const prisma = getPrisma()
    const sequence = await prisma.transcriptSegment.count({
      where: { sessionId: params.sessionDbId },
    })

    await prisma.transcriptSegment.create({
      data: {
        sessionId: params.sessionDbId,
        participantId: params.participantDbId ?? null,
        role: params.role,
        language: params.language,
        text: params.text.trim(),
        isFinal: params.isFinal ?? true,
        sequence,
      },
    })
  } catch (err) {
    persistError('appendTranscript', err)
  }
}
