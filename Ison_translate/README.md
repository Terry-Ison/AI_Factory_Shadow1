# Transly — AI Meeting Live Translation

Real-time meeting translation: capture browser tab audio (Google Meet, Zoom, Teams), stream to DeepL Voice API, show live transcript cards, and play translated AI voice.

## Prerequisites

- Node.js 20+
- DeepL API key with **paid plan** (Voice API requires paid subscription)
- Chrome or Edge (recommended for tab audio capture)

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Configure the API:

```bash
copy api\.env.example api\.env
```

Edit `api/.env` and set your `DEEPL_AUTH_KEY`.

3. (Optional) Configure the client:

```bash
copy client\.env.example client\.env
```

## Run

From the project root:

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Usage

1. Open your meeting in a browser tab.
2. Open Transly.
3. Choose target language and AI voice.
4. Click **Start translation**.
5. Select the meeting tab and enable **Share tab audio**.
6. Lower the meeting tab volume to avoid hearing original + translated audio together.

## Architecture

```
Browser tab audio → AudioWorklet (16kHz PCM) → Socket.IO → Node.js → DeepL Voice WebSocket
                                                                              ↓
                                    Transcript cards + AI voice playback ← Frontend
```

## Project structure

```
api/          Node.js + Express + Socket.IO + DeepL Voice client
client/       React 19 + Redux + Tailwind + Framer Motion
```

## Security

- DeepL API key stays on the server only (`api/.env`).
- Do not commit `.env` files.

## Notes

- Translated speech (TTS) may require DeepL Voice API access on your plan.
- Hindi and other languages use BCP-47 codes (`hi`, `en`, `ja`, etc.).
