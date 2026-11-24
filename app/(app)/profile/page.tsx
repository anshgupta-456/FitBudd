"use client"

import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/app-shell"
import { Chips, Panel } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field"
import { api, ApiError, errorMessage } from "@/lib/api"
import { useAuth, useUser } from "@/lib/auth"
import { CITIES, DIET_LABEL, GOAL_LABEL, LEVEL_LABEL, TIME_LABEL } from "@/lib/format"
import type { Diet, Gender, Goal, Level, TimeOfDay, User } from "@/lib/types"

function ProfileForm() {
  const user = useUser()
  const { setUser } = useAuth()
  const [form, setForm] = useState({
    name: user.name,
    age: user.age?.toString() ?? "",
    gender: user.gender ?? "",
    height_cm: user.height_cm?.toString() ?? "",
    weight_kg: user.weight_kg?.toString() ?? "",
    city: user.city ?? "",
    fitness_level: user.fitness_level,
    preferred_time: user.preferred_time ?? "",
    diet: user.diet ?? "",
    bio: user.bio ?? "",
  })
  const [goals, setGoals] = useState<Goal[]>(user.goals)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFields({})
    try {
      const { user: updated } = await api.patch<{ user: User }>("/profile", {
        name: form.name,
        age: form.age || null,
        gender: (form.gender || null) as Gender | null,
        height_cm: form.height_cm || null,
        weight_kg: form.weight_kg || null,
        city: form.city || null,
        fitness_level: form.fitness_level,
        preferred_time: (form.preferred_time || null) as TimeOfDay | null,
        diet: (form.diet || null) as Diet | null,
        bio: form.bio || null,
        goals,
      })
      setUser(updated)
      toast.success("Profile saved")
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setFields(err.fields)
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-5 p-5" noValidate>
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="p-name" error={fields.name}>
          <Input id="p-name" autoComplete="name" value={form.name} onChange={set("name")} />
        </Field>
        <Field label="City" htmlFor="p-city" error={fields.city} hint="Used to match you with partners, gyms and classes nearby.">
          <Input id="p-city" list="p-cities" value={form.city} onChange={set("city")} />
          <datalist id="p-cities">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Age" htmlFor="p-age" error={fields.age}>
          <Input id="p-age" inputMode="numeric" value={form.age} onChange={set("age")} />
        </Field>
        <Field label="Sex" htmlFor="p-sex" error={fields.gender}>
          <Select id="p-sex" value={form.gender} onChange={set("gender")}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Height (cm)" htmlFor="p-h" error={fields.height_cm}>
          <Input id="p-h" inputMode="decimal" value={form.height_cm} onChange={set("height_cm")} />
        </Field>
        <Field label="Weight (kg)" htmlFor="p-w" error={fields.weight_kg}>
          <Input id="p-w" inputMode="decimal" value={form.weight_kg} onChange={set("weight_kg")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Experience" htmlFor="p-level">
          <Select id="p-level" value={form.fitness_level} onChange={set("fitness_level")}>
            {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABEL[l]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Usually trains" htmlFor="p-time">
          <Select id="p-time" value={form.preferred_time} onChange={set("preferred_time")}>
            <option value="">Varies</option>
            {(Object.keys(TIME_LABEL) as TimeOfDay[]).map((t) => (
              <option key={t} value={t}>
                {TIME_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Diet" htmlFor="p-diet">
          <Select id="p-diet" value={form.diet} onChange={set("diet")}>
            <option value="">Not set</option>
            {(Object.keys(DIET_LABEL) as Diet[]).map((d) => (
              <option key={d} value={d}>
                {DIET_LABEL[d]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Goals">
        <Chips
          label="Goals"
          options={(Object.keys(GOAL_LABEL) as Goal[]).map((g) => ({ value: g, label: GOAL_LABEL[g] }))}
          value={goals}
          onChange={(g) => setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]))}
        />
      </Field>
      <Field label="About you" htmlFor="p-bio" optional error={fields.bio} hint="Shown to other members. What you train for, when and where.">
        <Textarea id="p-bio" maxLength={500} value={form.bio} onChange={set("bio")} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={busy}>
          Save profile
        </Button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const [form, setForm] = useState({ current_password: "", new_password: "" })
  const [fields, setFields] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setFields({})
    try {
      await api.post("/profile/password", form)
      setForm({ current_password: "", new_password: "" })
      toast.success("Password changed")
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setFields(err.fields)
      else toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 p-5" noValidate>
      <Field label="Current password" htmlFor="pw-cur" error={fields.current_password}>
        <Input id="pw-cur" type="password" autoComplete="current-password" value={form.current_password} onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))} />
      </Field>
      <Field label="New password" htmlFor="pw-new" error={fields.new_password} hint="At least 8 characters.">
        <Input id="pw-new" type="password" autoComplete="new-password" value={form.new_password} onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))} />
      </Field>
      <Button type="submit" loading={busy} disabled={!form.current_password || !form.new_password}>
        Change password
      </Button>
    </form>
  )
}

function DeleteAccount() {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      await api.delete("/profile", { password })
      signOut()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Permanently deletes your account, workouts, measurements, bookings and messages.
      </p>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Delete your account?" description="This can't be undone.">
          <FormError message={error} />
          <Field label="Enter your password to confirm" htmlFor="del-pw" className="mt-2">
            <Input id="del-pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep my account
            </Button>
            <Button variant="danger" loading={busy} disabled={!password} onClick={remove}>
              Delete everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProfilePage() {
  const user = useUser()
  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" description={`Signed in as ${user.email}`} />
      <div className="space-y-6">
        <Panel title="About you">
          <ProfileForm />
        </Panel>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Password">
            <PasswordForm />
          </Panel>
          <Panel title="Delete account" className="self-start">
            <DeleteAccount />
          </Panel>
        </div>
      </div>
    </>
  )
}
