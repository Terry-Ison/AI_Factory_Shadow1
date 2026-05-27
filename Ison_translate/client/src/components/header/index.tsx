import { Settings, HelpCircle, User } from 'lucide-react'

export function Header() {
  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-background shrink-0">
      {/* Left — Logo / Brand */}
      <div className="flex items-center gap-2.5">
        <svg
          className="shrink-0"
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="28" height="28" rx="7" fill="url(#logo-grad)" />
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
            <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-base font-bold tracking-tight text-foreground">LinguaDirect</span>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-1">
        <button
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-none bg-transparent text-muted-foreground cursor-pointer transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
        <button
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-none bg-transparent text-muted-foreground cursor-pointer transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Help"
        >
          <HelpCircle size={18} />
        </button>
        <button
          className="inline-flex items-center justify-center w-9 h-9 rounded-full border-none bg-foreground text-background cursor-pointer transition-opacity hover:opacity-85"
          aria-label="Account"
        >
          <User size={18} />
        </button>
      </div>
    </header>
  )
}
