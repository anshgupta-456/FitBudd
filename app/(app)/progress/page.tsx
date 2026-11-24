"use client"

import { format, parseISO } from "date-fns"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import useSWR from "swr"

import { PageHeader } from "@/components/app-shell"
import { Chips, EmptyState, ErrorState, ListSkeleton, Panel } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { Field, FormError, Input } from "@/components/ui/field"
import { api, ApiError, errorMessage } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { todayIso } from "@/lib/format"
import { useRefresh } from "@/lib/hooks"
import type { Measurement, User } from "@/lib/types"

type Metric = "weight_kg" | "waist_cm" | "body_fat_pct" | "resting_hr"

const METRICS: { value: Metric; label: string; unit: string; digits: number }[] = [
  { value: "weight_kg", label: "Weight", unit: "kg", digits: 1 },
  { value: "waist_cm", label: "Waist", unit: "cm", digits: 1 },
  { value: "body_fat_pct", label: "Body fat", unit: "%", digits: 1 },
  { value: "resting_hr", label: "Resting HR", unit: "bpm", digits: 0 },
]

function TrendChart({ data, metric }: { data: Measurement[]; metric: (typeof METRICS)[number] }) {
  const points = data
    .filter((m) => m[metric.value] !== null)
    .map((m) => ({ date: m.date, value: m[metric.value] as number }))
    .reverse()

  if (points.length < 2) {
    return (
      <p className="px-4 py-16 text-center text-sm text-muted-foreground">
        Log {metric.label.toLowerCase()} on at least two days to see a trend.
      </p>
    )
  }

  const values = points.map((p) => p.value)
  const pad = Math.max((Math.max(...values) - Math.min(...values)) * 0.25, metric.value === "weight_kg" ? 0.5 : 1)

  return (
    <div className="h-64 px-2 pb-2 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--chart-grid))" />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), "d MMM")}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[Math.floor(Math.min(...values) - pad), Math.ceil(Math.max(...values) + pad)]}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--border-strong))" }}
            contentStyle={{
              background: "hsl(var(--surface))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 12,
            }}
            labelFormatter={(d) => format(parseISO(String(d)), "EEE d MMM yyyy")}
            formatter={(v) => [`${Number(v).toFixed(metric.digits)} ${metric.unit}`, metric.label]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "hsl(var(--chart-1))", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function LogForm() {
  const refresh = useRefresh()
  const { setUser, user } = useAuth()
  const [form, setForm] = useState({ date: todayIso(), weight_kg: "", waist_cm: "", body_fat_pct: "", resting_hr: "" })
  const [fields, setFields] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFields({})
    try {
      await api.post("/measurements", {
        date: form.date,
        weight_kg: form.weight_kg || null,
        waist_cm: form.waist_cm || null,
        body_fat_pct: form.body_fat_pct || null,
        resting_hr: form.resting_hr || null,
      })
      toast.success("Saved")
      setForm((f) => ({ ...f, weight_kg: "", waist_cm: "", body_fat_pct: "", resting_hr: "" }))
      refresh("/measurements")
      // Weight also updates the profile, which nutrition targets read from.
      if (form.weight_kg && user) {
        const { user: fresh } = await api.get<{ user: User }>("/auth/me")
        setUser(fresh)
      }
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setFields(err.fields)
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 p-4" noValidate>
      <FormError message={error} />
      <Field label="Date" htmlFor="m-date" error={fields.date}>
        <Input id="m-date" type="date" max={todayIso()} value={form.date} onChange={set("date")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Weight (kg)" htmlFor="m-w" error={fields.weight_kg}>
          <Input id="m-w" inputMode="decimal" placeholder="63.4" value={form.weight_kg} onChange={set("weight_kg")} />
        </Field>
        <Field label="Waist (cm)" htmlFor="m-waist" error={fields.waist_cm}>
          <Input id="m-waist" inputMode="decimal" value={form.waist_cm} onChange={set("waist_cm")} />
        </Field>
        <Field label="Body fat (%)" htmlFor="m-bf" error={fields.body_fat_pct}>
          <Input id="m-bf" inputMode="decimal" value={form.body_fat_pct} onChange={set("body_fat_pct")} />
        </Field>
        <Field label="Resting HR" htmlFor="m-hr" error={fields.resting_hr}>
          <Input id="m-hr" inputMode="numeric" value={form.resting_hr} onChange={set("resting_hr")} />
        </Field>
      </div>
      <Button type="submit" variant="primary" className="w-full" loading={busy}>
        Save entry
      </Button>
      <p className="text-xs text-muted-foreground">
        Weigh in first thing in the morning, after the bathroom and before eating, for numbers you can compare.
      </p>
    </form>
  )
}

export default function ProgressPage() {
  const [metric, setMetric] = useState<Metric>("weight_kg")
  const refresh = useRefresh()
  const { data, error, mutate } = useSWR<{ measurements: Measurement[] }>("/measurements?limit=365")
  const entries = data?.measurements ?? []
  const current = METRICS.find((m) => m.value === metric)!

  async function remove(m: Measurement) {
    if (!window.confirm(`Delete the entry for ${format(parseISO(m.date), "d MMM")}?`)) return
    try {
      await api.delete(`/measurements/${m.id}`)
      refresh("/measurements")
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Progress"
        title="Body measurements"
        description="Day-to-day weight swings by a kilo or more with water and food. Watch the trend over weeks, not single readings."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <Panel title={<Chips label="Measurement" options={METRICS.map(({ value, label }) => ({ value, label }))} value={metric} onChange={setMetric} />}>
            {error ? (
              <div className="p-4">
                <ErrorState error={error} onRetry={() => mutate()} />
              </div>
            ) : !data ? (
              <div className="h-64" />
            ) : (
              <TrendChart data={entries} metric={current} />
            )}
          </Panel>

          <Panel title="Entries">
            {!data ? (
              <ListSkeleton rows={3} />
            ) : entries.length === 0 ? (
              <EmptyState className="m-4" title="No entries yet">
                Use the form to log your first weigh-in.
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Date</th>
                      {METRICS.map((m) => (
                        <th key={m.value} className="px-4 py-2 text-right font-medium">
                          {m.label}
                        </th>
                      ))}
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {entries.map((e) => (
                      <tr key={e.id} className="group">
                        <td className="num whitespace-nowrap px-4 py-2.5">{format(parseISO(e.date), "EEE d MMM yyyy")}</td>
                        {METRICS.map((m) => (
                          <td key={m.value} className="num whitespace-nowrap px-4 py-2.5 text-right">
                            {e[m.value] !== null ? `${(e[m.value] as number).toFixed(m.digits)} ${m.unit}` : <span className="text-muted-foreground/50">—</span>}
                          </td>
                        ))}
                        <td className="pr-2 text-right">
                          <Button variant="quiet" size="icon-sm" className="opacity-0 focus:opacity-100 group-hover:opacity-100" onClick={() => remove(e)} aria-label="Delete entry">
                            <Trash2 />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <aside>
          <Panel title="Log an entry" className="xl:sticky xl:top-10">
            <LogForm />
          </Panel>
        </aside>
      </div>
    </>
  )
}
