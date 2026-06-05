import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AdminTable } from '../../components/admin/AdminTable'
import { AdminViewToggle } from '../../components/admin/AdminViewToggle'
import { AssignUserToOrgModal } from '../../components/admin/AssignUserToOrgModal'
import { useAdminViewMode } from '../../components/admin/useAdminViewMode'
import { fetchOrganizations, type Organization } from '../../lib/adminApi'
import { fetchAllUsers, type GlobalUser } from '../../lib/usersApi'

function membershipsSummary(u: GlobalUser) {
  if (u.memberships.length === 0) return '—'
  return u.memberships
    .map((m) => `${m.organizationName} (${m.orgRole})`)
    .join('; ')
}

export function SuperAdminUsersPage() {
  const { token } = useAuth()
  const [viewMode, setViewMode] = useAdminViewMode('users')
  const [users, setUsers] = useState<GlobalUser[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [assignUser, setAssignUser] = useState<GlobalUser | null>(null)

  async function load() {
    if (!token) return
    setLoading(true)
    try {
      const [usersData, orgsData] = await Promise.all([
        fetchAllUsers(token, { limit: 100 }),
        fetchOrganizations(token, 1, 100),
      ])
      setUsers(usersData.users)
      setTotal(usersData.total)
      setOrganizations(orgsData.organizations)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [token])

  function userActions(u: GlobalUser) {
    if (u.globalRole === 'super_admin') return null
    return (
      <button type="button" className="md-btn md-btn-tonal" onClick={() => setAssignUser(u)}>
        Add to org
      </button>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>All users</h1>
          <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            {total} registered users. Assign users to organizations and set their org role.
          </p>
        </div>
        <AdminViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 text-sm" style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)', borderRadius: 'var(--shape-sm)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--md-on-surface-variant)' }}>Loading…</p>
      ) : viewMode === 'cards' ? (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-xl p-4"
              style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium" style={{ color: 'var(--md-on-surface)' }}>{u.displayName}</p>
                  <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>{u.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {u.globalRole && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}>
                      {u.globalRole}
                    </span>
                  )}
                  {userActions(u)}
                </div>
              </div>
              {u.memberships.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {u.memberships.map((m) => (
                    <li key={`${u.id}-${m.organizationId}`}>
                      {m.organizationName} ({m.organizationSlug}) — {m.orgRole}, {m.status}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm italic" style={{ color: 'var(--md-outline)' }}>Not in any organization</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <AdminTable
          rows={users}
          rowKey={(u) => u.id}
          emptyMessage="No users found."
          columns={[
            { key: 'name', header: 'Display name', render: (u) => u.displayName },
            { key: 'email', header: 'Email', render: (u) => u.email },
            {
              key: 'role',
              header: 'Global role',
              render: (u) => u.globalRole ?? '—',
            },
            {
              key: 'orgs',
              header: 'Organizations',
              render: (u) => (
                <span className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {membershipsSummary(u)}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              className: 'min-w-[120px]',
              render: (u) => userActions(u) ?? '—',
            },
          ]}
        />
      )}

      {token && assignUser && (
        <AssignUserToOrgModal
          token={token}
          user={assignUser}
          organizations={organizations}
          onClose={() => setAssignUser(null)}
          onSuccess={() => void load()}
        />
      )}
    </div>
  )
}
