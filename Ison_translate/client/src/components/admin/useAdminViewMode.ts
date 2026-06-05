import { useCallback, useState } from 'react'

export type AdminViewMode = 'cards' | 'table'

export function useAdminViewMode(pageKey: string): [AdminViewMode, (mode: AdminViewMode) => void] {
  const storageKey = `admin-view-mode:${pageKey}`

  const [mode, setModeState] = useState<AdminViewMode>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored === 'cards' || stored === 'table') return stored
    } catch {
      // ignore
    }
    return 'cards'
  })

  const setMode = useCallback(
    (next: AdminViewMode) => {
      setModeState(next)
      try {
        localStorage.setItem(storageKey, next)
      } catch {
        // ignore
      }
    },
    [storageKey],
  )

  return [mode, setMode]
}
