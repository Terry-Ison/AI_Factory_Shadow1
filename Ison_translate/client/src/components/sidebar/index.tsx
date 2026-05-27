import { Languages, History, Settings, LifeBuoy, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'translate', label: 'Translate', icon: <Languages size={18} /> },
  { id: 'history', label: 'History', icon: <History size={18} /> },
]

export function Sidebar() {
  const [activeId, setActiveId] = useState('translate')

  return (
    <aside className="flex flex-col w-60 h-screen p-4 px-3 border-r border-border bg-sidebar shrink-0 overflow-y-auto">
      {/* Brand block */}
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <svg
          className="shrink-0"
          width="36"
          height="36"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="28" height="28" rx="7" fill="url(#sb-logo-grad)" />
          <text
            x="14"
            y="19"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="#fff"
            fontFamily="Inter Variable, sans-serif"
          >
            文A
          </text>
          <defs>
            <linearGradient id="sb-logo-grad" x1="0" y1="0" x2="28" y2="28">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold tracking-tight leading-tight text-sidebar-foreground">
            LinguaDirect
          </span>
          <span className="text-[11px] leading-tight text-muted-foreground">
            Premium Voice Translation
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`flex items-center gap-2.5 w-full py-2.5 px-3.5 border-none rounded-lg text-sm font-medium cursor-pointer text-left transition-colors ${
              activeId === item.id
                ? 'bg-gradient-to-br from-sky-400 to-cyan-400 text-white font-semibold shadow-[0_2px_12px_rgba(56,189,248,0.25)]'
                : 'bg-transparent text-sidebar-foreground hover:bg-sidebar-accent'
            }`}
            onClick={() => setActiveId(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom section */}
      <div className="flex flex-col gap-1 pt-3 border-t border-sidebar-border">
        <button className="flex items-center justify-center gap-2 w-full py-3 px-3.5 mb-2 border-none rounded-xl bg-foreground text-background text-sm font-bold cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px active:translate-y-0">
          <Sparkles size={16} />
          Go Pro
        </button>

        <button className="flex items-center gap-2.5 w-full py-2 px-3.5 border-none rounded-lg bg-transparent text-muted-foreground text-[13px] font-medium cursor-pointer text-left transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <Settings size={16} />
          <span>Settings</span>
        </button>
        <button className="flex items-center gap-2.5 w-full py-2 px-3.5 border-none rounded-lg bg-transparent text-muted-foreground text-[13px] font-medium cursor-pointer text-left transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <LifeBuoy size={16} />
          <span>Support</span>
        </button>
      </div>
    </aside>
  )
}
