import { useEffect, useState } from 'react'
import { apiUrl } from '../config'

type Props = {
  src: string
  token: string | null
  className?: string
}

/** Loads protected audio via fetch + Bearer token (HTML audio cannot send headers). */
export function AuthenticatedAudio({ src, token, className }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Sign in required to play recordings')
      return
    }

    let revoked: string | null = null
    let cancelled = false

    async function load() {
      try {
        const url = src.startsWith('http') ? src : apiUrl(src)
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Could not load audio')
        const blob = await res.blob()
        if (cancelled) return
        revoked = URL.createObjectURL(blob)
        setBlobUrl(revoked)
        setError(null)
      } catch {
        if (!cancelled) setError('Audio unavailable')
      }
    }

    void load()

    return () => {
      cancelled = true
      if (revoked) URL.revokeObjectURL(revoked)
    }
  }, [src, token])

  if (error) {
    return <p className="text-xs text-slate-500">{error}</p>
  }

  if (!blobUrl) {
    return <p className="text-xs text-slate-500 animate-pulse">Loading audio…</p>
  }

  return <audio controls className={className ?? 'mt-2 w-full'} src={blobUrl} />
}
