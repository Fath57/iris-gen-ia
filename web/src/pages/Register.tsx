import { Link } from 'react-router-dom'
import { useRegisterForm } from '@/lib/hooks/useRegisterForm'
import { AuthLogo } from '@/components/auth/AuthLogo'
import { AuthCard } from '@/components/auth/AuthCard'
import { AuthInput } from '@/components/auth/AuthInput'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton'

export default function RegisterPage() {
  const { form, onSubmit, serverError } = useRegisterForm()
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0d0d0d] font-sans px-4">
      <div className="w-full max-w-[400px]">
        <AuthLogo />

        <AuthCard title="Create your account" description="Start analysing your documents with AI.">
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <AuthInput
              label="Full name"
              type="text"
              placeholder="Jean Dupont"
              autoComplete="name"
              error={errors.name?.message}
              {...register('name')}
            />

            <AuthInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <PasswordInput
              label="Password"
              id="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />

            <PasswordInput
              label="Confirm password"
              id="confirmPassword"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {serverError && (
              <p className="text-[12px] text-red-400/80 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                {serverError}
              </p>
            )}

            <AuthSubmitButton
              isSubmitting={isSubmitting}
              label="Create account"
              loadingLabel="Creating account…"
            />
          </form>
        </AuthCard>

        <p className="mt-5 text-center text-[12.5px] text-white/25">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
