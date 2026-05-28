# Transly — Developer Onboarding Guide

This document explains the full codebase so a new developer can understand how the app works, where to look when debugging, and how to extend it safely.

---

## 1. What this project does

**Transly** is a real-time, two-way voice translation platform for two people in a shared session.

| User A | User B |
|--------|--------|
| Speaks language A (e.g. English) | Speaks language B (e.g. Hindi) |
| Sees their own transcript | Sees A's speech translated into B's language |
| Hears B's speech translated into A's language | Sees their own transcript + hears translated audio |

Both users open the web app, enter the **same session ID**, pick their language pair, and talk into the microphone. The server forwards audio to **DeepL Voice API v3**, then sends back **transcripts** and **translated speech** to the partner in real time.

There is also optional **WebRTC signaling** for a raw peer-to-peer audio path (STUN only in MVP). Translated voice always goes through DeepL → server → partner, not WebRTC.

---

## 2. High-level architecture

```
┌─────────────┐     Socket.IO      ┌─────────────┐     WebSocket      ┌─────────────┐
│  Client A   │ ◄────────────────► │  Node API   │ ◄────────────────► │ DeepL Voice │
│  (React)    │   audio + events   │  (Express)  │   PCM in / TTS out │   API v3    │
└─────────────┘                    └─────────────┘                    └─────────────┘
       ▲                                  ▲
       │         WebRTC signaling         │
       └──────────────────────────────────┘
                    Client B
```

### Request flow (User A speaks → User B hears)

1. **Client A** captures mic audio as **16 kHz mono PCM** (`useMicCapture`).
2. Chunks are sent over **Socket.IO** as `audio_chunk` (`useWebSocket`).
3. **Server** finds A's session peer (B), opens/reuses a **DeepL stream** for A's language pair.
4. Server forwards PCM to DeepL; DeepL returns:
   - `source_transcript_update` → A's "You said" panel
   - `target_transcript_update` → B's subtitle panel
   - `target_media_chunk` → B's translated **WebM/Opus** audio
5. **Client B** plays audio via **MediaSource** streaming (`useAudioPlayer`).

The same flow runs in reverse when B speaks.

---

## 3. Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Real-time client | `socket.io-client` |
| Backend | Node.js (ES modules), Express 4 |
| Real-time server | `socket.io` on shared HTTP server |
| DeepL | Voice API v3 (`POST /v3/voice/realtime` + WebSocket stream) |
| Optional P2P | WebRTC with Google STUN (`useWebRTC`) |

**Note:** The root `README.md` mentions Redux and tab-audio capture — the current app uses **hooks + local React state** and **microphone capture**, not Redux or tab sharing.

---

## 4. Repository layout

```
Ison_translate/
├── api/                          # Backend
│   ├── .env                      # Secrets (never commit)
│   ├── .env.example
│   └── src/
│       ├── server.js             # Express + HTTP + Socket.IO bootstrap
│       ├── config.js             # Env vars
│       ├── deepl/
│       │   ├── deeplVoiceClient.js # DeepL streaming client (per speaker)
│       │   └── verifyDeepL.js    # API key health check + cache
│       ├── rooms/
│       │   └── sessionManager.js # Pair up to 2 users per session ID
│       └── socket/
│           ├── index.js          # All Socket.IO event handlers
│           └── rtcSignaling.js   # Relay WebRTC offer/answer/ICE
│
├── client/                       # Frontend
│   ├── public/
│   │   └── pcm-processor.worklet.js  # Optional AudioWorklet (PCM resample)
│   └── src/
│       ├── main.tsx              # React entry
│       ├── App.tsx               # Renders TranslatorPage
│       ├── config.ts             # API URL, language list
│       ├── types.ts              # Shared TS types for socket messages
│       ├── pages/
│       │   └── TranslatorPage.tsx    # Main session UI + orchestration
│       ├── hooks/
│       │   ├── useWebSocket.ts   # Socket.IO connect, join, audio send
│       │   ├── useMicCapture.ts  # getUserMedia + PCM chunks
│       │   ├── useAudioPlayer.ts # Translated WebM playback (MediaSource)
│       │   └── useWebRTC.ts      # P2P signaling (optional raw audio path)
│       └── components/
│           ├── SessionJoin.tsx   # Session ID + language form
│           ├── SubtitlePanel.tsx # Transcript cards
│           └── MicControl.tsx    # Mute / leave / partner status
│
├── package.json                  # Root scripts (concurrently dev both apps)
├── README.md                     # Quick start (partially outdated)
└── project.docs.md               # This file
```

---

## 5. Backend deep dive

### 5.1 Entry point — `api/src/server.js`

- Creates Express app + HTTP server.
- Attaches **Socket.IO** with CORS limited to `CLIENT_ORIGIN`.
- Exposes `GET /health` (DeepL status + active session count).
- On startup, runs `verifyDeepLAccess()` once and logs whether the API key works.

### 5.2 Configuration — `api/src/config.js`

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `3001`) |
| `CLIENT_ORIGIN` | Allowed CORS origin (default `http://localhost:5173`) |
| `DEEPL_AUTH_KEY` / `DEEPL_API_KEY` | DeepL secret (server only) |
| `DEEPL_API_URL` | REST base URL (`https://api.deepl.com`) |

### 5.3 Sessions — `api/src/rooms/sessionManager.js`

- Sessions are keyed by **normalized session ID** (`trim` + **lowercase**).
- Max **2 clients** per session.
- On join, **stale/disconnected sockets** are pruned so ghost users don't block new joins.
- If the same `userId` reconnects with a new socket, the old entry is replaced.

Key exports: `joinSession`, `leaveSession`, `getPeer`, `getClient`, `getSessionBySocket`.

### 5.4 Socket handlers — `api/src/socket/index.js`

This is the main routing layer. Important events:

| Event (client → server) | Handler behaviour |
|-------------------------|-------------------|
| `join_session` | Register client in room; **ack immediately** (no blocking DeepL wait); broadcast `session_state` |
| `audio_chunk` | Binary PCM → DeepL stream → emit results to speaker + partner |
| `webrtc_signal` | Relay SDP/ICE to peer (`rtcSignaling.js`) |
| `leave_session` / `disconnect` | Cleanup session + close DeepL streams |

| Event (server → client) | Purpose |
|-------------------------|---------|
| `session_state` | Partner count + `partnerConnected` flag |
| `self_transcript` | Speaker's own words (source language) |
| `translation_result` | Partner's translated text + optional `audioChunks` |
| `error_message` | DeepL or session errors |
| `peer_left` | Partner disconnected |

**Important:** `join_session` must ack fast. DeepL verification uses cached status from `getDeepLStatus()`; full verify runs in background.

### 5.5 DeepL client — `api/src/deepl/deeplVoiceClient.js`

DeepL Voice uses a **two-step** protocol:

1. **REST** `POST /v3/voice/realtime` → `{ streaming_url, token }`
2. **WebSocket** to `streaming_url?token=...` → stream audio + receive transcripts/TTS

One `DeepLVoiceClient` instance exists per **speaker** per session (`sessionId:socketId` map).

- **Input format:** `audio/pcm;encoding=s16le;rate=16000` (matches browser capture).
- **Output format:** `audio/webm;codecs=opus` (streamed to browser via MediaSource).
- **`sendQueue`:** serialises chunks so DeepL receives audio in order.
- **`getOrCreateStream`:** reuses stream; refreshes `onEvent` callback so peer socket ID stays current.

Read the file-level comments in this module for method-by-method detail.

### 5.6 DeepL verification — `api/src/deepl/verifyDeepL.js`

- Probes the Voice API with a minimal POST (no WebSocket opened).
- Result is **cached for the process lifetime** so join/health don't hang.
- 8 s timeout; concurrent callers share one in-flight promise.

---

## 6. Frontend deep dive

### 6.1 Entry & routing

- `main.tsx` → `App.tsx` → `TranslatorPage.tsx` (single-page app, no router).

### 6.2 `TranslatorPage.tsx` — orchestration hub

State machine in plain React:

1. **Join screen** — `SessionJoin` form until `session` is set.
2. **Active session** — wires hooks together:
   - `useWebSocket` — server connection
   - `useMicCapture` — mic PCM when `session` exists
   - `useAudioPlayer` — partner's translated voice
   - `useWebRTC` — optional P2P signaling

Join flow: `connect()` → `joinSession()` → set session state. Timeouts (10 s) prevent infinite "Joining…".

### 6.3 `useWebSocket.ts`

- Uses a **shared singleton** Socket.IO instance (survives React Strict Mode remounts).
- In dev, connects via Vite proxy (`API_URL = ''` → same origin `/socket.io`).
- Stores join payload for **auto-rejoin** on reconnect.
- `sendAudioChunk` sends `Uint8Array` PCM buffers.

### 6.4 `useMicCapture.ts`

- Requests mono mic via `getUserMedia`.
- **Primary path:** AudioWorklet (`/pcm-processor.worklet.js`) resamples to 16 kHz PCM.
- **Fallback:** ScriptProcessor if Worklet fails.
- Emits ~80 ms PCM chunks; respects mute without tearing down the session.

### 6.5 `useAudioPlayer.ts`

- Hidden `<audio>` element + **MediaSource** API.
- Appends DeepL WebM/Opus packets in order (`sourceBuffer.mode = 'sequence'`).
- PCM fallback with small merge buffer if server ever sends PCM again.

Call `prime()` after user gesture (Join click) to satisfy browser autoplay rules.

### 6.6 `useWebRTC.ts`

- Creates `RTCPeerConnection` with Google STUN.
- Initiator creates offer after mic stream is ready.
- Signaling only — translated audio does **not** use this path today.

### 6.7 UI components

| Component | Role |
|-----------|------|
| `SessionJoin` | Session ID, my language, partner's language |
| `SubtitlePanel` | Scrollable transcript lines (tentative vs final styling) |
| `MicControl` | Recording status, partner badge, mute, leave |

---

## 7. Socket message reference

### Client → server

```typescript
// join_session (with ack callback)
{
  sessionId: string   // normalised to lowercase on client
  userId: string      // random per tab
  sourceLang: string  // what I speak (BCP-47, e.g. "en")
  targetLang: string  // partner's language / translation target (e.g. "hi")
}

// audio_chunk — binary Uint8Array (Int16 PCM, 16 kHz mono)

// webrtc_signal
{ type: 'offer' | 'answer' | 'ice_candidate', sdp?, candidate? }
```

### Server → client

```typescript
// join ack
{ ok, sessionId, clientId, isInitiator, participantCount, partnerConnected, deeplOk, deeplError? }

// translation_result
{ translation, audioChunks?: string[], audioContentType?: string, isFinal? }

// self_transcript
{ transcript, isFinal? }

// session_state
{ sessionId, participantCount, partnerConnected, partnerUserId? }
```

---

## 8. Language configuration

Each user sets:

- **My language** (`sourceLang`) — what they speak.
- **Partner's language** (`targetLang`) — language their speech is translated **into** for the partner.

Example for English ↔ Hindi:

| Tab | sourceLang | targetLang |
|-----|------------|------------|
| A   | `en`       | `hi`       |
| B   | `hi`       | `en`       |

Server passes `targetLang` to DeepL as the translation target when that user speaks.

---

## 9. Local development

### Prerequisites

- Node.js 20+
- DeepL **Pro** API key with Voice API access
- Chrome or Edge recommended

### Setup

```bash
# From repo root
npm run install:all

# Configure backend
copy api\.env.example api\.env
# Edit api/.env → set DEEPL_AUTH_KEY
```

### Run

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |
| Health | http://localhost:3001/health |

### Test two-user flow

1. Open two browser tabs to `http://localhost:5173`.
2. Both use the **same session ID** (e.g. `demo-1`).
3. Set swapped languages as in section 8.
4. Wait for **Partner connected** on both tabs.
5. Speak — use **headphones** when testing on one machine to avoid echo.

---

## 10. Troubleshooting (common issues)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Stuck on "Joining…" | API not running or socket blocked | Start `api`; check port 3001; restart both apps |
| "Session is full" | Ghost participant from crashed tab | Click Leave on all tabs or use new session ID |
| Partner never connects | Different session IDs or only one tab | Same ID (case-insensitive); two tabs |
| Transcripts work, no voice | Browser autoplay or MSE issue | Click Join again; check console; use Chrome |
| DeepL errors in UI | Invalid/expired API key | Update `api/.env`; restart API; check `/health` |
| `EADDRINUSE :3001` | Old API process still running | `netstat -ano \| findstr :3001` then kill PID |

---

## 11. Security notes

- **Never** expose `DEEPL_AUTH_KEY` to the client.
- `.env` is git-ignored; use `.env.example` as template.
- CORS is locked to `CLIENT_ORIGIN`.
- Rate limit: 120 requests/minute on HTTP routes.

---

## 12. Suggested reading order for new developers

1. `project.docs.md` (this file) — big picture  
2. `client/src/pages/TranslatorPage.tsx` — how the UI wires together  
3. `api/src/socket/index.js` — all server-side events  
4. `api/src/deepl/deeplVoiceClient.js` — DeepL integration  
5. `client/src/hooks/useWebSocket.ts` + `useMicCapture.ts` + `useAudioPlayer.ts` — client media pipeline  
6. `api/src/rooms/sessionManager.js` — session pairing rules  

---

## 13. Extension ideas (where to add code)

| Feature | Where to start |
|---------|----------------|
| New language in UI | `client/src/config.ts` → `LANGUAGES` |
| New socket event | `api/src/socket/index.js` + `useWebSocket.ts` + `types.ts` |
| Session size > 2 | `sessionManager.js` limit + UI |
| TURN for WebRTC NAT | `useWebRTC.ts` `iceServers` + deploy Coturn |
| Persist session history | New REST route + DB; hook into `handleDeepLEvent` |
| Metrics / logging | Middleware in `server.js`; log in socket handlers |

---

## 14. Production considerations (not yet implemented)

- TURN server for WebRTC in restrictive networks  
- Horizontal scaling requires Redis adapter for Socket.IO + sticky sessions  
- DeepL stream per speaker is stateful — session affinity matters  
- HTTPS required for `getUserMedia` outside localhost  

---

*Last updated to match the two-user live interpreter architecture (Socket.IO + DeepL Voice v3 + mic PCM + WebM TTS playback).*
