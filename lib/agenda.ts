import { CATEGORY_LABEL, FOCUS_LABEL, KIND_LABEL, SPORT_LABEL } from "./format"
import type { Booking, Workout } from "./types"

export interface AgendaItem {
  key: string
  date: string // yyyy-MM-dd
  time: string | null // HH:mm
  minutes: number
  title: string
  meta: string
  source: "workout" | "class" | "court" | "trainer"
  label: string
  workout?: Workout
}

export function fromWorkout(w: Workout): AgendaItem {
  const bits = [w.location, w.partner ? `with ${w.partner.name}` : null].filter(Boolean)
  return {
    key: `w${w.id}`,
    date: w.date,
    time: w.start_time,
    minutes: w.duration_min,
    title: w.title,
    meta: bits.join(" · "),
    source: "workout",
    label: KIND_LABEL[w.kind],
    workout: w,
  }
}

export function fromBooking(b: Booking): AgendaItem {
  const [date, time] = b.starts_at.split("T")
  if (b.type === "class") {
    return {
      key: `c${b.item.id}`,
      date,
      time,
      minutes: b.item.duration_min,
      title: b.item.title,
      meta: `${b.item.instructor} · ${b.item.studio}`,
      source: "class",
      label: CATEGORY_LABEL[b.item.category],
    }
  }
  if (b.type === "court") {
    return {
      key: `s${b.item.id}`,
      date,
      time,
      minutes: b.item.duration_min,
      title: `${SPORT_LABEL[b.item.sport]}, ${b.item.court}`,
      meta: b.item.venue,
      source: "court",
      label: "Court",
    }
  }
  return {
    key: `t${b.item.id}`,
    date,
    time,
    minutes: b.item.duration_min,
    title: `Session with ${b.item.trainer.name}`,
    meta: `${FOCUS_LABEL[b.item.focus]} · at home`,
    source: "trainer",
    label: "Trainer",
  }
}

export function sortAgenda(items: AgendaItem[]): AgendaItem[] {
  return [...items].sort((a, b) => (a.date + (a.time ?? "99")).localeCompare(b.date + (b.time ?? "99")))
}

export function groupByDate(items: AgendaItem[]): [string, AgendaItem[]][] {
  const groups = new Map<string, AgendaItem[]>()
  for (const item of sortAgenda(items)) {
    const list = groups.get(item.date) ?? []
    list.push(item)
    groups.set(item.date, list)
  }
  return [...groups.entries()]
}
