// Small presentational pieces used across pages.
import { Loader2 } from "lucide-react"
import * as React from "react"

import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "outline"
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-sm px-1.5 text-xs font-medium",
        {
          neutral: "bg-muted text-foreground/80",
          accent: "bg-primary/10 text-primary",
          success: "bg-success-soft text-success",
          warning: "bg-warning-soft text-warning",
          danger: "bg-danger-soft text-danger",
          outline: "border border-border text-muted-foreground",
        }[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Toggle chips for filters. Behaves as a radio group unless `multiple` is set. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string; count?: number }[]
  value: T | T[]
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v)
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={selected(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 rounded-full border px-3 text-[13px] transition-colors",
            selected(o.value)
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-surface text-foreground/80 hover:border-border-strong hover:text-foreground",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1.5 num opacity-60">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

/** Underlined tabs for switching views inside a page. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string; badge?: number }[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn("flex gap-6 overflow-x-auto overflow-y-hidden border-b", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors",
            value === t.value
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
          {!!t.badge && (
            <span className="num rounded-full bg-primary px-1.5 text-2xs font-semibold leading-[18px] text-primary-foreground">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

const AVATAR_TONES = [
  "bg-[#E9DCCB] text-[#5B4126]",
  "bg-[#D6E4DA] text-[#24503A]",
  "bg-[#DCDDEB] text-[#33365E]",
  "bg-[#EBD8D5] text-[#6B2E25]",
  "bg-[#E4E1CF] text-[#4D4A22]",
  "bg-[#D5E2E8] text-[#244754]",
]

export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const tone = AVATAR_TONES[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_TONES.length]
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold", tone, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin text-muted-foreground", className)} aria-label="Loading" />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} />
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y rounded-lg border bg-surface" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string
  children?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-lg border border-dashed bg-surface/50 px-6 py-10 text-center", className)}>
      <p className="font-medium">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Couldn't load this."
  return (
    <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-2 font-medium underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  )
}

/** Bordered white surface with an optional header row. */
export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn("rounded-lg border bg-surface", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
          {typeof title === "string" ? <h2 className="eyebrow">{title}</h2> : title}
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="num inline-flex items-center gap-1 text-sm">
      <svg viewBox="0 0 20 20" className="size-3.5 fill-current text-foreground" aria-hidden>
        <path d="M10 1.5l2.6 5.5 6 .7-4.5 4.1 1.2 5.9L10 14.8l-5.3 2.9 1.2-5.9L1.4 7.7l6-.7z" />
      </svg>
      <span className="font-medium">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted-foreground">({count.toLocaleString("en-IN")})</span>}
    </span>
  )
}
