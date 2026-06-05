import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AdminTable } from '../../components/admin/AdminTable'
import { AdminViewToggle } from '../../components/admin/AdminViewToggle'
import { OrgMembersModal } from '../../components/admin/OrgMembersModal'
import { useAdminViewMode } from '../../components/admin/useAdminViewMode'
import {
  createOrganization,
  fetchOrganizations,
  patchOrganization,
  type Organization,
} from '../../lib/adminApi'

export function SuperAdminOrganizationsPage() {
  const { token } = useAuth()
  const [viewMode, setViewMode] = useAdminViewMode('organizations')
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [addTenantAdmin, setAddTenantAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminDisplayName, setAdminDisplayName] = useState('')
  const [membersOrg, setMembersOrg] = useState<Organization | null>(null)

  async function load() {
    if (!token) return
    try {
      const data = await fetchOrganizations(token)
      setOrgs(data.organizations)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations')
    }
  }

  useEffect(() => { void load() }, [token])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    try {
      const body: Parameters<typeof createOrganization>[1] = {
        name,
        slug: slug || undefined,
      }
      if (addTenantAdmin) {
        if (!adminEmail || !adminPassword || !adminDisplayName) {
          setError('Tenant admin email, password, and display name are required')
          return
        }
        body.tenantAdminEmail = adminEmail
        body.tenantAdminPassword = adminPassword
        body.tenantAdminDisplayName = adminDisplayName
      }
      await createOrganization(token, body)
      setName('')
      setSlug('')
      setAddTenantAdmin(false)
      setAdminEmail('')
      setAdminPassword('')
      setAdminDisplayName('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    }
  }

  async function rotateInvite(id: string) {
    if (!token) return
    try {
      await patchOrganization(token, id, { rotateInviteCode: true })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate invite code')
    }
  }

  async function toggleActive(o: Organization) {
    if (!token) return
    try {
      await patchOrganization(token, o.id, { isActive: !o.isActive })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization')
    }
  }

  function orgActions(o: Organization) {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" className="md-btn md-btn-tonal" onClick={() => setMembersOrg(o)}>
          Members
        </button>
        <button type="button" className="md-btn md-btn-outlined" onClick={() => void rotateInvite(o.id)}>
          Rotate invite
        </button>
        <button type="button" className="md-btn md-btn-outlined" onClick={() => void toggleActive(o)}>
          {o.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>Organizations</h1>
          <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            Manage tenant organizations, members, and invite codes.
          </p>
        </div>
        <AdminViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 text-sm" style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)', borderRadius: 'var(--shape-sm)' }}>
          {error}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="mb-8 space-y-4 rounded-xl p-4"
        style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}
      >
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
          <input className="md-field-input" placeholder="Organization name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="md-field-input" placeholder="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <button type="submit" className="md-btn md-btn-filled shrink-0 self-center md:justify-self-end">
            Create organization
          </button>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: 'var(--md-on-surface)' }}>
          <input
            type="checkbox"
            checked={addTenantAdmin}
            onChange={(e) => setAddTenantAdmin(e.target.checked)}
            className="size-4"
          />
          Add initial tenant admin
        </label>

        {addTenantAdmin && (
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="md-field-input" type="email" placeholder="Admin email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required={addTenantAdmin} />
            <input className="md-field-input" placeholder="Admin display name" value={adminDisplayName} onChange={(e) => setAdminDisplayName(e.target.value)} required={addTenantAdmin} />
            <input className="md-field-input" type="password" placeholder="Admin password (8+ chars)" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required={addTenantAdmin} />
          </div>
        )}
      </form>

      {viewMode === 'cards' ? (
        <div className="space-y-3">
          {orgs.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
              style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}
            >
              <div>
                <p className="font-medium" style={{ color: 'var(--md-on-surface)' }}>
                  {o.name}
                  {!o.isActive && (
                    <span className="ml-2 text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>(inactive)</span>
                  )}
                </p>
                <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {o.slug} · {o.memberCount} members · invite: <code>{o.inviteCode}</code>
                </p>
              </div>
              {orgActions(o)}
            </div>
          ))}
        </div>
      ) : (
        <AdminTable
          rows={orgs}
          rowKey={(o) => o.id}
          emptyMessage="No organizations yet."
          columns={[
            { key: 'name', header: 'Name', render: (o) => o.name },
            { key: 'slug', header: 'Slug', render: (o) => o.slug },
            { key: 'members', header: 'Members', render: (o) => o.memberCount },
            {
              key: 'invite',
              header: 'Invite code',
              render: (o) => <code className="text-xs">{o.inviteCode}</code>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (o) => (o.isActive ? 'Active' : 'Inactive'),
            },
            {
              key: 'actions',
              header: 'Actions',
              className: 'min-w-[280px]',
              render: (o) => orgActions(o),
            },
          ]}
        />
      )}

      {token && membersOrg && (
        <OrgMembersModal
          token={token}
          organization={membersOrg}
          onClose={() => setMembersOrg(null)}
          onChanged={() => void load()}
        />
      )}
    </div>
  )
}
