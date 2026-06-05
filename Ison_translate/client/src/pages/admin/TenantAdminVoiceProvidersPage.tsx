import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
<<<<<<< Updated upstream
import { fetchOrgVoiceProviders, updateOrgVoiceProviders, type OrgVoiceProvider } from '../../lib/adminApi'

export function TenantAdminVoiceProvidersPage() {
  const { token } = useAuth()
  const [providers, setProviders] = useState<OrgVoiceProvider[]>([])
=======
import {
  fetchOrgVoiceProviders,
  updateOrgVoiceProviders,
  type VoiceProvider,
} from '../../lib/adminApi'

export function TenantAdminVoiceProvidersPage() {
  const { token } = useAuth()
  const [providers, setProviders] = useState<VoiceProvider[]>([])
>>>>>>> Stashed changes
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!token) return
<<<<<<< Updated upstream
    try {
      const data = await fetchOrgVoiceProviders(token)
      setProviders(data.providers)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers')
    }
  }

  useEffect(() => { void load() }, [token])

  function toggleEnabled(id: string) {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
=======
    const data = await fetchOrgVoiceProviders(token)
    setProviders(data.providers)
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load providers'),
    )
  }, [token])

  function toggleEnabled(id: string) {
    setProviders((list) =>
      list.map((p) => (p.id === id ? { ...p, enabled: !p.enabled, isDefault: p.enabled ? false : p.isDefault } : p)),
>>>>>>> Stashed changes
    )
  }

  function setDefault(id: string) {
<<<<<<< Updated upstream
    setProviders((prev) =>
      prev.map((p) => ({ ...p, isDefault: p.id === id && p.enabled })),
    )
  }

  async function handleSave() {
    if (!token) return
    setSaving(true)
    try {
      await updateOrgVoiceProviders(
        token,
        providers.map((p) => ({
          voiceProviderId: p.id,
          enabled: p.enabled,
          isDefault: p.isDefault,
        })),
      )
      await load()
=======
    setProviders((list) =>
      list.map((p) => ({
        ...p,
        isDefault: p.id === id,
        enabled: p.id === id ? true : p.enabled,
      })),
    )
  }

  async function save() {
    if (!token) return
    setSaving(true)
    setError('')
    try {
      const payload = providers.map((p) => ({
        voiceProviderId: p.id,
        enabled: Boolean(p.enabled),
        isDefault: Boolean(p.isDefault),
      }))
      const data = await updateOrgVoiceProviders(token, payload)
      setProviders(data.providers)
>>>>>>> Stashed changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
<<<<<<< Updated upstream
      <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>Voice providers</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
        Choose which providers are available to your organization and set the default.
      </p>

      {error && (
        <div className="mb-4 px-3 py-2 text-sm" style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)', borderRadius: 'var(--shape-sm)' }}>
          {error}
        </div>
      )}

      <div className="mb-4 space-y-3">
        {providers.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
            style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}
          >
            <div>
              <p className="font-medium" style={{ color: 'var(--md-on-surface)' }}>{p.name}</p>
              <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>{p.type} · {p.apiUrl}</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={p.enabled} onChange={() => toggleEnabled(p.id)} />
                Enabled
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="defaultProvider"
                  checked={p.isDefault}
                  disabled={!p.enabled}
=======
      <h1 className="text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>
        Voice providers
      </h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
        Select which providers your organization may use and set the default.
      </p>
      {error && <p className="mt-2 text-sm" style={{ color: 'var(--md-error)' }}>{error}</p>}

      <ul className="mt-6 max-w-xl space-y-3">
        {providers.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-xl p-4"
            style={{ background: 'var(--md-surface-container)' }}
          >
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>{p.type}</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={Boolean(p.enabled)} onChange={() => toggleEnabled(p.id)} />
                Enabled
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="defaultProvider"
                  checked={Boolean(p.isDefault)}
>>>>>>> Stashed changes
                  onChange={() => setDefault(p.id)}
                />
                Default
              </label>
            </div>
<<<<<<< Updated upstream
          </div>
        ))}
      </div>

      <button type="button" className="md-btn md-btn-filled w-fit" disabled={saving} onClick={() => void handleSave()}>
        {saving ? 'Saving…' : 'Save changes'}
=======
          </li>
        ))}
      </ul>

      <button type="button" className="md-btn md-btn-filled mt-6 w-fit" disabled={saving} onClick={() => void save()}>
        {saving ? 'Saving…' : 'Save selection'}
>>>>>>> Stashed changes
      </button>
    </div>
  )
}
