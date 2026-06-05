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

const protectedGets = [
  '/api/auth/me',
  '/api/users',
  '/api/admin/voice-providers',
  '/api/admin/organization/voice-providers',
  '/api/admin/organizations',
  '/api/admin/analytics',
  '/api/history/sessions',
]

for (const path of protectedGets) {
  test(`GET ${path} without a token returns 401`, async () => {
    const { status, body } = await jsonRequest(`${server.baseUrl}${path}`)
    assert.equal(status, 401)
    assert.equal(typeof body.error, 'string')
  })
}

test('GET protected route with a malformed bearer token returns 401', async () => {
  const { status } = await jsonRequest(`${server.baseUrl}/api/auth/me`, {
    headers: { Authorization: 'Bearer not-a-real-token' },
  })
  assert.equal(status, 401)
})
