<<<<<<< Updated upstream
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

=======
# Ison Translate — REST API Reference

**Base URL:** `http://localhost:3001` (set `PORT` in `api/.env`)  
**Content-Type:** `application/json` for all request/response bodies  
**Auth:** `Authorization: Bearer <JWT>` on protected routes

---

## Roles & access model

| Role | How obtained | Capabilities |
|------|-------------|-------------|
| **Guest / anonymous** | No JWT | Create sessions, join sessions via Socket.IO |
| **Registered user** | JWT, no org | Sessions, history |
| **Pending member** | JWT, `membershipStatus: pending` | Sessions only (no history until approved) |
| **Active member** | JWT, `membershipStatus: active` | Sessions + personal history |
| **Tenant admin** | JWT, `orgRole: tenant_admin`, `membershipStatus: active` | Org user management, org voice providers, analytics |
| **Super admin** | JWT, `globalRole: super_admin` | All of the above, global voice provider catalog, org governance |

Super-admin is granted automatically on login/register when the user's email matches `SUPER_ADMIN_EMAIL` in `.env`.

---

## Authentication

JWT claims returned in every auth response:

```jsonc
{
  "sub": "<userId>",
  "email": "user@example.com",
  "displayName": "Alice",
  "globalRole": "super_admin",   // or omitted
  "orgId": "<orgId>",            // or omitted
  "orgRole": "tenant_admin",     // or omitted
  "membershipStatus": "active"   // or omitted
}
```

>>>>>>> Stashed changes
---

## Health

<<<<<<< Updated upstream
### GET `/health`
Public. Liveness plus database and DeepL configuration status.

=======
### `GET /health`
Public. Checks DeepL and database connectivity.

**Response `200`**
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
---

### `GET /admin/health`
Public. Includes active in-memory session count.

**Response `200`**
```json
{
  "ok": true,
  "databaseConfigured": true,
  "databaseOk": true,
  "databaseError": null,
  "deeplConfigured": true,
  "deeplOk": true,
  "deeplError": null,
  "activeSessions": 3
}
```

---

## Sessions

### `POST /api/sessions`
Create a new session. Rate limited: **10/min** per IP.

**Response `201`**
```json
{
  "sessionId": "3e2f1a4b-...",
  "createdAt": 1717000000000
}
```

---

### `GET /api/sessions/:sessionId`
Check if a session exists (in-memory first, then DB).

**Response `200`**
```json
{
  "sessionId": "3e2f1a4b-...",
  "exists": true,
  "active": true,
  "participantCount": 1,
  "partnerConnected": false
}
```

**Response `404`** — session not found
```json
{ "error": "Session not found", "exists": false }
```

---

### `GET /api/sessions/:sessionId/invite`
Generate a shareable invite URL for a session. No auth required.

**Response `200`**
```json
{
  "sessionId": "3e2f1a4b-...",
  "inviteUrl": "http://localhost:5173/join/3e2f1a4b-..."
}
```

---

### `GET /api/languages`
List voice-capable languages from the configured voice provider (DeepL). Cached 10 min. Resolves org's default provider if JWT `orgId` is present.

**Response `200`**
```json
{
  "languages": [
    { "code": "en", "label": "English" },
    { "code": "fr", "label": "French" }
  ],
  "cached": false
}
```

**Response `503`** — no voice provider configured

---

## Auth

Rate limited: **20 requests/min** per IP on all auth routes.

### `POST /api/auth/register`
Register a new account. Optionally attach to an organization.

**Request body**
```json
{
  "email": "alice@example.com",
  "password": "min8chars",
  "displayName": "Alice",
  "organizationSlug": "acme-corp",   // optional — OR —
  "inviteCode": "a1b2c3d4e5f6g7h8"  // optional
}
```
`organizationSlug` and `inviteCode` are mutually exclusive. If supplied, membership is created with `status: pending` and must be approved by a tenant admin.

**Response `201`**
```json
{
  "token": "<JWT>",
  "user": {
    "id": "...",
    "email": "alice@example.com",
    "displayName": "Alice",
    "defaultSourceLang": "en",
    "defaultTargetLang": "es",
    "createdAt": "2026-06-04T...",
    "globalRole": null,
    "orgId": "<orgId>",
    "orgRole": "member",
    "membershipStatus": "pending"
  }
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | Missing/invalid fields |
| `400` | Both `organizationSlug` and `inviteCode` provided |
| `400` | Org not found or inactive |
| `409` | Email already registered |
| `503` | `PERSIST_ENABLED=false` |

---

### `POST /api/auth/login`
Authenticate and receive a JWT.

**Request body**
```json
{ "email": "alice@example.com", "password": "min8chars" }
```

**Response `200`** — same shape as register response

**Error `401`** — invalid credentials

---

### `GET /api/auth/me`
🔒 Requires JWT. Returns current user with live membership claims.

**Response `200`**
```json
{
  "user": {
    "id": "...",
    "email": "alice@example.com",
    "displayName": "Alice",
    "defaultSourceLang": "en",
    "defaultTargetLang": "es",
    "createdAt": "...",
    "globalRole": null,
    "orgId": "...",
    "orgRole": "tenant_admin",
    "membershipStatus": "active"
  }
}
```

---

### `PATCH /api/auth/me/languages`
🔒 Requires JWT. Update preferred translation languages.

**Request body** (all fields optional)
```json
{ "defaultSourceLang": "en", "defaultTargetLang": "de" }
```

**Response `200`** — updated user object

---

## History

🔒 Requires JWT + `membershipStatus: active` (or no org).

### `GET /api/history/sessions`
Paginated list of sessions the authenticated user participated in.

**Query params:** `?page=1&limit=20` (max limit: 50)

**Response `200`**
```json
{
  "page": 1,
  "limit": 20,
  "total": 4,
  "sessions": [
    {
      "sessionId": "...",
      "status": "ended",
      "startedAt": "...",
      "endedAt": "...",
      "participantCount": 2,
      "participants": [
        { "id": "...", "isYou": true, "displayName": "You", "sourceLang": "en", "targetLang": "fr", "isInitiator": true, "joinedAt": "...", "leftAt": "..." }
      ],
      "transcriptPreview": "Hello, how are you?",
      "hasTranscript": true,
      "hasRecording": true
    }
  ]
}
```

**Error `403`** — pending or suspended membership

---

### `GET /api/history/sessions/:sessionId`
Full detail for one session (participants, full transcript, recording metadata).

**Response `200`**
```json
{
  "sessionId": "...",
  "status": "ended",
  "startedAt": "...",
  "endedAt": "...",
  "participants": [...],
  "transcripts": [
    { "id": "...", "role": "source", "language": "en", "text": "Hello", "isFinal": true, "sequence": 1, "recordedAt": "..." }
  ],
  "recordings": [
    {
      "id": "...",
      "kind": "source_uplink",
      "contentType": "audio/wav",
      "sampleRate": 16000,
      "byteLength": 204800,
      "durationMs": 6400,
      "participantId": "...",
      "finalizedAt": "...",
      "audioUrl": "/api/history/sessions/<id>/audio/<recordingId>"
    }
  ]
}
```

**Error `404`** — session not found or not owned by user

---

### `GET /api/history/sessions/:sessionId/audio/:recordingId`
Stream a session recording as `audio/wav`.

**Response `200`** — WAV binary stream  
**Error `404`** — recording not found / file missing on disk

---

## User management (Tenant Admin)

🔒 Requires `orgRole: tenant_admin` + `membershipStatus: active`. All queries are automatically scoped to the tenant admin's organization.

### `GET /api/users`
Paginated list of users.

**Tenant admin:** members of their organization only.

**Super admin:** all users in the system (including guests with no organization). Optional filters:
- `organizationId` — limit to users with membership in that org
- `status` — filter by membership status (`pending`, `active`, `suspended`, `rejected`)

**Query params:** `?page=1&limit=20&status=active&organizationId=<orgId>`

**Response `200` (tenant admin)** — one row per org member:
```json
{
  "page": 1,
  "limit": 20,
  "total": 12,
  "users": [
    {
      "id": "...",
      "email": "alice@example.com",
      "displayName": "Alice",
      "defaultSourceLang": "en",
      "defaultTargetLang": "es",
      "orgRole": "member",
      "status": "active",
      "createdAt": "...",
      "joinedAt": "..."
    }
  ]
}
```

**Response `200` (super admin)** — each user includes all organization memberships:
```json
{
  "page": 1,
  "limit": 20,
  "total": 42,
  "users": [
    {
      "id": "...",
      "email": "alice@example.com",
      "displayName": "Alice",
      "defaultSourceLang": "en",
      "defaultTargetLang": "es",
      "globalRole": null,
      "createdAt": "...",
      "memberships": [
        {
          "organizationId": "...",
          "organizationName": "Acme Corp",
          "organizationSlug": "acme-corp",
          "orgRole": "member",
          "status": "active",
          "joinedAt": "..."
        }
      ]
    }
  ]
}
```

---

### `GET /api/users/:id`
Single user by account ID.

**Tenant admin:** user must belong to their organization.

**Super admin:** any user (including guests with no memberships).

**Response `200`** — user object (shape matches list entry for the caller's role)  
**Error `404`** — user not found (super admin) or not in organization (tenant admin)

---

### `POST /api/users`
Create a new user and add them to the organization as `active`.  
If a user with that email already exists and is not yet in the org, they are added; if already in the org, `409` is returned.

**Request body**
```json
{
  "email": "bob@example.com",
  "password": "min8chars",
  "displayName": "Bob",
  "orgRole": "member"   // optional, default: "member"; or "tenant_admin"
}
```

**Response `201`** — user object  
**Error `400`** — missing/invalid fields  
**Error `409`** — user already in organization

---

### `PUT /api/users/:id/status`
Change a user's membership status (approve, suspend, reject).

**Request body**
```json
{ "status": "active" }
```

Valid values: `pending | active | suspended | rejected`

**Response `200`** — updated user object  
**Error `400`** — invalid status value  
**Error `404`** — user not in organization

---

### `DELETE /api/users/:id`
Soft-remove a user from the organization (sets status to `rejected`). The account and session history are preserved.

**Response `200`**
```json
{ "ok": true }
```

**Error `400`** — cannot remove yourself  
**Error `404`** — user not in organization

---

## Admin — Voice Provider Catalog (Super Admin)

🔒 Requires `globalRole: super_admin`.

### `GET /api/admin/voice-providers`
List all voice providers. API keys are never returned.

**Response `200`**
```json
{
  "providers": [
    {
      "id": "...",
      "name": "DeepL Production",
      "type": "deepl",
      "apiUrl": "https://api.deepl.com",
      "isActive": true,
      "hasApiKey": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### `POST /api/admin/voice-providers`
Add a new voice provider to the global catalog.

**Request body**
```json
{
  "name": "DeepL Production",
  "type": "deepl",
  "apiUrl": "https://api.deepl.com",
  "apiKey": "your-deepl-auth-key",
  "isActive": true
}
```

The `apiKey` is encrypted at rest using `ENCRYPTION_KEY` (falls back to `JWT_SECRET`).

**Response `201`** — provider object (masked)  
**Error `400`** — missing required fields

---

### `PUT /api/admin/voice-providers/:id`
Update an existing provider. Pass `apiKey` only if rotating the key.

**Request body** (all fields optional)
```json
{
  "name": "DeepL EU",
  "apiUrl": "https://api-free.deepl.com",
  "apiKey": "new-key",
  "isActive": true
}
```

**Response `200`** — updated provider (masked)  
**Error `404`** — provider not found

---

### `DELETE /api/admin/voice-providers/:id`
Delete a provider. If the provider is currently assigned to any organization, it is **deactivated** instead of deleted, and `"deactivated": true` is returned.

**Response `200`**
```json
{ "ok": true, "deactivated": true }
```

**Error `404`** — provider not found

---

## Admin — Organization Voice Providers (Tenant Admin)

🔒 Requires `orgRole: tenant_admin` + `membershipStatus: active`.

### `GET /api/admin/organization/voice-providers`
List all globally active providers, annotated with this org's `enabled` and `isDefault` flags.

**Response `200`**
```json
{
  "providers": [
    {
      "id": "...",
      "name": "DeepL Production",
      "type": "deepl",
      "apiUrl": "https://api.deepl.com",
      "isActive": true,
      "enabled": true,
      "isDefault": true
    }
  ]
}
```

---

### `PUT /api/admin/organization/voice-providers`
Replace the organization's provider selection. Exactly one enabled provider must be marked `isDefault: true`.

**Request body**
```json
{
  "providers": [
    { "voiceProviderId": "<id>", "enabled": true,  "isDefault": true  },
    { "voiceProviderId": "<id2>", "enabled": false, "isDefault": false }
  ]
}
```

**Response `200`** — list of org's active provider links  
**Error `400`** — not exactly one default, missing array, or invalid provider IDs

---

## Admin — Organizations (Super Admin)

🔒 Requires `globalRole: super_admin`.

### `GET /api/admin/organizations`
Paginated list of all organizations.

**Query params:** `?page=1&limit=20`

**Response `200`**
```json
{
  "page": 1,
  "limit": 20,
  "total": 5,
  "organizations": [
    {
      "id": "...",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "inviteCode": "a1b2c3d4e5f6g7h8",
      "isActive": true,
      "memberCount": 12,
      "createdAt": "..."
    }
  ]
}
```

---

### `POST /api/admin/organizations`
Create a new organization. Optionally create the first tenant admin in the same request.

**Request body**
```json
{
  "name": "Acme Corp",
  "slug": "acme-corp",
  "tenantAdminEmail": "admin@acme.com",
  "tenantAdminPassword": "min8chars",
  "tenantAdminDisplayName": "Acme Admin"
}
```

`slug`, `tenantAdmin*` fields are optional. If `slug` is omitted, it is derived from `name`.  
An `inviteCode` (16-char hex) is generated automatically.

**Response `201`**
```json
{
  "organization": {
    "id": "...",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "inviteCode": "a1b2c3d4e5f6g7h8",
    "isActive": true,
    "createdAt": "..."
  }
}
```

**Error `400`** — missing name  
**Error `409`** — slug already taken

---

### `PATCH /api/admin/organizations/:id`
Update org name, active status, or rotate the invite code.

**Request body** (all optional)
```json
{
  "name": "New Name",
  "isActive": false,
  "rotateInviteCode": true
}
```

**Response `200`** — updated organization  
**Error `404`** — not found

---

## Admin — Analytics (Tenant Admin)

🔒 Requires `orgRole: tenant_admin` + `membershipStatus: active`.

### `GET /api/admin/analytics`
Aggregated statistics for the tenant admin's organization.

**Query params:** `?from=ISO-date&to=ISO-date` (default: last 30 days)

**Response `200`**
```json
{
  "from": "2026-05-05T00:00:00.000Z",
  "to": "2026-06-04T14:00:00.000Z",
  "sessionCount": 42,
  "endedSessionCount": 38,
  "totalDurationMs": 9720000,
  "activeMembers": 8,
  "pendingMembers": 2,
  "transcriptSegmentCount": 1240,
  "recordingCount": 84,
  "recordingBytes": 157286400,
  "languagePairs": {
    "en->fr": 18,
    "en->de": 12,
    "fr->en": 12
  },
  "sessionsByDay": [
    { "date": "2026-05-05", "count": 3 },
    { "date": "2026-05-06", "count": 5 }
  ]
}
```

**Error `401`** — not authenticated  
**Error `403`** — not a tenant admin, or pending/suspended membership

---

## Socket.IO (Realtime)

Connect to the same host/port as the REST API. Optional handshake token:

```js
io(BASE_URL, { auth: { token: SOCKET_SECRET } })  // if SOCKET_SECRET is set
```

### Client → Server events

| Event | Payload | Description |
|-------|---------|-------------|
| `join_session` | `{ sessionId, userId, sourceLang, authToken? }` | Join a 2-person room. `authToken` is the user's JWT — enables org-scoped voice provider and durable history |
| `audio_chunk` | `Buffer` (16 kHz s16le PCM) | Send microphone audio for translation |
| `webrtc_signal` | `{ type, sdp?, candidate? }` | Relay SDP/ICE to peer |
| `leave_session` | — | Leave the current room |

### Server → Client events

| Event | Payload | Description |
|-------|---------|-------------|
| `session_joined` | `{ ok, sessionId, clientId, isInitiator, participantCount, partnerConnected, sourceLang, targetLang, deeplOk, deeplError }` | Ack for `join_session` |
| `session_state` | `{ sessionId, participantCount, partnerConnected, partnerUserId }` | Broadcast on join/leave |
| `peer_joined` | `{ peerId, userId, targetLang }` | Notifies first participant when partner connects |
| `peer_left` | `{ peerId }` | Partner disconnected |
| `self_transcript` | `{ transcript, isFinal }` | Your own speech transcribed |
| `translation_result` | `{ translation, audioChunks?, audioContentType?, isFinal }` | Partner's translated speech + optional TTS audio |
| `webrtc_signal` | `{ from, type, sdp?, candidate? }` | Relayed WebRTC signal from peer |
| `error_message` | `{ message }` | Session or voice-provider error |

---

## Error format

All error responses use a consistent JSON body:

```json
{ "error": "Human-readable message" }
```

## Rate limits

| Scope | Limit |
|-------|-------|
| Global (all routes) | 120 req/min per IP |
| `POST /api/sessions` | 10 req/min per IP |
| `POST /api/auth/*` | 20 req/min per IP |
| Admin routes | 60 req/min per IP |
| Socket audio bytes | configurable `MAX_AUDIO_BYTES_PER_SEC` (default 160 000 B/s) |
>>>>>>> Stashed changes
