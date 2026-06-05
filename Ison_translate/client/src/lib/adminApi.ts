import { authHeaders } from './authApi'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

<<<<<<< Updated upstream
=======
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

>>>>>>> Stashed changes
export type VoiceProvider = {
  id: string
  name: string
  type: string
  apiUrl: string
  isActive: boolean
<<<<<<< Updated upstream
  isGlobalDefault: boolean
  hasApiKey: boolean
  apiKeyPreview: string | null
  createdAt: string
  updatedAt: string
=======
  hasApiKey?: boolean
  enabled?: boolean
  isDefault?: boolean
>>>>>>> Stashed changes
}

export type Organization = {
  id: string
  name: string
  slug: string
  inviteCode: string
  isActive: boolean
<<<<<<< Updated upstream
  memberCount: number
  createdAt: string
}

export type OrgMember = {
  membershipId: string
  userId: string
  email: string
  displayName: string
  orgRole: 'tenant_admin' | 'member'
  status: 'pending' | 'active' | 'suspended' | 'rejected'
  joinedAt: string
}

export type OrgVoiceProvider = {
  id: string
  name: string
  type: string
  apiUrl: string
  isActive: boolean
  enabled: boolean
  isDefault: boolean
}

=======
  memberCount?: number
  createdAt: string
}

>>>>>>> Stashed changes
export type Analytics = {
  from: string
  to: string
  sessionCount: number
  endedSessionCount: number
  totalDurationMs: number
  activeMembers: number
  pendingMembers: number
  transcriptSegmentCount: number
  recordingCount: number
  recordingBytes: number
  languagePairs: Record<string, number>
  sessionsByDay: Array<{ date: string; count: number }>
}

<<<<<<< Updated upstream
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

export async function fetchSessionInvite(sessionId: string): Promise<{ sessionId: string; inviteUrl: string }> {
  const res = await fetch(`${API_BASE}/api/sessions/${encodeURIComponent(sessionId)}/invite`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to get invite link')
  return data
}

export async function fetchVoiceProviders(token: string): Promise<{ providers: VoiceProvider[] }> {
  return request('/api/admin/voice-providers', token)
=======
export async function fetchSessionInvite(sessionId: string) {
  const res = await fetch(`${API_BASE}/api/sessions/${encodeURIComponent(sessionId)}/invite`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to get invite link')
  return data as { sessionId: string; inviteUrl: string }
}

// Super admin
export async function fetchVoiceProviders(token: string) {
  return request<{ providers: VoiceProvider[] }>('/api/admin/voice-providers', token)
>>>>>>> Stashed changes
}

export async function createVoiceProvider(
  token: string,
<<<<<<< Updated upstream
  body: { name: string; type?: string; apiUrl: string; apiKey: string; isActive?: boolean },
): Promise<{ provider: VoiceProvider }> {
  return request('/api/admin/voice-providers', token, { method: 'POST', body: JSON.stringify(body) })
=======
  body: { name: string; type: string; apiUrl: string; apiKey: string; isActive?: boolean },
) {
  return request<{ provider: VoiceProvider }>('/api/admin/voice-providers', token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
>>>>>>> Stashed changes
}

export async function updateVoiceProvider(
  token: string,
  id: string,
<<<<<<< Updated upstream
  body: Partial<{ name: string; apiUrl: string; apiKey: string; isActive: boolean; isGlobalDefault: boolean }>,
): Promise<{ provider: VoiceProvider }> {
  return request(`/api/admin/voice-providers/${encodeURIComponent(id)}`, token, {
=======
  body: Partial<{ name: string; apiUrl: string; apiKey: string; isActive: boolean }>,
) {
  return request<{ provider: VoiceProvider }>(`/api/admin/voice-providers/${id}`, token, {
>>>>>>> Stashed changes
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

<<<<<<< Updated upstream
export async function deleteVoiceProvider(
  token: string,
  id: string,
): Promise<{ ok: boolean; deactivated?: boolean }> {
  return request(`/api/admin/voice-providers/${encodeURIComponent(id)}`, token, {
    method: 'DELETE',
  })
}

export async function fetchOrganizations(
  token: string,
  page = 1,
  limit = 50,
): Promise<{ page: number; limit: number; total: number; organizations: Organization[] }> {
  return request(`/api/admin/organizations?page=${page}&limit=${limit}`, token)
=======
export async function fetchOrganizations(token: string, page = 1) {
  return request<{ organizations: Organization[]; total: number }>(
    `/api/admin/organizations?page=${page}`,
    token,
  )
>>>>>>> Stashed changes
}

export async function createOrganization(
  token: string,
  body: {
    name: string
    slug?: string
    tenantAdminEmail?: string
    tenantAdminPassword?: string
    tenantAdminDisplayName?: string
  },
<<<<<<< Updated upstream
): Promise<{ organization: Organization }> {
  return request('/api/admin/organizations', token, { method: 'POST', body: JSON.stringify(body) })
=======
) {
  return request<{ organization: Organization }>('/api/admin/organizations', token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
>>>>>>> Stashed changes
}

export async function patchOrganization(
  token: string,
  id: string,
  body: Partial<{ name: string; isActive: boolean; rotateInviteCode: boolean }>,
<<<<<<< Updated upstream
): Promise<{ organization: Organization }> {
  return request(`/api/admin/organizations/${encodeURIComponent(id)}`, token, {
=======
) {
  return request<{ organization: Organization }>(`/api/admin/organizations/${id}`, token, {
>>>>>>> Stashed changes
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

<<<<<<< Updated upstream
export async function fetchOrgMembers(
  token: string,
  organizationId: string,
): Promise<{ members: OrgMember[] }> {
  return request(`/api/admin/organizations/${encodeURIComponent(organizationId)}/members`, token)
}

export async function addOrgMember(
  token: string,
  organizationId: string,
  body: {
    userId?: string
    email?: string
    password?: string
    displayName?: string
    orgRole?: 'tenant_admin' | 'member'
    status?: OrgMember['status']
  },
): Promise<{ member: OrgMember }> {
  return request(`/api/admin/organizations/${encodeURIComponent(organizationId)}/members`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateOrgMember(
  token: string,
  organizationId: string,
  userId: string,
  body: Partial<{ orgRole: 'tenant_admin' | 'member'; status: OrgMember['status'] }>,
): Promise<{ member: OrgMember }> {
  return request(
    `/api/admin/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`,
    token,
    { method: 'PATCH', body: JSON.stringify(body) },
  )
}

export async function removeOrgMember(
  token: string,
  organizationId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  return request(
    `/api/admin/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`,
    token,
    { method: 'DELETE' },
  )
}

export async function fetchOrgVoiceProviders(token: string): Promise<{ providers: OrgVoiceProvider[] }> {
  return request('/api/admin/organization/voice-providers', token)
}

export async function updateOrgVoiceProviders(
  token: string,
  providers: Array<{ voiceProviderId: string; enabled: boolean; isDefault: boolean }>,
): Promise<{ providers: OrgVoiceProvider[] }> {
  return request('/api/admin/organization/voice-providers', token, {
    method: 'PUT',
    body: JSON.stringify({ providers }),
  })
}

export async function fetchAnalytics(token: string, from?: string, to?: string): Promise<Analytics> {
=======
// Tenant admin
export async function fetchOrgVoiceProviders(token: string) {
  return request<{ providers: VoiceProvider[] }>(
    '/api/admin/organization/voice-providers',
    token,
  )
}

export async function updateOrgVoiceProviders(
  token: string,
  providers: Array<{ voiceProviderId: string; enabled: boolean; isDefault: boolean }>,
) {
  return request<{ providers: VoiceProvider[] }>(
    '/api/admin/organization/voice-providers',
    token,
    {
      method: 'PUT',
      body: JSON.stringify({ providers }),
    },
  )
}

export async function fetchAnalytics(token: string, from?: string, to?: string) {
>>>>>>> Stashed changes
  const q = new URLSearchParams()
  if (from) q.set('from', from)
  if (to) q.set('to', to)
  const qs = q.toString()
<<<<<<< Updated upstream
  return request(`/api/admin/analytics${qs ? `?${qs}` : ''}`, token)
=======
  return request<Analytics>(`/api/admin/analytics${qs ? `?${qs}` : ''}`, token)
>>>>>>> Stashed changes
}
