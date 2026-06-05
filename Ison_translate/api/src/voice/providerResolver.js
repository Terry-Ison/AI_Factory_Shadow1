import { decryptSecret } from '../utils/secretCrypto.js'
import { getPrisma } from '../persistence/prisma.js'

/**
 * @typedef {{ type: string, apiKey: string, apiUrl: string, providerId: string }} VoiceConfig
 */

/**
 * Resolve voice API credentials for an organization, or fall back to global default.
 * @param {string | null | undefined} organizationId
 * @returns {Promise<VoiceConfig | null>}
 */
export async function resolveVoiceConfig(organizationId) {
  const prisma = getPrisma()

  if (organizationId) {
    const link = await prisma.organizationvoiceprovider.findFirst({
      where: {
        organizationId,
        enabled: true,
        isDefault: true,
        voiceprovider: { isActive: true },
      },
      include: { voiceprovider: true },
    })
    if (link?.voiceprovider) {
      return toVoiceConfig(link.voiceprovider)
    }
  }

  const global = await prisma.voiceprovider.findFirst({
    where: { isGlobalDefault: true, isActive: true },
  })
  if (global) {
    return toVoiceConfig(global)
  }

  return null
}

/**
 * @param {{ id: string, type: string, apiUrl: string, apiKeyCiphertext: string }} provider
 * @returns {VoiceConfig | null}
 */
function toVoiceConfig(provider) {
  if (!provider.apiKeyCiphertext) return null
  try {
    const apiKey = decryptSecret(provider.apiKeyCiphertext)
    if (!apiKey) return null
    return {
      type: provider.type,
      apiKey,
      apiUrl: provider.apiUrl.replace(/\/$/, ''),
      providerId: provider.id,
    }
  } catch {
    return null
  }
}

/**
 * Whether a global default provider exists in the catalog (for health checks).
 * @returns {Promise<boolean>}
 */
export async function hasGlobalDefaultProvider() {
  const prisma = getPrisma()
  const count = await prisma.voiceprovider.count({
    where: { isGlobalDefault: true, isActive: true },
  })
  return count > 0
}
