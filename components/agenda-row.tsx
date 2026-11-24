import { Check } from "lucide-react"

import { Tag } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import type { AgendaItem } from "@/lib/agenda"
import { minutes, todayIso } from "@/lib/format"
import { cn } from "@/lib/utils"

const SOURCE_TONE = {
  workout: "neutral",
  class: "accent",
  court: "accent",
  trainer: "accent",
} as const

export function AgendaRow({
  item,
  onOpen,
  onLog,
  compact,
}: {
  item: AgendaItem
  onOpen?: (item: AgendaItem) => void
  onLog?: (item: AgendaItem) => void
  compact?: boolean
}) {
  const status = item.workout?.status
  const clickable = !!onOpen && item.source === "workout"
  const canLog = item.date <= todayIso()

  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-4 py-3",
        clickable && "cursor-pointer hover:bg-muted/50",
        status === "skipped" && "opacity-55",
      )}
      onClick={clickable ? () => onOpen!(item) : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen!(item)) : undefined}
    >
      <div className="w-12 shrink-0">
        <p className="num font-mono text-sm">{item.time ?? "—"}</p>
        {!compact && <p className="num text-2xs text-muted-foreground">{minutes(item.minutes)}</p>}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", status === "skipped" && "line-through")}>{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {compact ? [minutes(item.minutes), item.meta].filter(Boolean).join(" · ") : item.meta || " "}
        </p>
      </div>
      <Tag tone={SOURCE_TONE[item.source]} className="hidden sm:inline-flex">
        {item.label}
      </Tag>
      {status === "done" ? (
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-success-soft text-success" title="Done">
          <Check className="size-4" />
        </span>
      ) : status === "planned" && onLog && canLog ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation()
            onLog(item)
          }}
        >
          Log
        </Button>
      ) : null}
    </div>
  )
}
