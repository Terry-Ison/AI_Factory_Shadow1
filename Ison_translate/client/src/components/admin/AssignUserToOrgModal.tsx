import { useState } from 'react'
import { addOrgMember, type Organization } from '../../lib/adminApi'
import type { GlobalUser } from '../../lib/usersApi'

const ROLES = ['member', 'tenant_admin'] as const

type Props = {
  token: string
  user: GlobalUser
  organizations: Organization[]
  onClose: () => void
  onSuccess: () => void
}

export function AssignUserToOrgModal({ token, user, organizations, onClose, onSuccess }: Props) {
  const [orgId, setOrgId] = useState('')
  const [orgRole, setOrgRole] = useState<'tenant_admin' | 'member'>('member')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const memberOrgIds = new Set(
    user.memberships.filter((m) => m.status !== 'rejected').map((m) => m.organizationId),
  )
  const availableOrgs = organizations.filter((o) => o.isActive && !memberOrgIds.has(o.id))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) {
      setError('Select an organization')
      return
    }
    setSaving(true)
    setError('')
    try {
      await addOrgMember(token, orgId, { userId: user.id, orgRole, status: 'active' })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user to organization')
    } finally {
      setSaving(false)
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
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl p-6"
        style={{ background: 'var(--md-surface-container-highest)', border: '1px solid var(--md-outline-variant)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold" style={{ color: 'var(--md-on-surface)' }}>
          Add to organization
        </h2>
        <p className="mb-4 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
          {user.displayName} · {user.email}
        </p>

        {error && (
          <div
            className="mb-4 px-3 py-2 text-sm"
            style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)', borderRadius: 'var(--shape-sm)' }}
          >
            {error}
          </div>
        )}

        {availableOrgs.length === 0 ? (
          <p className="mb-4 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            This user is already a member of all active organizations.
          </p>
        ) : (
          <div className="space-y-3">
            <select
              className="md-field-input w-full"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              required
              aria-label="Organization"
            >
              <option value="">Select organization…</option>
              {availableOrgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.slug})
                </option>
              ))}
            </select>
            <select
              className="md-field-input w-full"
              value={orgRole}
              onChange={(e) => setOrgRole(e.target.value as 'tenant_admin' | 'member')}
              aria-label="Role in organization"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === 'tenant_admin' ? 'Tenant admin' : 'Member'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="md-btn md-btn-text" onClick={onClose}>
            Cancel
          </button>
          {availableOrgs.length > 0 && (
            <button type="submit" className="md-btn md-btn-filled" disabled={saving}>
              {saving ? 'Adding…' : 'Add to organization'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
