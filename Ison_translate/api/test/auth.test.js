import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { startTestServer, jsonRequest } from './helpers.js'

let server

before(async () => {
  server = await startTestServer()
})

after(async () => {
  await server.close()
})

test('POST /api/auth/register rejects missing email', async () => {
  const { status, body } = await jsonRequest(`${server.baseUrl}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ password: 'longenough1', displayName: 'X' }),
  })
  assert.equal(status, 400)
  assert.match(body.error, /email/i)
})

test('POST /api/auth/register rejects short password', async () => {
  const { status, body } = await jsonRequest(`${server.baseUrl}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ email: 'a@b.com', password: 'short', displayName: 'X' }),
  })
  assert.equal(status, 400)
  assert.match(body.error, /password/i)
})

test('POST /api/auth/register rejects both org slug and invite code', async () => {
  const { status, body } = await jsonRequest(`${server.baseUrl}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'a@b.com',
      password: 'longenough1',
      displayName: 'X',
      organizationSlug: 'acme',
      inviteCode: 'xyz',
    }),
  })
  assert.equal(status, 400)
  assert.match(body.error, /slug or inviteCode|not both/i)
})

test('POST /api/auth/login rejects missing credentials', async () => {
  const { status, body } = await jsonRequest(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'a@b.com' }),
  })
  assert.equal(status, 400)
  assert.match(body.error, /required/i)
})
