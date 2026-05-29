import { useEffect, useRef } from 'react'
import type { TranscriptLine } from '../types'

type Props = {
  title: string
  badge: string
  lines: TranscriptLine[]
  emptyText: string
}

/**
 * M3 Elevated Card — surface-container-low bg, elevation-1 shadow, shape-md corners.
 */
export function SubtitlePanel({ title, badge, lines, emptyText }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [lines])

  const bodyText = lines.map((line) => line.text).join(' ').trim()
  const inProgress = lines.some((line) => !line.isFinal)

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{
        background: 'var(--md-surface-container-low)',
        boxShadow: 'var(--elevation-1)',
        borderRadius: 'var(--shape-lg)',
      }}
    >
      {/* Card header */}
      <header
        className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--md-outline-variant)' }}
      >
        {/* M3 Title Medium */}
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: '1.5rem',
            letterSpacing: '0.009375rem',
            color: 'var(--md-on-surface)',
          }}
        >
          {title}
        </h2>
        {/* M3 Assist Chip as language badge */}
        <span
          className="md-chip-tonal"
          style={{
            background: 'var(--md-secondary-container)',
            color: 'var(--md-on-secondary-container)',
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.03125rem',
            lineHeight: '1rem',
            height: '1.5rem',
            padding: '0 0.625rem',
            borderRadius: 'var(--shape-full)',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {badge}
        </span>
      </header>

      {/* Scrollable body */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4"
      >
        {lines.length === 0 ? (
          <p
            style={{
              fontSize: '0.875rem',
              lineHeight: '1.25rem',
              color: 'var(--md-on-surface-variant)',
            }}
          >
            {emptyText}
          </p>
        ) : (
          <div className="flex min-h-full flex-col justify-end">
            <p
              className="whitespace-pre-wrap break-words"
              style={{
                fontSize: '1rem',
                lineHeight: '1.5rem',
                letterSpacing: '0.03125rem',
                color: inProgress
                  ? 'var(--md-on-surface-variant)'
                  : 'var(--md-on-surface)',
                transition: 'color 200ms',
              }}
            >
              {bodyText}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
