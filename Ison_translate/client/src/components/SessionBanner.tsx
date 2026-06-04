import { ChevronDown, ChevronUp, Copy, LogIn, Mic, MicOff, PhoneOff, Send, Volume2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import { languageLabel } from '../config'
import { useOnClickOutside } from '../hooks/useOnClickOutside'
import type { SessionConfig } from '../types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type VoiceGender = 'male' | 'female'

const voiceOptions: { value: VoiceGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

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
  onVoiceChange?: (voice: VoiceGender) => void
  voice?: VoiceGender
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
  onVoiceChange,
  voice,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [internalVoice, setInternalVoice] = useState<VoiceGender>('female')
  const [inviteOpen, setInviteOpen] = useState(false)
  const inviteRef = useRef<HTMLDivElement | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const activeVoice = voice ?? internalVoice

  const sessionId = session?.sessionId ?? ''

  useOnClickOutside(inviteRef, () => setInviteOpen(false), inviteOpen)
  function copySessionId() {
    if (!sessionId) return
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  function handleVoiceChange(next: VoiceGender) {
    setInternalVoice(next)
    onVoiceChange?.(next)
  }
  async function sendInvite() {
    const email = inviteEmail.trim()
    if (!email) return

    setInviteError(null)
    setInviteSuccess(null)
    setInviteSending(true)
    try {
      await axiosInstance.post('/admin/invite', { email })
      setInviteSuccess('Invite sent')
      setInviteEmail('')
      window.setTimeout(() => setInviteOpen(false), 700)
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((err as any).response?.data?.message as string) ?? 'Failed to send invite'
          : 'Failed to send invite'
      setInviteError(message)
    } finally {
      setInviteSending(false)
    }
  }

  return (
    <div
      className="shrink-0"
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
            <VoiceSelect activeVoice={activeVoice} onVoiceChange={handleVoiceChange} compact />
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
                      {/* {' '}· Partner language resolves on join */}
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
              <Button variant="default" size="default" onClick={onToggleMute}>
                {muted ? <MicOff size={14} /> : <Mic size={14} />}
                {muted ? 'Unmute' : 'Mute'}
              </Button>

              <VoiceSelect activeVoice={activeVoice} onVoiceChange={handleVoiceChange} />

              <Button variant="default" size="default" onClick={onJoinDifferent}>
                <LogIn size={14} />
                Join different session
              </Button>
              <Button variant="destructive" size="sm" onClick={onLeave}>
                <PhoneOff size={14} />
                Leave
              </Button>
              <Button
                variant="default"
                size="default"
                onClick={() => {
                  setInviteError(null)
                  setInviteSuccess(null)
                  setInviteOpen(true)
                }}
              >
                <Send size={14} />
                Invite User
              </Button>
            </div>
          )}
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--md-scrim)' }}>
          <div
            ref={inviteRef}
            className="w-full max-w-md overflow-hidden"
            style={{
              background: 'var(--md-surface-container-lowest)',
              border: '1px solid var(--md-outline-variant)',
              borderRadius: 'var(--shape-sm)',
              boxShadow: 'var(--elevation-4)',
            }}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
              <div>
                <p className="text-lg font-medium leading-6" style={{ color: 'var(--md-on-surface)' }}>
                  Invite user
                </p>
                <p className="text-sm leading-5" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Enter email to send invitation.
                </p>
              </div>
              <button type="button" className="md-icon-btn" onClick={() => setInviteOpen(false)} aria-label="Close invite popup">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <Input
                label="Email address"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="name@company.com"
                type="email"
                autoFocus
                error={inviteError}
              />
              {inviteSuccess && (
                <div className="px-3 py-2 text-sm" style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)', borderRadius: 'var(--shape-sm)' }}>
                  {inviteSuccess}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--md-outline-variant)' }}>
              <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviteSending}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => void sendInvite()}
                disabled={!inviteEmail.trim()}
              >
                Send invite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VoiceSelect({
  activeVoice,
  onVoiceChange,
  compact = false,
}: {
  activeVoice: VoiceGender
  onVoiceChange: (voice: VoiceGender) => void
  compact?: boolean
}) {
  return (
    <Select value={activeVoice} onValueChange={(value) => onVoiceChange(value as VoiceGender)}>
      <SelectTrigger
        size={compact ? 'sm' : 'default'}
        aria-label="Voice"
        className={
          compact
            ? 'h-8 min-w-[6.5rem] gap-1.5 border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-2 text-[var(--md-on-surface)] shadow-none hover:bg-[var(--md-surface-container-high)]'
            : 'min-w-[7.5rem] gap-2 border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-3 text-[var(--md-on-surface)] shadow-none hover:bg-[var(--md-surface-container-high)]'
        }
      >
        <Volume2 className="size-4 shrink-0 text-[var(--md-on-surface-variant)]" />
        <SelectValue placeholder="Voice" />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[7.5rem]">
        {voiceOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} textValue={option.label}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function IconBtn({ children,
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
