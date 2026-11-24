"use client"

import { addDays, format, parseISO } from "date-fns"
import { Lightbulb } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"

import { PageHeader } from "@/components/app-shell"
import { Chips, EmptyState, ErrorState, ListSkeleton, Tabs, Tag } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Select } from "@/components/ui/field"
import { api, errorMessage, qs } from "@/lib/api"
import { useUser } from "@/lib/auth"
import { CATEGORY_LABEL, CITIES, dayLabel, FOCUS_LABEL, isoDate, LEVEL_LABEL, rupees, SPORT_LABEL, time24 } from "@/lib/format"
import { useRefresh } from "@/lib/hooks"
import type { Booking, ClassCategory, CourtSlot, Sport, StudioClass } from "@/lib/types"
import { cn } from "@/lib/utils"

type Tab = "classes" | "courts" | "mine"

function DayStrip({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))
  return (
    <div className="flex gap-1 overflow-x-auto pb-1" role="group" aria-label="Day">
      {days.map((d, i) => {
        const iso = isoDate(d)
        const active = iso === value
        return (
          <button
            key={iso}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(iso)}
            className={cn(
              "flex w-[58px] shrink-0 flex-col items-center rounded border py-1.5 transition-colors",
              active ? "border-foreground bg-foreground text-background" : "border-border bg-surface hover:border-border-strong",
            )}
          >
            <span className={cn("text-2xs uppercase tracking-wide", active ? "text-background/70" : "text-muted-foreground")}>
              {i === 0 ? "Today" : format(d, "EEE")}
            </span>
            <span className="num font-display text-xl font-semibold leading-tight">{format(d, "d")}</span>
          </button>
        )
      })}
    </div>
  )
}

function ClassList({ city, day }: { city: string; day: string }) {
  const [category, setCategory] = useState<ClassCategory | "all">("all")
  const [selected, setSelected] = useState<StudioClass | null>(null)
  const [busy, setBusy] = useState(false)
  const refresh = useRefresh()
  const key = `/classes${qs({ city, date: day, category: category === "all" ? null : category })}`
  const { data, error, mutate } = useSWR<{ classes: StudioClass[] }>(key)

  async function act(c: StudioClass) {
    setBusy(true)
    try {
      if (c.booked_by_me) {
        await api.delete(`/classes/${c.id}/booking`)
        toast.success("Booking cancelled")
      } else {
        await api.post(`/classes/${c.id}/booking`)
        toast.success(`Booked: ${c.title}, ${dayLabel(c.starts_at).toLowerCase()} at ${time24(c.starts_at)}`)
      }
      setSelected(null)
      refresh("/classes", "/bookings")
    } catch (err) {
      toast.error(errorMessage(err))
      mutate()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Chips
        label="Class type"
        className="mb-4"
        options={[{ value: "all" as const, label: "All" }, ...Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value: value as ClassCategory, label }))]}
        value={category}
        onChange={setCategory}
      />
      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <ListSkeleton rows={5} />
      ) : data.classes.length === 0 ? (
        <EmptyState title="No classes left on this day">Try another day, city or class type.</EmptyState>
      ) : (
        <div className="divide-y rounded-lg border bg-surface">
          {data.classes.map((c) => {
            const full = c.spots_left === 0 && !c.booked_by_me
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:flex-nowrap">
                <div className="w-14 shrink-0">
                  <p className="num font-mono text-sm">{time24(c.starts_at)}</p>
                  <p className="num text-2xs text-muted-foreground">{c.duration_min} min</p>
                </div>
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setSelected(c)}>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {c.title}
                    <Tag tone="outline">{c.level === "all" ? "All levels" : LEVEL_LABEL[c.level]}</Tag>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.instructor} · {c.studio}
                  </p>
                </button>
                <div className="ml-[72px] flex items-center gap-4 sm:ml-0">
                  <span
                    className={cn(
                      "num w-16 text-right text-xs",
                      full ? "text-danger" : c.spots_left <= 3 ? "text-warning" : "text-muted-foreground",
                    )}
                  >
                    {full ? "Full" : `${c.spots_left} left`}
                  </span>
                  <span className="num w-14 text-right text-sm">{rupees(c.price)}</span>
                  {c.booked_by_me ? (
                    <Button size="sm" variant="secondary" className="w-20 border-success/40 text-success" onClick={() => setSelected(c)}>
                      Booked
                    </Button>
                  ) : (
                    <Button size="sm" variant="primary" className="w-20" disabled={full} onClick={() => setSelected(c)}>
                      Book
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent
            title={selected.title}
            description={`${dayLabel(selected.starts_at)}, ${format(parseISO(selected.starts_at), "d MMM")} · ${time24(selected.starts_at)}, ${selected.duration_min} min`}
          >
            <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Studio</dt>
              <dd>{selected.studio}</dd>
              <dt className="text-muted-foreground">Instructor</dt>
              <dd>{selected.instructor}</dd>
              <dt className="text-muted-foreground">Level</dt>
              <dd>{selected.level === "all" ? "All levels" : LEVEL_LABEL[selected.level]}</dd>
              <dt className="text-muted-foreground">Spots</dt>
              <dd className="num">
                {selected.spots_left} of {selected.capacity} left
              </dd>
              <dt className="text-muted-foreground">Price</dt>
              <dd className="num">{rupees(selected.price)}, paid at the studio</dd>
            </dl>
            {selected.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{selected.description}</p>}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Close
              </Button>
              {selected.booked_by_me ? (
                <Button variant="danger" loading={busy} onClick={() => act(selected)}>
                  Cancel booking
                </Button>
              ) : (
                <Button variant="primary" loading={busy} disabled={selected.spots_left === 0} onClick={() => act(selected)}>
                  Book this class
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

function CourtGrid({ city, day }: { city: string; day: string }) {
  const [sport, setSport] = useState<Sport | "all">("all")
  const [selected, setSelected] = useState<CourtSlot | null>(null)
  const [busy, setBusy] = useState(false)
  const refresh = useRefresh()
  // Fetch every sport for the day and filter here, so the chips only offer sports this city has.
  const { data, error, mutate } = useSWR<{ courts: CourtSlot[] }>(`/courts${qs({ city, date: day })}`)

  const venues = useMemo(() => {
    const map = new Map<string, { venue: string; sport: Sport; courts: Map<string, CourtSlot[]> }>()
    for (const slot of (data?.courts ?? []).filter((s) => sport === "all" || s.sport === sport)) {
      const v = map.get(slot.venue) ?? { venue: slot.venue, sport: slot.sport, courts: new Map() }
      v.courts.set(slot.court, [...(v.courts.get(slot.court) ?? []), slot])
      map.set(slot.venue, v)
    }
    return [...map.values()]
  }, [data, sport])

  const sportsHere = [...new Set((data?.courts ?? []).map((s) => s.sport))]

  async function act(slot: CourtSlot) {
    setBusy(true)
    try {
      if (slot.booked_by_me) {
        await api.delete(`/courts/${slot.id}/booking`)
        toast.success("Court booking cancelled")
      } else {
        await api.post(`/courts/${slot.id}/booking`)
        toast.success(`Booked ${slot.court} at ${slot.venue}, ${time24(slot.starts_at)}`)
      }
      setSelected(null)
      refresh("/courts", "/bookings")
    } catch (err) {
      toast.error(errorMessage(err))
      mutate()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Chips
        label="Sport"
        className="mb-4"
        options={[
          { value: "all" as const, label: "All sports" },
          ...(Object.keys(SPORT_LABEL) as Sport[]).filter((s) => sportsHere.includes(s)).map((s) => ({ value: s, label: SPORT_LABEL[s] })),
        ]}
        value={sport}
        onChange={setSport}
      />
      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <ListSkeleton rows={3} />
      ) : venues.length === 0 ? (
        <EmptyState title="No slots left on this day">Evening slots go first. Try tomorrow or another sport.</EmptyState>
      ) : (
        <div className="space-y-4">
          {venues.map((v) => {
            const first = [...v.courts.values()][0][0]
            return (
              <section key={v.venue} className="rounded-lg border bg-surface">
                <header className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3">
                  <div>
                    <h3 className="font-medium">{v.venue}</h3>
                    <p className="text-xs text-muted-foreground">
                      {SPORT_LABEL[v.sport]}
                      {first.rackets_included ? " · rackets provided" : " · bring your own gear"}
                    </p>
                  </div>
                  <p className="num text-sm">
                    from {rupees(Math.min(...[...v.courts.values()].flat().map((s) => s.price)))}
                    <span className="text-muted-foreground"> / hour</span>
                  </p>
                </header>
                <div className="divide-y">
                  {[...v.courts.entries()].map(([court, slots]) => (
                    <div key={court} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                      <p className="w-28 shrink-0 text-sm text-muted-foreground">{court}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {slots.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!slot.available && !slot.booked_by_me}
                            onClick={() => setSelected(slot)}
                            title={slot.booked_by_me ? "Your booking" : slot.available ? `${rupees(slot.price)}${slot.floodlit ? ", floodlit" : ""}` : "Taken"}
                            className={cn(
                              "num relative h-8 w-[60px] rounded-sm border font-mono text-xs transition-colors",
                              slot.booked_by_me
                                ? "border-primary bg-primary text-primary-foreground"
                                : slot.available
                                  ? "border-border-strong bg-surface hover:border-foreground"
                                  : "cursor-not-allowed border-transparent bg-muted text-muted-foreground/50 line-through",
                            )}
                          >
                            {time24(slot.starts_at)}
                            {slot.floodlit && slot.available && (
                              <Lightbulb className="absolute -right-1 -top-1 size-3 rounded-full bg-surface text-warning" aria-label="floodlit" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent
            title={`${SPORT_LABEL[selected.sport]}, ${selected.court}`}
            description={`${selected.venue} · ${dayLabel(selected.starts_at)} ${time24(selected.starts_at)}, 1 hour`}
          >
            <p className="text-sm">
              <span className="num font-medium">{rupees(selected.price)}</span>
              <span className="text-muted-foreground">, paid at the venue.</span>
              {selected.floodlit && <span className="text-muted-foreground"> Includes floodlights.</span>}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Free cancellation up to 2 hours before the slot.</p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Close
              </Button>
              {selected.booked_by_me ? (
                <Button variant="danger" loading={busy} onClick={() => act(selected)}>
                  Cancel booking
                </Button>
              ) : (
                <Button variant="primary" loading={busy} onClick={() => act(selected)}>
                  Book court
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

function MyBookings() {
  const refresh = useRefresh()
  const { data, error, mutate } = useSWR<{ bookings: Booking[] }>("/bookings")
  const [busy, setBusy] = useState<string | null>(null)

  async function cancel(b: Booking) {
    if (!window.confirm("Cancel this booking?")) return
    const key = `${b.type}${b.item.id}`
    setBusy(key)
    try {
      if (b.type === "class") await api.delete(`/classes/${b.item.id}/booking`)
      else if (b.type === "court") await api.delete(`/courts/${b.item.id}/booking`)
      else await api.post(`/sessions/${b.item.id}/cancel`)
      toast.success("Cancelled")
      refresh("/bookings", "/classes", "/courts", "/sessions")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />
  if (!data) return <ListSkeleton rows={3} />
  if (data.bookings.length === 0) return <EmptyState title="No upcoming bookings">Classes, courts and trainer sessions you book will show up here.</EmptyState>

  return (
    <div className="divide-y rounded-lg border bg-surface">
      {data.bookings.map((b) => {
        const title =
          b.type === "class" ? b.item.title : b.type === "court" ? `${SPORT_LABEL[b.item.sport]}, ${b.item.court}` : `Session with ${b.item.trainer.name}`
        const where = b.type === "class" ? b.item.studio : b.type === "court" ? b.item.venue : `${FOCUS_LABEL[b.item.focus]} · ${b.item.address}`
        const price = b.type === "court" ? b.item.price : b.item.price
        return (
          <div key={`${b.type}${b.item.id}`} className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-24 shrink-0">
              <p className="text-sm font-medium">{dayLabel(b.starts_at)}</p>
              <p className="num font-mono text-xs text-muted-foreground">{time24(b.starts_at)}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{where}</p>
            </div>
            <Tag tone="accent" className="hidden sm:inline-flex">
              {b.type === "class" ? "Class" : b.type === "court" ? "Court" : "Trainer"}
            </Tag>
            <span className="num hidden w-16 text-right text-sm sm:block">{rupees(price)}</span>
            <Button size="sm" variant="quiet" loading={busy === `${b.type}${b.item.id}`} onClick={() => cancel(b)}>
              Cancel
            </Button>
          </div>
        )
      })}
    </div>
  )
}

function ClassesPage() {
  const user = useUser()
  const router = useRouter()
  const params = useSearchParams()
  const tab = (params.get("tab") as Tab) || "classes"
  const [city, setCity] = useState(() => CITIES.find((c) => c.toLowerCase() === user.city?.toLowerCase()) ?? "Bengaluru")
  const [day, setDay] = useState(isoDate(new Date()))
  const bookings = useSWR<{ bookings: Booking[] }>("/bookings")

  const setTab = (t: Tab) => router.replace(t === "classes" ? "/classes" : `/classes?tab=${t}`, { scroll: false })

  return (
    <>
      <PageHeader
        eyebrow="Book"
        title="Classes & courts"
        description="Drop-in classes at partner studios and hourly court slots. Pay at the venue; cancel from My bookings."
        actions={
          tab !== "mine" && (
            <Select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" className="w-40">
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )
        }
      />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "classes", label: "Classes" },
          { value: "courts", label: "Courts" },
          { value: "mine", label: "My bookings", badge: bookings.data?.bookings.length },
        ]}
      />
      {tab !== "mine" && (
        <div className="mb-5">
          <DayStrip value={day} onChange={setDay} />
        </div>
      )}
      {tab === "classes" && <ClassList city={city} day={day} />}
      {tab === "courts" && <CourtGrid city={city} day={day} />}
      {tab === "mine" && <MyBookings />}
    </>
  )
}

export default function Page() {
  return (
    <Suspense>
      <ClassesPage />
    </Suspense>
  )
}
