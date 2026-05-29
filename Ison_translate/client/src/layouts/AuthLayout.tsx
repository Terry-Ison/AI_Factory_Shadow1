import { Globe, History, Mic } from 'lucide-react'

type Props = {
  children: React.ReactNode
}

/* ── Wave bars: 15 bars, staggered delays + height envelope ──── */
const WAVE_COUNT = 15
const WAVE_DELAYS = [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.84, 0.72, 0.60, 0.48, 0.36, 0.24, 0.12, 0]
const WAVE_HEIGHTS = [0.35, 0.5, 0.65, 0.82, 0.92, 1, 0.88, 0.75, 0.88, 1, 0.92, 0.82, 0.65, 0.5, 0.35]

function AudioWave() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        pointerEvents: 'none',
        opacity: 0.65,
      }}
    >
      {Array.from({ length: WAVE_COUNT }, (_, i) => (
        <span
          key={i}
          className="wave-bar"
          style={{
            animationDelay: `${WAVE_DELAYS[i]}s`,
            height: `${44 * WAVE_HEIGHTS[i]}px`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Full-viewport auth shell.
 * Left  — 75vh glass card with animated wave header.
 * Right — rich hero section (desktop only).
 */
export function AuthLayout({ children }: Props) {
  return (
    <div
      className="relative flex min-h-screen w-full overflow-hidden"
      style={{
        backgroundImage: `url('/hAI-ison.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#0b0f17',
      }}
    >
      {/* Scrim */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(5,8,18,0.85) 0%, rgba(10,14,28,0.65) 100%)',
        }}
      />

      {/* ── Left panel ── */}
      <div
        className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-5 py-10 sm:px-8 lg:w-[640px] lg:items-stretch"
        style={{ paddingLeft: 'clamp(1.25rem, 3vw, 3rem)', paddingRight: 'clamp(1.25rem, 3vw, 2.5rem)' }}
      >
        {/* 75vh glass card */}
        <div
          style={{
            height: '75vh',
            minHeight: '540px',
            width: '100%',
            maxWidth: '520px',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--shape-xl)',
            background: 'rgba(12, 15, 28, 0.56)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.11)',
            boxShadow:
              '0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}
        >
          {/* Brand header + waves */}
          <div
            style={{
              position: 'relative',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '92px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}
          >
            <AudioWave />
            <span
              className="font-display relative z-10"
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                letterSpacing: '-0.015em',
                color: '#ffffff',
                textShadow: '0 0 40px rgba(190,194,255,0.9), 0 0 80px rgba(190,194,255,0.4)',
              }}
            >
              Transly
            </span>
          </div>

          {/* Scrollable form */}
          <div
            className="auth-glass-content"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '2.5rem 3rem 2rem',
              scrollbarWidth: 'none',
            }}
          >
            {children}
          </div>
        </div>
      </div>

<<<<<<< Updated upstream
      {/* Right branding — hidden on mobile */}
      <div className="relative z-10 hidden flex-1 flex-col items-center justify-center px-10 sm:flex">
        <div className="max-w-lg text-center">
          <h1 className="font-display text-5xl font-bold leading-tight text-white drop-shadow-lg xl:text-6xl">
            Welcome to<br />
            <span className="text-indigo-400">Transly</span>
          </h1>
          <p className="mt-5 text-lg text-slate-300 drop-shadow">
            Real-time voice translation — effortless conversations across any language barrier.
          </p>
=======
      {/* ── Right hero panel (desktop) ── */}
      <div className="relative z-10 hidden flex-1 flex-col items-center justify-center px-8 lg:flex xl:px-16">
        <HeroContent />
      </div>
    </div>
  )
}

/* ── Feature data with Lucide icons ────────────────────────────── */
const FEATURES = [
  {
    icon: Mic,
    iconClass: 'icon-float-0',
    heroClass: 'hero-feature-0',
    gradient: 'linear-gradient(135deg, #5156B5 0%, #BEC2FF 100%)',
    title: 'Real-time voice translation',
    body: 'Speak naturally — your words appear translated in your partner\'s language under a second.',
  },
  {
    icon: Globe,
    iconClass: 'icon-float-1',
    heroClass: 'hero-feature-1',
    gradient: 'linear-gradient(135deg, #2D5F9E 0%, #7CB9FF 100%)',
    title: '30+ languages, zero setup',
    body: 'Powered by elite AI models, the highest-accuracy neural translation engine is now at your fingertips.',
  },
  {
    icon: History,
    iconClass: 'icon-float-2',
    heroClass: 'hero-feature-2',
    gradient: 'linear-gradient(135deg, #5D3751 0%, #E8B4D8 100%)',
    title: 'Full session history',
    body: 'Every conversation is saved with a searchable transcript and playable audio recordings.',
  },
]

function HeroContent() {
  return (
    <div style={{ maxWidth: '480px' }}>
      {/* Headline with staggered reveal */}
      <h1 className="font-display" style={{ lineHeight: 1.12, marginBottom: '1rem' }}>
        <span
          className="hero-line-1"
          style={{
            display: 'block',
            fontSize: 'clamp(2rem, 3.2vw, 2.75rem)',
            fontWeight: 700,
            color: '#ffffff',
            textShadow: '0 2px 32px rgba(0,0,0,0.5)',
          }}
        >
          Speak freely.
        </span>
        <span
          className="hero-line-2"
          style={{
            display: 'block',
            fontSize: 'clamp(2rem, 3.2vw, 2.75rem)',
            fontWeight: 700,
            color: '#BEC2FF',
            textShadow: '0 0 48px rgba(190,194,255,0.5)',
          }}
        >
          Be understood — anywhere.
        </span>
      </h1>

      {/* Tagline */}
      <p
        className="hero-tagline"
        style={{
          fontSize: '1rem',
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.60)',
          marginBottom: '2.25rem',
        }}
      >
        Break language barriers in real time. Whether you're across the table or across the globe,
        Transly turns your voice into a bridge that everyone can cross.
      </p>

      {/* Feature cards */}
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {FEATURES.map((f) => {
          const Icon = f.icon
          return (
            <li
              key={f.title}
              className={f.heroClass}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                background: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--shape-lg)',
                padding: '1rem 1.25rem',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              {/* Animated icon in gradient container */}
              <div
                className={f.iconClass}
                style={{
                  flexShrink: 0,
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--shape-md)',
                  background: f.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  marginTop: '1px',
                }}
              >
                <Icon size={18} color="#ffffff" strokeWidth={2.2} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    lineHeight: 1.3,
                    marginBottom: '0.25rem',
                  }}
                >
                  {f.title}
                </p>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    lineHeight: 1.55,
                    color: 'rgba(255,255,255,0.52)',
                  }}
                >
                  {f.body}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Mock conversation preview — shows the product in action */}
      <MockConversation />
    </div>
  )
}

/* ── Mock live conversation ─────────────────────────────────────── */
function MockConversation() {
  return (
    <div
      className="hero-preview"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 'var(--shape-lg)',
        padding: '1.125rem 1.25rem',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '9999px',
            background: '#22c55e',
            boxShadow: '0 0 8px rgba(34,197,94,0.7)',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.38)',
          }}
        >
          Live session preview
        </span>
      </div>

      {/* Bubbles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {/* Outgoing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(190,194,255,0.65)', paddingLeft: '0.25rem' }}>
            You · English
          </span>
          <div
            style={{
              alignSelf: 'flex-start',
              background: 'rgba(81,86,181,0.35)',
              border: '1px solid rgba(190,194,255,0.2)',
              borderRadius: '14px 14px 14px 4px',
              padding: '0.55rem 0.875rem',
              maxWidth: '90%',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.92)', lineHeight: 1.4 }}>
              Good morning! Can we start the meeting now?
            </p>
          </div>
        </div>

        {/* Incoming translated */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.38)', paddingRight: '0.25rem' }}>
            Partner · French
          </span>
          <div
            style={{
              alignSelf: 'flex-end',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px 14px 4px 14px',
              padding: '0.55rem 0.875rem',
              maxWidth: '90%',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.4 }}>
              Bonjour ! Oui, commençons la réunion.
            </p>
          </div>
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  )
}
