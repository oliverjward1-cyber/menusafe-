import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'red' | 'yellow' | 'gray' | 'blue' | 'gold'
}

export function Badge({ className, variant = 'gray', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-sans',
        {
          'bg-mise-fresh/15 text-mise-deep': variant === 'green',
          'bg-red-100 text-red-800': variant === 'red',
          'bg-amber-100 text-amber-800': variant === 'yellow',
          'bg-black/5 text-mise-ink/70': variant === 'gray',
          'bg-blue-100 text-blue-800': variant === 'blue',
          'bg-mise-gold/15 text-mise-deep': variant === 'gold',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
