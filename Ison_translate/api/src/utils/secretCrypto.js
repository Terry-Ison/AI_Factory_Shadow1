import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { config } from '../config.js'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function deriveKey() {
  const raw = config.encryptionKey || config.jwtSecret
  return createHash('sha256').update(raw).digest()
}

<<<<<<< Updated upstream
=======
/**
 * @param {string} plaintext
 * @returns {string} base64 iv:tag:ciphertext
 */
>>>>>>> Stashed changes
export function encryptSecret(plaintext) {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, deriveKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

<<<<<<< Updated upstream
=======
/**
 * @param {string} encoded
 * @returns {string}
 */
>>>>>>> Stashed changes
export function decryptSecret(encoded) {
  const buf = Buffer.from(encoded, 'base64')
  const iv = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + 16)
<<<<<<< Updated upstream
  const data = buf.subarray(IV_LENGTH + 16)
  const decipher = createDecipheriv(ALGORITHM, deriveKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
=======
  const ciphertext = buf.subarray(IV_LENGTH + 16)
  const decipher = createDecipheriv(ALGORITHM, deriveKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
>>>>>>> Stashed changes
}
