"use client"

import { addDays, format, parseISO } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"

import { PageHeader } from "@/components/app-shell"
import { Avatar, Chips, EmptyState, ErrorState, ListSkeleton, Panel, Rating, Tag } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field"
import { api, ApiError, errorMessage, qs } from "@/lib/api"
import { useUser } from "@/lib/auth"
import { CITIES, FOCUS_LABEL, isoDate, rupees } from "@/lib/format"
import { useRefresh } from "@/lib/hooks"
import type { SessionFocus, Trainer, TrainerSession } from "@/lib/types"

const START_TIMES = Array.from({ length: (20 - 6) * 4 + 1 }, (_, i) => {
  const mins = 6 * 60 + i * 15
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`
})

const ADDRESS_KEY = "fitbudd.last-address"

function BookDialog({ trainer, onClose }: { trainer: Trainer; onClose: () => void }) {
  const refresh = useRefresh()
  const [form, setForm] = useState(() => ({
    date: isoDate(addDays(new Date(), 2)),
    start_time: "07:00",
    duration_min: 60,
    focus: trainer.specialties[0] ?? ("strength" as SessionFocus),
    address: typeof window !== "undefined" ? (localStorage.getItem(ADDRESS_KEY) ?? "") : "",
    notes: "",
  }))
  const [fields, setFields] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const price = Math.round((trainer.hourly_rate * form.duration_min) / 60)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFields({})
    try {
      await api.post(`/trainers/${trainer.id}/sessions`, { ...form, notes: form.notes || null })
      try {
        localStorage.setItem(ADDRESS_KEY, form.address)
      } catch {}
      toast.success(`Session booked with ${trainer.name}`, {
        description: `${format(parseISO(form.date), "EEE d MMM")} at ${form.start_time}`,
      })
      refresh("/sessions", "/bookings")
      onClose()
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setFields(err.fields)
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <DialogContent title={`Book ${trainer.name}`} description={`Home session in ${trainer.areas ?? trainer.city}`}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date" htmlFor="t-date" error={fields.date} className="col-span-3 sm:col-span-1">
            <Input
              id="t-date"
              type="date"
              min={isoDate(new Date())}
              max={isoDate(addDays(new Date(), 60))}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>
          <Field label="Start" htmlFor="t-time" error={fields.start_time}>
            <Select id="t-time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)}>
              {START_TIMES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Length" htmlFor="t-dur" error={fields.duration_min}>
            <Select id="t-dur" value={form.duration_min} onChange={(e) => set("duration_min", Number(e.target.value))}>
              {[45, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Focus" htmlFor="t-focus" error={fields.focus}>
          <Select id="t-focus" value={form.focus} onChange={(e) => set("focus", e.target.value as SessionFocus)}>
            {(Object.keys(FOCUS_LABEL) as SessionFocus[]).map((f) => (
              <option key={f} value={f}>
                {FOCUS_LABEL[f]}
                {trainer.specialties.includes(f) ? "" : " (not a specialty)"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Address" htmlFor="t-addr" error={fields.address} hint="Only shared with the trainer for this session.">
          <Textarea
            id="t-addr"
            className="min-h-[64px]"
            placeholder="Flat, building, street, area"
            autoComplete="street-address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
        <Field label="Anything they should know?" htmlFor="t-notes" optional>
          <Textarea id="t-notes" className="min-h-[64px]" placeholder="Injuries, equipment you have at home, goals" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
        <DialogFooter className="items-center justify-between">
          <p className="num text-sm">
            <span className="font-medium">{rupees(price)}</span>
            <span className="text-muted-foreground"> · pay the trainer</span>
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={busy}>
              Book session
            </Button>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function TrainerRow({ t, onBook }: { t: Trainer; onBook: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <article className="px-4 py-4">
      <div className="flex gap-4">
        <Avatar name={t.name} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              <h3 className="font-medium">{t.name}</h3>
              <p className="text-sm text-muted-foreground">{t.headline}</p>
            </div>
            <div className="flex items-center gap-4">
              <Rating value={t.rating} count={t.review_count} />
              <p className="num text-sm">
                <span className="font-medium">{rupees(t.hourly_rate)}</span>
                <span className="text-muted-foreground"> / hr</span>
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {t.women_clients_focus && <Tag tone="accent">Works mostly with women</Tag>}
            {t.specialties.map((s) => (
              <Tag key={s}>{FOCUS_LABEL[s]}</Tag>
            ))}
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">
            {t.experience_years} years · {t.languages.join(", ")} · {t.areas}
          </p>
          {open && (
            <div className="mt-3 space-y-2 border-l-2 pl-3 text-sm">
              <p className="leading-relaxed">{t.bio}</p>
              <p className="text-xs text-muted-foreground">Certified: {t.certifications.join(", ")}</p>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="primary" onClick={onBook}>
              Book a home session
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? "Less" : "About"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

function MySessions() {
  const refresh = useRefresh()
  const { data } = useSWR<{ sessions: TrainerSession[] }>("/sessions")
  const today = isoDate(new Date())
  const upcoming = (data?.sessions ?? []).filter((s) => s.status === "booked" && s.date >= today).reverse()
  const past = (data?.sessions ?? []).filter((s) => s.date < today || s.status === "cancelled").slice(0, 5)

  async function cancel(s: TrainerSession) {
    if (!window.confirm(`Cancel your session with ${s.trainer.name}?`)) return
    try {
      await api.post(`/sessions/${s.id}/cancel`)
      toast.success("Session cancelled")
      refresh("/sessions", "/bookings")
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (!data || (upcoming.length === 0 && past.length === 0)) return null
  return (
    <Panel title="Your sessions" className="mb-8">
      <div className="divide-y">
        {[...upcoming, ...past].map((s) => {
          const isPast = s.date < today || s.status === "cancelled"
          return (
            <div key={s.id} className="flex items-center gap-4 px-4 py-3">
              <div className="w-28 shrink-0">
                <p className="text-sm font-medium">{format(parseISO(s.date), "EEE d MMM")}</p>
                <p className="num font-mono text-xs text-muted-foreground">
                  {s.start_time} · {s.duration_min} min
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.trainer.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {FOCUS_LABEL[s.focus]} · {s.address}
                </p>
              </div>
              {s.status === "cancelled" ? (
                <Tag tone="outline">Cancelled</Tag>
              ) : isPast ? (
                <Tag tone="success">Completed</Tag>
              ) : (
                <Button size="sm" variant="quiet" onClick={() => cancel(s)}>
                  Cancel
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

export default function TrainersPage() {
  const user = useUser()
  const [city, setCity] = useState(() => CITIES.find((c) => c.toLowerCase() === user.city?.toLowerCase()) ?? "")
  const [specialty, setSpecialty] = useState<SessionFocus | "all">("all")
  const [womenFocus, setWomenFocus] = useState(false)
  const [sort, setSort] = useState("rating")
  const [booking, setBooking] = useState<Trainer | null>(null)

  const { data, error, mutate } = useSWR<{ trainers: Trainer[] }>(
    `/trainers${qs({ city, specialty: specialty === "all" ? null : specialty, women_focus: womenFocus, sort })}`,
    { keepPreviousData: true },
  )

  return (
    <>
      <PageHeader
        eyebrow="Book"
        title="Trainers"
        description="Certified coaches who come to your home with the kit. Book at least 12 hours ahead; cancel up to 6 hours before."
      />

      <MySessions />

      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" className="sm:w-44">
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className="sm:w-44">
            <option value="rating">Top rated</option>
            <option value="price">Lowest rate</option>
            <option value="experience">Most experienced</option>
          </Select>
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded border border-input bg-surface px-3 text-sm">
            <input type="checkbox" checked={womenFocus} onChange={(e) => setWomenFocus(e.target.checked)} className="size-4 accent-[hsl(var(--primary))]" />
            Works mostly with women
          </label>
        </div>
        <Chips
          label="Specialty"
          options={[{ value: "all" as const, label: "Any specialty" }, ...(Object.keys(FOCUS_LABEL) as SessionFocus[]).map((f) => ({ value: f, label: FOCUS_LABEL[f] }))]}
          value={specialty}
          onChange={setSpecialty}
        />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <ListSkeleton rows={4} />
      ) : data.trainers.length === 0 ? (
        <EmptyState title="No trainers match">Try another city or specialty.</EmptyState>
      ) : (
        <div className="divide-y rounded-lg border bg-surface">
          {data.trainers.map((t) => (
            <TrainerRow key={t.id} t={t} onBook={() => setBooking(t)} />
          ))}
        </div>
      )}

      <Dialog open={!!booking} onOpenChange={(o) => !o && setBooking(null)}>
        {booking && <BookDialog trainer={booking} onClose={() => setBooking(null)} />}
      </Dialog>
    </>
  )
}
