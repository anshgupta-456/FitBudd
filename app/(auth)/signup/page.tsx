"use client"

import Link from "next/link"
import { useState } from "react"

import { Chips } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { Field, FormError, Input, Select } from "@/components/ui/field"
import { ApiError, errorMessage } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { CITIES, GOAL_LABEL, LEVEL_LABEL } from "@/lib/format"
import type { Goal, Level } from "@/lib/types"

export default function SignupPage() {
  const { signUp } = useAuth()
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "", fitness_level: "beginner" as Level })
  const [goals, setGoals] = useState<Goal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFields({})
    try {
      await signUp({ ...form, city: form.city || null, goals })
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setFields(err.fields)
      else setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="font-display text-4xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Already a member?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Name" htmlFor="name" error={fields.name}>
          <Input id="name" autoComplete="name" required autoFocus value={form.name} onChange={set("name")} aria-invalid={!!fields.name} />
        </Field>
        <Field label="Email" htmlFor="email" error={fields.email}>
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} aria-invalid={!!fields.email} />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters." error={fields.password}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={form.password}
            onChange={set("password")}
            aria-invalid={!!fields.password}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" htmlFor="city" error={fields.city}>
            <Input id="city" list="cities" autoComplete="address-level2" value={form.city} onChange={set("city")} />
            <datalist id="cities">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Experience" htmlFor="level">
            <Select id="level" value={form.fitness_level} onChange={set("fitness_level")}>
              {Object.entries(LEVEL_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="What are you working on?" optional>
          <Chips
            label="Goals"
            options={Object.entries(GOAL_LABEL).map(([value, label]) => ({ value: value as Goal, label }))}
            value={goals}
            onChange={(g) => setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]))}
          />
        </Field>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy}>
          Create account
        </Button>
        <p className="text-xs text-muted-foreground">
          Your city, level and goals are shown to other members so they can find training partners. You can change them any
          time in your profile.
        </p>
      </form>
    </>
  )
}
