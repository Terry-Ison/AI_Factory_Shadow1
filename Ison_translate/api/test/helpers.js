import { createServer } from 'node:http'
import { createApp } from '../src/app.js'

/**
 * Start the API on an ephemeral port for integration tests.
 * @returns {Promise<{ baseUrl: string, close: () => Promise<void> }>}
 */
export async function startTestServer() {
  const app = createApp()
  const server = createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  }
}

/**
 * Helper around fetch returning { status, body }.
 * @param {string} url
 * @param {RequestInit} [options]
 */
export async function jsonRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  let body = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }
  return { status: res.status, body }
}
