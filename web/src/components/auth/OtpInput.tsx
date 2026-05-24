import { forwardRef, type InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/auth/FormField'

interface OtpInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'maxLength'> {
  error?: string
}

export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(({ error, ...props }, ref) => (
  <FormField label="Verification code" error={error} htmlFor="otp-code">
    <Input
      ref={ref}
      id="otp-code"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={10}
      placeholder="Enter the code sent to your email"
      hasError={!!error}
      className="tracking-[0.2em] text-center text-[15px]"
      {...props}
    />
  </FormField>
))
OtpInput.displayName = 'OtpInput'
