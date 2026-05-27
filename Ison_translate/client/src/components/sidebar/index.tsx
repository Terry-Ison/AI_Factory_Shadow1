import { Languages, History, Settings, LifeBuoy, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  label: string
  to: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'translate', label: 'Translate', to: '/', icon: <Languages size={18} /> },
  { id: 'history', label: 'History', to: '/history', icon: <History size={18} /> },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar p-4 px-3">
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
          <rect width="28" height="28" rx="7" className="fill-sidebar-primary" />
          <text
            x="14"
            y="19"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="currentColor"
            className="text-sidebar-primary-foreground"
            style={{ fontFamily: "'Geist Variable', sans-serif" }}
          >
            文A
          </text>
        </svg>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold leading-tight tracking-tight text-sidebar-foreground">
            Ison Translate
          </span>
          <span className="text-[11px] leading-tight text-muted-foreground">
            Premium Voice Translation
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none py-2.5 px-3.5 text-left text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground'
                  : 'bg-transparent text-sidebar-foreground hover:bg-sidebar-accent',
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom section */}
      <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
        <button
          type="button"
          className="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-foreground px-3.5 py-3 text-sm font-bold text-background transition-all hover:-translate-y-px hover:opacity-90 active:translate-y-0"
        >
          <Sparkles size={16} />
          Go Pro
        </button>

        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none bg-transparent px-3.5 py-2 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none bg-transparent px-3.5 py-2 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LifeBuoy size={16} />
          <span>Support</span>
        </button>
      </div>
    </aside>
  )
}
