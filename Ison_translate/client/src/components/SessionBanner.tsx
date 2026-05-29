import { ChevronDown, ChevronUp, Copy, LogIn, Mic, MicOff, PhoneOff } from 'lucide-react'
import { useState } from 'react'
import { languageLabel } from '../config'
import type { SessionConfig } from '../types'

type Props = {
  session: SessionConfig | null
  joining: boolean
  muted: boolean
  partnerConnected: boolean
  socketConnected: boolean
  micStatus: string
  sourceLang: string
  targetLang: string
  onLeave: () => void
  onToggleMute: () => void
  onJoinDifferent: () => void
}

/**
 * M3 Top App Bar — Small variant, used as a sticky session-control bar.
 * surface-container-high background to visually separate from main content.
 */
export function SessionBanner({
  session,
  joining,
  muted,
  partnerConnected,
  socketConnected,
  micStatus,
  sourceLang,
  targetLang,
  onLeave,
  onToggleMute,
  onJoinDifferent,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const sessionId = session?.sessionId ?? ''

  function copySessionId() {
    if (!sessionId) return
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div
      className="sticky top-0 z-10 shrink-0"
      style={{
        background: 'var(--md-surface-container)',
        borderBottom: '1px solid var(--md-outline-variant)',
      }}
    >
      {/* ── Slim always-visible row ── */}
      <div className="flex h-14 items-center gap-1 px-2">

        {/* Session ID */}
        <div className="flex min-w-0 flex-1 items-center gap-1 pl-2">
          {joining ? (
            <span
              className="animate-pulse text-sm"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              Connecting…
            </span>
          ) : sessionId ? (
            <>
              <span
                className="truncate font-mono text-sm font-medium"
                style={{ color: 'var(--md-on-surface)', letterSpacing: '0.025rem' }}
              >
                {sessionId}
              </span>
              <button
                className="md-icon-btn"
                onClick={copySessionId}
                title="Copy session ID"
                aria-label="Copy session ID"
                style={{ width: '2rem', height: '2rem', color: 'var(--md-on-surface-variant)' }}
              >
                <Copy size={14} />
              </button>
              {copied && (
                <span
                  className="text-xs"
                  style={{ color: 'var(--md-primary)' }}
                >
                  Copied
                </span>
              )}
            </>
          ) : (
            <span
              className="text-sm"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              No active session
            </span>
          )}
        </div>

        {/* Collapsed quick-controls */}
        {collapsed && session && (
          <div className="flex items-center">
            <IconBtn
              title={muted ? 'Unmute' : 'Mute'}
              onClick={onToggleMute}
              danger={muted}
            >
              {muted ? <MicOff size={18} /> : <Mic size={18} />}
            </IconBtn>
            <IconBtn title="Leave session" onClick={onLeave} danger>
              <PhoneOff size={18} />
            </IconBtn>
            <IconBtn title="Join a different session" onClick={onJoinDifferent}>
              <LogIn size={18} />
            </IconBtn>
          </div>
        )}

        <button
          className="md-icon-btn"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={{ color: 'var(--md-on-surface-variant)' }}
        >
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {/* ── Expanded metadata + controls ── */}
      {!collapsed && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          style={{ borderTop: '1px solid var(--md-outline-variant)' }}
        >
          {/* Left: status metadata — Body Small / Label Small */}
          <div
            className="flex flex-col gap-1"
            style={{
              fontSize: '0.75rem',
              lineHeight: '1rem',
              color: 'var(--md-on-surface-variant)',
            }}
          >
            {session ? (
              <>
                <p>
                  Server:{' '}
                  <span style={{ color: socketConnected ? '#22c55e' : '#f59e0b', fontWeight: 500 }}>
                    {socketConnected ? 'connected' : 'reconnecting…'}
                  </span>
                  {'  ·  '}
                  Partner:{' '}
                  <span
                    style={{
                      color: partnerConnected ? '#22c55e' : 'var(--md-outline)',
                      fontWeight: 500,
                    }}
                  >
                    {partnerConnected ? 'connected' : 'waiting'}
                  </span>
                </p>
                <p>
                  My language:{' '}
                  <span style={{ color: 'var(--md-on-surface)', fontWeight: 500 }}>
                    {languageLabel(sourceLang)}
                  </span>
                  {partnerConnected && targetLang && targetLang !== sourceLang ? (
                    <>
                      {'  ·  '}Partner:{' '}
                      <span style={{ color: 'var(--md-on-surface)', fontWeight: 500 }}>
                        {languageLabel(targetLang)}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--md-outline)' }}>
                      {' '}· Partner language resolves on join
                    </span>
                  )}
                </p>
                {partnerConnected && (
                  <p>Mic: <span style={{ fontWeight: 500, color: 'var(--md-on-surface)' }}>{micStatus}</span></p>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--md-outline)' }}>
                {joining ? 'Setting up your session…' : 'No active session'}
              </p>
            )}
          </div>

          {/* Right: action buttons */}
          {session && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onToggleMute}
                className="md-btn md-btn-tonal"
                style={
                  muted
                    ? {
                        background: 'var(--md-error-container)',
                        color: 'var(--md-on-error-container)',
                        height: '2rem',
                        fontSize: '0.75rem',
                        padding: '0 0.75rem',
                      }
                    : { height: '2rem', fontSize: '0.75rem', padding: '0 0.75rem' }
                }
              >
                {muted ? <MicOff size={14} /> : <Mic size={14} />}
                {muted ? 'Unmute' : 'Mute'}
              </button>

              <button
                onClick={onJoinDifferent}
                className="md-btn md-btn-outlined"
                style={{ height: '2rem', fontSize: '0.75rem', padding: '0 0.75rem' }}
              >
                <LogIn size={14} />
                Join different session
              </button>

              <button
                onClick={onLeave}
                className="md-btn md-btn-error"
                style={{ height: '2rem', fontSize: '0.75rem', padding: '0 0.75rem' }}
              >
                <PhoneOff size={14} />
                Leave
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
  disabled,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="md-icon-btn"
      style={{
        color: danger ? 'var(--md-error)' : 'var(--md-on-surface-variant)',
      }}
    >
      {children}
    </button>
  )
}
