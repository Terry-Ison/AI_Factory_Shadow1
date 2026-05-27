import { Link } from 'react-router'
import { Settings, HelpCircle, User, Sun, Moon, LogIn } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function Header() {
  const { theme, setTheme } = useTheme()

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
          <rect width="28" height="28" rx="7" className="fill-primary" />
          <text
            x="14"
            y="19"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="currentColor"
            className="text-primary-foreground"
            style={{ fontFamily: "'Geist Variable', sans-serif" }}
          >
            文A
          </text>
        </svg>
        <span className="text-base font-bold tracking-tight text-foreground">Ison Translate</span>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-1">
        
        <Button variant="outline" size="icon-sm" asChild className="sm:hidden">
          <Link to="/login" aria-label="Login">
            <LogIn />
          </Link>
        </Button>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-none bg-transparent text-muted-foreground cursor-pointer transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
          <Link to="/login">
            <LogIn />
            Login
          </Link>
        </Button>
       
        <button
          className="inline-flex ml-2 items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-foreground cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground shadow-sm"
          aria-label="Account"
        >
          <User size={16} />
        </button>
      </div>
    </header>
  )
}
