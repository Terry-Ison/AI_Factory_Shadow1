import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { useAuth } from '../context/AuthContext'

export function JoinSessionPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const { setGuestSession, setPendingSession, user } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const id = sessionId.trim().toLowerCase()
    if (!id) {
      setError('Invalid session link')
      return
    }

    async function join() {
      try {
        const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`)
        if (!res.ok) {
          setError('Session not found or expired')
          return
        }
      } catch {
        // Allow join even if lookup fails (session may be created on connect)
      }

      if (user) {
        setPendingSession(id)
      } else {
        setGuestSession(id)
      }
      navigate('/setup/languages', { replace: true })
    }

    void join()
  }, [sessionId, setGuestSession, setPendingSession, user, navigate])

  if (error) {
    return (
      <AuthLayout>
        <h2 style={{ color: 'var(--md-on-surface)', marginBottom: '0.5rem' }}>Cannot join session</h2>
        <p style={{ color: 'var(--md-on-surface-variant)' }}>{error}</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <p style={{ color: 'var(--md-on-surface-variant)' }}>Joining session…</p>
    </AuthLayout>
  )
}
