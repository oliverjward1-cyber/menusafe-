import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'red' | 'yellow' | 'gray' | 'blue'
}

export function Badge({ className, variant = 'gray', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-green-100 text-green-800': variant === 'green',
          'bg-red-100 text-red-800': variant === 'red',
          'bg-yellow-100 text-yellow-800': variant === 'yellow',
          'bg-gray-100 text-gray-800': variant === 'gray',
          'bg-blue-100 text-blue-800': variant === 'blue',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
