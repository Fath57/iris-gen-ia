import { z } from 'zod'

export const otpRequestSchema = z.object({
  email: z.email('Invalid email address'),
})

export const otpVerifySchema = z.object({
  code: z
    .string()
    .min(4, 'Code too short')
    .max(10, 'Code too long')
    .regex(/^\d+$/, 'Code must contain only digits'),
})

export type OtpRequestFormData = z.infer<typeof otpRequestSchema>
export type OtpVerifyFormData = z.infer<typeof otpVerifySchema>
