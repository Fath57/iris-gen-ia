import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import {
  otpRequestSchema,
  otpVerifySchema,
  type OtpRequestFormData,
  type OtpVerifyFormData,
} from '@/lib/schemas/auth'

type Step = 'email' | 'otp'

export function useOtpFlow() {
  const { requestOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [pendingEmail, setPendingEmail] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)

  const emailForm = useForm<OtpRequestFormData>({ resolver: zodResolver(otpRequestSchema) })
  const otpForm = useForm<OtpVerifyFormData>({ resolver: zodResolver(otpVerifySchema) })

  const onRequestOtp = emailForm.handleSubmit(async ({ email }) => {
    setServerError(null)
    try {
      await requestOtp(email)
      setPendingEmail(email)
      setStep('otp')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Impossible d'envoyer le code. Veuillez réessayer.")
    }
  })

  const onVerifyOtp = otpForm.handleSubmit(async ({ code }) => {
    setServerError(null)
    try {
      await verifyOtp(pendingEmail, code)
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Code invalide ou expiré.')
    }
  })

  const goBack = () => {
    setStep('email')
    setServerError(null)
    otpForm.reset()
  }

  return {
    step,
    pendingEmail,
    emailForm,
    otpForm,
    onRequestOtp,
    onVerifyOtp,
    goBack,
    serverError,
  }
}
