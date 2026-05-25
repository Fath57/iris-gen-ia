import { ArrowLeft } from 'lucide-react'
import { useOtpFlow } from '@/lib/hooks/useOtpFlow'
import { AuthLogo } from '@/components/auth/AuthLogo'
import { AuthCard } from '@/components/auth/AuthCard'
import { AuthInput } from '@/components/auth/AuthInput'
import { OtpInput } from '@/components/auth/OtpInput'
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton'

export default function OtpAuthPage() {
  const { step, pendingEmail, emailForm, otpForm, onRequestOtp, onVerifyOtp, goBack, serverError } =
    useOtpFlow()

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0d0d0d] font-sans px-4">
      <div className="w-full max-w-[400px]">
        <AuthLogo />

        {step === 'email' ? (
          <AuthCard
            title="Sign in / Sign up"
            description="Enter your email to receive a one-time code."
          >
            <form onSubmit={onRequestOtp} noValidate className="flex flex-col gap-4">
              <AuthInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={emailForm.formState.errors.email?.message}
                {...emailForm.register('email')}
              />
              {serverError && (
                <p className="text-[12px] text-red-400/80 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                  {serverError}
                </p>
              )}
              <AuthSubmitButton
                isSubmitting={emailForm.formState.isSubmitting}
                label="Send code"
                loadingLabel="Sending..."
              />
            </form>
          </AuthCard>
        ) : (
          <AuthCard
            title="Check your inbox"
            description={'We sent a code to ' + pendingEmail}
          >
            <form onSubmit={onVerifyOtp} noValidate className="flex flex-col gap-4">
              <OtpInput
                error={otpForm.formState.errors.code?.message}
                {...otpForm.register('code')}
              />
              {serverError && (
                <p className="text-[12px] text-red-400/80 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                  {serverError}
                </p>
              )}
              <AuthSubmitButton
                isSubmitting={otpForm.formState.isSubmitting}
                label="Continue"
                loadingLabel="Verifying..."
              />
              <button
                type="button"
                onClick={goBack}
                className="flex items-center justify-center gap-1.5 text-[12.5px] text-white/30 hover:text-white/50 transition-colors"
              >
                <ArrowLeft size={12} /> Change email
              </button>
            </form>
          </AuthCard>
        )}
      </div>
    </div>
  )
}
