/**
 * Ison Translate — REST API endpoint integration tests
 * Run: node test-endpoints.js
 */
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = 'http://localhost:3001'

const SA = { email: 'superadmin@example.com', password: 'SuperAdmin123!' }
const ORG_SLUG = `test-org-${Date.now()}`
const TA_EMAIL = `ta-${Date.now()}@test.com`
const TA_PASS  = 'TAdmin123!'
const MBR_EMAIL = `mbr-${Date.now()}@test.com`
const MBR_PASS  = 'Member123!'

let pass = 0
let fail = 0
const failed = []

async function req(method, path, { body, token, expect: expected = 200, label } = {}) {
  const name = label || `${method} ${path}`
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const init = { method, headers, signal: AbortSignal.timeout(20_000) }
  if (body) init.body = JSON.stringify(body)
  try {
    const r = await fetch(`${BASE}${path}`, init)
    const data = await r.json().catch(() => ({}))
    const ok = r.status === expected
    const icon = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'
    console.log(`  ${icon} [${r.status}] ${method.padEnd(6)} ${path}`)
    if (!ok) {
      console.log(`      expected ${expected} — body: ${JSON.stringify(data).slice(0, 200)}`)
      failed.push({ name, got: r.status, expected, body: data })
    }
    if (ok) pass++; else fail++
    return { status: r.status, data, ok }
  } catch (err) {
    const code = err.cause?.code || err.code || err.message
    console.log(`  \x1b[31m✗\x1b[0m [ERR] ${method.padEnd(6)} ${path}  → ${code}`)
    failed.push({ name, got: 'ERR', expected, error: code })
    fail++
    return { status: 0, data: {}, ok: false }
  }
}

async function run() {
  console.log('\n\x1b[1m═══════════════════════════════════════════════\x1b[0m')
  console.log('\x1b[1m  Ison Translate — API Endpoint Test Suite\x1b[0m')
  console.log('\x1b[1m═══════════════════════════════════════════════\x1b[0m\n')

  // ──────────────────────────────────────────────────
  console.log('\x1b[1m◆ Health\x1b[0m')
  await req('GET', '/health')
  await sleep(200)
  await req('GET', '/admin/health')

  // ──────────────────────────────────────────────────
  console.log('\n\x1b[1m◆ Sessions\x1b[0m')
  const { data: sessData } = await req('POST', '/api/sessions', { expect: 201 })
  const sessionId = sessData.sessionId
  console.log(`    sessionId: ${sessionId}`)
  await sleep(200)
  await req('GET', `/api/sessions/${sessionId}`)
  await sleep(200)
  await req('GET', `/api/sessions/${sessionId}/invite`)
  await sleep(200)
  await req('GET', '/api/sessions/nonexistent-uuid-zzz', { expect: 404 })

  // ──────────────────────────────────────────────────
  console.log('\n\x1b[1m◆ Languages\x1b[0m')
  await sleep(200)
  await req('GET', '/api/languages')

  // ──────────────────────────────────────────────────
  console.log('\n\x1b[1m◆ Auth\x1b[0m')
  await sleep(200)
  await req('POST', '/api/auth/register', { body: { email: 'bad' }, expect: 400, label: 'register: missing password' })
  await sleep(200)
  await req('POST', '/api/auth/register', { body: { email: 'x@x.com', password: 'short' }, expect: 400, label: 'register: short password' })
  await sleep(200)
  await req('POST', '/api/auth/login', { body: { email: SA.email, password: 'wrong' }, expect: 401, label: 'login: bad password' })
  await sleep(200)
  await req('GET', '/api/auth/me', { expect: 401, label: 'GET /me: no token' })

  // Super-admin login
  await sleep(200)
  const saLogin = await req('POST', '/api/auth/login', { body: SA, label: 'login: super_admin' })
  const saToken = saLogin.data.token
  console.log(`    globalRole: ${saLogin.data.user?.globalRole}`)

  await sleep(200)
  await req('GET', '/api/auth/me', { token: saToken, label: 'GET /me: authenticated' })
  await sleep(200)
  await req('PATCH', '/api/auth/me/languages', {
    token: saToken,
    body: { defaultSourceLang: 'en', defaultTargetLang: 'de' },
    label: 'PATCH /me/languages',
  })

  // ──────────────────────────────────────────────────
  console.log('\n\x1b[1m◆ Super-admin — Organizations\x1b[0m')
  await sleep(200)
  await req('GET', '/api/admin/organizations', { expect: 401, label: 'org list: no auth' })
  await sleep(200)
  await req('GET', '/api/admin/organizations', { token: 'badtoken', expect: 401, label: 'org list: bad token' })

  await sleep(200)
  const orgCreate = await req('POST', '/api/admin/organizations', {
    token: saToken,
    body: { name: 'Test Org', slug: ORG_SLUG },
    expect: 201,
    label: 'org create',
  })
  const orgId = orgCreate.data.organization?.id
  const orgInviteCode = orgCreate.data.organization?.inviteCode
  console.log(`    org id: ${orgId}  invite: ${orgInviteCode}`)

  await sleep(200)
  await req('GET', '/api/admin/organizations', { token: saToken, label: 'org list' })
  await sleep(200)
  await req('PATCH', `/api/admin/organizations/${orgId}`, {
    token: saToken, body: { name: 'Test Org Renamed' }, label: 'org rename',
  })
  await sleep(200)
  const rotated = await req('PATCH', `/api/admin/organizations/${orgId}`, {
    token: saToken, body: { rotateInviteCode: true }, label: 'org rotate invite',
  })
  const newInvite = rotated.data.organization?.inviteCode
  console.log(`    new invite: ${newInvite}`)

  await sleep(200)
  await req('PATCH', '/api/admin/organizations/nonexistent', {
    token: saToken, body: { isActive: false }, expect: 404, label: 'org patch: not found',
  })

  // Create org with inline tenant admin
  await sleep(200)
  const org2Create = await req('POST', '/api/admin/organizations', {
    token: saToken,
    body: {
      name: 'Org With Admin',
      slug: `with-admin-${Date.now()}`,
      tenantAdminEmail: TA_EMAIL,
      tenantAdminPassword: TA_PASS,
      tenantAdminDisplayName: 'Tenant Admin',
    },
    expect: 201,
    label: 'org create with tenant admin',
  })
  const org2Id = org2Create.data.organization?.id
  console.log(`    org2 id: ${org2Id}`)

  // ──────────────────────────────────────────────────
  console.log('\n\x1b[1m◆ Super-admin — Voice Providers\x1b[0m')
  await sleep(200)
  await req('GET', '/api/admin/voice-providers', { expect: 401, label: 'vp list: no auth' })
  await sleep(200)
  await req('GET', '/api/admin/voice-providers', { token: saToken, label: 'vp list' })

  await sleep(200)
  const vpCreate = await req('POST', '/api/admin/voice-providers', {
    token: saToken,
    body: { name: 'DeepL Test', type: 'deepl', apiUrl: 'https://api.deepl.com', apiKey: 'test-key-value' },
    expect: 201,
    label: 'vp create',
  })
  const vpId = vpCreate.data.provider?.id
  console.log(`    provider id: ${vpId}  hasApiKey: ${vpCreate.data.provider?.hasApiKey}`)

  // apiKey must NOT appear in response
  if ('apiKey' in (vpCreate.data.provider ?? {})) {
    console.log('  \x1b[31m✗\x1b[0m  apiKey leaked in voice-provider response!')
    failed.push({ name: 'vp secret masking', got: 'apiKey exposed', expected: 'hasApiKey only' })
    fail++
  } else {
    console.log('  \x1b[32m✓\x1b[0m  apiKey is masked (hasApiKey flag only)')
    pass++
  }

  await sleep(200)
  await req('PUT', `/api/admin/voice-providers/${vpId}`, {
    token: saToken, body: { name: 'DeepL Updated', isActive: true }, label: 'vp update',
  })
  await sleep(200)
  await req('PUT', '/api/admin/voice-providers/nonexistent', {
    token: saToken, body: { name: 'x' }, expect: 404, label: 'vp update: not found',
  })

  // Tenant admin should be forbidden from super-admin routes
  await sleep(200)
  const taLogin = await req('POST', '/api/auth/login', {
    body: { email: TA_EMAIL, password: TA_PASS }, label: 'login: tenant admin',
  })
  const taToken = taLogin.data.token
  console.log(`    ta orgRole: ${taLogin.data.user?.orgRole}  status: ${taLogin.data.user?.membershipStatus}`)

  await sleep(200)
  await req('GET', '/api/admin/voice-providers', { token: taToken, expect: 403, label: 'vp list: tenant admin forbidden' })
  await sleep(200)
  await req('GET', '/api/admin/organizations', { token: taToken, expect: 403, label: 'org list: tenant admin forbidden' })

  // ──────────────────────────────────────────────────
  console.log('\n\x1b[1m◆ Tenant Admin — Users\x1b[0m')
  await sleep(200)
  await req('GET', '/api/users', { expect: 401, label: 'users list: no auth' })
  await sleep(200)
  await req('GET', '/api/users', { token: saToken, label: 'users list: super-admin (all users)' })
  const saMe = await req('GET', '/api/auth/me', { token: saToken, label: 'me for super-admin id' })
  const saUserId = saMe.data.user?.id
  if (saUserId) {
    await req('GET', `/api/users/${saUserId}`, { token: saToken, label: 'users get by id: super-admin' })
  }

  await sleep(200)
  await req('GET', '/api/users', { token: taToken, label: 'users list: tenant admin' })

  // Register self-serve member via invite
  await sleep(200)
  const mbrRegister = await req('POST', '/api/auth/register', {
    body: { email: MBR_EMAIL, password: MBR_PASS, displayName: 'Test Member', inviteCode: newInvite },
    expect: 201, label: 'register: member via invite code',
  })
  console.log(`    member status: ${mbrRegister.data.user?.membershipStatus}  orgId: ${mbrRegister.data.user?.orgId}`)

  // Register via org slug to org2
  await sleep(200)
  const mbrSlug = await req('POST', '/api/auth/register', {
    body: { email: `slug-${Date.now()}@test.com`, password: 'Member123!', displayName: 'Slug Member', organizationSlug: `with-admin-${Date.now() - 1000}` },
    expect: 400, label: 'register: invalid org slug → 400',
  })

  // Create member via admin
  await sleep(200)
  const newUser = await req('POST', '/api/users', {
    token: taToken, body: { email: MBR_EMAIL + '2', password: MBR_PASS, displayName: 'Admin Created' },
    expect: 201, label: 'users create: by tenant admin',
  })
  const newUserId = newUser.data.user?.id
  console.log(`    created user id: ${newUserId}`)

  await sleep(200)
  await req('GET', `/api/users/${newUserId}`, { token: taToken, label: 'users get by id' })
  await sleep(200)
  await req('GET', '/api/users?status=active', { token: taToken, label: 'users list: filter by status' })

  await sleep(200)
  await req('PUT', `/api/users/${newUserId}/status`, {
    token: taToken, body: { status: 'suspended' }, label: 'users suspend',
  })
  await sleep(200)
  await req('PUT', `/api/users/${newUserId}/status`, {
    token: taToken, body: { status: 'active' }, label: 'users reactivate',
  })
  await sleep(200)
  await req('PUT', `/api/users/${newUserId}/status`, {
    token: taToken, body: { status: 'INVALID' }, expect: 400, label: 'users set invalid status',
  })
  await sleep(200)
  await req('PUT', '/api/users/nonexistent/status', {
    token: taToken, body: { status: 'active' }, expect: 404, label: 'users status: not in org',
  })

  await sleep(200)
  await req('DELETE', `/api/users/${newUserId}`, { token: taToken, label: 'users delete (soft)' })
  await sleep(200)
  await req('DELETE', '/api/users/nonexistent', { token: taToken, expect: 404, label: 'users delete: not found' })

  // Duplicate email
  await sleep(200)
  await req('POST', '/api/users', {
    token: taToken, body: { email: MBR_EMAIL + '2', password: MBR_PASS, displayName: 'Dup' },
    expect: 409, label: 'users create: duplicate email existing user → 409 merge (already in org)',
  })

  // ──────────────────────────────────────────────────
  console.log('\n\x1b[1m◆ Tenant Admin — Org Voice Providers\x1b[0m')
  await sleep(200)
  await req('GET', '/api/admin/organization/voice-providers', { expect: 401, label: 'org-vp list: no auth' })
  await sleep(200)
  await req('GET', '/api/admin/organization/voice-providers', { token: taToken, label: 'org-vp list' })

  await sleep(200)
  await req('PUT', '/api/admin/organization/voice-providers', {
    token: taToken,
    body: { providers: [{ voiceProviderId: vpId, enabled: true, isDefault: true }] },
    label: 'org-vp assign with default',
  })
  await sleep(200)
  await req('PUT', '/api/admin/organization/voice-providers', {
    token: taToken,
    body: { providers: [{ voiceProviderId: vpId, enabled: true, isDefault: false }] },
    expect: 400, label: 'org-vp: no default → 400',
  })
  await sleep(200)
  await req('PUT', '/api/admin/organization/voice-providers', {
    token: taToken, body: {}, expect: 400, label: 'org-vp: missing providers array → 400',
  })

  // ──────────────────────────────────────────────────
  console.log('\n\x1b[1m◆ Tenant Admin — Analytics\x1b[0m')
  await sleep(200)
  await req('GET', '/api/admin/analytics', { expect: 401, label: 'analytics: no auth' })
  await sleep(200)
  await req('GET', '/api/admin/analytics', { token: saToken, expect: 403, label: 'analytics: super-admin no org → 403' })
  await sleep(200)
  const analytics = await req('GET', '/api/admin/analytics', { token: taToken, label: 'analytics: last 30 days' })
  console.log(`    sessions: ${analytics.data.sessionCount}  members: ${analytics.data.activeMembers}`)
  await sleep(200)
  await req('GET', '/api/admin/analytics?from=2025-01-01&to=2025-12-31', { token: taToken, label: 'analytics: custom date range' })

  // ──────────────────────────────────────────────────
  console.log('\n\x1b[1m◆ History\x1b[0m')
  await sleep(200)
  await req('GET', '/api/history/sessions', { expect: 401, label: 'history: no auth' })
  await sleep(200)
  await req('GET', '/api/history/sessions', { token: saToken, label: 'history: super-admin list (no org sessions)' })
  await sleep(200)
  await req('GET', '/api/history/sessions?page=1&limit=5', { token: saToken, label: 'history: paginated' })
  await sleep(200)
  await req('GET', `/api/history/sessions/${sessionId}`, { token: saToken, expect: 404, label: 'history: session not owned → 404' })

  // Self-service member with pending status cannot access history
  await sleep(200)
  const mbrLogin = await req('POST', '/api/auth/login', {
    body: { email: MBR_EMAIL, password: MBR_PASS }, label: 'login: pending member',
  })
  const mbrToken = mbrLogin.data.token
  console.log(`    member status: ${mbrLogin.data.user?.membershipStatus}`)
  await sleep(200)
  await req('GET', '/api/history/sessions', { token: mbrToken, expect: 403, label: 'history: pending member blocked' })

  // ──────────────────────────────────────────────────
  console.log('\n\x1b[1m◆ Voice Provider Delete\x1b[0m')
  await sleep(200)
  const delResult = await req('DELETE', `/api/admin/voice-providers/${vpId}`, {
    token: saToken, label: 'vp delete (in use by org → deactivate)',
  })
  console.log(`    deactivated: ${delResult.data.deactivated}`)
  await sleep(200)
  await req('DELETE', '/api/admin/voice-providers/nonexistent', {
    token: saToken, expect: 404, label: 'vp delete: not found',
  })

  // ──────────────────────────────────────────────────
  const total = pass + fail
  console.log('\n' + '─'.repeat(50))
  console.log(`\x1b[1mResults: \x1b[32m${pass} passed\x1b[0m  \x1b[31m${fail} failed\x1b[0m  of ${total} total\x1b[0m`)

  if (failed.length) {
    console.log('\n\x1b[31mFailed:\x1b[0m')
    failed.forEach((f) => {
      console.log(`  • ${f.name}  [got ${f.got}, expected ${f.expected}]`)
      if (f.error) console.log(`    error: ${f.error}`)
      if (f.body) console.log(`    body: ${JSON.stringify(f.body).slice(0, 200)}`)
    })
  }

  process.exit(fail > 0 ? 1 : 0)
}

run().catch((err) => { console.error(err); process.exit(1) })
