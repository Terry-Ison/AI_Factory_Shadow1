import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export type TablePaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, total)

  const pageBtn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition'

  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-[var(--md-outline-variant)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--md-on-surface-variant)]">
        Showing <span className="font-medium text-[var(--md-on-surface)]">{start}</span>–
        <span className="font-medium text-[var(--md-on-surface)]">{end}</span> of{' '}
        <span className="font-medium text-[var(--md-on-surface)]">{total}</span> results
      </p>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--md-on-surface-variant)]">Rows</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-9 appearance-none rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] py-0 pl-3 pr-8 text-sm text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)]"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--md-outline)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className={cn(
              pageBtn,
              'border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] text-[var(--md-on-surface-variant)]',
              safePage <= 1 && 'cursor-not-allowed opacity-40',
            )}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              className={cn(
                pageBtn,
                n === safePage
                  ? 'border-[var(--md-on-surface)] bg-[var(--md-on-surface)] text-[var(--md-surface)]'
                  : 'border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container)]',
              )}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className={cn(
              pageBtn,
              'border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] text-[var(--md-on-surface)]',
              safePage >= totalPages && 'cursor-not-allowed opacity-40',
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
