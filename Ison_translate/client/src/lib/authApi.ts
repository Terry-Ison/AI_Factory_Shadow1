const API_BASE = import.meta.env.VITE_API_URL ?? ''

export type AuthUser = {
  id: string
  email: string
  displayName: string
  defaultSourceLang: string
  defaultTargetLang: string
  createdAt: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
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

export async function register(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResponse> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
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
