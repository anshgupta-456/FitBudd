"use client"

import { addDays, addWeeks, format, isSameDay, parseISO, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useState } from "react"
import useSWR from "swr"

import { AgendaRow } from "@/components/agenda-row"
import { PageHeader } from "@/components/app-shell"
import { EmptyState, ErrorState, ListSkeleton, Panel, Tag } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { WorkoutDialog } from "@/components/workout-dialog"
import { fromBooking, fromWorkout, sortAgenda, type AgendaItem } from "@/lib/agenda"
import { qs } from "@/lib/api"
import { isoDate, KIND_LABEL, minutes, shortDate } from "@/lib/format"
import type { Booking, Workout } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [dialog, setDialog] = useState<{ workout?: Workout; date?: string; logging?: boolean } | null>(null)
  const weekEnd = addDays(weekStart, 6)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()
  const isThisWeek = isSameDay(weekStart, startOfWeek(today, { weekStartsOn: 1 }))

  const week = useSWR<{ workouts: Workout[] }>(`/workouts${qs({ from: isoDate(weekStart), to: isoDate(weekEnd) })}`)
  const bookings = useSWR<{ bookings: Booking[] }>("/bookings?past=1")
  const history = useSWR<{ workouts: Workout[] }>(`/workouts${qs({ status: "done", to: isoDate(today) })}`)

  const items: AgendaItem[] = [
    ...(week.data?.workouts ?? []).map(fromWorkout),
    ...(bookings.data?.bookings ?? [])
      .map(fromBooking)
      .filter((b) => b.date >= isoDate(weekStart) && b.date <= isoDate(weekEnd)),
  ]
  const byDay = (d: Date) => sortAgenda(items.filter((i) => i.date === isoDate(d)))

  const weekWorkouts = week.data?.workouts ?? []
  const done = weekWorkouts.filter((w) => w.status === "done")
  const planned = weekWorkouts.filter((w) => w.status !== "skipped")
  const log = [...(history.data?.workouts ?? [])].reverse().slice(0, 25)

  const open = (item: AgendaItem, logging = false) => item.workout && setDialog({ workout: item.workout, logging })

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title={isThisWeek ? "This week" : `Week of ${shortDate(weekStart)}`}
        description={
          week.data
            ? `${planned.length} planned · ${done.length} done · ${minutes(done.reduce((sum, w) => sum + w.duration_min, 0))} trained`
            : undefined
        }
        actions={
          <>
            <div className="flex items-center rounded border border-border-strong bg-surface">
              <Button variant="ghost" size="icon" className="rounded-r-none" onClick={() => setWeekStart((w) => addWeeks(w, -1))} aria-label="Previous week">
                <ChevronLeft />
              </Button>
              <span className="num min-w-[132px] border-x px-3 text-center text-sm leading-9">
                {format(weekStart, "d MMM")} – {format(weekEnd, "d MMM")}
              </span>
              <Button variant="ghost" size="icon" className="rounded-l-none" onClick={() => setWeekStart((w) => addWeeks(w, 1))} aria-label="Next week">
                <ChevronRight />
              </Button>
            </div>
            {!isThisWeek && (
              <Button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>This week</Button>
            )}
            <Button variant="primary" onClick={() => setDialog({})}>
              <Plus /> Plan a workout
            </Button>
          </>
        }
      />

      {week.error ? (
        <ErrorState error={week.error} onRetry={() => week.mutate()} />
      ) : !week.data ? (
        <ListSkeleton rows={7} />
      ) : (
        <div className="divide-y rounded-lg border bg-surface">
          {days.map((day) => {
            const dayItems = byDay(day)
            const isToday = isSameDay(day, today)
            return (
              <div key={day.toISOString()} className="group flex flex-col sm:flex-row">
                <div className={cn("flex items-baseline gap-2 px-4 pb-1 pt-3 sm:w-36 sm:flex-col sm:gap-0 sm:border-r sm:py-3", isToday && "sm:bg-primary/[0.04]")}>
                  <span className={cn("text-sm font-semibold", isToday && "text-primary")}>{format(day, "EEEE")}</span>
                  <span className="num text-xs text-muted-foreground">{format(day, "d MMM")}{isToday ? " · today" : ""}</span>
                </div>
                <div className="flex-1">
                  {dayItems.length ? (
                    <div className="divide-y divide-dashed">
                      {dayItems.map((item) => (
                        <AgendaRow key={item.key} item={item} onOpen={open} onLog={(i) => open(i, true)} />
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-sm text-muted-foreground/70 sm:py-4">Rest</p>
                  )}
                </div>
                <div className="hidden items-center pr-3 sm:flex">
                  <Button
                    variant="quiet"
                    size="icon-sm"
                    className="opacity-0 focus:opacity-100 group-hover:opacity-100"
                    onClick={() => setDialog({ date: isoDate(day) })}
                    aria-label={`Add workout on ${format(day, "EEEE")}`}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-10">
        <Panel title="Training log">
          {history.error ? (
            <div className="p-4">
              <ErrorState error={history.error} onRetry={() => history.mutate()} />
            </div>
          ) : !history.data ? (
            <ListSkeleton rows={3} />
          ) : log.length === 0 ? (
            <EmptyState className="m-4" title="No finished workouts yet">
              When you finish a planned session, press Log to record it. It&apos;ll appear here with your effort and notes.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Workout</th>
                    <th className="hidden px-4 py-2 font-medium sm:table-cell">Type</th>
                    <th className="px-4 py-2 text-right font-medium">Time</th>
                    <th className="px-4 py-2 text-right font-medium">Effort</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {log.map((w) => (
                    <tr key={w.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDialog({ workout: w })}>
                      <td className="num whitespace-nowrap px-4 py-2.5 text-muted-foreground">{format(parseISO(w.date), "EEE d MMM")}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium">{w.title}</span>
                        {w.notes && <span className="block max-w-md truncate text-xs text-muted-foreground">{w.notes}</span>}
                      </td>
                      <td className="hidden px-4 py-2.5 sm:table-cell">
                        <Tag>{KIND_LABEL[w.kind]}</Tag>
                      </td>
                      <td className="num whitespace-nowrap px-4 py-2.5 text-right">{w.duration_min} min</td>
                      <td className="num px-4 py-2.5 text-right">{w.effort ? `${w.effort}/10` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <WorkoutDialog
        open={dialog !== null}
        onOpenChange={(o) => !o && setDialog(null)}
        workout={dialog?.workout}
        defaultDate={dialog?.date}
        logging={dialog?.logging}
      />
    </>
  )
}
