import { Router } from 'express'
import { createReadStream, existsSync } from 'node:fs'
import { join } from 'node:path'
import { optionalAuth, requireAuth } from '../middleware/requireAuth.js'
import { getPrisma } from '../persistence/prisma.js'
import { normalizeSessionId } from '../rooms/sessionManager.js'

const router = Router()

router.use(optionalAuth)
router.use(requireAuth)

function guestDisplayName(userId) {
  if (userId.startsWith('guest-')) return 'Guest'
  if (userId.length > 16) return 'Partner'
  return userId
}

function mapParticipant(p, currentUserId) {
  const isYou = p.accountUserId === currentUserId
  return {
    id: p.id,
    userId: p.userId,
    sourceLang: p.sourceLang,
    targetLang: p.targetLang,
    isInitiator: p.isInitiator,
    isYou,
    displayName: isYou
      ? 'You'
      : p.accountUser?.displayName ?? guestDisplayName(p.userId),
    joinedAt: p.joinedAt,
    leftAt: p.leftAt ?? null,
  }
}

router.get('/sessions', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const userFilter = {
      participants: { some: { accountUserId: req.user.id } },
    }

    const prisma = getPrisma()
    const [items, total] = await Promise.all([
      prisma.session.findMany({
        where: userFilter,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          participants: {
            orderBy: { joinedAt: 'asc' },
            select: {
              userId: true,
              sourceLang: true,
              targetLang: true,
              isInitiator: true,
              accountUserId: true,
              joinedAt: true,
              leftAt: true,
              accountUser: { select: { displayName: true } },
            },
          },
          transcriptSegments: {
            take: 1,
            orderBy: { recordedAt: 'desc' },
            select: { text: true, role: true },
          },
          _count: { select: { transcriptSegments: true, audioRecordings: true } },
        },
      }),
      prisma.session.count({ where: userFilter }),
    ])

    res.json({
      page,
      limit,
      total,
      sessions: items.map((s) => {
        const participants = s.participants.map((p) => mapParticipant(p, req.user.id))
        const preview = s.transcriptSegments[0]?.text?.trim() ?? null
        return {
          sessionId: s.sessionId,
          status: s.status,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          participantCount: participants.length,
          participants,
          transcriptPreview: preview ? preview.slice(0, 160) : null,
          hasTranscript: s._count.transcriptSegments > 0,
          hasRecording: s._count.audioRecordings > 0,
        }
      }),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/sessions/:sessionId', async (req, res, next) => {
  try {
    const sessionId = normalizeSessionId(req.params.sessionId)
    const prisma = getPrisma()
    const session = await prisma.session.findFirst({
      where: {
        sessionId,
        participants: { some: { accountUserId: req.user.id } },
      },
      include: {
        participants: {
          orderBy: { joinedAt: 'asc' },
          include: { accountUser: { select: { displayName: true } } },
        },
        transcriptSegments: { orderBy: [{ recordedAt: 'asc' }, { sequence: 'asc' }] },
        audioRecordings: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const participants = session.participants.map((p) => mapParticipant(p, req.user.id))

    res.json({
      sessionId: session.sessionId,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      participants,
      transcripts: session.transcriptSegments,
      recordings: session.audioRecordings.map((r) => ({
        id: r.id,
        kind: r.kind,
        contentType: r.contentType,
        sampleRate: r.sampleRate,
        filePath: r.filePath,
        byteLength: r.byteLength,
        durationMs: r.durationMs,
        participantId: r.participantId,
        finalizedAt: r.finalizedAt,
        audioUrl: `/api/history/sessions/${session.sessionId}/audio/${r.id}`,
      })),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/sessions/:sessionId/audio/:recordingId', async (req, res, next) => {
  try {
    const sessionId = normalizeSessionId(req.params.sessionId)
    const { recordingId } = req.params
    const prisma = getPrisma()

    const recording = await prisma.audioRecording.findFirst({
      where: {
        id: recordingId,
        session: {
          sessionId,
          participants: { some: { accountUserId: req.user.id } },
        },
      },
    })

    if (!recording) {
      res.status(404).json({ error: 'Recording not found' })
      return
    }

    const absPath = join(process.cwd(), recording.filePath)
    if (!existsSync(absPath)) {
      res.status(404).json({ error: 'Recording file missing' })
      return
    }

    res.setHeader('Content-Type', 'audio/wav')
    createReadStream(absPath).pipe(res)
  } catch (err) {
    next(err)
  }
})

export default router
