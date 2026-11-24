"use client"

import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"

import { Chips } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field"
import { api, ApiError, errorMessage } from "@/lib/api"
import { KIND_LABEL, todayIso } from "@/lib/format"
import { useRefresh } from "@/lib/hooks"
import type { Partner, Workout, WorkoutKind, WorkoutStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const DURATIONS = [20, 30, 45, 60, 75, 90, 120]

const EFFORT_HINT: Record<number, string> = {
  1: "Barely anything",
  3: "Easy, could chat the whole time",
  5: "Steady, working but comfortable",
  7: "Hard, a few reps left in the tank",
  9: "Very hard, almost nothing left",
  10: "Everything I had",
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workout?: Workout | null
  defaultDate?: string
  /** Open an existing workout straight into logging it as done. */
  logging?: boolean
}

function blank(date?: string) {
  return {
    title: "",
    kind: "strength" as WorkoutKind,
    date: date ?? todayIso(),
    start_time: "07:00",
    duration_min: 60,
    location: "",
    notes: "",
    partner_id: "",
    status: "planned" as WorkoutStatus,
    effort: 7,
  }
}

export function WorkoutDialog({ open, onOpenChange, workout, defaultDate, logging }: Props) {
  const editing = !!workout
  const [form, setForm] = useState(blank(defaultDate))
  const [fields, setFields] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const refresh = useRefresh()
  const { data: partners } = useSWR<{ partners: Partner[] }>(open ? "/partners" : null)

  useEffect(() => {
    if (!open) return
    setFields({})
    setError(null)
    if (workout) {
      setForm({
        title: workout.title,
        kind: workout.kind,
        date: workout.date,
        start_time: workout.start_time ?? "",
        duration_min: workout.duration_min,
        location: workout.location ?? "",
        notes: workout.notes ?? "",
        partner_id: workout.partner ? String(workout.partner.id) : "",
        status: logging ? "done" : workout.status,
        effort: workout.effort ?? 7,
      })
    } else {
      setForm(blank(defaultDate))
    }
  }, [open, workout, defaultDate, logging])

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFields({})
    const body = {
      title: form.title,
      kind: form.kind,
      date: form.date,
      start_time: form.start_time || null,
      duration_min: Number(form.duration_min),
      location: form.location || null,
      notes: form.notes || null,
      partner_id: form.partner_id ? Number(form.partner_id) : null,
      ...(editing ? { status: form.status, effort: form.status === "done" ? form.effort : null } : {}),
    }
    try {
      if (editing) await api.patch(`/workouts/${workout!.id}`, body)
      else await api.post("/workouts", body)
      toast.success(editing ? (form.status === "done" && workout!.status !== "done" ? "Logged. Nice work." : "Saved") : "Added to your schedule")
      refresh("/workouts")
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setFields(err.fields)
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!workout || !window.confirm(`Delete "${workout.title}"?`)) return
    setBusy(true)
    try {
      await api.delete(`/workouts/${workout.id}`)
      toast.success("Deleted")
      refresh("/workouts")
      onOpenChange(false)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editing ? (logging ? "Log workout" : "Edit workout") : "Plan a workout"}>
        <form onSubmit={save} className="space-y-4" noValidate>
          <FormError message={error} />

          {editing && (
            <Field label="Status" error={fields.status}>
              <Chips
                label="Status"
                options={[
                  { value: "planned", label: "Planned" },
                  { value: "done", label: "Done" },
                  { value: "skipped", label: "Skipped" },
                ]}
                value={form.status}
                onChange={(v) => set("status", v as WorkoutStatus)}
              />
            </Field>
          )}

          {editing && form.status === "done" && (
            <Field label={`How hard was it? ${form.effort}/10`} hint={EFFORT_HINT[form.effort] ?? EFFORT_HINT[form.effort - 1]}>
              <div className="flex gap-1" role="radiogroup" aria-label="Effort">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={form.effort === n}
                    onClick={() => set("effort", n)}
                    className={cn(
                      "num h-8 flex-1 rounded-sm border text-xs transition-colors",
                      n <= form.effort ? "border-primary bg-primary text-primary-foreground" : "bg-surface hover:bg-muted",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>
          )}

          <Field label="What are you doing?" htmlFor="w-title" error={fields.title}>
            <Input
              id="w-title"
              placeholder="e.g. Lower body, 5 km tempo run"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              aria-invalid={!!fields.title}
              autoFocus={!editing}
            />
          </Field>

          <Field label="Type" error={fields.kind}>
            <Chips
              label="Type"
              options={Object.entries(KIND_LABEL).map(([value, label]) => ({ value: value as WorkoutKind, label }))}
              value={form.kind}
              onChange={(v) => set("kind", v)}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Date" htmlFor="w-date" error={fields.date}>
              <Input id="w-date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Start" htmlFor="w-time" error={fields.start_time}>
              <Input id="w-time" type="time" step={300} value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
            </Field>
            <Field label="Length" htmlFor="w-dur" error={fields.duration_min}>
              <Select id="w-dur" value={form.duration_min} onChange={(e) => set("duration_min", Number(e.target.value))}>
                {[...new Set([...DURATIONS, form.duration_min])].sort((a, b) => a - b).map((d) => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Where" htmlFor="w-loc" optional error={fields.location}>
              <Input id="w-loc" placeholder="Gym, park, home" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </Field>
            <Field label="With" htmlFor="w-partner" optional error={fields.partner_id}>
              <Select id="w-partner" value={form.partner_id} onChange={(e) => set("partner_id", e.target.value)}>
                <option value="">Just me</option>
                {partners?.partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Notes" htmlFor="w-notes" optional error={fields.notes}>
            <Textarea
              id="w-notes"
              placeholder={form.status === "done" ? "Weights, sets, how it felt" : "Plan, sets, targets"}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>

          <DialogFooter className={editing ? "justify-between" : undefined}>
            {editing && (
              <Button type="button" variant="quiet" onClick={remove} disabled={busy} aria-label="Delete workout">
                <Trash2 /> Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={busy}>
                {editing ? "Save" : "Add to schedule"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
