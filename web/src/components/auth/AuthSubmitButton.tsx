import { Loader2 } from 'lucide-react'

interface AuthSubmitButtonProps {
  isSubmitting: boolean
  label: string
  loadingLabel: string
}

export function AuthSubmitButton({ isSubmitting, label, loadingLabel }: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="mt-1 w-full flex items-center justify-center gap-2 rounded-[10px] bg-violet-500/90 hover:bg-violet-500 px-4 py-2.5 text-[13.5px] font-medium text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isSubmitting && <Loader2 size={13} className="animate-spin" />}
      {isSubmitting ? loadingLabel : label}
    </button>
  )
}
