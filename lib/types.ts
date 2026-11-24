// Shapes returned by the Flask API (backend/fitbudd/models.py).

export type Gender = "female" | "male" | "other"
export type Level = "beginner" | "intermediate" | "advanced"
export type Goal = "lose_fat" | "build_muscle" | "get_stronger" | "endurance" | "mobility" | "stay_active"
export type TimeOfDay = "morning" | "afternoon" | "evening"
export type Diet = "vegetarian" | "eggetarian" | "non_vegetarian" | "vegan"

export interface PublicMember {
  id: number
  name: string
  age: number | null
  gender: Gender | null
  fitness_level: Level
  city: string | null
  bio: string | null
  goals: Goal[]
  preferred_time: TimeOfDay | null
  last_active_at: string | null
}

export interface User extends PublicMember {
  email: string
  height_cm: number | null
  weight_kg: number | null
  diet: Diet | null
  created_at: string
}

export type WorkoutKind = "strength" | "cardio" | "mobility" | "sport" | "class"
export type WorkoutStatus = "planned" | "done" | "skipped"

export interface Workout {
  id: number
  title: string
  kind: WorkoutKind
  date: string
  start_time: string | null
  duration_min: number
  location: string | null
  notes: string | null
  status: WorkoutStatus
  effort: number | null
  partner: { id: number; name: string } | null
  completed_at: string | null
}

export interface WorkoutSummary {
  week_start: string
  this_week: { planned: number; done: number; minutes: number }
  streak_days: number
  total_done: number
  weekly: { week_start: string; minutes: number; sessions: number }[]
}

export interface Measurement {
  id: number
  date: string
  weight_kg: number | null
  body_fat_pct: number | null
  waist_cm: number | null
  resting_hr: number | null
  notes: string | null
}

export interface Gym {
  id: number
  name: string
  area: string
  city: string
  address: string
  description: string | null
  rating: number
  review_count: number
  price_per_month: number
  day_pass: number | null
  phone: string | null
  website: string | null
  hours: { weekdays: string; weekends: string }
  women_only_hours: string | null
  amenities: string[]
  equipment: string[]
  classes: string[]
}

export type ClassCategory = "yoga" | "pilates" | "hiit" | "dance" | "strength" | "aerial"
export type Sport = "badminton" | "pickleball" | "tennis" | "basketball" | "football" | "squash"

export interface StudioClass {
  id: number
  title: string
  category: ClassCategory
  instructor: string
  studio: string
  city: string
  starts_at: string
  duration_min: number
  level: "all" | Level
  capacity: number
  spots_left: number
  price: number
  description: string | null
  booked_by_me: boolean
}

export interface CourtSlot {
  id: number
  sport: Sport
  venue: string
  court: string
  city: string
  starts_at: string
  duration_min: number
  price: number
  floodlit: boolean
  rackets_included: boolean
  available: boolean
  booked_by_me: boolean
}

export type SessionFocus = "strength" | "fat_loss" | "mobility" | "prenatal" | "nutrition" | "sport"

export interface Trainer {
  id: number
  name: string
  gender: Gender
  headline: string
  specialties: SessionFocus[]
  certifications: string[]
  languages: string[]
  experience_years: number
  bio: string
  city: string
  areas: string | null
  rating: number
  review_count: number
  hourly_rate: number
  women_clients_focus: boolean
  accepting_clients: boolean
}

export interface TrainerSession {
  id: number
  trainer: { id: number; name: string; city: string }
  date: string
  start_time: string
  duration_min: number
  address: string
  focus: SessionFocus
  notes: string | null
  status: "booked" | "cancelled"
  price: number
}

export type Booking =
  | { type: "class"; starts_at: string; item: StudioClass }
  | { type: "court"; starts_at: string; item: CourtSlot }
  | { type: "trainer"; starts_at: string; item: TrainerSession }

export type NutritionGoal = "lose_fat" | "maintain" | "build_muscle"
export type Activity = "sedentary" | "light" | "moderate" | "active" | "athlete"
export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal"

export interface NutritionTargets {
  bmr: number
  maintenance: number
  activity_label: string
  calories: number
  macros: { protein_g: number; carbs_g: number; fat_g: number; fibre_g: number }
  water_l: number
  meals: { name: string; calories: number; protein_g: number; options: string[] }[]
  notes: string[]
}

export interface DietPlan {
  id: number
  name: string
  goal: NutritionGoal
  diet: Diet
  for_women: boolean
  daily_calories: number
  protein_g: number
  summary: string
  meals: { name: string; calories: number; items: string[] }[]
  author: string | null
}

export interface Suggestion extends PublicMember {
  match: number
  reasons: string[]
}

export interface PartnerRequest {
  id: number
  note: string | null
  sent_at: string
  user: Suggestion
}

export interface Partner extends PublicMember {
  connected_at: string
}

export interface Message {
  id: number
  sender_id: number
  recipient_id: number
  body: string
  sent_at: string
  read_at: string | null
}

export interface Conversation {
  partner: { id: number; name: string; city: string | null }
  last_message: Message | null
  unread: number
}
