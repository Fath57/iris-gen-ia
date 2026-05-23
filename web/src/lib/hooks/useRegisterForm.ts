import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth'

export function useRegisterForm() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = form.handleSubmit(async (data) => {
    setServerError(null)
    try {
      await registerUser(data.name, data.email, data.password)
      navigate('/', { replace: true })
    } catch {
      setServerError('Could not create account. Please try again.')
    }
  })

  return { form, onSubmit, serverError }
}
