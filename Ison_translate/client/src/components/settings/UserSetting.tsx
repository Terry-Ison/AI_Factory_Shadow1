import { Database, Globe2, Headphones, PlayCircle, Save, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { LANGUAGES } from '../../config'
import type { AuthUser } from '../../lib/authApi'

type Props = {
  user: AuthUser | null
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="relative h-7 w-12 shrink-0"
      style={{
        border: 'none',
        borderRadius: 'var(--shape-full)',
        background: checked ? 'var(--md-primary)' : 'var(--md-outline)',
        cursor: 'pointer',
      }}
      aria-pressed={checked}
    >
      <span
        className="absolute top-1 h-5 w-5 transition-all"
        style={{
          left: checked ? '1.5rem' : '0.25rem',
          borderRadius: 'var(--shape-full)',
          background: checked ? 'var(--md-on-primary)' : 'var(--md-surface-container-lowest)',
        }}
      />
    </button>
  )
}

function SettingCard({
  icon,
  title,
  children,
  className = '',
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`p-5 ${className}`}
      style={{
        background: 'var(--md-surface-container-lowest)',
        border: '1px solid var(--md-outline-variant)',
        borderRadius: 'var(--shape-sm)',
      }}
    >
      <div className="mb-5 flex items-center gap-2">
        <span style={{ color: 'var(--md-primary)' }}>{icon}</span>
        <h2 className="text-base font-semibold leading-6" style={{ color: 'var(--md-on-surface)' }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

export function UserSetting({ user }: Props) {
  const [sourceLang, setSourceLang] = useState(user?.defaultSourceLang ?? 'en')
  const [targetLang, setTargetLang] = useState(user?.defaultTargetLang ?? 'es')
  const [autoSave, setAutoSave] = useState(true)
  const [cloudSync, setCloudSync] = useState(false)
  const [voiceGender, setVoiceGender] = useState<'male' | 'female' | 'neutral'>('female')
  const [speechRate, setSpeechRate] = useState(1)
  const [pitch, setPitch] = useState(50)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <header className="shrink-0">
        <h1 className="text-2xl font-semibold leading-8" style={{ color: 'var(--md-on-surface)' }}>
          Configuration & Preferences
        </h1>
        <p className="mt-1 text-sm leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>
          Tailor your AI translation experience to your workflow.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid gap-4 xl:grid-cols-2">
          <SettingCard icon={<Globe2 size={18} />} title="Translation Core">
            <div className="grid gap-4">
              <label className="md-field">
                <span className="md-field-label">Default source language</span>
                <select className="md-field-input" value={sourceLang} onChange={(event) => setSourceLang(event.target.value)}>
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="md-field">
                <span className="md-field-label">Default target language</span>
                <select className="md-field-input" value={targetLang} onChange={(event) => setTargetLang(event.target.value)}>
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </SettingCard>

          <SettingCard icon={<Database size={18} />} title="Storage & Persistence">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold leading-5" style={{ color: 'var(--md-on-surface)' }}>
                    Auto-save transcripts
                  </p>
                  <p className="text-xs leading-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                    Save every session to local history.
                  </p>
                </div>
                <Toggle checked={autoSave} onChange={() => setAutoSave((value) => !value)} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold leading-5" style={{ color: 'var(--md-on-surface)' }}>
                    Sync with Cloud Storage
                  </p>
                  <p className="text-xs leading-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                    Access history across all your devices.
                  </p>
                </div>
                <Toggle checked={cloudSync} onChange={() => setCloudSync((value) => !value)} />
              </div>
            </div>
          </SettingCard>

          <SettingCard icon={<Headphones size={18} />} title="Acoustic Engineering" className="xl:col-span-2">
            <div className="grid gap-6 xl:grid-cols-[0.65fr_1fr_0.65fr]">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase" style={{ color: 'var(--md-outline)' }}>
                  Default voice gender
                </p>
                <div className="space-y-3">
                  {(['male', 'female', 'neutral'] as const).map((gender) => (
                    <label key={gender} className="flex items-center gap-2 text-sm capitalize" style={{ color: 'var(--md-on-surface-variant)' }}>
                      <input
                        type="radio"
                        name="voiceGender"
                        value={gender}
                        checked={voiceGender === gender}
                        onChange={() => setVoiceGender(gender)}
                        style={{ accentColor: 'var(--md-primary)' }}
                      />
                      {gender}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <label className="block">
                  <div className="mb-2 flex justify-between gap-3 text-xs font-semibold uppercase" style={{ color: 'var(--md-outline)' }}>
                    <span>Speech rate</span>
                    <span style={{ color: 'var(--md-on-surface)' }}>{speechRate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={speechRate}
                    onChange={(event) => setSpeechRate(Number(event.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--md-primary)' }}
                  />
                  <div className="mt-1 flex justify-between text-[0.6875rem]" style={{ color: 'var(--md-outline)' }}>
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </label>

                <label className="block">
                  <div className="mb-2 flex justify-between gap-3 text-xs font-semibold uppercase" style={{ color: 'var(--md-outline)' }}>
                    <span>Voice pitch</span>
                    <span style={{ color: 'var(--md-on-surface)' }}>{pitch === 50 ? 'Default' : pitch}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={pitch}
                    onChange={(event) => setPitch(Number(event.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--md-primary)' }}
                  />
                  <div className="mt-1 flex justify-between text-[0.6875rem]" style={{ color: 'var(--md-outline)' }}>
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </label>
              </div>

              {/* <div
                className="flex min-h-44 flex-col items-center justify-center gap-3 p-4 text-center"
                style={{
                  background: 'var(--md-surface-container)',
                  border: '1px solid var(--md-outline-variant)',
                  borderRadius: 'var(--shape-sm)',
                }}
              >
                <span className="flex h-14 w-14 items-center justify-center" style={{ background: 'var(--md-secondary-container)', borderRadius: 'var(--shape-full)', color: 'var(--md-on-secondary-container)' }}>
                  <PlayCircle size={26} />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-5" style={{ color: 'var(--md-on-surface)' }}>
                    Sample Output
                  </p>
                  <p className="mt-1 text-xs leading-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                    Hear how your customized voice will sound during live translation.
                  </p>
                </div>
                <button type="button" className="md-btn md-btn-outlined h-9 px-4">
                  Test Voice
                </button>
              </div> */}
            </div>
          </SettingCard>
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap justify-end gap-3" style={{ borderColor: 'var(--md-outline-variant)' }}>
        <button type="button" className="md-btn md-btn-text">
          Discard Changes
        </button>
        <button type="button" className="md-btn md-btn-filled">
          <Save size={16} />
          Save Preferences
        </button>
      </footer>
    </div>
  )
}
