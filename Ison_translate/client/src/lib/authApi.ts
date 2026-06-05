const API_BASE = import.meta.env.VITE_API_URL ?? ''

export type AuthUser = {
  id: string
  email: string
  displayName: string
  defaultSourceLang: string
  defaultTargetLang: string
  createdAt: string
  globalRole: 'super_admin' | null
  orgId: string | null
  orgRole: 'tenant_admin' | 'member' | null
  membershipStatus: 'pending' | 'active' | 'suspended' | 'rejected' | null
}

export type AuthResponse = {
  token: string
  user: AuthUser
}

export type RegisterOptions = {
  organizationSlug?: string
  inviteCode?: string
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data as T
}

export function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
  return user?.globalRole === 'super_admin'
}

export function isTenantAdmin(user: AuthUser | null | undefined): boolean {
  return (
    user?.orgRole === 'tenant_admin' &&
    user?.membershipStatus === 'active'
  )
}

export function isPendingMember(user: AuthUser | null | undefined): boolean {
  return Boolean(user?.orgId && user.membershipStatus === 'pending')
}

export function canAccessHistory(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (!user.orgId) return true
  return user.membershipStatus === 'active'
}

export async function register(
  email: string,
  password: string,
  displayName: string,
  options: RegisterOptions = {},
): Promise<AuthResponse> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName, ...options }),
  })
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchMe(token: string): Promise<{ user: AuthUser }> {
  return request('/api/auth/me', { headers: authHeaders(token) })
}

export async function updateLanguages(
  token: string,
  defaultSourceLang: string,
  defaultTargetLang: string,
): Promise<{ user: AuthUser }> {
  return request('/api/auth/me/languages', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ defaultSourceLang, defaultTargetLang }),
  })
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.globalRole === 'super_admin'
}

export function isTenantAdmin(user: AuthUser | null): boolean {
  return (
    user?.globalRole === 'super_admin' ||
    (user?.orgRole === 'tenant_admin' && user?.membershipStatus === 'active')
  )
}

export function isPendingMember(user: AuthUser | null): boolean {
  return Boolean(user?.orgId && user?.membershipStatus === 'pending')
}

export function canAccessHistory(user: AuthUser | null): boolean {
  if (!user) return false
  if (!user.orgId) return true
  return user.membershipStatus === 'active'
}
