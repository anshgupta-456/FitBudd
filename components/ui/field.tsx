import * as React from "react"

import { cn } from "@/lib/utils"

const control =
  "w-full rounded border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors hover:border-border-strong focus:border-foreground focus:outline-none focus-visible:outline-none disabled:opacity-60 aria-[invalid=true]:border-danger"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(control, "h-9", className)} {...props} />,
)
Input.displayName = "Input"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(control, "min-h-[84px] resize-y py-2 leading-relaxed", className)} {...props} />
  ),
)
Textarea.displayName = "Textarea"

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        control,
        "select-chevron h-9 cursor-pointer appearance-none pr-8",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = "Select"

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  optional?: boolean
  className?: string
  children: React.ReactNode
}

export function Field({ label, htmlFor, hint, error, optional, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline gap-2 text-[13px] font-medium text-foreground">
        {label}
        {optional && <span className="text-2xs font-normal text-muted-foreground">Optional</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p className="rounded border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
      {message}
    </p>
  )
}
