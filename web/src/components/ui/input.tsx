import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        data-slot="input"
        aria-invalid={hasError || undefined}
        className={cn(
          'flex w-full rounded-[10px] border bg-white/[0.04] px-3.5 py-2.5',
          'text-[13.5px] text-white/90 placeholder:text-white/20',
          'outline-none transition-all',
          hasError
            ? 'border-red-500/50 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/10'
            : 'border-white/[0.08] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
