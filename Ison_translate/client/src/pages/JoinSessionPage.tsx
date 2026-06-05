import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { useAuth } from '../context/AuthContext'

export function JoinSessionPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
<<<<<<< Updated upstream
  const { setGuestSession, setPendingSession, user } = useAuth()
=======
  const { setGuestSession, user } = useAuth()
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
        sessionStorage.setItem('transly_guest_session', id)
        navigate('/setup/languages', { replace: true })
      } else {
        setGuestSession(id)
        navigate('/setup/languages', { replace: true })
      }
    }

    void join()
  }, [sessionId, navigate, setGuestSession, user])

  return (
    <AuthLayout>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--md-on-surface)' }}>
        Joining session…
      </h2>
      {error ? (
        <p style={{ color: 'var(--md-error)', marginTop: '1rem' }}>{error}</p>
      ) : (
        <p style={{ color: 'var(--md-on-surface-variant)', marginTop: '0.5rem' }}>
          Validating session link
        </p>
      )}
>>>>>>> Stashed changes
    </AuthLayout>
  )
}
