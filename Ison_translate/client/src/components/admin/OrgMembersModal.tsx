import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addOrgMember,
  fetchOrgMembers,
  removeOrgMember,
  updateOrgMember,
  type OrgMember,
  type Organization,
} from '../../lib/adminApi'
import { fetchAllUsers, type GlobalUser } from '../../lib/usersApi'

const STATUSES: OrgMember['status'][] = ['pending', 'active', 'suspended', 'rejected']
const ROLES: OrgMember['orgRole'][] = ['member', 'tenant_admin']

type Props = {
  token: string
  organization: Organization
  onClose: () => void
  onChanged: () => void
}

export function OrgMembersModal({ token, organization, onClose, onChanged }: Props) {
  const [members, setMembers] = useState<OrgMember[]>([])
  const [allUsers, setAllUsers] = useState<GlobalUser[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [addRole, setAddRole] = useState<OrgMember['orgRole']>('member')
  const [adding, setAdding] = useState(false)

  const memberUserIds = useMemo(
    () => new Set(members.filter((m) => m.status !== 'rejected').map((m) => m.userId)),
    [members],
  )

  const availableUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    return allUsers.filter((u) => {
      if (memberUserIds.has(u.id)) return false
      if (u.globalRole === 'super_admin') return false
      if (!q) return true
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    })
  }, [allUsers, memberUserIds, userSearch])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [membersData, usersData] = await Promise.all([
        fetchOrgMembers(token, organization.id),
        fetchAllUsers(token, { limit: 200 }),
      ])
      setMembers(membersData.members)
      setAllUsers(usersData.users)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [token, organization.id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleAddExisting(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId) {
      setError('Select a user to add')
      return
    }
    setAdding(true)
    setError('')
    try {
      await addOrgMember(token, organization.id, {
        userId: selectedUserId,
        orgRole: addRole,
        status: 'active',
      })
      setSelectedUserId('')
      setUserSearch('')
      await load()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  async function patchMember(userId: string, body: { orgRole?: OrgMember['orgRole']; status?: OrgMember['status'] }) {
    try {
      await updateOrgMember(token, organization.id, userId, body)
      await load()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member')
    }
  }

  async function handleRemove(m: OrgMember) {
    if (!window.confirm(`Remove ${m.displayName} from ${organization.name}?`)) return
    try {
      await removeOrgMember(token, organization.id, m.userId)
      await load()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl"
        style={{ background: 'var(--md-surface-container-highest)', border: '1px solid var(--md-outline-variant)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b px-6 py-4" style={{ borderColor: 'var(--md-outline-variant)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--md-on-surface)' }}>
            Members — {organization.name}
          </h2>
          <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            Add users from the platform directory. Invite code: <code>{organization.inviteCode}</code>
          </p>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {error && (
            <div
              className="mb-4 px-3 py-2 text-sm"
              style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)', borderRadius: 'var(--shape-sm)' }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleAddExisting}
            className="mb-6 space-y-3 rounded-xl p-4"
            style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>
              Add member from existing users
            </p>
            <input
              className="md-field-input w-full"
              type="search"
              placeholder="Search by name or email…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              aria-label="Search users"
            />
            <select
              className="md-field-input w-full"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              aria-label="User"
              disabled={loading || availableUsers.length === 0}
            >
              <option value="">
                {loading
                  ? 'Loading users…'
                  : availableUsers.length === 0
                    ? 'No users available to add'
                    : 'Select user…'}
              </option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName} ({u.email})
                </option>
              ))}
            </select>
            <select
              className="md-field-input w-full"
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as OrgMember['orgRole'])}
              aria-label="Role"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === 'tenant_admin' ? 'Tenant admin' : 'Member'}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="md-btn md-btn-filled"
              disabled={adding || !selectedUserId}
            >
              {adding ? 'Adding…' : 'Add selected user'}
            </button>
          </form>

          {loading ? (
            <p style={{ color: 'var(--md-on-surface-variant)' }}>Loading members…</p>
          ) : members.length === 0 ? (
            <p style={{ color: 'var(--md-on-surface-variant)' }}>No members in this organization yet.</p>
          ) : (
            <ul className="space-y-3">
              {members.map((m) => (
                <li
                  key={m.membershipId}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}
                >
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--md-on-surface)' }}>{m.displayName}</p>
                      <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>{m.email}</p>
                    </div>
                    <button type="button" className="md-btn md-btn-text md-btn-error" onClick={() => void handleRemove(m)}>
                      Remove
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="md-field-input text-sm"
                      value={m.orgRole}
                      aria-label={`Role for ${m.displayName}`}
                      onChange={(e) => void patchMember(m.userId, { orgRole: e.target.value as OrgMember['orgRole'] })}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r === 'tenant_admin' ? 'Tenant admin' : 'Member'}</option>
                      ))}
                    </select>
                    <select
                      className="md-field-input text-sm"
                      value={m.status}
                      aria-label={`Status for ${m.displayName}`}
                      onChange={(e) => void patchMember(m.userId, { status: e.target.value as OrgMember['status'] })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t px-6 py-4" style={{ borderColor: 'var(--md-outline-variant)' }}>
          <button type="button" className="md-btn md-btn-filled" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
