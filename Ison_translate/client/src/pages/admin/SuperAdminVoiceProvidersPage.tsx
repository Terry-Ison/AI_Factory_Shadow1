import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
<<<<<<< Updated upstream
import { AdminTable } from '../../components/admin/AdminTable'
import { AdminViewToggle } from '../../components/admin/AdminViewToggle'
import { useAdminViewMode } from '../../components/admin/useAdminViewMode'
import {
  createVoiceProvider,
  deleteVoiceProvider,
=======
import {
  createVoiceProvider,
>>>>>>> Stashed changes
  fetchVoiceProviders,
  updateVoiceProvider,
  type VoiceProvider,
} from '../../lib/adminApi'

<<<<<<< Updated upstream
function keyLabel(p: VoiceProvider) {
  if (p.apiKeyPreview) return p.apiKeyPreview
  if (p.hasApiKey) return '••••••••'
  return 'missing'
}

export function SuperAdminVoiceProvidersPage() {
  const { token } = useAuth()
  const [viewMode, setViewMode] = useAdminViewMode('voice-providers')
  const [providers, setProviders] = useState<VoiceProvider[]>([])
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [apiUrl, setApiUrl] = useState('https://api.deepl.com')
  const [apiKey, setApiKey] = useState('')
  const [editing, setEditing] = useState<VoiceProvider | null>(null)
  const [editName, setEditName] = useState('')
  const [editApiUrl, setEditApiUrl] = useState('')
  const [editApiKey, setEditApiKey] = useState('')

  async function load() {
    if (!token) return
    try {
      const data = await fetchVoiceProviders(token)
      setProviders(data.providers)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers')
    }
  }

  useEffect(() => { void load() }, [token])
=======
export function SuperAdminVoiceProvidersPage() {
  const { token } = useAuth()
  const [providers, setProviders] = useState<VoiceProvider[]>([])
  const [name, setName] = useState('')
  const [apiUrl, setApiUrl] = useState('https://api.deepl.com')
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')

  async function load() {
    if (!token) return
    const data = await fetchVoiceProviders(token)
    setProviders(data.providers)
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load'),
    )
  }, [token])
>>>>>>> Stashed changes

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
<<<<<<< Updated upstream
    try {
      await createVoiceProvider(token, { name, apiUrl, apiKey, type: 'deepl' })
=======
    setError('')
    try {
      await createVoiceProvider(token, { name, type: 'deepl', apiUrl, apiKey })
>>>>>>> Stashed changes
      setName('')
      setApiKey('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create provider')
    }
  }

  async function toggleActive(p: VoiceProvider) {
    if (!token) return
<<<<<<< Updated upstream
    try {
      await updateVoiceProvider(token, p.id, { isActive: !p.isActive })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update provider')
    }
  }

  async function setGlobalDefault(p: VoiceProvider) {
    if (!token) return
    try {
      await updateVoiceProvider(token, p.id, { isGlobalDefault: true })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set global default')
    }
  }

  function openEdit(p: VoiceProvider) {
    setEditing(p)
    setEditName(p.name)
    setEditApiUrl(p.apiUrl)
    setEditApiKey('')
  }

  function closeEdit() {
    setEditing(null)
    setEditName('')
    setEditApiUrl('')
    setEditApiKey('')
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !editing) return
    try {
      const body: { name: string; apiUrl: string; apiKey?: string } = {
        name: editName.trim(),
        apiUrl: editApiUrl.trim(),
      }
      if (editApiKey.trim()) body.apiKey = editApiKey.trim()
      await updateVoiceProvider(token, editing.id, body)
      closeEdit()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update provider')
    }
  }

  async function handleDelete(p: VoiceProvider) {
    if (!token) return
    const msg = p.isGlobalDefault
      ? 'Cannot delete the global default provider.'
      : `Delete provider "${p.name}"? If assigned to organizations it will be deactivated instead.`
    if (p.isGlobalDefault || !window.confirm(msg)) return
    try {
      await deleteVoiceProvider(token, p.id)
      if (editing?.id === p.id) closeEdit()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider')
    }
  }

  function providerActions(p: VoiceProvider) {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" className="md-btn md-btn-outlined" onClick={() => openEdit(p)}>
          Edit
        </button>
        {!p.isGlobalDefault && p.isActive && (
          <button type="button" className="md-btn md-btn-tonal" onClick={() => void setGlobalDefault(p)}>
            Set global default
          </button>
        )}
        <button type="button" className="md-btn md-btn-outlined" onClick={() => void toggleActive(p)}>
          {p.isActive ? 'Deactivate' : 'Activate'}
        </button>
        {!p.isGlobalDefault && (
          <button type="button" className="md-btn md-btn-error" onClick={() => void handleDelete(p)}>
            Delete
          </button>
        )}
      </div>
    )
=======
    await updateVoiceProvider(token, p.id, { isActive: !p.isActive })
    await load()
>>>>>>> Stashed changes
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
<<<<<<< Updated upstream
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>Provider catalog</h1>
          <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            Global voice providers available for organizations to enable.
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
        className="mb-8 grid gap-3 rounded-xl p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center"
        style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}
      >
        <input className="md-field-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="md-field-input" placeholder="API URL" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} required />
        <input className="md-field-input" type="password" placeholder="API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required />
        <button type="submit" className="md-btn md-btn-filled shrink-0 self-center md:justify-self-end">
          Add provider
        </button>
      </form>

      {viewMode === 'cards' ? (
        <div className="space-y-3">
          {providers.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
              style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}
            >
              <div>
                <p className="font-medium" style={{ color: 'var(--md-on-surface)' }}>
                  {p.name}
                  {p.isGlobalDefault && (
                    <span
                      className="ml-2 rounded px-2 py-0.5 text-xs font-medium"
                      style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
                    >
                      Global default
                    </span>
                  )}
                  {!p.isActive && (
                    <span
                      className="ml-2 rounded px-2 py-0.5 text-xs font-medium"
                      style={{ background: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }}
                    >
                      Inactive
                    </span>
                  )}
                </p>
                <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {p.type} · {p.apiUrl}
                </p>
                <p className="mt-1 font-mono text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {keyLabel(p)}
                </p>
              </div>
              {providerActions(p)}
            </div>
          ))}
        </div>
      ) : (
        <AdminTable
          rows={providers}
          rowKey={(p) => p.id}
          emptyMessage="No providers in the catalog."
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (p) => (
                <span>
                  {p.name}
                  {p.isGlobalDefault && (
                    <span className="ml-2 text-xs" style={{ color: 'var(--md-primary)' }}>★ default</span>
                  )}
                </span>
              ),
            },
            { key: 'type', header: 'Type', render: (p) => p.type },
            { key: 'url', header: 'API URL', render: (p) => <span className="break-all">{p.apiUrl}</span> },
            {
              key: 'key',
              header: 'API key',
              render: (p) => (
                <code className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {keyLabel(p)}
                </code>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (p) => (p.isActive ? 'Active' : 'Inactive'),
            },
            {
              key: 'actions',
              header: 'Actions',
              className: 'min-w-[280px]',
              render: (p) => providerActions(p),
            },
          ]}
        />
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-provider-title"
          onClick={closeEdit}
        >
          <form
            onSubmit={handleEditSave}
            className="w-full max-w-md rounded-xl p-6 shadow-lg"
            style={{ background: 'var(--md-surface-container-highest)', border: '1px solid var(--md-outline-variant)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-provider-title" className="mb-4 text-lg font-semibold" style={{ color: 'var(--md-on-surface)' }}>
              Edit provider
            </h2>
            <div className="space-y-3">
              <input
                className="md-field-input w-full"
                placeholder="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              <input
                className="md-field-input w-full"
                placeholder="API URL"
                value={editApiUrl}
                onChange={(e) => setEditApiUrl(e.target.value)}
                required
              />
              <input
                className="md-field-input w-full"
                type="password"
                placeholder={editing.hasApiKey ? `New API key (current: ${keyLabel(editing)})` : 'API key'}
                value={editApiKey}
                onChange={(e) => setEditApiKey(e.target.value)}
              />
              <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                Leave API key blank to keep the existing key.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="md-btn md-btn-text" onClick={closeEdit}>
                Cancel
              </button>
              <button type="submit" className="md-btn md-btn-filled">
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}
=======
      <h1 className="text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>
        Voice provider catalog
      </h1>
      {error && <p className="mt-2 text-sm" style={{ color: 'var(--md-error)' }}>{error}</p>}

      <form onSubmit={handleCreate} className="mt-6 grid max-w-xl gap-3">
        <input className="md-field-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="md-field-input" placeholder="API URL" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} required />
        <input className="md-field-input" type="password" placeholder="API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required />
        <button type="submit" className="md-btn md-btn-filled w-fit">Add provider</button>
      </form>

      <ul className="mt-8 max-w-xl space-y-2">
        {providers.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--md-surface-container)' }}>
            <span>{p.name} ({p.type}) {p.isActive ? '' : '— inactive'}</span>
            <button type="button" className="md-btn md-btn-outlined text-xs" onClick={() => void toggleActive(p)}>
              {p.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </li>
        ))}
      </ul>
>>>>>>> Stashed changes
    </div>
  )
}
