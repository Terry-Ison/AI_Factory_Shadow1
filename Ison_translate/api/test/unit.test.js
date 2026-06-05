import { test } from 'node:test'
import assert from 'node:assert/strict'
import { signToken, verifyToken, buildAuthUser } from '../src/auth/jwt.js'
import { hashPassword, verifyPassword } from '../src/auth/password.js'
import { encryptSecret, decryptSecret } from '../src/utils/secretCrypto.js'
import {
  createSession,
  getSessionSnapshot,
  normalizeLang,
  normalizeSessionId,
} from '../src/rooms/sessionManager.js'

test('jwt sign/verify round-trips claims', () => {
  const token = signToken({
    id: 'u1',
    email: 'a@b.com',
    displayName: 'Jane',
    globalRole: 'super_admin',
    orgId: 'o1',
    orgRole: 'tenant_admin',
    membershipStatus: 'active',
  })
  const claims = verifyToken(token)
  assert.equal(claims.sub, 'u1')
  assert.equal(claims.email, 'a@b.com')
  assert.equal(claims.globalRole, 'super_admin')
  assert.equal(claims.orgId, 'o1')
})

test('verifyToken returns null for a bad token', () => {
  assert.equal(verifyToken('garbage'), null)
})

test('buildAuthUser normalizes optional fields to null', () => {
  const user = buildAuthUser({ id: 'u1', email: 'a@b.com', displayName: 'Jane' })
  assert.equal(user.globalRole, null)
  assert.equal(user.orgId, null)
  assert.equal(user.orgRole, null)
  assert.equal(user.membershipStatus, null)
})

test('password hash verifies correctly and rejects wrong password', async () => {
  const hash = await hashPassword('correct-horse')
  assert.notEqual(hash, 'correct-horse')
  assert.equal(await verifyPassword('correct-horse', hash), true)
  assert.equal(await verifyPassword('wrong', hash), false)
})

test('secret encrypt/decrypt round-trips', () => {
  const plaintext = 'super-secret-deepl-key-123'
  const encoded = encryptSecret(plaintext)
  assert.notEqual(encoded, plaintext)
  assert.equal(decryptSecret(encoded), plaintext)
})

test('normalizeSessionId trims and lowercases', () => {
  assert.equal(normalizeSessionId('  ABC-123 '), 'abc-123')
  assert.equal(normalizeSessionId(undefined), '')
})

test('normalizeLang strips region and lowercases', () => {
  assert.equal(normalizeLang('EN-US'), 'en')
  assert.equal(normalizeLang('pt_BR'), 'pt')
  assert.equal(normalizeLang(undefined), 'en')
})

test('createSession registers a retrievable in-memory session', () => {
  const { sessionId } = createSession()
  const snapshot = getSessionSnapshot(sessionId)
  assert.ok(snapshot)
  assert.equal(snapshot.participantCount, 0)
})
