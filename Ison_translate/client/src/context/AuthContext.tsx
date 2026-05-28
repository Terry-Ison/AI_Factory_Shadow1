import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { login as apiLogin, register as apiRegister, type AuthUser } from '../lib/authApi'

export type AuthMode = 'authenticated' | 'guest' | null

type AuthState = {
  user: AuthUser | null
  token: string | null
  isGuest: boolean
  pendingSessionId: string | null
  sourceLang: string
  targetLang: string
  isLoading: boolean
}

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  setGuestSession: (sessionId: string) => void
  setLanguages: (source: string, target: string) => void
  clearPendingSession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'transly_token'
const USER_KEY = 'transly_user'
const GUEST_SESSION_KEY = 'transly_guest_session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const user = JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as AuthUser | null
      const guestSessionId = sessionStorage.getItem(GUEST_SESSION_KEY)
      const isGuest = !user && !!guestSessionId
      const src = user?.defaultSourceLang ?? 'en'
      const tgt = user?.defaultTargetLang ?? 'es'
      return {
        user,
        token,
        isGuest,
        pendingSessionId: guestSessionId,
        sourceLang: src,
        targetLang: tgt,
        isLoading: false,
      }
    } catch {
      return {
        user: null,
        token: null,
        isGuest: false,
        pendingSessionId: null,
        sourceLang: 'en',
        targetLang: 'es',
        isLoading: false,
      }
    }
  })

  const persist = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user } = await apiLogin(email, password)
      persist(token, user)
      setState((s) => ({
        ...s,
        user,
        token,
        isGuest: false,
        pendingSessionId: null,
        sourceLang: user.defaultSourceLang,
        targetLang: user.defaultTargetLang,
      }))
    },
    [persist],
  )

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { token, user } = await apiRegister(email, password, displayName)
      persist(token, user)
      setState((s) => ({
        ...s,
        user,
        token,
        isGuest: false,
        pendingSessionId: null,
        sourceLang: user.defaultSourceLang,
        targetLang: user.defaultTargetLang,
      }))
    },
    [persist],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(GUEST_SESSION_KEY)
    setState({
      user: null,
      token: null,
      isGuest: false,
      pendingSessionId: null,
      sourceLang: 'en',
      targetLang: 'es',
      isLoading: false,
    })
  }, [])

  const setGuestSession = useCallback((sessionId: string) => {
    sessionStorage.setItem(GUEST_SESSION_KEY, sessionId)
    setState((s) => ({ ...s, isGuest: true, pendingSessionId: sessionId, user: null, token: null }))
  }, [])

  const setLanguages = useCallback((source: string, target: string) => {
    setState((s) => ({ ...s, sourceLang: source, targetLang: target }))
  }, [])

  const clearPendingSession = useCallback(() => {
    sessionStorage.removeItem(GUEST_SESSION_KEY)
    setState((s) => ({ ...s, pendingSessionId: null }))
  }, [])

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, setGuestSession, setLanguages, clearPendingSession }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
