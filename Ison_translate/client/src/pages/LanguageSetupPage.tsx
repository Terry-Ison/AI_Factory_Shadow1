import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { updateLanguages } from '../lib/authApi'
import { LANGUAGES } from '../config'
import { fetchDeepLVoiceLanguages, type DeepLLanguage } from '../lib/languagesApi'

export function LanguageSetupPage() {
  const { user, token, sourceLang, setLanguages } = useAuth()
  const navigate = useNavigate()
  const [src, setSrc] = useState(sourceLang)
  const [loading, setLoading] = useState(false)
  const [languagesLoading, setLanguagesLoading] = useState(true)
  const [languagesError, setLanguagesError] = useState<string | null>(null)
  const [deeplLanguages, setDeeplLanguages] = useState<DeepLLanguage[]>([])

  const languageOptions = useMemo(() => {
    if (deeplLanguages.length > 0) return deeplLanguages
    return LANGUAGES.map((l) => ({ code: l.code, label: l.label }))
  }, [deeplLanguages])

  useEffect(() => {
    let cancelled = false
    setLanguagesLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    setLanguagesError(null)
    void fetchDeepLVoiceLanguages()
      .then((list) => {
        if (cancelled) return
        if (list.length > 0) {
          setDeeplLanguages(list)
          if (!list.some((l) => l.code === src)) {
            setSrc(list[0].code)
          }
        }
      })
      .catch((err) => {
        if (cancelled) return
        setLanguagesError(err instanceof Error ? err.message : 'Could not load DeepL languages')
      })
      .finally(() => {
        if (!cancelled) setLanguagesLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleContinue() {
    setLoading(true)
    setLanguages(src, src)

    if (token) {
      try {
        await updateLanguages(token, src, src)
      } catch {
        // Non-fatal
      }
    }

    setLoading(false)
    navigate('/app/translate')
  }

  return (
    <AuthLayout>
      {/* M3 Headline Small */}
      <h2
        className="mb-2"
        style={{
          fontSize: '1.5rem',
          fontWeight: 400,
          lineHeight: '2rem',
          color: 'var(--md-on-surface)',
        }}
      >
        Your language
      </h2>

      {user && (
        <p
          className="mb-5"
          style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--md-on-surface-variant)' }}
        >
          Hi,{' '}
          <span style={{ fontWeight: 500, color: 'var(--md-on-surface)' }}>
            {user.displayName}
          </span>
          ! Select the language you will speak during the session.
        </p>
      )}
      {!user && (
        <p
          className="mb-5"
          style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--md-on-surface-variant)' }}
        >
          Select the language you will speak. Your partner's language will be detected automatically
          when they join.
        </p>
      )}

      <div className="md-field mb-4">
        <label className="md-field-label" htmlFor="lang-select">
          My language
        </label>
        <select
          id="lang-select"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          disabled={languagesLoading}
          className="md-field-input"
          style={{ cursor: 'pointer' }}
        >
          {languageOptions.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {languagesLoading && (
        <p
          className="mb-3"
          style={{ fontSize: '0.75rem', color: 'var(--md-outline)', lineHeight: '1rem' }}
        >
          Loading DeepL language list…
        </p>
      )}
      {languagesError && (
        <p
          className="mb-3"
          style={{ fontSize: '0.75rem', color: 'var(--md-error)', lineHeight: '1rem' }}
        >
          {languagesError}. Using built-in fallback list.
        </p>
      )}

      <button
        onClick={handleContinue}
        disabled={loading}
        className="md-btn md-btn-filled"
        style={{ width: '100%' }}
      >
        {loading ? 'Saving…' : 'Continue'}
      </button>
    </AuthLayout>
  )
}
