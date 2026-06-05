import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  createOrgUser,
  deleteOrgUser,
  fetchOrgUsers,
  updateOrgUserStatus,
  type OrgUser,
} from '../../lib/usersApi'

<<<<<<< Updated upstream
const STATUSES = ['pending', 'active', 'suspended', 'rejected'] as const

=======
>>>>>>> Stashed changes
export function TenantAdminUsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState<OrgUser[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
<<<<<<< Updated upstream
  const [addRole, setAddRole] = useState<OrgUser['orgRole']>('member')
=======
>>>>>>> Stashed changes

  async function load() {
    if (!token) return
    setLoading(true)
    try {
      const data = await fetchOrgUsers(token)
      setUsers(data.users)
<<<<<<< Updated upstream
      setError('')
=======
>>>>>>> Stashed changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

<<<<<<< Updated upstream
  useEffect(() => { void load() }, [token])
=======
  useEffect(() => {
    void load()
  }, [token])
>>>>>>> Stashed changes

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
<<<<<<< Updated upstream
    try {
      await createOrgUser(token, { email, password, displayName, orgRole: addRole })
=======
    setError('')
    try {
      await createOrgUser(token, { email, password, displayName })
>>>>>>> Stashed changes
      setEmail('')
      setPassword('')
      setDisplayName('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

<<<<<<< Updated upstream
  async function setStatus(id: string, status: OrgUser['status']) {
    if (!token) return
    try {
      await updateOrgUserStatus(token, id, status)
=======
  async function setStatus(userId: string, status: string) {
    if (!token) return
    try {
      await updateOrgUserStatus(token, userId, status)
>>>>>>> Stashed changes
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

<<<<<<< Updated upstream
  async function handleRemove(id: string) {
    if (!token || !confirm('Remove this user from the organization?')) return
    try {
      await deleteOrgUser(token, id)
=======
  async function removeUser(userId: string) {
    if (!token) return
    try {
      await deleteOrgUser(token, userId)
>>>>>>> Stashed changes
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
<<<<<<< Updated upstream
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
=======
      <h1 className="text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>
        Organization users
      </h1>
      {error && <p className="mt-2 text-sm" style={{ color: 'var(--md-error)' }}>{error}</p>}

      <form onSubmit={handleCreate} className="mt-6 grid max-w-xl gap-3">
        <h2 className="text-sm font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
          Create user
        </h2>
        <input className="md-field-input" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <input className="md-field-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="md-field-input" type="password" placeholder="Password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <button type="submit" className="md-btn md-btn-filled w-fit">Add user</button>
      </form>

      <div className="mt-8">
        {loading ? (
          <p style={{ color: 'var(--md-on-surface-variant)' }}>Loading…</p>
        ) : (
          <table className="w-full max-w-4xl text-sm">
            <thead>
              <tr style={{ color: 'var(--md-on-surface-variant)', textAlign: 'left' }}>
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Actions</th>
>>>>>>> Stashed changes
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--md-outline-variant)' }}>
<<<<<<< Updated upstream
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
=======
                  <td className="py-2">{u.displayName}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.orgRole}</td>
                  <td className="py-2">{u.status}</td>
                  <td className="py-2 flex flex-wrap gap-2">
                    {u.status === 'pending' && (
                      <button type="button" className="md-btn md-btn-tonal text-xs" onClick={() => void setStatus(u.id, 'active')}>
                        Approve
                      </button>
                    )}
                    {u.status === 'active' && (
                      <button type="button" className="md-btn md-btn-outlined text-xs" onClick={() => void setStatus(u.id, 'suspended')}>
                        Suspend
                      </button>
                    )}
                    {u.status === 'suspended' && (
                      <button type="button" className="md-btn md-btn-tonal text-xs" onClick={() => void setStatus(u.id, 'active')}>
                        Reactivate
                      </button>
                    )}
                    <button type="button" className="md-btn md-btn-error text-xs" onClick={() => void removeUser(u.id)}>
                      Remove
                    </button>
>>>>>>> Stashed changes
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
<<<<<<< Updated upstream
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
=======
        )}
      </div>
>>>>>>> Stashed changes
    </div>
  )
}
