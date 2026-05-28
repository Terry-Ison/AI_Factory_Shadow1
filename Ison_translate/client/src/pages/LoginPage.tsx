import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { useAuth } from '../context/AuthContext'

type Tab = 'signin' | 'signup' | 'guest'

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('signin')
  const { login, register, setGuestSession } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthLayout>
      {/* Tabs */}
      <div className="mb-6 flex rounded-xl bg-white/5 p-1">
        {(['signin', 'signup', 'guest'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              tab === t
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'signin' ? 'Sign in' : t === 'signup' ? 'Sign up' : 'Join session'}
          </button>
        ))}
      </div>

      {tab === 'signin' && (
        <SignInForm
          login={login}
          onSuccess={() => navigate('/setup/languages')}
        />
      )}
      {tab === 'signup' && (
        <SignUpForm
          register={register}
          onSuccess={() => navigate('/setup/languages')}
        />
      )}
      {tab === 'guest' && (
        <GuestJoinForm
          onSuccess={(sessionId) => {
            setGuestSession(sessionId)
            navigate('/setup/languages')
          }}
        />
      )}
    </AuthLayout>
  )
}

function SignInForm({
  login,
  onSuccess,
}: {
  login: (email: string, password: string) => Promise<void>
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email" type="email" value={email} onChange={setEmail} />
      <Field label="Password" type="password" value={password} onChange={setPassword} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <SubmitButton loading={loading} label="Sign in" />
    </form>
  )
}

function SignUpForm({
  register,
  onSuccess,
}: {
  register: (email: string, password: string, displayName: string) => Promise<void>
  onSuccess: () => void
}) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register(email, password, displayName)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Display name" type="text" value={displayName} onChange={setDisplayName} />
      <Field label="Email" type="email" value={email} onChange={setEmail} />
      <Field label="Password" type="password" value={password} onChange={setPassword} />
      <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <SubmitButton loading={loading} label="Create account" />
    </form>
  )
}

function GuestJoinForm({ onSuccess }: { onSuccess: (sessionId: string) => void }) {
  const [sessionKey, setSessionKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const key = sessionKey.trim()
    if (!key) {
      setError('Please enter a session key')
      return
    }
    setError('')
    setHint(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(key)}`)
      const data = await res.json()
      if (data.exists && data.active) {
        setHint('Room found — joining…')
      }
    } catch {
      // Lookup failed — still allow joining (new room)
    } finally {
      setLoading(false)
      onSuccess(key)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
          Session key
        </label>
        <input
          type="text"
          value={sessionKey}
          onChange={(e) => setSessionKey(e.target.value)}
          placeholder="e.g. demo-room-1"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-indigo-500/40 focus:ring-2"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {hint && <p className="text-sm text-green-400">{hint}</p>}
      <SubmitButton loading={loading} label="Continue as guest" />
    </form>
  )
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-indigo-500/40 focus:ring-2"
      />
    </div>
  )
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Please wait…' : label}
    </button>
  )
}
