import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT) || 3001,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  deeplAuthKey: process.env.DEEPL_AUTH_KEY || process.env.DEEPL_API_KEY || '',
  deeplApiUrl: (process.env.DEEPL_API_URL || 'https://api.deepl.com').replace(/\/$/, ''),
  deeplVoiceWsUrl:
    process.env.DEEPL_VOICE_WS_URL || 'wss://api.deepl.com/v3/voice/realtime/connect',
}

export function assertDeepLConfigured() {
  if (!config.deeplAuthKey) {
    throw new Error('DEEPL_AUTH_KEY is not set. Add it to api/.env')
  }
}
