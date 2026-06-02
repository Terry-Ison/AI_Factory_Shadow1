import { Eye, EyeOff } from 'lucide-react'
import { useState, type CSSProperties, type ReactNode } from 'react'

export type InputProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
  name?: string
  autoComplete?: string
  autoFocus?: boolean
  disabled?: boolean
  required?: boolean
  error?: string | null
  helperText?: string | null
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  passwordToggle?: boolean
  multiline?: boolean
  rows?: number
  className?: string
  style?: CSSProperties
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  name,
  autoComplete,
  autoFocus,
  disabled,
  required,
  error,
  helperText,
  leftIcon,
  rightIcon,
  passwordToggle = true,
  multiline = false,
  rows = 4,
  className,
  style,
}: InputProps) {
  const supporting = error ?? helperText
  const [passwordVisible, setPasswordVisible] = useState(false)

  const isPassword = type === 'password' && !multiline
  const effectiveType = isPassword ? (passwordVisible ? 'text' : 'password') : type
  const hasRightAdornment = Boolean(rightIcon) || (isPassword && passwordToggle)
  const paddingRight = hasRightAdornment ? '2.75rem' : undefined

  return (
    <label className={['md-field', className ?? ''].filter(Boolean).join(' ')} style={style}>
      {label && (
        <span className="md-field-label">
          {label}
          {required ? ' *' : ''}
        </span>
      )}

      <div className="relative">
        {leftIcon && (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            {leftIcon}
          </span>
        )}

        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            name={name}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            disabled={disabled}
            rows={rows}
            className="md-field-input min-h-28 py-3"
            style={{
              height: 'auto',
              paddingLeft: leftIcon ? '2.75rem' : undefined,
              paddingRight: rightIcon ? '2.75rem' : undefined,
              borderColor: error ? 'var(--md-error)' : undefined,
            }}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            type={effectiveType}
            name={name}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            disabled={disabled}
            className="md-field-input"
            style={{
              paddingLeft: leftIcon ? '2.75rem' : undefined,
              paddingRight,
              borderColor: error ? 'var(--md-error)' : undefined,
            }}
          />
        )}

        {rightIcon && (
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            {rightIcon}
          </span>
        )}

        {isPassword && passwordToggle && (
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            title={passwordVisible ? 'Hide' : 'Show'}
            style={{
              width: '2.25rem',
              height: '2.25rem',
              border: 'none',
              borderRadius: 'var(--shape-full)',
              background: 'transparent',
              color: 'var(--md-on-surface-variant)',
              cursor: 'pointer',
            }}
            disabled={disabled}
          >
            {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {supporting && (
        <span
          className="mt-1 block text-xs"
          style={{ color: error ? 'var(--md-error)' : 'var(--md-on-surface-variant)' }}
        >
          {supporting}
        </span>
      )}
    </label>
  )
}

