import { useEffect, useRef } from 'react'
import type { TranscriptLine } from '../types'

type Props = {
  title: string
  badge: string
  lines: TranscriptLine[]
  emptyText: string
}

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
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/80 backdrop-blur">
      <header className="shrink-0 flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200">{title}</h2>
        <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-200">
          {badge}
        </span>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4"
      >
        {lines.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyText}</p>
        ) : (
          <div className="flex min-h-full flex-col justify-end">
            <p
              className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                inProgress ? 'text-slate-300' : 'text-slate-100'
              }`}
            >
              {bodyText}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
