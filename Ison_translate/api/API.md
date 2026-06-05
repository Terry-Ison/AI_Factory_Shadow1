# Ison Translate API Reference

Real-time voice translation backend. HTTP/JSON over Express plus a Socket.IO
realtime channel for audio streaming and transcripts.

- Base URL (dev): `http://localhost:3001`
- All JSON request bodies require `Content-Type: application/json`.
- Authenticated routes expect a bearer token: `Authorization: Bearer <JWT>`.
- The JWT is issued by `/api/auth/login` and `/api/auth/register`.

## Roles and access model

| Claim | Values | Meaning |
| --- | --- | --- |
| `globalRole` | `super_admin`, `null` | Platform-wide administrator. |
| `orgRole` | `tenant_admin`, `member`, `null` | Role inside the active organization. |
| `membershipStatus` | `pending`, `active`, `suspended`, `rejected` | Status of the user in their organization. |

Middleware guards:

- `requireAuth` - valid JWT required.
- `optionalAuth` - attaches `req.user` if a valid JWT is present, otherwise continues anonymously.
- `requireTenantAdmin` - `orgRole = tenant_admin` or `globalRole = super_admin`.
- `requireSuperAdmin` - `globalRole = super_admin`.
- `requireActiveMember` - authenticated user with `membershipStatus = active` (or `super_admin`).

## Common error shape

All errors return JSON:

```json
{ "error": "Human readable message" }
```

| Status | Meaning |
| --- | --- |
| 400 | Validation error / bad input. |
| 401 | Missing or invalid credentials. |
| 403 | Authenticated but not authorized (role/org/status). |
| 404 | Resource not found. |
| 409 | Conflict (duplicate email, slug, membership). |
| 429 | Rate limit exceeded. |
| 502 / 503 | Upstream (DeepL) or persistence unavailable. |

Rate limits: global 120 req/min per IP; auth 20 req/min; session create 10 req/min;
admin and users routers 60 req/min.

---

## Health

### GET `/health`
Public. Liveness plus database and DeepL configuration status.

```json
{
  "ok": true,
  "databaseConfigured": true,
  "databaseOk": true,
  "databaseError": null,
  "deeplConfigured": true,
  "deeplOk": true,
  "deeplError": null
}
```

### GET `/admin/health`
Public. Same as `/health` plus `activeSessions` (in-memory session count).

---

## Auth - `/api/auth`

### POST `/api/auth/register`
Public. Creates a user account. Optionally associates the user with an organization
via `organizationSlug` or `inviteCode` (mutually exclusive); the resulting membership
starts as `pending`.

Request:

```json
{
  "email": "user@example.com",
  "password": "min-8-chars",
  "displayName": "Jane Doe",
  "organizationSlug": "acme-corp",
  "inviteCode": "optional-instead-of-slug"
}
```

Response `201`: `{ "token": "<JWT>", "user": { ... } }`

Errors: `400` validation, `409` email already exists, `503` persistence disabled.

### POST `/api/auth/login`
Public. Returns `{ "token", "user" }`. Errors: `400` missing fields, `401` invalid credentials.

### GET `/api/auth/me`
`requireAuth`. Returns the current `{ "user" }` with refreshed org claims.

### PATCH `/api/auth/me/languages`
`requireAuth`. Updates the user's default languages.

Request: `{ "defaultSourceLang": "en", "defaultTargetLang": "es" }` (both optional).
Response: `{ "user": { ... } }`.

---

## Sessions - `/api`

### POST `/api/sessions`
Public (rate limited 10/min). Creates a new session.

Response `201`: `{ "sessionId": "abc-123", "createdAt": "<ISO>" }`

### GET `/api/languages`
`optionalAuth`. Returns DeepL voice-capable languages, resolving credentials from the
caller's org default provider, falling back to the global default. Cached for 10 minutes.

Response: `{ "languages": [{ "code": "en", "label": "English" }], "cached": false }`

Errors: `503` no voice provider configured, `502` DeepL request failed.

### GET `/api/sessions/:sessionId`
Public. Looks up a session in memory, then the database.

Response: `{ "sessionId", "exists": true, "active": true, "participantCount", "partnerConnected" }`
Errors: `404` `{ "error": "Session not found", "exists": false }`.

### GET `/api/sessions/:sessionId/invite`
Public. Returns a shareable invite URL.

Response: `{ "sessionId", "inviteUrl": "<clientOrigin>/join/<sessionId>" }`
Errors: `400` missing sessionId.

---

## Users - `/api/users`
All routes: `requireAuth` + `requireTenantAdmin`. Super-admins operate across all
organizations; tenant admins are scoped to their own org. Pagination via `?page` and
`?limit` (max 50). Filter via `?status`. Super-admins may filter `?organizationId`.

### GET `/api/users`
Lists users (super-admin: global with memberships; tenant-admin: org members).
Response: `{ "page", "limit", "total", "users": [ ... ] }`.

### GET `/api/users/:id`
Returns a single user (super-admin) or org membership (tenant-admin).
Errors: `404` not found.

### POST `/api/users`
Tenant-admin scope. Creates or links a user into the caller's org as `active`.

Request: `{ "email", "password", "displayName", "orgRole": "member" | "tenant_admin" }`
Response `201`: `{ "user": { ... } }`. Errors: `400` validation, `403` no org, `409` already a member.

### PUT `/api/users/:id/status`
Updates an org member's status.
Request: `{ "status": "pending" | "active" | "suspended" | "rejected" }`. Errors: `400`, `404`.

### DELETE `/api/users/:id`
Soft-removes a member (sets status `rejected`). Errors: `400` cannot remove self, `404`.

---

## Admin: Voice Providers - `/api/admin/voice-providers`
All routes: `requireAuth` + `requireSuperAdmin`. Manages the global provider catalog.
API keys are stored encrypted; responses never include the raw key, only
`hasApiKey` and a masked `apiKeyPreview` (e.g. `abcd••••wxyz`).

### GET `/`
Response: `{ "providers": [{ "id", "name", "type", "apiUrl", "isActive", "isGlobalDefault", "hasApiKey", "apiKeyPreview", "createdAt", "updatedAt" }] }`

### POST `/`
Request: `{ "name", "apiUrl", "apiKey", "type": "deepl", "isActive": true, "isGlobalDefault": false }`
Setting `isGlobalDefault: true` clears the flag on all other providers (transactional).
Response `201`: `{ "provider": { ... } }`. Errors: `400` missing required fields.

### PUT `/:id`
Partial update of `name`, `apiUrl`, `apiKey`, `isActive`, `isGlobalDefault`.
The global default provider cannot be deactivated. Errors: `400`, `404`.

### DELETE `/:id`
Deletes a provider, or deactivates it if it is still referenced by an org link.
The global default cannot be deleted. Response: `{ "ok": true, "deactivated": boolean }`.
Errors: `400` global default, `404`.

---

## Admin: Organization Voice Providers - `/api/admin/organization/voice-providers`
All routes: `requireAuth` + `requireTenantAdmin`. Per-organization enablement of catalog providers.

### GET `/`
Lists catalog providers with this org's `enabled`/`isDefault` flags merged in.

### PUT `/`
Replaces the org's provider links. Exactly one enabled provider must be the default.
Request: `{ "providers": [{ "voiceProviderId", "enabled", "isDefault" }] }`.
Errors: `400` (not an array / not exactly one default), `403` no org.

---

## Admin: Organizations - `/api/admin/organizations`
All routes: `requireAuth` + `requireSuperAdmin`.

### GET `/`
Paginated list. Response items: `{ "id", "name", "slug", "inviteCode", "isActive", "memberCount", "createdAt" }`.

### POST `/`
Creates an organization (auto-slug + invite code). Optionally seeds an initial
tenant admin when all three admin fields are provided.
Request: `{ "name", "slug?", "tenantAdminEmail?", "tenantAdminPassword?", "tenantAdminDisplayName?" }`
Response `201`: `{ "organization": { ... } }`. Errors: `400` name required, `409` slug exists.

### PATCH `/:id`
Updates `name`, `isActive`, or rotates the invite code.
Request: `{ "name?", "isActive?", "rotateInviteCode?": true }`. Errors: `404`.

### GET `/:id/members`
Lists members: `{ "members": [{ "membershipId", "userId", "email", "displayName", "orgRole", "status", "joinedAt" }] }`. Errors: `404`.

### POST `/:id/members`
Adds an existing user (`userId` or `email`) or creates a new user, then links them to
the org. Reactivates a previously `rejected` membership.
Request (existing): `{ "userId" | "email", "orgRole?", "status?" }`
Request (new user): `{ "email", "password", "displayName", "orgRole?", "status?" }`
Response `201`: `{ "member": { ... } }`. Errors: `400`, `404` org/user, `409` already a member.

### PATCH `/:id/members/:userId`
Updates a member's `orgRole` and/or `status`.
Request: `{ "orgRole?": "tenant_admin" | "member", "status?": "pending" | "active" | "suspended" | "rejected" }`
Errors: `400` nothing to update, `404`.

### DELETE `/:id/members/:userId`
Soft-removes a member (sets status `rejected`). Response: `{ "ok": true }`. Errors: `404`.

---

## Admin: Analytics - `/api/admin/analytics`
`requireAuth` + `requireTenantAdmin`. Scoped to the caller's org.

### GET `/`
Query: `?from=<ISO>&to=<ISO>` (defaults to last 30 days).

Response:

```json
{
  "from": "<ISO>",
  "to": "<ISO>",
  "sessionCount": 0,
  "endedSessionCount": 0,
  "totalDurationMs": 0,
  "activeMembers": 0,
  "pendingMembers": 0,
  "transcriptSegmentCount": 0,
  "recordingCount": 0,
  "recordingBytes": 0,
  "languagePairs": { "en->es": 3 },
  "sessionsByDay": [{ "date": "2026-06-01", "count": 2 }]
}
```

Errors: `400` invalid or inverted `from`/`to`, `403` no org context.

---

## History - `/api/history`
All routes: `requireActiveMember`. Returns only sessions the caller participated in.

### GET `/sessions`
Paginated session history with participants and a transcript preview.
Response: `{ "page", "limit", "total", "sessions": [ ... ] }`.

### GET `/sessions/:sessionId`
Full session detail: participants, transcripts, recordings (with download URLs).
Errors: `404`.

### GET `/sessions/:sessionId/recordings/:recordingId`
Streams the audio file (content type derived from the stored recording).
Errors: `404` recording or file missing.

---

## Socket.IO realtime channel

Connect to the same origin. Authentication is performed by `socketAuthMiddleware`;
guests may still join with a `userId` in the join payload.

### Client -> Server events

| Event | Payload | Description |
| --- | --- | --- |
| `join_session` | `{ sessionId, sourceLang, userId?, authToken? }` + ack | Joins a session. A valid `authToken` binds the stable account id and org. |
| `audio_chunk` | `Buffer` / `ArrayBuffer` / typed array | Streams source audio for translation. Rate limited. |
| `webrtc_signal` | `{ ... }` | Relays WebRTC signaling to the peer. |
| `leave_session` | none | Leaves the current session. |

`join_session` ack:

```json
{
  "ok": true,
  "type": "session_joined",
  "clientId": "...",
  "sessionId": "abc-123",
  "isInitiator": true,
  "participantCount": 1,
  "partnerConnected": false,
  "sourceLang": "en",
  "targetLang": "es",
  "deeplOk": true,
  "deeplError": null
}
```

On failure: `{ "ok": false, "error": "..." }`.

### Server -> Client events

| Event | Payload | Description |
| --- | --- | --- |
| `session_state` | `{ sessionId, participantCount, partnerConnected, partnerUserId }` | Broadcast on join/leave. |
| `peer_joined` | `{ peerId, userId, targetLang }` | The other participant connected. |
| `peer_left` | `{ peerId }` | The other participant disconnected. |
| `self_transcript` | `{ transcript, isFinal }` | Recognized speech of the speaker. |
| `translation_result` | `{ translation, isFinal, audioChunks?, audioContentType? }` | Translated text and TTS audio for the partner. |
| `error_message` | `{ message }` | Recoverable error notice. |
