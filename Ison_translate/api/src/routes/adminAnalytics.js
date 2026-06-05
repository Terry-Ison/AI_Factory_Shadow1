import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireTenantAdmin } from '../middleware/requireRole.js'
import { getPrisma } from '../persistence/prisma.js'

const router = Router()
<<<<<<< Updated upstream
router.use(rateLimit({ windowMs: 60_000, max: 60 }))
router.use(requireAuth, requireTenantAdmin)
=======

router.use(
  rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)
router.use(requireAuth)
router.use(requireTenantAdmin)

function parseDateRange(query) {
  const now = new Date()
  const to = query.to ? new Date(String(query.to)) : now
  const from = query.from
    ? new Date(String(query.from))
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
  return { from, to }
}
>>>>>>> Stashed changes

router.get('/', async (req, res, next) => {
  try {
    const orgId = req.user.orgId
    if (!orgId) {
      res.status(403).json({ error: 'Organization context required' })
      return
    }

<<<<<<< Updated upstream
    const from = req.query.from
      ? new Date(String(req.query.from))
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const to = req.query.to ? new Date(String(req.query.to)) : new Date()

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      res.status(400).json({ error: 'Invalid from/to date' })
      return
    }
    if (from > to) {
      res.status(400).json({ error: 'from date must be before to date' })
      return
    }

    const prisma = getPrisma()
    const sessions = await prisma.session.findMany({
      where: {
        organizationId: orgId,
        startedAt: { gte: from, lte: to },
      },
      include: { participant: true },
    })

    const ended = sessions.filter((s) => s.status === 'ended')
    const totalDurationMs = ended.reduce((sum, s) => {
      if (!s.endedAt) return sum
      return sum + (s.endedAt.getTime() - s.startedAt.getTime())
    }, 0)

    const [activeMembers, pendingMembers, transcriptSegmentCount, recordingCount, recordingAgg] =
      await Promise.all([
        prisma.organizationmembership.count({ where: { organizationId: orgId, status: 'active' } }),
        prisma.organizationmembership.count({ where: { organizationId: orgId, status: 'pending' } }),
        prisma.transcriptsegment.count({
          where: { session: { organizationId: orgId, startedAt: { gte: from, lte: to } } },
        }),
        prisma.audiorecording.count({
          where: { session: { organizationId: orgId, startedAt: { gte: from, lte: to } } },
        }),
        prisma.audiorecording.aggregate({
          where: { session: { organizationId: orgId, startedAt: { gte: from, lte: to } } },
          _sum: { byteLength: true },
        }),
      ])

    const languagePairs = {}
    for (const s of sessions) {
      for (const p of s.participant) {
        const key = `${p.sourceLang}->${p.targetLang}`
        languagePairs[key] = (languagePairs[key] ?? 0) + 1
      }
    }

    const byDay = {}
    for (const s of sessions) {
      const day = s.startedAt.toISOString().slice(0, 10)
      byDay[day] = (byDay[day] ?? 0) + 1
    }
=======
    const { from, to } = parseDateRange(req.query)
    const prisma = getPrisma()

    const sessionWhere = {
      organizationId: orgId,
      startedAt: { gte: from, lte: to },
    }

    const [
      sessionCount,
      endedSessionCount,
      sessions,
      activeMembers,
      pendingMembers,
      transcriptSegmentCount,
      recordingAgg,
      participants,
    ] = await Promise.all([
      prisma.session.count({ where: sessionWhere }),
      prisma.session.count({ where: { ...sessionWhere, status: 'ended' } }),
      prisma.session.findMany({
        where: sessionWhere,
        select: { startedAt: true, endedAt: true, status: true },
      }),
      prisma.organizationMembership.count({
        where: { organizationId: orgId, status: 'active' },
      }),
      prisma.organizationMembership.count({
        where: { organizationId: orgId, status: 'pending' },
      }),
      prisma.transcriptSegment.count({
        where: { session: sessionWhere },
      }),
      prisma.audioRecording.aggregate({
        where: { session: sessionWhere },
        _count: { id: true },
        _sum: { byteLength: true },
      }),
      prisma.participant.findMany({
        where: { session: sessionWhere },
        select: { sourceLang: true, targetLang: true },
      }),
    ])

    let totalDurationMs = 0
    const sessionsByDayMap = new Map()
    for (const s of sessions) {
      const end = s.endedAt ?? (s.status === 'ended' ? s.startedAt : null)
      if (end) {
        totalDurationMs += Math.max(0, end.getTime() - s.startedAt.getTime())
      }
      const day = s.startedAt.toISOString().slice(0, 10)
      sessionsByDayMap.set(day, (sessionsByDayMap.get(day) ?? 0) + 1)
    }

    const languagePairs = {}
    for (const p of participants) {
      const key = `${p.sourceLang}->${p.targetLang}`
      languagePairs[key] = (languagePairs[key] ?? 0) + 1
    }

    const sessionsByDay = [...sessionsByDayMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))
>>>>>>> Stashed changes

    res.json({
      from: from.toISOString(),
      to: to.toISOString(),
<<<<<<< Updated upstream
      sessionCount: sessions.length,
      endedSessionCount: ended.length,
=======
      sessionCount,
      endedSessionCount,
>>>>>>> Stashed changes
      totalDurationMs,
      activeMembers,
      pendingMembers,
      transcriptSegmentCount,
<<<<<<< Updated upstream
      recordingCount,
      recordingBytes: recordingAgg._sum.byteLength ?? 0,
      languagePairs,
      sessionsByDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
=======
      recordingCount: recordingAgg._count.id,
      recordingBytes: recordingAgg._sum.byteLength ?? 0,
      languagePairs,
      sessionsByDay,
>>>>>>> Stashed changes
    })
  } catch (err) {
    next(err)
  }
})

export default router
