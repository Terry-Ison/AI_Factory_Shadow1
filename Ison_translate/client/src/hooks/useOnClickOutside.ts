import { useEffect } from 'react'

export function useOnClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  handler: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const el = ref.current
      if (!el) return
      if (event.target instanceof Node && el.contains(event.target)) return
      handler()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [enabled, handler, ref])
}

