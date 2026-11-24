import { cn } from "@/lib/utils"

/** Dumbbell mark redrawn from the original logo so it stays crisp at any size. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7 text-brand", className)} aria-hidden>
      <rect x="8" y="8" width="5" height="16" rx="2.2" fill="currentColor" />
      <rect x="19" y="8" width="5" height="16" rx="2.2" fill="currentColor" />
      <rect x="12" y="14.2" width="8" height="3.6" fill="currentColor" />
      <rect x="4.5" y="11" width="2.2" height="10" rx="1.1" fill="currentColor" opacity="0.75" />
      <rect x="25.3" y="11" width="2.2" height="10" rx="1.1" fill="currentColor" opacity="0.75" />
      <rect x="1.6" y="13.5" width="1.6" height="5" rx="0.8" fill="currentColor" opacity="0.5" />
      <rect x="28.8" y="13.5" width="1.6" height="5" rx="0.8" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <LogoMark />
      <span className="font-display text-[22px] font-bold uppercase leading-none tracking-[0.02em]">
        Fit<span className="text-brand">Budd</span>
      </span>
    </span>
  )
}
