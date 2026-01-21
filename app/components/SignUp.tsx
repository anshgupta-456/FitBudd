"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SignUp() {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState<any>({ fitness_level: "beginner", goals: [] as string[] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const height = Number(form.height) || 0
  const weight = Number(form.weight) || 0
  const bmi = height > 0 ? (weight / Math.pow(height / 100, 2)).toFixed(1) : "-"

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await register(form)
      router.replace('/login')
    } catch (err: any) {
      setError(err?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.08),transparent_40%)] p-4">
      <h1 className="text-3xl font-bold text-center mb-6">FitBudd</h1>
      <Card className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
        <div className="hidden md:block bg-gradient-to-br from-blue-500/80 to-purple-500/80 text-white p-6">
          <h2 className="text-xl font-semibold mb-2">Create your fitness account</h2>
          <p className="opacity-90">Join the community and find your perfect workout partner.</p>
        </div>
        <div className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-2xl">Sign Up</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={submit} className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Full Name" onChange={(e) => update("name", e.target.value)} />
                <Input placeholder="Username" onChange={(e) => update("username", e.target.value)} />
                <Input placeholder="Email" type="email" onChange={(e) => update("email", e.target.value)} />
                <Input placeholder="Password" type="password" onChange={(e) => update("password", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Age" type="number" onChange={(e) => update("age", Number(e.target.value))} />
                <Select onValueChange={(v) => update("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Location" onChange={(e) => update("location", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Height (cm)" type="number" onChange={(e) => update("height", Number(e.target.value))} />
                <Input placeholder="Weight (kg)" type="number" onChange={(e) => update("weight", Number(e.target.value))} />
                <Select onValueChange={(v) => update("fitness_level", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fitness Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-700">BMI: {bmi}</div>
              <Input placeholder="Avatar URL (optional)" onChange={(e) => update("avatar_url", e.target.value)} />
              <Input placeholder="Goals (comma separated)" onChange={(e) => update("goals", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
              <Input placeholder="Bio" onChange={(e) => update("bio", e.target.value)} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">{loading ? "Creating..." : "Create Account"}</Button>
              <p className="text-sm text-center text-gray-600">Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a></p>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}



