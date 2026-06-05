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

test('POST /api/sessions creates a session', async () => {
  const { status, body } = await jsonRequest(`${server.baseUrl}/api/sessions`, {
    method: 'POST',
  })
  assert.equal(status, 201)
  assert.equal(typeof body.sessionId, 'string')
  assert.ok(body.sessionId.length > 0)
  assert.equal(typeof body.createdAt, 'number')
})

test('GET /api/sessions/:id returns the in-memory session after creation', async () => {
  const created = await jsonRequest(`${server.baseUrl}/api/sessions`, { method: 'POST' })
  const { status, body } = await jsonRequest(
    `${server.baseUrl}/api/sessions/${created.body.sessionId}`,
  )
  assert.equal(status, 200)
  assert.equal(body.exists, true)
  assert.equal(body.active, true)
  assert.equal(body.participantCount, 0)
})

test('GET /api/sessions/:id returns 404 for unknown session', async () => {
  const { status, body } = await jsonRequest(
    `${server.baseUrl}/api/sessions/does-not-exist-zzz`,
  )
  assert.equal(status, 404)
  assert.equal(body.exists, false)
})

test('GET /api/sessions/:id/invite returns a join URL', async () => {
  const { status, body } = await jsonRequest(
    `${server.baseUrl}/api/sessions/abc-123/invite`,
  )
  assert.equal(status, 200)
  assert.equal(body.sessionId, 'abc-123')
  assert.match(body.inviteUrl, /\/join\/abc-123$/)
})
