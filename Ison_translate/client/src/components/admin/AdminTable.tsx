import type { ReactNode } from 'react'

type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

type Props<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage?: string
}

export function AdminTable<T>({ columns, rows, rowKey, emptyMessage = 'No items.' }: Props<T>) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="admin-table-wrap overflow-x-auto rounded-xl" style={{ border: '1px solid var(--md-outline-variant)' }}>
      <table className="admin-table w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr style={{ background: 'var(--md-surface-container-high)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-medium ${col.className ?? ''}`}
                style={{ color: 'var(--md-on-surface-variant)' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              style={{ borderTop: '1px solid var(--md-outline-variant)', background: 'var(--md-surface-container)' }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 align-middle ${col.className ?? ''}`}
                  style={{ color: 'var(--md-on-surface)' }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
