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
    <div className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-[var(--color-bg)]/90 backdrop-blur-sm">

      {/* Slim always-visible bar */}
      <div className="flex items-center gap-2 px-4 py-2">

        {/* Session ID + copy */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {joining ? (
            <span className="text-xs text-slate-400 animate-pulse">Connecting…</span>
          ) : sessionId ? (
            <>
              <span className="font-mono text-sm font-medium text-slate-200 truncate">
                {sessionId}
              </span>
              <button
                onClick={copySessionId}
                title="Copy session ID"
                className="shrink-0 rounded p-1 text-slate-500 hover:text-slate-200 transition"
              >
                <Copy size={13} />
              </button>
              {copied && <span className="text-xs text-green-400">Copied!</span>}
            </>
          ) : (
            <span className="text-xs text-slate-500">No active session</span>
          )}
        </div>

        {/* Collapsed icon controls */}
        {collapsed && session && (
          <div className="flex items-center gap-1">
            <IconBtn
              title={muted ? 'Unmute' : 'Mute'}
              onClick={onToggleMute}
              active={muted}
              danger={muted}
            >
              {muted ? <MicOff size={15} /> : <Mic size={15} />}
            </IconBtn>
            <IconBtn title="Leave session" onClick={onLeave} danger>
              <PhoneOff size={15} />
            </IconBtn>
            <IconBtn title="Join a different session" onClick={onJoinDifferent}>
              <LogIn size={15} />
            </IconBtn>
          </div>
        )}

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="shrink-0 rounded p-1 text-slate-500 hover:text-white transition"
          title={collapsed ? 'Expand banner' : 'Collapse banner'}
        >
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
      </div>

      {/* Expanded content */}
      {!collapsed && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-3">

          {/* Left: metadata */}
          <div className="flex flex-col gap-1 text-xs text-slate-400">
            {session ? (
              <>
                <p>
                  Server:{' '}
                  <span className={socketConnected ? 'text-green-400' : 'text-amber-400'}>
                    {socketConnected ? 'connected' : 'reconnecting…'}
                  </span>
                  {' · '}
                  Partner:{' '}
                  <span className={partnerConnected ? 'text-green-400' : 'text-slate-500'}>
                    {partnerConnected ? 'connected' : 'waiting'}
                  </span>
                </p>
                <p>
                  My language: <span className="text-slate-200">{languageLabel(sourceLang)}</span>
                  {partnerConnected && targetLang && targetLang !== sourceLang ? (
                    <>
                      {' · '}Partner: <span className="text-slate-200">{languageLabel(targetLang)}</span>
                    </>
                  ) : (
                    <span className="text-slate-600"> · Partner language resolves on join</span>
                  )}
                </p>
                {partnerConnected && (
                  <p>Mic: {micStatus}</p>
                )}
              </>
            ) : (
              <p className="text-slate-500">{joining ? 'Setting up your session…' : 'No active session'}</p>
            )}
          </div>

          {/* Right: controls */}
          <div className="flex flex-wrap items-center gap-2">
            {session && (
              <>
                <button
                  onClick={onToggleMute}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    muted
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                      : 'border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {muted ? <MicOff size={12} /> : <Mic size={12} />}
                  {muted ? 'Unmute' : 'Mute'}
                </button>

                <button
                  onClick={onJoinDifferent}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  <LogIn size={12} />
                  Join a different session
                </button>

                <button
                  onClick={onLeave}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
                >
                  <PhoneOff size={12} />
                  Leave
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function IconBtn({
  children,
  title,
  onClick,
  active,
  danger,
  disabled,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  active?: boolean
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded p-1.5 transition disabled:opacity-50 ${
        danger
          ? 'text-rose-400 hover:bg-rose-500/10'
          : active
            ? 'text-amber-300 hover:bg-amber-500/10'
            : 'text-slate-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
