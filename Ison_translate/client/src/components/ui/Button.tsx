import type { CSSProperties, ReactNode } from 'react'

type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'error'
type ButtonSize = 'sm' | 'md'

function variantClass(variant: ButtonVariant) {
  switch (variant) {
    case 'filled':
      return 'md-btn-filled'
    case 'tonal':
      return 'md-btn-tonal'
    case 'outlined':
      return 'md-btn-outlined'
    case 'text':
      return 'md-btn-text'
    case 'error':
      return 'md-btn-error'
  }
}

export type ButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  title?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  className?: string
  style?: CSSProperties
  ariaLabel?: string
}

export function Button({
  children,
  variant = 'filled',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  title,
  type = 'button',
  onClick,
  className,
  style,
  ariaLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading
  const baseStyle: CSSProperties =
    size === 'sm'
      ? { height: '2rem', fontSize: '0.75rem', padding: '0 0.75rem' }
      : {}

  return (
    <button
      type={type}
      title={title}
      aria-label={ariaLabel}
      disabled={isDisabled}
      onClick={onClick}
      className={[
        'md-btn',
        variantClass(variant),
        fullWidth ? 'w-full' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...baseStyle, ...style }}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="inline-block h-4 w-4 animate-spin rounded-full"
          style={{
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            opacity: 0.9,
          }}
        />
      ) : (
        leftIcon ?? null
      )}
      <span>{children}</span>
      {rightIcon ?? null}
    </button>
  )
}

