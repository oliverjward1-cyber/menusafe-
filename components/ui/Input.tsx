import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-sans font-medium text-hospopilot-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-hospopilot-ink placeholder-hospopilot-ink/30 shadow-sm transition-colors',
            'focus:border-hospopilot-gold focus:outline-none focus:ring-1 focus:ring-hospopilot-gold',
            'disabled:cursor-not-allowed disabled:bg-hospopilot-cream/50 disabled:text-hospopilot-ink/40',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-hospopilot-ink/40">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
