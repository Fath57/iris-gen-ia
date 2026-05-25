import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  htmlFor?: string
  children: ReactNode
}

export function FormField({ label, error, htmlFor, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-white/50 tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="text-[11.5px] text-red-400/80">{error}</p>}
    </div>
  )
}
