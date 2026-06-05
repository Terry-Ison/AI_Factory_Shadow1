<<<<<<< Updated upstream
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  canAccessHistory as checkCanAccessHistory,
  fetchMe,
  isPendingMember as checkIsPending,
  isSuperAdmin as checkIsSuperAdmin,
  isTenantAdmin as checkIsTenantAdmin,
=======
import { createContext, useCallback, useContext, useState } from 'react'
import {
  canAccessHistory,
  isPendingMember,
  isSuperAdmin,
  isTenantAdmin,
>>>>>>> Stashed changes
  login as apiLogin,
  register as apiRegister,
  type AuthUser,
  type RegisterOptions,
} from '../lib/authApi'

type AuthState = {
  user: AuthUser | null
  token: string | null
  isGuest: boolean
  pendingSessionId: string | null
  sourceLang: string
  targetLang: string
  isSuperAdmin: boolean
  isTenantAdmin: boolean
  isPending: boolean
  canAccessHistory: boolean
}

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>
<<<<<<< Updated upstream
  register: (email: string, password: string, displayName: string, options?: RegisterOptions) => Promise<void>
=======
  register: (
    email: string,
    password: string,
    displayName: string,
    options?: RegisterOptions,
  ) => Promise<void>
>>>>>>> Stashed changes
  logout: () => void
  setGuestSession: (sessionId: string) => void
  setPendingSession: (sessionId: string) => void
  setLanguages: (source: string, target: string) => void
  clearPendingSession: () => void
  isSuperAdmin: boolean
  isTenantAdmin: boolean
  isPending: boolean
  canAccessHistory: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'transly_token'
const USER_KEY = 'transly_user'
const GUEST_SESSION_KEY = 'transly_guest_session'

<<<<<<< Updated upstream
function deriveFlags(user: AuthUser | null) {
  return {
    isSuperAdmin: checkIsSuperAdmin(user),
    isTenantAdmin: checkIsTenantAdmin(user),
    isPending: checkIsPending(user),
    canAccessHistory: checkCanAccessHistory(user),
  }
}

function applyUser(user: AuthUser | null): Pick<AuthState, 'user' | 'isSuperAdmin' | 'isTenantAdmin' | 'isPending' | 'canAccessHistory' | 'sourceLang' | 'targetLang'> {
  return {
    user,
    sourceLang: user?.defaultSourceLang ?? 'en',
    targetLang: user?.defaultTargetLang ?? 'es',
    ...deriveFlags(user),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const user = JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as AuthUser | null
      const guestSessionId = sessionStorage.getItem(GUEST_SESSION_KEY)
      const isGuest = !user && !!guestSessionId
      return {
        token,
        isGuest,
        pendingSessionId: guestSessionId,
        ...applyUser(user),
      }
    } catch {
      return {
        user: null,
        token: null,
        isGuest: false,
        pendingSessionId: null,
        sourceLang: 'en',
        targetLang: 'es',
        isSuperAdmin: false,
        isTenantAdmin: false,
        isPending: false,
        canAccessHistory: false,
      }
=======
function loadInitialState(): AuthState {
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
>>>>>>> Stashed changes
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
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loadInitialState)

  const persist = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }, [])

<<<<<<< Updated upstream
  useEffect(() => {
    const token = state.token
    if (!token || state.isGuest) return

    let cancelled = false
    fetchMe(token)
      .then(({ user }) => {
        if (cancelled) return
        persist(token, user)
        setState((s) => ({
          ...s,
          ...applyUser(user),
        }))
      })
      .catch(() => {
        if (cancelled) return
      })

    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- refresh once on mount

=======
>>>>>>> Stashed changes
  const applyAuth = useCallback(
    (token: string, user: AuthUser) => {
      persist(token, user)
      setState((s) => ({
        ...s,
        token,
        isGuest: false,
        ...applyUser(user),
      }))
    },
    [persist],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user } = await apiLogin(email, password)
      applyAuth(token, user)
    },
    [applyAuth],
  )

  const register = useCallback(
<<<<<<< Updated upstream
    async (email: string, password: string, displayName: string, options: RegisterOptions = {}) => {
=======
    async (
      email: string,
      password: string,
      displayName: string,
      options: RegisterOptions = {},
    ) => {
>>>>>>> Stashed changes
      const { token, user } = await apiRegister(email, password, displayName, options)
      applyAuth(token, user)
    },
    [applyAuth],
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
      isSuperAdmin: false,
      isTenantAdmin: false,
      isPending: false,
      canAccessHistory: false,
    })
  }, [])

  const setGuestSession = useCallback((sessionId: string) => {
    sessionStorage.setItem(GUEST_SESSION_KEY, sessionId)
    setState((s) => ({
      ...s,
      isGuest: true,
      pendingSessionId: sessionId,
      user: null,
      token: null,
      isSuperAdmin: false,
      isTenantAdmin: false,
      isPending: false,
      canAccessHistory: false,
    }))
  }, [])

  const setPendingSession = useCallback((sessionId: string) => {
    sessionStorage.setItem(GUEST_SESSION_KEY, sessionId)
    setState((s) => ({ ...s, pendingSessionId: sessionId }))
  }, [])

  const setLanguages = useCallback((source: string, target: string) => {
    setState((s) => ({ ...s, sourceLang: source, targetLang: target }))
  }, [])

  const clearPendingSession = useCallback(() => {
    sessionStorage.removeItem(GUEST_SESSION_KEY)
    setState((s) => ({ ...s, pendingSessionId: null }))
  }, [])

  const user = state.user

  return (
    <AuthContext.Provider
<<<<<<< Updated upstream
      value={{ ...state, login, register, logout, setGuestSession, setPendingSession, setLanguages, clearPendingSession }}
=======
      value={{
        ...state,
        login,
        register,
        logout,
        setGuestSession,
        setLanguages,
        clearPendingSession,
        isSuperAdmin: isSuperAdmin(user),
        isTenantAdmin: isTenantAdmin(user),
        isPending: isPendingMember(user),
        canAccessHistory: canAccessHistory(user),
      }}
>>>>>>> Stashed changes
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
