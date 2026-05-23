import { useState, forwardRef, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/auth/FormField'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <FormField label={label} error={error} htmlFor={props.id ?? props.name}>
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? 'text' : 'password'}
            hasError={!!error}
            className={`pr-10 ${className ?? ''}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </FormField>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'
