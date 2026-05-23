import { Link } from 'react-router-dom'
import { useLoginForm } from '@/lib/hooks/useLoginForm'
import { AuthLogo } from '@/components/auth/AuthLogo'
import { AuthCard } from '@/components/auth/AuthCard'
import { AuthInput } from '@/components/auth/AuthInput'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton'

export default function LoginPage() {
  const { form, onSubmit, serverError } = useLoginForm()
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0d0d0d] font-sans px-4">
      <div className="w-full max-w-[400px]">
        <AuthLogo />

        <AuthCard title="Welcome back" description="Sign in to continue to your workspace.">
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {serverError && (
              <p className="text-[12px] text-red-400/80 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                {serverError}
              </p>
            )}

            <AuthSubmitButton
              isSubmitting={isSubmitting}
              label="Sign in"
              loadingLabel="Signing in…"
            />
          </form>
        </AuthCard>

        <p className="mt-5 text-center text-[12.5px] text-white/25">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
