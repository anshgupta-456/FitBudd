import { differenceInCalendarDays, format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns"

import type { ClassCategory, Diet, Goal, Level, SessionFocus, Sport, TimeOfDay, WorkoutKind } from "./types"

/** "2025-03-04" in the user's local calendar, not UTC. */
export function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd")
}

export function todayIso(): string {
  return isoDate(new Date())
}

/** Parse a date-only or local datetime string from the API as local time. */
export function localDate(value: string): Date {
  return parseISO(value)
}

export function dayLabel(value: string | Date): string {
  const d = typeof value === "string" ? parseISO(value) : value
  const diff = differenceInCalendarDays(d, new Date())
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  if (diff === -1) return "Yesterday"
  if (diff > 1 && diff < 7) return format(d, "EEEE")
  return format(d, "EEE d MMM")
}

export function shortDate(value: string | Date): string {
  const d = typeof value === "string" ? parseISO(value) : value
  return format(d, "d MMM")
}

export function longDate(value: string | Date): string {
  const d = typeof value === "string" ? parseISO(value) : value
  return format(d, "EEEE d MMMM")
}

export function time24(value: string | null | undefined): string {
  if (!value) return ""
  if (value.length === 5) return value
  const d = parseISO(value)
  return isValid(d) ? format(d, "HH:mm") : value
}

export function ago(utcIso: string | null | undefined): string {
  if (!utcIso) return ""
  const d = parseISO(utcIso)
  if (!isValid(d)) return ""
  const seconds = (Date.now() - d.getTime()) / 1000
  if (seconds < 60) return "just now"
  return formatDistanceToNowStrict(d, { addSuffix: true })
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
export function rupees(amount: number): string {
  return inr.format(amount)
}

export function minutes(total: number): string {
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

export const GOAL_LABEL: Record<Goal, string> = {
  lose_fat: "Lose fat",
  build_muscle: "Build muscle",
  get_stronger: "Get stronger",
  endurance: "Endurance",
  mobility: "Mobility",
  stay_active: "Stay active",
}

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
}

export const TIME_LABEL: Record<TimeOfDay, string> = {
  morning: "Mornings",
  afternoon: "Afternoons",
  evening: "Evenings",
}

export const DIET_LABEL: Record<Diet, string> = {
  vegetarian: "Vegetarian",
  eggetarian: "Eggetarian",
  non_vegetarian: "Non-vegetarian",
  vegan: "Vegan",
}

export const KIND_LABEL: Record<WorkoutKind, string> = {
  strength: "Strength",
  cardio: "Cardio",
  mobility: "Mobility",
  sport: "Sport",
  class: "Class",
}

export const CATEGORY_LABEL: Record<ClassCategory, string> = {
  yoga: "Yoga",
  pilates: "Pilates",
  hiit: "HIIT",
  dance: "Dance",
  strength: "Strength",
  aerial: "Aerial",
}

export const SPORT_LABEL: Record<Sport, string> = {
  badminton: "Badminton",
  pickleball: "Pickleball",
  tennis: "Tennis",
  basketball: "Basketball",
  football: "Football",
  squash: "Squash",
}

export const FOCUS_LABEL: Record<SessionFocus, string> = {
  strength: "Strength",
  fat_loss: "Fat loss",
  mobility: "Mobility & rehab",
  prenatal: "Pre/postnatal",
  nutrition: "Nutrition",
  sport: "Sport conditioning",
}

export const CITIES = ["Bengaluru", "Mumbai", "Delhi"]

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}
