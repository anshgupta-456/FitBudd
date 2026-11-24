"use client"

import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns"
import { ArrowUpRight, Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"

import { AgendaRow } from "@/components/agenda-row"
import { PageHeader } from "@/components/app-shell"
import { Avatar, EmptyState, ErrorState, Panel, Skeleton } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { WorkoutDialog } from "@/components/workout-dialog"
import { fromBooking, fromWorkout, groupByDate, type AgendaItem } from "@/lib/agenda"
import { qs } from "@/lib/api"
import { useUser } from "@/lib/auth"
import { ago, dayLabel, firstName, isoDate, longDate, plural } from "@/lib/format"
import type { Booking, Conversation, Measurement, PartnerRequest, Workout, WorkoutSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

function Stat({ label, value, unit, sub, children }: { label: string; value: React.ReactNode; unit?: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <p className="eyebrow text-[11px]">{label}</p>
      <p className="mt-1 font-display text-[34px] font-semibold leading-none num">
        {value}
        {unit && <span className="ml-1 text-lg font-medium text-muted-foreground">{unit}</span>}
      </p>
      {children}
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function WeekBar({ done, planned }: { done: number; planned: number }) {
  const total = Math.max(planned, done, 1)
  return (
    <div className="mt-2.5 flex gap-1" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < done ? "bg-primary" : "bg-muted")} />
      ))}
    </div>
  )
}

function LoadChart({ weekly }: { weekly: WorkoutSummary["weekly"] }) {
  const max = Math.max(...weekly.map((w) => w.minutes), 60)
  return (
    <div className="flex h-36 items-end gap-2 px-4 pb-3 pt-5">
      {weekly.map((w, i) => {
        const current = i === weekly.length - 1
        return (
          <div key={w.week_start} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="num text-2xs text-muted-foreground">{w.minutes ? Math.round(w.minutes / 6) / 10 : ""}</span>
            <div
              className={cn("w-full rounded-t-sm", current ? "bg-primary" : "bg-foreground/80")}
              style={{ height: `${Math.max((w.minutes / max) * 100, w.minutes ? 4 : 1)}%`, opacity: w.minutes ? 1 : 0.15 }}
              title={`${w.minutes} min in ${w.sessions} sessions`}
            />
            <span className="num text-2xs text-muted-foreground">{format(parseISO(w.week_start), "d/M")}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function TodayPage() {
  const user = useUser()
  const today = new Date()
  const todayIso = isoDate(today)
  const [dialog, setDialog] = useState<{ workout?: Workout; logging?: boolean } | null>(null)

  const summary = useSWR<WorkoutSummary>(`/workouts/summary${qs({ today: todayIso })}`)
  const workouts = useSWR<{ workouts: Workout[] }>(`/workouts${qs({ from: todayIso, to: isoDate(addDays(today, 6)) })}`)
  const bookings = useSWR<{ bookings: Booking[] }>("/bookings")
  const measurements = useSWR<{ measurements: Measurement[] }>("/measurements?limit=60")
  const requests = useSWR<{ incoming: PartnerRequest[]; outgoing: PartnerRequest[] }>("/partners/requests")
  const conversations = useSWR<{ conversations: Conversation[] }>("/conversations")

  const agenda: AgendaItem[] = [
    ...(workouts.data?.workouts ?? []).map(fromWorkout),
    ...(bookings.data?.bookings ?? []).map(fromBooking).filter((b) => b.date <= isoDate(addDays(today, 6))),
  ]
  const groups = groupByDate(agenda)

  const s = summary.data
  const lastWeek = s?.weekly[s.weekly.length - 2]
  const weights = (measurements.data?.measurements ?? []).filter((m) => m.weight_kg !== null)
  const latest = weights[0]
  const monthAgo = weights.find((m) => differenceInCalendarDays(parseISO(latest?.date ?? todayIso), parseISO(m.date)) >= 28)
  const weightChange = latest && monthAgo ? latest.weight_kg! - monthAgo.weight_kg! : null
  const doneToday = (workouts.data?.workouts ?? []).some((w) => w.date === todayIso && w.status === "done")

  const unread = (conversations.data?.conversations ?? []).filter((c) => c.unread > 0)
  const incoming = requests.data?.incoming ?? []

  const openWorkout = (item: AgendaItem, logging = false) => item.workout && setDialog({ workout: item.workout, logging })

  let description: string | undefined
  if (s) {
    const left = s.this_week.planned - s.this_week.done
    description =
      s.this_week.planned === 0
        ? "Nothing planned this week yet."
        : left > 0
          ? `${plural(s.this_week.done, "session")} done this week, ${left} to go.`
          : `All ${plural(s.this_week.planned, "planned session")} done this week.`
  }

  return (
    <>
      <PageHeader
        eyebrow={longDate(today)}
        title={`Hi, ${firstName(user.name)}`}
        description={description}
        actions={
          <Button variant="primary" onClick={() => setDialog({})}>
            <Plus /> Plan a workout
          </Button>
        }
      />

      <section className="mb-8 grid grid-cols-2 divide-x divide-y rounded-lg border bg-surface md:grid-cols-4 md:divide-y-0">
        {s ? (
          <>
            <Stat label="This week" value={`${s.this_week.done}/${s.this_week.planned}`} unit="sessions">
              <WeekBar done={s.this_week.done} planned={s.this_week.planned} />
            </Stat>
            <Stat
              label="Time trained"
              value={s.this_week.minutes}
              unit="min"
              sub={lastWeek ? `${lastWeek.minutes} min last week` : undefined}
            />
            <Stat
              label="Streak"
              value={s.streak_days}
              unit={s.streak_days === 1 ? "day" : "days"}
              sub={s.streak_days > 0 && !doneToday ? "Train today to keep it going" : s.streak_days === 0 ? "Log a workout to start one" : "Logged today"}
            />
            <Stat
              label="Weight"
              value={latest ? latest.weight_kg!.toFixed(1) : "—"}
              unit={latest ? "kg" : undefined}
              sub={
                weightChange !== null
                  ? `${weightChange > 0 ? "+" : weightChange < 0 ? "−" : "±"}${Math.abs(weightChange).toFixed(1)} kg in 4 weeks`
                  : latest
                    ? `Logged ${dayLabel(latest.date).toLowerCase()}`
                    : (
                      <Link href="/progress" className="underline underline-offset-2">
                        Log a weigh-in
                      </Link>
                    )
              }
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 px-5 py-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold">Next 7 days</h2>
            <Link href="/workouts" className="text-sm text-muted-foreground hover:text-foreground">
              Full schedule
            </Link>
          </div>

          {workouts.error ? (
            <ErrorState error={workouts.error} onRetry={() => workouts.mutate()} />
          ) : !workouts.data ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : groups.length === 0 ? (
            <EmptyState
              title="Nothing on the calendar"
              action={
                <div className="flex gap-2">
                  <Button variant="primary" onClick={() => setDialog({})}>
                    Plan a workout
                  </Button>
                  <Button asChild>
                    <Link href="/classes">Book a class</Link>
                  </Button>
                </div>
              }
            >
              Plan a session or book a class and it&apos;ll show up here.
            </EmptyState>
          ) : (
            <div className="space-y-5">
              {groups.map(([date, items]) => (
                <div key={date}>
                  <h3 className="mb-2 flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{dayLabel(date)}</span>
                    <span className="text-xs text-muted-foreground">{format(parseISO(date), "d MMM")}</span>
                  </h3>
                  <div className="divide-y rounded-lg border bg-surface">
                    {items.map((item) => (
                      <AgendaRow key={item.key} item={item} onOpen={(i) => openWorkout(i)} onLog={(i) => openWorkout(i, true)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
          <Panel
            title="Training load, last 8 weeks"
            action={<span className="text-2xs text-muted-foreground">hours</span>}
          >
            {s ? <LoadChart weekly={s.weekly} /> : <Skeleton className="m-4 h-28" />}
            {s && (
              <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
                {plural(s.total_done, "workout")} logged in total
              </p>
            )}
          </Panel>

          <Panel title="Partners" action={<Link href="/partners" className="text-xs text-muted-foreground hover:text-foreground">Open</Link>}>
            <div className="divide-y">
              {incoming.map((r) => (
                <Link key={r.id} href="/partners?tab=requests" className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <Avatar name={r.user.name} size={32} />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{r.user.name}</span> wants to train with you
                    <span className="block text-xs text-muted-foreground">{ago(r.sent_at)}</span>
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
              {unread.map((c) => (
                <Link key={c.partner.id} href={`/messages?with=${c.partner.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <Avatar name={c.partner.name} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{c.partner.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{c.last_message?.body}</span>
                  </span>
                  <span className="num rounded-full bg-primary px-1.5 text-2xs font-semibold leading-[18px] text-primary-foreground">{c.unread}</span>
                </Link>
              ))}
              {requests.data && conversations.data && incoming.length === 0 && unread.length === 0 && (
                <p className="px-4 py-4 text-sm text-muted-foreground">
                  No new requests or messages.{" "}
                  <Link href="/partners" className="text-foreground underline underline-offset-2">
                    Find someone to train with
                  </Link>
                </p>
              )}
            </div>
          </Panel>
        </aside>
      </div>

      <WorkoutDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        workout={dialog?.workout}
        logging={dialog?.logging}
      />
    </>
  )
}
