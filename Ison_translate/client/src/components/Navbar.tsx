import { Menu } from 'lucide-react'

type Props = {
  onToggleSidebar: () => void
}

export function Navbar({ onToggleSidebar }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[var(--color-bg)]/80 px-4 backdrop-blur-sm">
      <button
        onClick={onToggleSidebar}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
        title="Toggle sidebar"
      >
        <Menu size={18} />
      </button>
      <span className="font-display text-xl font-bold tracking-tight text-white">
        Transly
      </span>
    </header>
  )
}
