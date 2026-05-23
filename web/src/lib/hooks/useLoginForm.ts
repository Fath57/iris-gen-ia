import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth'

export function useLoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = form.handleSubmit(async (data) => {
    setServerError(null)
    try {
      await login(data.email, data.password)
      navigate('/', { replace: true })
    } catch {
      setServerError('Invalid credentials. Please try again.')
    }
  })

  return { form, onSubmit, serverError }
}
