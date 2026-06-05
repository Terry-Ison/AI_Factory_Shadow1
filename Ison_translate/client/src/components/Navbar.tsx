import { Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import logo from '../assets/images/logo.jpg'


export function Navbar() {
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
      className="flex h-16 shrink-0 items-center gap-1 px-2 bg-white"
      style={{
      
        boxShadow: scrolled ? 'var(--elevation-2)' : 'none',
        borderBottom: scrolled ? 'none' : '1px solid var(--md-outline-variant)',
        transition: 'background 200ms, box-shadow 200ms',
        zIndex: 10,
        position: 'sticky',
        top: 0,
      }}
    >
     
      {/* M3 headline: Title Large */}
      <span
        className="font-display flex-1 select-none pl-1 font-semibold "
        style={{
          fontSize: '1.375rem',
          lineHeight: '1.75rem',
          color: 'var(--md-on-surface)',
        }}
      >
        <div className="flex items-center gap-2 ">
          <img src={logo} alt="logo" className="w-8 h-8 rounded-md" />
          <span className="text-2xl font-semibold">Transly</span>
        </div>
      </span>

      {/* Theme toggle */}
      {/* <button
        className="md-icon-btn"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ color: 'var(--md-on-surface-variant)' }}
      >
        {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
      </button> */}
    </header>
  )
}
