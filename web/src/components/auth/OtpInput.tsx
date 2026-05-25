import { forwardRef, type InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/auth/FormField'

interface OtpInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'maxLength'> {
  error?: string
}

export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(({ error, ...props }, ref) => (
  <FormField label="Code de vérification" error={error} htmlFor="otp-code">
    <Input
      ref={ref}
      id="otp-code"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="Entrez le code reçu par email"
      hasError={!!error}
      className="tracking-[0.2em] text-center text-[15px]"
      {...props}
    />
  </FormField>
))
OtpInput.displayName = 'OtpInput'
