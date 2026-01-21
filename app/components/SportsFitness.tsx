"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Sparkles, Star, MapPin, Calendar, Clock } from "lucide-react"

interface SportCardProps {
  name: string
  tagline: string
  level: string
  intensity: string
  spotsLeft: number
  location: string
  time: string
  duration: string
  image?: string
  accent: string
  highlight: string
}

const SportCard = ({
  name,
  tagline,
  level,
  intensity,
  spotsLeft,
  location,
  time,
  duration,
  image,
  accent,
  highlight,
}: SportCardProps) => {
  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-b from-white/90 to-white/70 dark:from-slate-900/80 dark:to-slate-900/60 shadow-lg shadow-slate-900/5 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10">
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/10" />
      </div>

      {image && (
        <div className="relative h-40 w-full overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>
      )}

      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 dark:bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 ring-1 ring-slate-100/80 dark:ring-slate-800">
            <span
              className="inline-flex h-2 w-2 rounded-full"
              style={{ background: accent }}
            />
            <span>{highlight}</span>
          </div>
          <Badge
            variant="outline"
            className="border-0 bg-slate-900 text-xs font-semibold text-white shadow-sm shadow-slate-900/20 dark:bg-white dark:text-slate-900"
          >
            <Users className="mr-1.5 h-3 w-3" />
            {spotsLeft} spots left
          </Badge>
        </div>

        <div>
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            {name}
          </CardTitle>
          <CardDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {tagline}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
            <Sparkles className="mr-1.5 h-3 w-3" />
            {level}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <Star className="mr-1.5 h-3 w-3 text-amber-400" />
            {intensity} intensity
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="space-y-1 rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-100 dark:bg-slate-900/70 dark:ring-slate-800">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-100">
              <MapPin className="h-3.5 w-3.5" />
              <span>Location</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{location}</p>
          </div>
          <div className="space-y-1 rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-100 dark:bg-slate-900/70 dark:ring-slate-800">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-100">
              <Calendar className="h-3.5 w-3.5" />
              <span>Next session</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {time} • {duration}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex -space-x-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white bg-gradient-to-tr from-fuchsia-500 to-orange-400 text-[10px] font-semibold text-white shadow-sm dark:border-slate-900">
                +6
              </span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white bg-sky-400 text-[10px] font-semibold text-white shadow-sm dark:border-slate-900">
                🧘
              </span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white bg-emerald-400 text-[10px] font-semibold text-white shadow-sm dark:border-slate-900">
                ⚡
              </span>
            </div>
            <span>Friends are active here</span>
          </div>

          <Button
            className="h-9 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm shadow-slate-900/30 transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Book session
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SportsFitness() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-5 py-7 text-slate-50 shadow-xl shadow-slate-950/40 ring-1 ring-slate-800/60 md:px-8 md:py-9">
      <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen">
        <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
      </div>

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-100 ring-1 ring-white/10 backdrop-blur">
            <span className="inline-flex h-1.5 w-6 rounded-full bg-gradient-to-r from-fuchsia-400 via-sky-400 to-emerald-400" />
            Live & social fitness
          </p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Sports Fitness
            <span className="ml-1 bg-gradient-to-r from-fuchsia-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
              sessions
            </span>
          </h2>
          <p className="text-sm text-slate-300">
            Book high-energy group sessions across yoga, dance fitness, and pickleball. Designed for social, studio-like
            workouts with an iOS-level polished experience.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
              <Users className="h-3.5 w-3.5" />
              <span>Small groups • real-time vibes</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
              <Clock className="h-3.5 w-3.5" />
              <span>45 min curated formats</span>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-xl md:flex-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SportCard
              name="Glow Flow Yoga"
              tagline="Soft, breath-led flows with a calm but elevated studio vibe."
              level="All levels welcome"
              intensity="Gentle"
              spotsLeft={4}
              location="Rooftop Studio • City Center"
              time="Today, 7:00 PM"
              duration="45 min"
              image="/images/dailyexercises.png"
              accent="linear-gradient(135deg, #a855f7, #ec4899)"
              highlight="Mindful energy"
            />
            <SportCard
              name="Dance Burn Session"
              tagline="High-energy choreography to bass-driven pop & Bollywood."
              level="Intermediate"
              intensity="High"
              spotsLeft={3}
              location="Neon Studio • Level 2"
              time="Today, 8:15 PM"
              duration="50 min"
              image="/images/partnerfinder.png"
              accent="linear-gradient(135deg, #fb923c, #f97316)"
              highlight="Dance fitness"
            />
            <SportCard
              name="Sunset Pickleball"
              tagline="Social match play with guided warm-up and skill pairings."
              level="Beginner–Intermediate"
              intensity="Moderate"
              spotsLeft={2}
              location="Courtside • Club Arena"
              time="Tomorrow, 6:30 PM"
              duration="60 min"
              image="/images/dashboard.png"
              accent="linear-gradient(135deg, #22c55e, #0ea5e9)"
              highlight="Courts & rallies"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

