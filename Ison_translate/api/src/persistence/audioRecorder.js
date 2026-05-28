import { createWriteStream, existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { config } from '../config.js'
import { writePcmAsWav } from '../utils/pcmWav.js'
import { getPrisma } from './prisma.js'
import { persistError } from './sessionStore.js'

/** @typedef {{ pcmPath: string, wavPath: string, stream: import('node:fs').WriteStream, recordingId: string, sampleRate: number, bytesWritten: number }} OpenRecording */

/** @type {Map<string, { sessionDbId: string, participantDbId: string, source?: OpenRecording, targetTts?: OpenRecording }>} */
const bySocket = new Map()

/** @type {Map<string, number>} sessionDbId -> bytes written this session */
const sessionBytes = new Map()

function recordingsRoot() {
  return config.recordingsDir
}

function relPath(absPath) {
  return relative(process.cwd(), absPath).replace(/\\/g, '/')
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function sessionBytesUsed(sessionDbId) {
  return sessionBytes.get(sessionDbId) ?? 0
}

function addSessionBytes(sessionDbId, n) {
  const next = sessionBytesUsed(sessionDbId) + n
  sessionBytes.set(sessionDbId, next)
  return next
}

function overSessionLimit(sessionDbId) {
  return sessionBytesUsed(sessionDbId) >= config.recordingsMaxBytesPerSession
}

/**
 * @param {{ socketId: string, sessionDbId: string, participantDbId: string }} ctx
 */
export async function openParticipantRecordings(ctx) {
  if (!config.persistEnabled || !config.persistAudio) return

  const baseDir = join(recordingsRoot(), ctx.sessionDbId, ctx.participantDbId)
  ensureDir(baseDir)

  const sourcePcm = join(baseDir, 'source.pcm')
  const sourceWav = join(baseDir, 'source.wav')

  try {
    const prisma = getPrisma()
    const sourceRow = await prisma.audioRecording.create({
      data: {
        sessionId: ctx.sessionDbId,
        participantId: ctx.participantDbId,
        kind: 'source_uplink',
        contentType: 'audio/pcm;encoding=s16le;rate=16000',
        sampleRate: 16000,
        filePath: relPath(sourceWav),
      },
    })

    const targetPcm = join(baseDir, 'target_tts.pcm')
    const targetWav = join(baseDir, 'target_tts.wav')
    const targetRow = await prisma.audioRecording.create({
      data: {
        sessionId: ctx.sessionDbId,
        participantId: ctx.participantDbId,
        kind: 'target_tts',
        contentType: 'audio/pcm;encoding=s16le;rate=24000',
        sampleRate: 24000,
        filePath: relPath(targetWav),
      },
    })

    bySocket.set(ctx.socketId, {
      sessionDbId: ctx.sessionDbId,
      participantDbId: ctx.participantDbId,
      source: {
        pcmPath: sourcePcm,
        wavPath: sourceWav,
        stream: createWriteStream(sourcePcm),
        recordingId: sourceRow.id,
        sampleRate: 16000,
        bytesWritten: 0,
      },
      targetTts: {
        pcmPath: targetPcm,
        wavPath: targetWav,
        stream: createWriteStream(targetPcm),
        recordingId: targetRow.id,
        sampleRate: 24000,
        bytesWritten: 0,
      },
    })
  } catch (err) {
    persistError('openParticipantRecordings', err)
  }
}

/**
 * @param {string} socketId
 * @param {Buffer} chunk
 */
export function appendSourceAudio(socketId, chunk) {
  if (!config.persistEnabled || !config.persistAudio || !chunk.length) return

  const entry = bySocket.get(socketId)
  if (!entry?.source) return
  if (overSessionLimit(entry.sessionDbId)) return

  try {
    entry.source.stream.write(chunk)
    entry.source.bytesWritten += chunk.length
    addSessionBytes(entry.sessionDbId, chunk.length)
  } catch (err) {
    persistError('appendSourceAudio', err)
  }
}

/**
 * @param {string} listenerSocketId partner who hears TTS
 * @param {Buffer[]} packets raw PCM buffers
 */
export function appendTargetTts(listenerSocketId, packets) {
  if (!config.persistEnabled || !config.persistAudio) return

  const entry = bySocket.get(listenerSocketId)
  if (!entry?.targetTts) return
  if (overSessionLimit(entry.sessionDbId)) return

  try {
    for (const packet of packets) {
      if (!packet.length) continue
      entry.targetTts.stream.write(packet)
      entry.targetTts.bytesWritten += packet.length
      addSessionBytes(entry.sessionDbId, packet.length)
    }
  } catch (err) {
    persistError('appendTargetTts', err)
  }
}

/**
 * @param {OpenRecording} rec
 */
async function finalizeRecording(rec, sessionDbId) {
  return new Promise((resolve) => {
    rec.stream.end(async () => {
      try {
        const pcm = existsSync(rec.pcmPath) ? readFileSync(rec.pcmPath) : Buffer.alloc(0)
        if (pcm.length) {
          ensureDir(dirname(rec.wavPath))
          writePcmAsWav(rec.wavPath, pcm, rec.sampleRate)
        }
        try {
          if (existsSync(rec.pcmPath)) unlinkSync(rec.pcmPath)
        } catch {
          // ignore
        }

        const durationMs = Math.round((pcm.length / 2 / rec.sampleRate) * 1000)
        const prisma = getPrisma()
        await prisma.audioRecording.update({
          where: { id: rec.recordingId },
          data: {
            byteLength: pcm.length,
            durationMs,
            finalizedAt: new Date(),
            filePath: relPath(rec.wavPath),
          },
        })
      } catch (err) {
        persistError('finalizeRecording', err)
      }
      resolve()
    })
  })
}

/**
 * @param {string} socketId
 */
export async function closeParticipantRecordings(socketId) {
  if (!config.persistEnabled || !config.persistAudio) return

  const entry = bySocket.get(socketId)
  if (!entry) return
  bySocket.delete(socketId)

  const tasks = []
  if (entry.source) tasks.push(finalizeRecording(entry.source, entry.sessionDbId))
  if (entry.targetTts) tasks.push(finalizeRecording(entry.targetTts, entry.sessionDbId))
  await Promise.all(tasks)

  sessionBytes.delete(entry.sessionDbId)
}

/**
 * Decode base64 strings or buffers to PCM buffers for target_media persistence.
 * @param {unknown[]} packets
 * @returns {Buffer[]}
 */
export function packetsToBuffers(packets) {
  const out = []
  for (const packet of packets) {
    if (Buffer.isBuffer(packet)) {
      out.push(packet)
      continue
    }
    if (packet instanceof Uint8Array) {
      out.push(Buffer.from(packet))
      continue
    }
    if (typeof packet === 'string') {
      out.push(Buffer.from(packet, 'base64'))
    }
  }
  return out
}
