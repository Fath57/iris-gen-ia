import { z } from 'zod'

export const otpRequestSchema = z.object({
  email: z.email('Adresse email invalide'),
})

export const otpVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'Le code doit contenir exactement 6 chiffres')
    .regex(/^\d+$/, 'Le code doit contenir uniquement des chiffres'),
})

export type OtpRequestFormData = z.infer<typeof otpRequestSchema>
export type OtpVerifyFormData = z.infer<typeof otpVerifySchema>
