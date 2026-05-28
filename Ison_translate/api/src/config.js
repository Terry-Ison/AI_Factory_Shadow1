import 'dotenv/config'

function envBool(name, defaultValue) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return defaultValue
  return raw === '1' || raw.toLowerCase() === 'true'
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  deeplAuthKey: process.env.DEEPL_AUTH_KEY || process.env.DEEPL_API_KEY || '',
  deeplApiUrl: (process.env.DEEPL_API_URL || 'https://api.deepl.com').replace(/\/$/, ''),
  socketSecret: process.env.SOCKET_SECRET || '',
  maxAudioBytesPerSec: Number(process.env.MAX_AUDIO_BYTES_PER_SEC) || 160_000,
  sessionIdleMaxAgeMs: Number(process.env.SESSION_IDLE_MAX_AGE_MS) || 3_600_000,
  sessionCleanupIntervalMs: Number(process.env.SESSION_CLEANUP_INTERVAL_MS) || 300_000,
  databaseUrl: process.env.DATABASE_URL || '',
  persistEnabled: envBool('PERSIST_ENABLED', true),
  persistAudio: envBool('PERSIST_AUDIO', true),
  recordingsDir: process.env.RECORDINGS_DIR || './storage/recordings',
  recordingsMaxBytesPerSession:
    Number(process.env.RECORDINGS_MAX_BYTES_PER_SESSION) || 104_857_600,
  historyApiKey: process.env.HISTORY_API_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
}

export function assertDeepLConfigured() {
  if (!config.deeplAuthKey) {
    throw new Error('DEEPL_AUTH_KEY is not set. Add it to api/.env')
  }
}
