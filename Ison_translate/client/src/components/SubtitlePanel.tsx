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
    el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/80 backdrop-blur">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200">{title}</h2>
        <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-200">
          {badge}
        </span>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {lines.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyText}</p>
        ) : (
          lines.map((line) => (
            <p
              key={line.id}
              className={`text-sm leading-relaxed ${
                line.isFinal ? 'text-slate-100' : 'text-slate-400 italic'
              }`}
            >
              {line.text}
            </p>
          ))
        )}
      </div>
    </section>
  )
}
