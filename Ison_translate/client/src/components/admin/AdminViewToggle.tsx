import { LayoutGrid, Table2 } from 'lucide-react'
import type { AdminViewMode } from './useAdminViewMode'

type Props = {
  mode: AdminViewMode
  onChange: (mode: AdminViewMode) => void
}

export function AdminViewToggle({ mode, onChange }: Props) {
  return (
    <div className="inline-flex gap-1" role="group" aria-label="View mode">
      <button
        type="button"
        className="md-btn md-btn-text flex size-9 items-center justify-center p-0"
        aria-pressed={mode === 'cards'}
        aria-label="Card view"
        title="Card view"
        onClick={() => onChange('cards')}
        style={
          mode === 'cards'
            ? { background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }
            : undefined
        }
      >
        <LayoutGrid size={18} aria-hidden />
      </button>
      <button
        type="button"
        className="md-btn md-btn-text flex size-9 items-center justify-center p-0"
        aria-pressed={mode === 'table'}
        aria-label="Table view"
        title="Table view"
        onClick={() => onChange('table')}
        style={
          mode === 'table'
            ? { background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }
            : undefined
        }
      >
        <Table2 size={18} aria-hidden />
      </button>
    </div>
  )
}
