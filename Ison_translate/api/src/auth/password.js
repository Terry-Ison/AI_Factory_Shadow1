import bcrypt from 'bcrypt'

const ROUNDS = 12

/** @param {string} plaintext */
export function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, ROUNDS)
}

/**
 * @param {string} plaintext
 * @param {string} hash
 */
export function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash)
}
