/**
 * One-time bootstrap: migrate DEEPL_AUTH_KEY from .env into the voice provider catalog.
 *
 * Usage (from api/):
 *   node scripts/migrate-env-deepl-to-db.mjs
 *
 * Requires DATABASE_URL and ENCRYPTION_KEY in api/.env.
 * After success, remove DEEPL_AUTH_KEY / DEEPL_API_KEY from .env.
 */
import 'dotenv/config'
import { randomUUID } from 'crypto'
import { PrismaClient } from '@prisma/client'
import { encryptSecret } from '../src/utils/secretCrypto.js'

const apiKey = process.env.DEEPL_AUTH_KEY || process.env.DEEPL_API_KEY || ''
const apiUrl = (process.env.DEEPL_API_URL || 'https://api.deepl.com').replace(/\/$/, '')

if (!apiKey) {
  console.error('No DEEPL_AUTH_KEY or DEEPL_API_KEY in environment. Nothing to migrate.')
  process.exit(1)
}

if (!process.env.ENCRYPTION_KEY) {
  console.error('ENCRYPTION_KEY is required to store the provider key.')
  process.exit(1)
}

const prisma = new PrismaClient()

try {
  const existing = await prisma.voiceprovider.findFirst({
    where: { isGlobalDefault: true },
  })
  if (existing) {
    console.log(`Global default already set: ${existing.name} (${existing.id})`)
    process.exit(0)
  }

  await prisma.$transaction(async (tx) => {
    await tx.voiceprovider.updateMany({ data: { isGlobalDefault: false } })
    const provider = await tx.voiceprovider.create({
      data: {
        id: randomUUID(),
        name: 'DeepL (migrated from .env)',
        type: 'deepl',
        apiUrl,
        apiKeyCiphertext: encryptSecret(apiKey),
        isActive: true,
        isGlobalDefault: true,
        updatedAt: new Date(),
      },
    })
    console.log(`Created global default provider: ${provider.name} (${provider.id})`)
  })

  console.log('Migration complete. Remove DEEPL_AUTH_KEY from api/.env and restart the API.')
} finally {
  await prisma.$disconnect()
}
