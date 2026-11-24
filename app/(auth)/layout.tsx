"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"

import { Wordmark } from "@/components/logo"
import { useAuth } from "@/lib/auth"

function RedirectIfSignedIn() {
  const { status } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  useEffect(() => {
    if (status === "signed-in") {
      const next = params.get("next")
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/")
    }
  }, [status, router, params])
  return null
}

const POINTS = [
  ["Plan the week", "Schedule sessions, log what you did, and see your training load build up week by week."],
  ["Check your form", "Point your camera at a squat, push-up or curl and get rep counts and cues as you move."],
  ["Book and go", "Studio classes, badminton and pickleball courts, and trainers who come to your home."],
  ["Find your people", "Get matched with members near you who train at the same level and time of day."],
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#141311] p-12 text-[#efece6] lg:flex">
        <Wordmark />
        <div className="relative z-10 max-w-md">
          <p className="font-display text-[44px] font-semibold uppercase leading-[0.95] tracking-tight">
            Train with a plan.
            <br />
            <span className="text-brand">Train with people.</span>
          </p>
          <dl className="mt-10 space-y-5">
            {POINTS.map(([title, body]) => (
              <div key={title} className="border-l border-white/15 pl-4">
                <dt className="text-sm font-medium">{title}</dt>
                <dd className="mt-0.5 text-sm text-white/60">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="text-xs text-white/40">Bengaluru · Mumbai · Delhi</p>
        {/* Oversized plate outline as a quiet background texture. */}
        <svg viewBox="0 0 400 400" className="pointer-events-none absolute -right-40 top-1/2 size-[520px] -translate-y-1/2 text-white/[0.04]" aria-hidden>
          <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="28" />
          <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="10" />
          <circle cx="200" cy="200" r="30" fill="currentColor" />
        </svg>
      </aside>
      <main className="flex flex-col px-6 py-8 sm:px-10">
        <div className="lg:hidden">
          <Wordmark />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  )
}
