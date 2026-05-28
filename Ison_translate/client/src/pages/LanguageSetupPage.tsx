import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { updateLanguages } from '../lib/authApi'
import { LANGUAGES } from '../config'

export function LanguageSetupPage() {
  const { user, token, sourceLang, setLanguages } = useAuth()
  const navigate = useNavigate()
  const [src, setSrc] = useState(sourceLang)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    setLoading(true)
    // Only source lang is chosen here; target will be auto-assigned from partner's source
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
      <h2 className="mb-2 text-xl font-bold text-white">Your language</h2>
      {user && (
        <p className="mb-5 text-sm text-slate-400">
          Hi,{' '}
          <span className="font-medium text-white">{user.displayName}</span>! Select the language
          you will speak during the session.
        </p>
      )}
      {!user && (
        <p className="mb-5 text-sm text-slate-400">
          Select the language you will speak. Your partner's language will be detected automatically
          when they join.
        </p>
      )}

      <label className="mb-6 block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
          My language
        </span>
        <select
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-indigo-500/40 focus:ring-2"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-slate-900">
              {lang.label}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={handleContinue}
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Continue'}
      </button>
    </AuthLayout>
  )
}
