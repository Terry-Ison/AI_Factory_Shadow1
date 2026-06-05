import { authHeaders } from './authApi'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export type OrgUser = {
  id: string
  email: string
  displayName: string
  defaultSourceLang: string
  defaultTargetLang: string
  orgRole: 'tenant_admin' | 'member'
  status: 'pending' | 'active' | 'suspended' | 'rejected'
  createdAt: string
  joinedAt: string
}

export type UserMembership = {
  organizationId: string
  organizationName: string
  organizationSlug: string
  orgRole: 'tenant_admin' | 'member'
  status: 'pending' | 'active' | 'suspended' | 'rejected'
  joinedAt: string
}

export type GlobalUser = {
  id: string
  email: string
  displayName: string
  defaultSourceLang: string
  defaultTargetLang: string
  globalRole: 'super_admin' | null
  createdAt: string
  memberships: UserMembership[]
}

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
      ...(init.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data as T
}

export async function fetchOrgUsers(
  token: string,
  params: { page?: number; limit?: number; status?: string } = {},
): Promise<{ page: number; limit: number; total: number; users: OrgUser[] }> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  if (params.status) q.set('status', params.status)
  const qs = q.toString()
  return request(`/api/users${qs ? `?${qs}` : ''}`, token)
}

export async function fetchAllUsers(
  token: string,
  params: { page?: number; limit?: number; status?: string; organizationId?: string } = {},
): Promise<{ page: number; limit: number; total: number; users: GlobalUser[] }> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  if (params.status) q.set('status', params.status)
  if (params.organizationId) q.set('organizationId', params.organizationId)
  const qs = q.toString()
  return request(`/api/users${qs ? `?${qs}` : ''}`, token)
}

export async function createOrgUser(
  token: string,
  body: { email: string; password: string; displayName: string; orgRole?: 'tenant_admin' | 'member' },
): Promise<{ user: OrgUser }> {
  return request('/api/users', token, { method: 'POST', body: JSON.stringify(body) })
}

export async function updateOrgUserStatus(
  token: string,
  id: string,
  status: OrgUser['status'],
): Promise<{ user: OrgUser }> {
  return request(`/api/users/${encodeURIComponent(id)}/status`, token, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export async function deleteOrgUser(token: string, id: string): Promise<{ ok: boolean }> {
  return request(`/api/users/${encodeURIComponent(id)}`, token, { method: 'DELETE' })
}
