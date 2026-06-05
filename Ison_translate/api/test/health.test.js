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

test('GET /health returns liveness payload', async () => {
  const { status, body } = await jsonRequest(`${server.baseUrl}/health`)
  assert.equal(status, 200)
  assert.equal(body.ok, true)
  assert.equal(typeof body.databaseConfigured, 'boolean')
  assert.equal(typeof body.deeplConfigured, 'boolean')
})

test('GET /admin/health includes activeSessions count', async () => {
  const { status, body } = await jsonRequest(`${server.baseUrl}/admin/health`)
  assert.equal(status, 200)
  assert.equal(body.ok, true)
  assert.equal(typeof body.activeSessions, 'number')
})
