import type { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  description: string
  children: ReactNode
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="rounded-[16px] border border-white/[0.07] bg-[#111111] p-7 shadow-xl shadow-black/40">
      <h1 className="text-[18px] font-semibold text-white/90 tracking-[0.02em] mb-1">{title}</h1>
      <p className="text-[13px] text-white/35 mb-6">{description}</p>
      {children}
    </div>
  )
}
