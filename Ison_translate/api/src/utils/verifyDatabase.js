import { config } from '../config.js'
import { getPrisma } from '../persistence/prisma.js'

/** @type {{ checked: boolean, ok: boolean, error: string | null }} */
let cached = { checked: false, ok: false, error: null }

/**
 * Verifies MySQL connectivity via Prisma ($queryRaw SELECT 1).
 *
 * @returns {Promise<{ checked: boolean, ok: boolean, error: string | null }>}
 */
export async function verifyDatabaseConnection() {
  if (!config.databaseUrl) {
    cached = {
      checked: true,
      ok: false,
      error: 'DATABASE_URL is not set in api/.env',
    }
    return cached
  }

  try {
    const prisma = getPrisma()
    await prisma.$queryRaw`SELECT 1`
    cached = { checked: true, ok: true, error: null }
    return cached
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database connection failed'
    cached = { checked: true, ok: false, error: message }
    return cached
  }
}

/** Synchronous read of the last database verification result. */
export function getDatabaseStatus() {
  return cached
}
