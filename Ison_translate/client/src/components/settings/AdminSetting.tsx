import { Save, ShieldCheck, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AuthUser } from '../../lib/authApi'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

type Props = {
  user: AuthUser
}

const LS_KEYS = {
  provider: 'admin.voiceLLM.provider',
  model: 'admin.voiceLLM.model',
  baseUrl: 'admin.voiceLLM.baseUrl',
  apiKey: 'admin.voiceLLM.apiKey',
} as const

function readLS(key: string, fallback = '') {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function SettingCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section
      className="p-5"
      style={{
        background: 'var(--md-surface-container-lowest)',
        border: '1px solid var(--md-outline-variant)',
        borderRadius: 'var(--shape-sm)',
      }}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5" style={{ color: 'var(--md-primary)' }}>
          {icon}
        </span>
        <div>
          <h2 className="text-base font-semibold leading-6" style={{ color: 'var(--md-on-surface)' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}

export function AdminSetting({ user }: Props) {
  const [provider, setProvider] = useState(() => readLS(LS_KEYS.provider, 'openai'))
  const [model, setModel] = useState(() => readLS(LS_KEYS.model, 'gpt-4o-mini-tts'))
  const [baseUrl, setBaseUrl] = useState(() => readLS(LS_KEYS.baseUrl, ''))
  const [apiKey, setApiKey] = useState(() => readLS(LS_KEYS.apiKey, ''))
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  const canSave = useMemo(() => {
    if (!provider.trim()) return false
    if (!model.trim()) return false
    // allow empty key for local/dev, but show warning in UI via helper text
    return true
  }, [provider, model])

  function save() {
    setError(null)
    setSaveState('saving')
    try {
      localStorage.setItem(LS_KEYS.provider, provider.trim())
      localStorage.setItem(LS_KEYS.model, model.trim())
      localStorage.setItem(LS_KEYS.baseUrl, baseUrl.trim())
      localStorage.setItem(LS_KEYS.apiKey, apiKey)
      setSaveState('saved')
      window.setTimeout(() => setSaveState('idle'), 1200)
    } catch {
      setError('Could not save settings to local storage.')
      setSaveState('idle')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="shrink-0">
        <h2 className="text-2xl font-semibold leading-8" style={{ color: 'var(--md-on-surface)' }}>
          Admin settings
        </h2>
        <p className="mt-1 text-sm leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>
          Visible only to Admin users. Configure the Voice LLM/TTS provider used by the application.
        </p>
      </header>

      <SettingCard
        icon={<Sparkles size={18} />}
        title="Voice LLM / TTS"
        subtitle="Controls which model/provider is used to generate voice output."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}

            placeholder="e.g. openai"
            helperText="Example: openai, azure-openai, custom"
          />
          <Input
            label="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. gpt-4o-mini-tts"
            helperText="The voice model identifier used for synthesis."
          />
          <Input
            label="Base URL (optional)"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.example.com"
            helperText="Leave empty to use default backend configuration."
          />
          <Input
            label="API key (optional)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            type="password"
            helperText={apiKey.trim() ? null : 'If empty, voice generation may fail in production.'}
          />
        </div>

        {error && (
          <div
            className="mt-4 rounded-md px-3 py-2 text-sm"
            style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
          >
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
            <ShieldCheck size={14} />
            Changes are stored locally for now (per browser).
          </div>
          <Button
            variant="filled"
            onClick={save}
            disabled={!canSave}
            loading={saveState === 'saving'}
            leftIcon={<Save size={16} />}
          >
            {saveState === 'saved' ? 'Saved' : 'Save admin settings'}
          </Button>
        </div>
      </SettingCard>

      
    </div>
  )
}

