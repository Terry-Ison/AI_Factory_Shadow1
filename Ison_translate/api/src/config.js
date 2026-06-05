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
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || '',
  clientOriginPrimary: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')[0]
    .trim(),
}
