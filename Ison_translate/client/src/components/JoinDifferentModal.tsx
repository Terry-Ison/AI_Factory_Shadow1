import { X } from 'lucide-react'
import { useState } from 'react'

type Props = {
  onConfirm: (sessionId: string) => void
  onClose: () => void
}

/**
 * M3 Dialog — surface-container-high background, shape-xl corners,
 * elevation-3 shadow, scrim backdrop.
 */
export function JoinDifferentModal({ onConfirm, onClose }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = value.trim()
    if (!id) return
    onConfirm(id)
  }

  return (
    /* M3 scrim */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'var(--md-scrim)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* M3 Dialog container */}
      <div
        className="w-full max-w-sm"
        style={{
          background: 'var(--md-surface-container-high)',
          borderRadius: 'var(--shape-xl)',
          boxShadow: 'var(--elevation-3)',
          padding: '1.5rem',
        }}
      >
        {/* Dialog header */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 400,
              lineHeight: '2rem',
              color: 'var(--md-on-surface)',
            }}
          >
            Join a session
          </h2>
          <button
            className="md-icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ color: 'var(--md-on-surface-variant)', marginTop: '-0.25rem', marginRight: '-0.5rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Dialog body */}
        <p
          className="mb-5"
          style={{
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          Enter the session ID shared by your partner. Your current session will be left.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="md-field">
            <label
              className="md-field-label"
              htmlFor="session-id-input"
            >
              Session ID
            </label>
            <input
              id="session-id-input"
              autoFocus
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. abc-123-xyz"
              className="md-field-input"
            />
          </div>

          {/* M3 Dialog action row — Text + Filled buttons, right-aligned */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="md-btn md-btn-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="md-btn md-btn-filled"
            >
              Join
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
