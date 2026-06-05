/**
 * Manual test: super-admin adds user to org and promotes to tenant_admin.
 * Run: node scripts/test-org-members.mjs
 */
const BASE = 'http://localhost:3001'
const SA = { email: 'superadmin@example.com', password: 'SuperAdmin123!' }
const TARGET_EMAIL = 'terry@mail.com'

async function req(method, path, { body, token, expect } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const init = { method, headers, signal: AbortSignal.timeout(15000) }
  if (body) init.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, init)
  const data = await res.json().catch(() => ({}))
  const ok = expect ? res.status === expect : res.status >= 200 && res.status < 300
  console.log(ok ? 'PASS' : 'FAIL', res.status, method, path)
  if (!ok) console.log('   ', JSON.stringify(data))
  return { status: res.status, data, ok }
}

const login = await req('POST', '/api/auth/login', { body: SA, expect: 200 })
const token = login.data.token
if (!token) {
  console.error('Super-admin login failed')
  process.exit(1)
}

const orgs = await req('GET', '/api/admin/organizations?limit=1', { token, expect: 200 })
const org = orgs.data.organizations?.[0]
if (!org) {
  console.error('No organization found')
  process.exit(1)
}
console.log(`Org: ${org.name} (${org.id})`)

const before = await req('GET', `/api/admin/organizations/${org.id}/members`, { token, expect: 200 })
const beforeMember = before.data.members?.find((m) => m.email === TARGET_EMAIL)
console.log(
  'Before:',
  beforeMember ? `${beforeMember.orgRole}/${beforeMember.status}` : 'not a member',
)

let addStatus = 201
if (beforeMember && beforeMember.status !== 'rejected') addStatus = 409

const add = await req('POST', `/api/admin/organizations/${org.id}/members`, {
  token,
  body: { email: TARGET_EMAIL, orgRole: 'member', status: 'active' },
  expect: addStatus,
})
if (add.ok) {
  console.log('Added:', add.data.member?.orgRole, add.data.member?.status)
} else if (add.status === 409) {
  console.log('Already a member — proceeding to role update')
}

const users = await req('GET', '/api/users?limit=50', { token, expect: 200 })
const target = users.data.users?.find((u) => u.email === TARGET_EMAIL)
if (!target) {
  console.error('Target user not found in user list')
  process.exit(1)
}

const promote = await req('PATCH', `/api/admin/organizations/${org.id}/members/${target.id}`, {
  token,
  body: { orgRole: 'tenant_admin' },
  expect: 200,
})
console.log('Promoted:', promote.data.member?.orgRole, promote.data.member?.status)

const after = await req('GET', `/api/admin/organizations/${org.id}/members`, { token, expect: 200 })
const afterMember = after.data.members?.find((m) => m.userId === target.id)
console.log('After:', afterMember?.orgRole, afterMember?.status)

if (afterMember?.orgRole !== 'tenant_admin' || afterMember?.status !== 'active') {
  console.error('Promotion verification failed')
  process.exit(1)
}

console.log('\nAll checks passed: user added/linked and promoted to tenant_admin.')
