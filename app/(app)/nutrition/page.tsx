"use client"

import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import useSWR from "swr"

import { PageHeader } from "@/components/app-shell"
import { Chips, EmptyState, ErrorState, ListSkeleton, Panel, Tag } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { Field, FormError, Input, Select } from "@/components/ui/field"
import { api, ApiError, errorMessage, qs } from "@/lib/api"
import { useUser } from "@/lib/auth"
import { DIET_LABEL } from "@/lib/format"
import type { Activity, CyclePhase, Diet, DietPlan, Gender, NutritionGoal, NutritionTargets } from "@/lib/types"
import { cn } from "@/lib/utils"

const ACTIVITY: Record<Activity, string> = {
  sedentary: "Mostly sitting, little exercise",
  light: "Exercise 1–3 days a week",
  moderate: "Exercise 3–5 days a week",
  active: "Hard exercise 6–7 days a week",
  athlete: "Twice a day, or a physical job",
}

const GOAL: Record<NutritionGoal, string> = {
  lose_fat: "Lose fat",
  maintain: "Maintain",
  build_muscle: "Build muscle",
}

const PHASE: Record<CyclePhase, string> = {
  menstrual: "Period (days 1–5)",
  follicular: "Follicular (after period)",
  ovulatory: "Ovulation (mid-cycle)",
  luteal: "Luteal (before period)",
}

function MacroBar({ macros, calories }: { macros: NutritionTargets["macros"]; calories: number }) {
  const parts = [
    { label: "Protein", grams: macros.protein_g, kcal: macros.protein_g * 4, className: "bg-primary" },
    { label: "Carbs", grams: macros.carbs_g, kcal: macros.carbs_g * 4, className: "bg-foreground/75" },
    { label: "Fat", grams: macros.fat_g, kcal: macros.fat_g * 9, className: "bg-foreground/30" },
  ]
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full" aria-hidden>
        {parts.map((p) => (
          <span key={p.label} className={p.className} style={{ width: `${(p.kcal / calories) * 100}%` }} />
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-4">
        {parts.map((p) => (
          <div key={p.label}>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", p.className)} />
              {p.label}
            </dt>
            <dd className="num font-display text-2xl font-semibold">
              {p.grams}
              <span className="ml-0.5 text-sm font-medium text-muted-foreground">g</span>
            </dd>
            <dd className="num text-2xs text-muted-foreground">{Math.round((p.kcal / calories) * 100)}% of calories</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Calculator() {
  const user = useUser()
  const [form, setForm] = useState({
    age: user.age?.toString() ?? "",
    gender: (user.gender ?? "") as Gender | "",
    height_cm: user.height_cm?.toString() ?? "",
    weight_kg: user.weight_kg?.toString() ?? "",
    activity: "moderate" as Activity,
    goal: (user.goals.includes("lose_fat") ? "lose_fat" : user.goals.includes("build_muscle") ? "build_muscle" : "maintain") as NutritionGoal,
    diet: (user.diet ?? "vegetarian") as Diet,
    cycle_phase: "" as CyclePhase | "",
  })
  const [result, setResult] = useState<NutritionTargets | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function calculate(e?: React.FormEvent) {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    setFields({})
    try {
      const { targets } = await api.post<{ targets: NutritionTargets }>("/nutrition/targets", {
        ...form,
        gender: form.gender || "other",
        cycle_phase: form.gender === "female" && form.cycle_phase ? form.cycle_phase : null,
      })
      setResult(targets)
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setFields(err.fields)
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  // If the profile already has what we need, show numbers straight away.
  useEffect(() => {
    if (user.age && user.height_cm && user.weight_kg) calculate()
  }, [])

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Panel title="Your details">
        <form onSubmit={calculate} className="space-y-4 p-4" noValidate>
          <FormError message={error} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2">
            <Field label="Age" htmlFor="n-age" error={fields.age}>
              <Input id="n-age" inputMode="numeric" value={form.age} onChange={(e) => set("age", e.target.value)} />
            </Field>
            <Field label="Sex" htmlFor="n-sex" error={fields.gender}>
              <Select id="n-sex" value={form.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </Select>
            </Field>
            <Field label="Height (cm)" htmlFor="n-h" error={fields.height_cm}>
              <Input id="n-h" inputMode="decimal" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} />
            </Field>
            <Field label="Weight (kg)" htmlFor="n-w" error={fields.weight_kg}>
              <Input id="n-w" inputMode="decimal" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <Field label="Activity" htmlFor="n-act">
            <Select id="n-act" value={form.activity} onChange={(e) => set("activity", e.target.value as Activity)}>
              {Object.entries(ACTIVITY).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Goal">
            <Chips label="Goal" options={Object.entries(GOAL).map(([value, label]) => ({ value: value as NutritionGoal, label }))} value={form.goal} onChange={(v) => set("goal", v)} />
          </Field>
          <Field label="Diet" htmlFor="n-diet">
            <Select id="n-diet" value={form.diet} onChange={(e) => set("diet", e.target.value as Diet)}>
              {Object.entries(DIET_LABEL).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          {form.gender === "female" && (
            <Field label="Cycle phase" htmlFor="n-cycle" optional hint="Adjusts calories and adds notes for where you are in your cycle.">
              <Select id="n-cycle" value={form.cycle_phase} onChange={(e) => set("cycle_phase", e.target.value as CyclePhase)}>
                <option value="">Don&apos;t adjust</option>
                {Object.entries(PHASE).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          </div>
          <Button type="submit" variant="primary" className="w-full md:w-auto xl:w-full" loading={busy}>
            {result ? "Recalculate" : "Calculate"}
          </Button>
        </form>
      </Panel>

      <div>
        {!result ? (
          <EmptyState title="Enter your details to get daily targets" className="h-full content-center">
            We use the Mifflin–St Jeor equation for resting energy, your activity for daily burn, and set protein from your
            bodyweight.
          </EmptyState>
        ) : (
          <div className="space-y-6">
            <Panel>
              <div className="grid gap-6 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10">
                <div>
                  <p className="eyebrow">Daily target</p>
                  <p className="num font-display text-6xl font-semibold leading-none">
                    {result.calories.toLocaleString("en-IN")}
                    <span className="ml-1 text-xl font-medium text-muted-foreground">kcal</span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Maintenance {result.maintenance.toLocaleString("en-IN")} · resting {result.bmr.toLocaleString("en-IN")}
                  </p>
                </div>
                <MacroBar macros={result.macros} calories={result.calories} />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 border-t px-5 py-3 text-sm">
                <span>
                  Water <span className="num font-medium">{result.water_l} L</span>
                </span>
                <span>
                  Fibre <span className="num font-medium">{result.macros.fibre_g} g</span>
                </span>
              </div>
            </Panel>

            {result.notes.length > 0 && (
              <ul className="space-y-2 rounded-lg border border-warning/30 bg-warning-soft/60 px-4 py-3 text-sm">
                {result.notes.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-warning" />
                    {n}
                  </li>
                ))}
              </ul>
            )}

            <Panel title="A day of eating">
              <div className="divide-y">
                {result.meals.map((m) => (
                  <div key={m.name} className="grid gap-2 px-4 py-3.5 sm:grid-cols-[120px_minmax(0,1fr)]">
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="num text-xs text-muted-foreground">
                        ~{m.calories} kcal · {m.protein_g} g protein
                      </p>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {m.options.map((o, i) => (
                        <li key={o} className={cn(i > 0 && "text-muted-foreground")}>
                          {i > 0 && <span className="mr-1.5 text-2xs uppercase tracking-wide">or</span>}
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  )
}

function Plans() {
  const user = useUser()
  const [goal, setGoal] = useState<NutritionGoal | "all">("all")
  const [diet, setDiet] = useState<Diet | "all">("all")
  const [forWomen, setForWomen] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const { data, error, mutate } = useSWR<{ plans: DietPlan[] }>(
    `/diet-plans${qs({ goal: goal === "all" ? null : goal, diet: diet === "all" ? null : diet, for_women: forWomen })}`,
    { keepPreviousData: true },
  )

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold">Plans from our coaches</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">Fixed day plans you can follow as-is. Swap foods like for like.</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chips label="Goal" options={[{ value: "all" as const, label: "Any goal" }, ...Object.entries(GOAL).map(([value, label]) => ({ value: value as NutritionGoal, label }))]} value={goal} onChange={setGoal} />
        <Select value={diet} onChange={(e) => setDiet(e.target.value as Diet | "all")} aria-label="Diet" className="h-8 w-44 text-[13px]">
          <option value="all">Any diet</option>
          {Object.entries(DIET_LABEL).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </Select>
        {user.gender === "female" && (
          <Chips label="For women" options={[{ value: "w", label: "Written for women" }]} value={forWomen ? ["w"] : []} onChange={() => setForWomen((v) => !v)} />
        )}
      </div>
      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <ListSkeleton rows={3} />
      ) : data.plans.length === 0 ? (
        <EmptyState title="No plans match those filters" />
      ) : (
        <div className="divide-y rounded-lg border bg-surface">
          {data.plans.map((p) => (
            <div key={p.id}>
              <button
                type="button"
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/40"
                onClick={() => setOpen(open === p.id ? null : p.id)}
                aria-expanded={open === p.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{p.summary}</p>
                </div>
                <div className="hidden gap-1.5 sm:flex">
                  <Tag>{DIET_LABEL[p.diet]}</Tag>
                  {p.for_women && <Tag tone="accent">For women</Tag>}
                </div>
                <span className="num hidden w-24 text-right text-sm sm:block">{p.protein_g} g protein</span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open === p.id && "rotate-180")} />
              </button>
              {open === p.id && (
                <div className="border-t bg-surface-2/50 px-4 py-4">
                  <p className="mb-3 text-sm">{p.summary}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {p.meals.map((m) => (
                      <div key={m.name} className="rounded border bg-surface p-3">
                        <p className="flex justify-between text-sm font-medium">
                          {m.name}
                          <span className="num font-normal text-muted-foreground">{m.calories} kcal</span>
                        </p>
                        <ul className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
                          {m.items.map((i) => (
                            <li key={i}>{i}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {p.author && <p className="mt-3 text-xs text-muted-foreground">Written by {p.author}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function NutritionPage() {
  return (
    <>
      <PageHeader
        eyebrow="Training"
        title="Nutrition"
        description="Daily calorie and protein targets worked out from your body and training, with Indian meals that hit them."
      />
      <Calculator />
      <Plans />
      <p className="mt-8 text-xs text-muted-foreground">
        General guidance, not medical advice. If you&apos;re pregnant, managing a condition like diabetes or PCOS, or have a
        history of disordered eating, talk to a doctor or registered dietitian first.
      </p>
    </>
  )
}
