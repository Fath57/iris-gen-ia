import { forwardRef, type InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/auth/FormField'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, id, name, ...props }, ref) => {
    const fieldId = id ?? name
    return (
      <FormField label={label} error={error} htmlFor={fieldId}>
        <Input ref={ref} id={fieldId} name={name} hasError={!!error} {...props} />
      </FormField>
    )
  }
)
AuthInput.displayName = 'AuthInput'
