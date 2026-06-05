<<<<<<< Updated upstream
=======
import { config } from '../config.js'
>>>>>>> Stashed changes
import { decryptSecret } from '../utils/secretCrypto.js'
import { getPrisma } from '../persistence/prisma.js'

/**
<<<<<<< Updated upstream
 * @typedef {{ type: string, apiKey: string, apiUrl: string, providerId: string }} VoiceConfig
 */

/**
 * Resolve voice API credentials for an organization, or fall back to global default.
=======
 * @typedef {{ type: string, apiKey: string, apiUrl: string, providerId?: string }} VoiceConfig
 */

/**
 * Resolve voice API credentials for an organization, or fall back to env.
>>>>>>> Stashed changes
 * @param {string | null | undefined} organizationId
 * @returns {Promise<VoiceConfig | null>}
 */
export async function resolveVoiceConfig(organizationId) {
<<<<<<< Updated upstream
  const prisma = getPrisma()

  if (organizationId) {
    const link = await prisma.organizationvoiceprovider.findFirst({
=======
  if (organizationId) {
    const prisma = getPrisma()
    const link = await prisma.organizationVoiceProvider.findFirst({
>>>>>>> Stashed changes
      where: {
        organizationId,
        enabled: true,
        isDefault: true,
<<<<<<< Updated upstream
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
=======
        voiceProvider: { isActive: true },
      },
      include: { voiceProvider: true },
    })
    if (link?.voiceProvider) {
      const vp = link.voiceProvider
      return {
        type: vp.type,
        apiKey: decryptSecret(vp.apiKeyCiphertext),
        apiUrl: vp.apiUrl.replace(/\/$/, ''),
        providerId: vp.id,
      }
    }
  }

  if (config.deeplAuthKey) {
    return {
      type: 'deepl',
      apiKey: config.deeplAuthKey,
      apiUrl: config.deeplApiUrl,
    }
>>>>>>> Stashed changes
  }

  return null
}

/**
<<<<<<< Updated upstream
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
=======
 * @param {VoiceConfig | null} voiceConfig
 */
export function assertVoiceConfigured(voiceConfig) {
  if (!voiceConfig?.apiKey) {
    throw new Error('No voice provider configured for this organization')
  }
}
>>>>>>> Stashed changes
