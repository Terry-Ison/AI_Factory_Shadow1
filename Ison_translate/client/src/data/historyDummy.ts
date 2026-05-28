import type { TranscriptLine } from '@/types'

export type HistoryUser = {
  id: string
  name: string
  email: string
  initials: string
  role: string
  sessionCount: number
  lastActive: string
}

export type HistorySession = {
  id: string
  userId: string
  sessionId: string
  title: string
  date: string
  duration: string
  sourceLang: string
  targetLang: string
  partnerName: string
  selfLines: TranscriptLine[]
  partnerLines: TranscriptLine[]
}

export const HISTORY_USERS: HistoryUser[] = [
  {
    id: 'user-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    initials: 'PS',
    role: 'Product Manager',
    sessionCount: 4,
    lastActive: '2 hours ago',
  },
  {
    id: 'user-2',
    name: 'James Chen',
    email: 'james.chen@example.com',
    initials: 'JC',
    role: 'Sales Lead',
    sessionCount: 3,
    lastActive: 'Yesterday',
  },
  {
    id: 'user-3',
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    initials: 'MG',
    role: 'Support Agent',
    sessionCount: 5,
    lastActive: '3 days ago',
  },
  {
    id: 'user-4',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@example.com',
    initials: 'AH',
    role: 'Engineer',
    sessionCount: 2,
    lastActive: '1 week ago',
  },
  {
    id: 'user-5',
    name: 'Emma Wilson',
    email: 'emma.wilson@example.com',
    initials: 'EW',
    role: 'HR Coordinator',
    sessionCount: 3,
    lastActive: '2 weeks ago',
  },
]

function line(text: string, isFinal = true): TranscriptLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    isFinal,
    timestamp: Date.now(),
  }
}

export const HISTORY_SESSIONS: HistorySession[] = [
  {
    id: 'sess-1',
    userId: 'user-1',
    sessionId: 'LD-2847',
    title: 'Client onboarding call',
    date: 'May 26, 2026 · 2:14 PM',
    duration: '18 min',
    sourceLang: 'en',
    targetLang: 'hi',
    partnerName: 'Raj Patel',
    selfLines: [
      line('Welcome to Transly. Let me walk you through the setup.'),
      line('You can share a session ID with your partner on any device.'),
      line('The microphone will stream your speech in real time.'),
    ],
    partnerLines: [
      line('Transly में आपका स्वागत है। मैं आपको सेटअप के बारे में बताती हूँ।'),
      line('आप किसी भी डिवाइस पर अपने साथी के साथ सेशन ID साझा कर सकते हैं।'),
      line('माइक्रोफ़ोन आपकी आवाज़ को रियल टाइम में स्ट्रीम करेगा।'),
    ],
  },
  {
    id: 'sess-2',
    userId: 'user-1',
    sessionId: 'LD-2812',
    title: 'Vendor negotiation',
    date: 'May 24, 2026 · 11:30 AM',
    duration: '32 min',
    sourceLang: 'en',
    targetLang: 'de',
    partnerName: 'Klaus Weber',
    selfLines: [
      line('We can offer a 15% discount on annual plans.'),
      line('Delivery would start within two weeks of signing.'),
    ],
    partnerLines: [
      line('Wir können 15 % Rabatt auf Jahrespläne anbieten.'),
      line('Die Lieferung würde innerhalb von zwei Wochen nach Unterzeichnung beginnen.'),
    ],
  },
  {
    id: 'sess-3',
    userId: 'user-1',
    sessionId: 'LD-2799',
    title: 'Team standup',
    date: 'May 22, 2026 · 9:00 AM',
    duration: '12 min',
    sourceLang: 'en',
    targetLang: 'fr',
    partnerName: 'Sophie Martin',
    selfLines: [
      line('Sprint goals are on track for this week.'),
      line('We need one more review on the subtitle panel UI.'),
    ],
    partnerLines: [
      line('Les objectifs du sprint sont en bonne voie cette semaine.'),
      line('Il nous faut une revue supplémentaire sur l’interface des sous-titres.'),
    ],
  },
  {
    id: 'sess-4',
    userId: 'user-1',
    sessionId: 'LD-2755',
    title: 'Investor demo',
    date: 'May 18, 2026 · 4:45 PM',
    duration: '25 min',
    sourceLang: 'en',
    targetLang: 'ja',
    partnerName: 'Yuki Tanaka',
    selfLines: [
      line('Transly removes language barriers in live conversations.'),
      line('Latency stays under two seconds for most language pairs.'),
    ],
    partnerLines: [
      line('Translyはライブ会話の言語の壁を取り除きます。'),
      line('ほとんどの言語ペアで遅延は2秒未満です。'),
    ],
  },
  {
    id: 'sess-5',
    userId: 'user-2',
    sessionId: 'LD-2901',
    title: 'Enterprise pitch',
    date: 'May 25, 2026 · 3:00 PM',
    duration: '41 min',
    sourceLang: 'en',
    targetLang: 'es',
    partnerName: 'Carlos Ruiz',
    selfLines: [
      line('Our enterprise tier includes SSO and dedicated support.'),
      line('You can run unlimited concurrent sessions.'),
    ],
    partnerLines: [
      line('Nuestro plan empresarial incluye SSO y soporte dedicado.'),
      line('Pueden ejecutar sesiones concurrentes ilimitadas.'),
    ],
  },
  {
    id: 'sess-6',
    userId: 'user-2',
    sessionId: 'LD-2888',
    title: 'Partner sync',
    date: 'May 23, 2026 · 10:15 AM',
    duration: '15 min',
    sourceLang: 'en',
    targetLang: 'pt',
    partnerName: 'Ana Costa',
    selfLines: [
      line('Q2 pipeline looks strong in the LATAM region.'),
      line('We should schedule a joint webinar next month.'),
    ],
    partnerLines: [
      line('O pipeline do Q2 parece forte na região LATAM.'),
      line('Devemos agendar um webinar conjunto no próximo mês.'),
    ],
  },
  {
    id: 'sess-7',
    userId: 'user-2',
    sessionId: 'LD-2860',
    title: 'Customer feedback review',
    date: 'May 20, 2026 · 1:20 PM',
    duration: '22 min',
    sourceLang: 'en',
    targetLang: 'it',
    partnerName: 'Marco Bianchi',
    selfLines: [
      line('Users love the real-time subtitle experience.'),
      line('They asked for export to PDF for meeting notes.'),
    ],
    partnerLines: [
      line('Gli utenti adorano l’esperienza dei sottotitoli in tempo reale.'),
      line('Hanno chiesto l’esportazione in PDF per gli appunti delle riunioni.'),
    ],
  },
  {
    id: 'sess-8',
    userId: 'user-3',
    sessionId: 'LD-2910',
    title: 'Support ticket #4821',
    date: 'May 27, 2026 · 9:45 AM',
    duration: '8 min',
    sourceLang: 'en',
    targetLang: 'ar',
    partnerName: 'Fatima Al-Rashid',
    selfLines: [
      line('Let me help you reconnect to your session.'),
      line('Please check that microphone permissions are enabled.'),
    ],
    partnerLines: [
      line('دعني أساعدك في إعادة الاتصال بالجلسة.'),
      line('يرجى التحقق من تفعيل أذونات الميكروفون.'),
    ],
  },
  {
    id: 'sess-9',
    userId: 'user-3',
    sessionId: 'LD-2895',
    title: 'Billing inquiry',
    date: 'May 26, 2026 · 2:30 PM',
    duration: '11 min',
    sourceLang: 'en',
    targetLang: 'ko',
    partnerName: 'Min-jun Park',
    selfLines: [
      line('Your Pro subscription renews on the first of each month.'),
      line('I can send you an invoice copy by email.'),
    ],
    partnerLines: [
      line('Pro 구독은 매월 1일에 갱신됩니다.'),
      line('이메일로 송장 사본을 보내 드릴 수 있습니다.'),
    ],
  },
  {
    id: 'sess-10',
    userId: 'user-3',
    sessionId: 'LD-2872',
    title: 'Onboarding walkthrough',
    date: 'May 24, 2026 · 11:00 AM',
    duration: '20 min',
    sourceLang: 'en',
    targetLang: 'zh',
    partnerName: 'Wei Zhang',
    selfLines: [
      line('Click Join session after entering your session ID.'),
      line('Swap source and target languages with your partner.'),
    ],
    partnerLines: [
      line('输入会话 ID 后点击加入会话。'),
      line('与您的伙伴交换源语言和目标语言。'),
    ],
  },
  {
    id: 'sess-11',
    userId: 'user-3',
    sessionId: 'LD-2850',
    title: 'Feature request call',
    date: 'May 21, 2026 · 4:00 PM',
    duration: '14 min',
    sourceLang: 'en',
    targetLang: 'ru',
    partnerName: 'Dmitri Volkov',
    selfLines: [
      line('Dark mode and history export are on our roadmap.'),
      line('Thank you for the detailed feedback.'),
    ],
    partnerLines: [
      line('Тёмная тема и экспорт истории есть в нашем плане.'),
      line('Спасибо за подробную обратную связь.'),
    ],
  },
  {
    id: 'sess-12',
    userId: 'user-3',
    sessionId: 'LD-2833',
    title: 'Escalation follow-up',
    date: 'May 19, 2026 · 10:30 AM',
    duration: '16 min',
    sourceLang: 'en',
    targetLang: 'fr',
    partnerName: 'Luc Bernard',
    selfLines: [
      line('The audio delay issue has been resolved in the latest release.'),
      line('Please try joining the session again.'),
    ],
    partnerLines: [
      line('Le problème de délai audio a été résolu dans la dernière version.'),
      line('Veuillez réessayer de rejoindre la session.'),
    ],
  },
  {
    id: 'sess-13',
    userId: 'user-4',
    sessionId: 'LD-2920',
    title: 'API integration review',
    date: 'May 27, 2026 · 11:00 AM',
    duration: '28 min',
    sourceLang: 'en',
    targetLang: 'de',
    partnerName: 'Stefan Braun',
    selfLines: [
      line('WebSocket events include translation_result and self_transcript.'),
      line('Audio chunks are base64-encoded PCM at 24 kHz.'),
    ],
    partnerLines: [
      line('WebSocket-Ereignisse umfassen translation_result und self_transcript.'),
      line('Audiosegmente sind base64-kodiertes PCM bei 24 kHz.'),
    ],
  },
  {
    id: 'sess-14',
    userId: 'user-4',
    sessionId: 'LD-2905',
    title: 'Architecture discussion',
    date: 'May 25, 2026 · 3:30 PM',
    duration: '35 min',
    sourceLang: 'en',
    targetLang: 'ja',
    partnerName: 'Kenji Sato',
    selfLines: [
      line('We use DeepL for translation and a separate TTS pipeline.'),
      line('WebRTC handles peer audio when both clients are connected.'),
    ],
    partnerLines: [
      line('翻訳にDeepLを使用し、別のTTSパイプラインを使用しています。'),
      line('WebRTCは両方のクライアントが接続されているときにピア音声を処理します。'),
    ],
  },
  {
    id: 'sess-15',
    userId: 'user-5',
    sessionId: 'LD-2880',
    title: 'HR policy briefing',
    date: 'May 23, 2026 · 9:30 AM',
    duration: '19 min',
    sourceLang: 'en',
    targetLang: 'es',
    partnerName: 'Isabella Torres',
    selfLines: [
      line('Remote work policy updates take effect next quarter.'),
      line('All-hands will be translated live for global teams.'),
    ],
    partnerLines: [
      line('Las actualizaciones de la política de trabajo remoto entran en vigor el próximo trimestre.'),
      line('La reunión general se traducirá en vivo para los equipos globales.'),
    ],
  },
  {
    id: 'sess-16',
    userId: 'user-5',
    sessionId: 'LD-2865',
    title: 'Interview panel',
    date: 'May 21, 2026 · 2:00 PM',
    duration: '45 min',
    sourceLang: 'en',
    targetLang: 'hi',
    partnerName: 'Vikram Singh',
    selfLines: [
      line('Tell us about your experience with multilingual teams.'),
      line('How would you handle a live translation outage?'),
    ],
    partnerLines: [
      line('बहुभाषी टीमों के साथ अपने अनुभव के बारे में बताएं।'),
      line('लाइव अनुवाद outage को आप कैसे संभालेंगे?'),
    ],
  },
  {
    id: 'sess-17',
    userId: 'user-5',
    sessionId: 'LD-2840',
    title: 'Training session',
    date: 'May 17, 2026 · 10:00 AM',
    duration: '30 min',
    sourceLang: 'en',
    targetLang: 'fr',
    partnerName: 'Claire Dubois',
    selfLines: [
      line('Today we cover session setup and language pairing.'),
      line('Practice with a colleague using the same session ID.'),
    ],
    partnerLines: [
      line('Aujourd’hui nous couvrons la configuration de session et le couplage des langues.'),
      line('Entraînez-vous avec un collègue en utilisant le même ID de session.'),
    ],
  },
]

export function getSessionsForUser(userId: string): HistorySession[] {
  return HISTORY_SESSIONS.filter((s) => s.userId === userId)
}

export function getUserById(userId: string): HistoryUser | undefined {
  return HISTORY_USERS.find((u) => u.id === userId)
}

export function getSessionById(sessionId: string): HistorySession | undefined {
  return HISTORY_SESSIONS.find((s) => s.id === sessionId)
}
