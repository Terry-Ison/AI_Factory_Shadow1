import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { useAuth } from '../context/AuthContext'

type View = 'signin' | 'signup' | 'guest'

/* ─── shared style constants ─────────────────────────────────── */

const headingStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  lineHeight: '2rem',
  color: 'var(--md-on-surface)',
  marginBottom: '0.375rem',
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  lineHeight: '1.375rem',
  color: 'var(--md-on-surface-variant)',
  marginBottom: '1.75rem',
}

const switchRowStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  textAlign: 'center',
  fontSize: '0.875rem',
  color: 'var(--md-on-surface-variant)',
}

/* ─── root component ─────────────────────────────────────────── */

export function LoginPage() {
  const [view, setView] = useState<View>('signin')
  const { login, register, setGuestSession } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthLayout>
<<<<<<< Updated upstream
      {/* Tabs */}
      <div className="mb-6 flex rounded-xl bg-white/5 p-1">
        {(['signin', 'signup', 'guest'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold cursor-pointer transition ${
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
=======
      {view === 'signin' && (
        <SignInView
>>>>>>> Stashed changes
          login={login}
          onSuccess={() => navigate('/setup/languages')}
          onSignUp={() => setView('signup')}
          onGuest={() => setView('guest')}
        />
      )}
      {view === 'signup' && (
        <SignUpView
          register={register}
          onSuccess={() => navigate('/setup/languages')}
          onSignIn={() => setView('signin')}
        />
      )}
      {view === 'guest' && (
        <GuestView
          onSuccess={(sessionId) => {
            setGuestSession(sessionId)
            navigate('/setup/languages')
          }}
          onSignIn={() => setView('signin')}
        />
      )}
    </AuthLayout>
  )
}

/* ─── Sign In ─────────────────────────────────────────────────── */

function SignInView({
  login,
  onSuccess,
  onSignUp,
  onGuest,
}: {
  login: (email: string, password: string) => Promise<void>
  onSuccess: () => void
  onSignUp: () => void
  onGuest: () => void
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
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 style={headingStyle}>Sign in</h2>
      <p style={subtitleStyle}>Enter your credentials to continue.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <PrimaryButton loading={loading} label="Sign in" />
      </form>

      <Divider />

      {/* Guest join — Teams "Join a meeting" equivalent */}
      <button
        type="button"
        onClick={onGuest}
        className="md-btn md-btn-outlined"
        style={{ width: '100%' }}
      >
        Join a session as guest
      </button>

      <p style={switchRowStyle}>
        Don't have an account?{' '}
        <InlineLink onClick={onSignUp}>Create one</InlineLink>
      </p>
    </>
  )
}

/* ─── Sign Up ─────────────────────────────────────────────────── */

function SignUpView({
  register,
  onSuccess,
  onSignIn,
}: {
  register: (email: string, password: string, displayName: string) => Promise<void>
  onSuccess: () => void
  onSignIn: () => void
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
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
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
    <>
      <h2 style={headingStyle}>Create an account</h2>
      <p style={subtitleStyle}>Join Transly for real-time voice translation.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Display name" type="text" value={displayName} onChange={setDisplayName} autoComplete="name" />
        <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <PrimaryButton loading={loading} label="Create account" />
      </form>

      <p style={switchRowStyle}>
        Already have an account?{' '}
        <InlineLink onClick={onSignIn}>Sign in</InlineLink>
      </p>
    </>
  )
}

/* ─── Guest Join ─────────────────────────────────────────────── */

function GuestView({
  onSuccess,
  onSignIn,
}: {
  onSuccess: (sessionId: string) => void
  onSignIn: () => void
}) {
  const [sessionKey, setSessionKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const key = sessionKey.trim()
    if (!key) { setError('Please enter a session key'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(key)}`)
      await res.json()
    } catch {
      // Lookup failed — still allow joining
    } finally {
      setLoading(false)
      onSuccess(key)
    }
  }

  return (
    <>
      <h2 style={headingStyle}>Join a session</h2>
      <p style={subtitleStyle}>Enter the session key shared by your partner. No account needed.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="md-field">
          <label className="md-field-label" htmlFor="guest-key">
            Session key
          </label>
          <input
            id="guest-key"
            type="text"
            value={sessionKey}
            onChange={(e) => setSessionKey(e.target.value)}
            placeholder="e.g. abc-123-xyz"
            className="md-field-input"
            autoFocus
          />
        </div>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <PrimaryButton loading={loading} label="Continue as guest" />
      </form>

      <p style={switchRowStyle}>
        Have an account?{' '}
        <InlineLink onClick={onSignIn}>Sign in instead</InlineLink>
      </p>
    </>
  )
}

/* ─── Shared primitives ──────────────────────────────────────── */

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="md-field">
      <label className="md-field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        className="md-field-input"
      />
    </div>
  )
}

function PrimaryButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
<<<<<<< Updated upstream
      className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
=======
      className="md-btn md-btn-filled"
      style={{ width: '100%', marginTop: '0.5rem' }}
>>>>>>> Stashed changes
    >
      {loading ? 'Please wait…' : label}
    </button>
  )
}

function Divider() {
  return (
    <div
      className="flex items-center gap-3"
      style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.75rem', margin: '2.25rem 0 1.25rem' }}
    >
      <span
        style={{
          flex: 1,
          height: '1px',
          background: 'var(--md-outline-variant)',
        }}
      />
      or
      <span
        style={{
          flex: 1,
          height: '1px',
          background: 'var(--md-outline-variant)',
        }}
      />
    </div>
  )
}

function InlineLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: 'var(--md-primary)',
        fontWeight: 500,
        fontSize: 'inherit',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none' }}
    >
      {children}
    </button>
  )
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-2 px-3 py-2.5"
      style={{
        background: 'var(--md-error-container)',
        color: 'var(--md-on-error-container)',
        fontSize: '0.875rem',
        lineHeight: '1.375rem',
        borderRadius: 'var(--shape-sm)',
      }}
    >
      {children}
    </div>
  )
}
