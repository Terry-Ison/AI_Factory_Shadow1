import { Menu, Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'

type Props = {
  onToggleSidebar: () => void
}

/**
 * M3 Top App Bar — Small variant.
 * Starts at elevation-0 (flush with surface), elevates to elevation-2 on scroll.
 */
export function Navbar({ onToggleSidebar }: Props) {
  const { theme, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const mainRef = useRef<Element | null>(null)

  useEffect(() => {
    // Attach to the nearest scrolling <main> sibling for scroll-aware elevation
    const main = document.querySelector('main')
    mainRef.current = main
    if (!main) return
    const handler = () => setScrolled(main.scrollTop > 4)
    main.addEventListener('scroll', handler, { passive: true })
    return () => main.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-1 px-2"
      style={{
        background: scrolled
          ? 'var(--md-surface-container)'
          : 'var(--md-surface)',
        boxShadow: scrolled ? 'var(--elevation-2)' : 'none',
        borderBottom: scrolled ? 'none' : '1px solid var(--md-outline-variant)',
        transition: 'background 200ms, box-shadow 200ms',
        zIndex: 10,
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Navigation icon */}
      <button
        className="md-icon-btn"
        onClick={onToggleSidebar}
        title="Toggle sidebar"
        aria-label="Open navigation menu"
        style={{ color: 'var(--md-on-surface-variant)' }}
      >
        <Menu size={24} />
      </button>

      {/* M3 headline: Title Large */}
      <span
        className="font-display flex-1 select-none pl-1"
        style={{
          fontSize: '1.375rem',
          fontWeight: 400,
          lineHeight: '1.75rem',
          color: 'var(--md-on-surface)',
        }}
      >
        Transly
      </span>

      {/* Theme toggle */}
      <button
        className="md-icon-btn"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ color: 'var(--md-on-surface-variant)' }}
      >
        {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
      </button>
    </header>
  )
}
