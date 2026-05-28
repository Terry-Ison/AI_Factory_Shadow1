import { X } from 'lucide-react'
import { useState } from 'react'

type Props = {
  onConfirm: (sessionId: string) => void
  onClose: () => void
}

export function JoinDifferentModal({ onConfirm, onClose }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = value.trim()
    if (!id) return
    onConfirm(id)
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Join a different session</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-400">
          Enter the session ID shared by your partner. Your current session will be left.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Session ID or key"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none ring-indigo-500/40 focus:ring-2"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              Join
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
