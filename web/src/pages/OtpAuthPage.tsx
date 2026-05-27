import { ArrowLeft, Bot, Loader2, Sparkles } from 'lucide-react'
import { useOtpFlow } from '@/lib/hooks/useOtpFlow'
import { FormField } from '@/components/auth/FormField'
import { OtpInput } from '@/components/auth/OtpInput'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function OtpAuthPage() {
  const { step, pendingEmail, emailForm, otpForm, onRequestOtp, onVerifyOtp, goBack, serverError } =
    useOtpFlow()

  return (
    <div className="flex h-screen w-full bg-[#0d0d0d] font-sans">
      {/* Left — brand identity */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 border-r border-white/[0.06] px-14 py-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[9px] bg-violet-500/15 border border-violet-400/20 flex items-center justify-center">
            <Bot size={15} className="text-violet-400" />
          </div>
          <span className="text-[14px] font-semibold text-white/80 tracking-[-0.01em]">
            Iris Gen IA
          </span>
        </div>

        <div className="space-y-6 flex-1 flex flex-col items-center justify-center w-full">
          <p className="text-[11px] font-medium tracking-widest text-violet-400/60 uppercase">
            Espace de travail IA
          </p>
          <h2 className="text-[32px] font-semibold text-white/90 leading-[1.25] tracking-[-0.02em]">
            Pensez plus vite.
            <br />
            Travaillez mieux. <span className="text-white/30">Ensemble.</span>
          </h2>
          <p className="text-[13.5px] text-white/35 leading-relaxed max-w-xs">
            Importez vos documents, posez vos questions et obtenez des réponses précises basées sur
            votre base de connaissances.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11.5px] text-white/20">
          <Sparkles size={11} />
          <span>Propulsé par RAG · Conçu pour les équipes</span>
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 px-6">
        {/* mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="w-7 h-7 rounded-[8px] bg-violet-500/15 border border-violet-400/20 flex items-center justify-center">
            <Bot size={13} className="text-violet-400" />
          </div>
          <span className="text-[13.5px] font-semibold text-white/80">Iris Gen IA</span>
        </div>

        <div className="w-full max-w-[360px]">
          {step === 'email' ? (
            <>
              <div className="mb-7">
                <h1 className="text-[20px] font-semibold text-white/90 tracking-[-0.02em] mb-1.5">
                  Bienvenue
                </h1>
                <p className="text-[13px] text-white/35">
                  Entrez votre email pour vous connecter ou créer un compte.
                </p>
              </div>
              <form onSubmit={onRequestOtp} noValidate className="flex flex-col gap-4">
                <FormField
                  label="Adresse email"
                  error={emailForm.formState.errors.email?.message}
                  htmlFor="email"
                >
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.fr"
                    autoComplete="email"
                    hasError={!!emailForm.formState.errors.email}
                    {...emailForm.register('email')}
                  />
                </FormField>
                {serverError && (
                  <p className="text-[12px] text-red-400/80 border border-red-500/15 rounded-lg px-3 py-2">
                    {serverError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={emailForm.formState.isSubmitting}
                  className="w-full rounded-[10px] bg-violet-500 hover:bg-violet-400 py-2.5 text-[13.5px]"
                >
                  {emailForm.formState.isSubmitting && (
                    <Loader2 size={13} className="animate-spin" />
                  )}
                  {emailForm.formState.isSubmitting ? 'Envoi...' : 'Continuer avec mon email'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-[20px] font-semibold text-white/90 tracking-[-0.02em] mb-1.5">
                  Vérifiez votre boîte mail
                </h1>
                <p className="text-[13px] text-white/35">
                  Nous avons envoyé un code à <span className="text-white/55">{pendingEmail}</span>
                </p>
              </div>
              <form onSubmit={onVerifyOtp} noValidate className="flex flex-col gap-4">
                <OtpInput
                  error={otpForm.formState.errors.code?.message}
                  {...otpForm.register('code')}
                />
                {serverError && (
                  <p className="text-[12px] text-red-400/80 border border-red-500/15 rounded-lg px-3 py-2">
                    {serverError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={otpForm.formState.isSubmitting}
                  className="w-full rounded-[10px] bg-violet-500 hover:bg-violet-400 py-2.5 text-[13.5px]"
                >
                  {otpForm.formState.isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  {otpForm.formState.isSubmitting ? 'Vérification...' : 'Continuer'}
                </Button>
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center justify-center gap-1.5 text-[12.5px] text-white/30 hover:text-white/50 transition-colors"
                >
                  <ArrowLeft size={12} /> Changer d'email
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
