import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  createOrgUser,
  deleteOrgUser,
  fetchOrgUsers,
  updateOrgUserStatus,
  type OrgUser,
} from '../../lib/usersApi'

const STATUSES = ['pending', 'active', 'suspended', 'rejected'] as const

export function TenantAdminUsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState<OrgUser[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [addRole, setAddRole] = useState<OrgUser['orgRole']>('member')

  async function load() {
    if (!token) return
    setLoading(true)
    try {
      const data = await fetchOrgUsers(token)
      setUsers(data.users)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [token])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    try {
      await createOrgUser(token, { email, password, displayName, orgRole: addRole })
      setEmail('')
      setPassword('')
      setDisplayName('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  async function setStatus(id: string, status: OrgUser['status']) {
    if (!token) return
    try {
      await updateOrgUserStatus(token, id, status)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  async function handleRemove(id: string) {
    if (!token || !confirm('Remove this user from the organization?')) return
    try {
      await deleteOrgUser(token, id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
      <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>Users</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
        Manage members in your organization.
      </p>

      {error && <Banner type="error">{error}</Banner>}

      <form onSubmit={handleCreate} className="mb-8 grid gap-3 rounded-xl p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-center" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        <input className="md-field-input" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <input className="md-field-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="md-field-input" type="password" placeholder="Password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <select className="md-field-input" value={addRole} onChange={(e) => setAddRole(e.target.value as OrgUser['orgRole'])} aria-label="Role">
          <option value="member">Member</option>
          <option value="tenant_admin">Tenant admin</option>
        </select>
        <button type="submit" className="md-btn md-btn-filled shrink-0 self-center">Add user</button>
      </form>

      {loading ? (
        <p style={{ color: 'var(--md-on-surface-variant)' }}>Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--md-outline-variant)' }}>
          <table className="w-full text-left text-sm">
            <thead style={{ background: 'var(--md-surface-container)' }}>
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--md-outline-variant)' }}>
                  <td className="px-4 py-3">{u.displayName}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.orgRole}</td>
                  <td className="px-4 py-3">
                    <select
                      className="md-field-input"
                      value={u.status}
                      onChange={(e) => void setStatus(u.id, e.target.value as OrgUser['status'])}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" className="md-btn md-btn-text" onClick={() => void handleRemove(u.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Banner({ type, children }: { type: 'error'; children: React.ReactNode }) {
  return (
    <div
      className="mb-4 px-3 py-2 text-sm"
      style={{
        background: type === 'error' ? 'var(--md-error-container)' : undefined,
        color: type === 'error' ? 'var(--md-on-error-container)' : undefined,
        borderRadius: 'var(--shape-sm)',
      }}
    >
      {children}
    </div>
  )
}
