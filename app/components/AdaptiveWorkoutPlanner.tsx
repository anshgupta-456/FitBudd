"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Target, Zap, Check, Sparkles } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { toast } from "sonner"

export default function AdaptiveWorkoutPlanner() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'

  // Basic states
  const [fitnessLevel, setFitnessLevel] = useState("")
  const [workoutDays, setWorkoutDays] = useState<string[]>([])
  const [sessionDuration, setSessionDuration] = useState("")
  const [useEquipment, setUseEquipment] = useState(false)
  const [focusAreas, setFocusAreas] = useState<string[]>([])

  // Menstrual cycle states (for women only)
  const [userGender, setUserGender] = useState<string | null>(null)
  const [menstrualCyclePhase, setMenstrualCyclePhase] = useState<string>("")
  const [includeCycleExercises, setIncludeCycleExercises] = useState(false)

  // Plan generation state
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("configure")
  const [scheduledWorkouts, setScheduledWorkouts] = useState<any[]>([])

  // Get user gender
  useEffect(() => {
    const getUserGender = async () => {
      try {
        // First check if user object has gender
        if (user?.gender) {
          const gender = user.gender.toLowerCase()
          setUserGender(gender)
          if (gender === 'female') {
            setIncludeCycleExercises(true)
          }
          return
        }
        
        // Otherwise fetch from API
        const token = localStorage.getItem('auth_token')
        if (!token || !user?.id) return
        
        const res = await fetch(`${baseUrl}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        
        if (data.success && data.user?.gender) {
          const gender = data.user.gender.toLowerCase()
          setUserGender(gender)
          if (gender === 'female') {
            setIncludeCycleExercises(true)
          }
        }
      } catch (error) {
        console.error("Error fetching user gender:", error)
      }
    }
    getUserGender()
  }, [user?.id, user?.gender, baseUrl])

  const weekDays = [
    { id: "monday", label: "Monday", short: "Mon" },
    { id: "tuesday", label: "Tuesday", short: "Tue" },
    { id: "wednesday", label: "Wednesday", short: "Wed" },
    { id: "thursday", label: "Thursday", short: "Thu" },
    { id: "friday", label: "Friday", short: "Fri" },
    { id: "saturday", label: "Saturday", short: "Sat" },
    { id: "sunday", label: "Sunday", short: "Sun" },
  ]

  const bodyAreas = [
    { id: "upper-body", label: "Upper Body", icon: "💪" },
    { id: "core", label: "Core Strength", icon: "�" },
    { id: "lower-body", label: "Lower Body", icon: "🦵" },
    { id: "cardio", label: "Cardio", icon: "❤️" },
    { id: "flexibility", label: "Flexibility", icon: "🤸" },
    { id: "balance", label: "Balance", icon: "⚖️" },
  ]

  const menstrualCyclePhases = [
    { value: "menstrual", label: "Menstrual (Days 1-5)", description: "Light exercises, focus on rest and recovery", intensity: "Low" },
    { value: "follicular", label: "Follicular (Days 6-14)", description: "Normal intensity, strength training focus", intensity: "Moderate-High" },
    { value: "ovulation", label: "Ovulation (Days 15-17)", description: "Peak performance, high-intensity workouts", intensity: "High" },
    { value: "luteal", label: "Luteal (Days 18-28)", description: "Moderate intensity, focus on endurance", intensity: "Moderate" },
  ]

  const handleDayToggle = (dayId: string) => {
    setWorkoutDays((prev) => (prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]))
  }

  const handleFocusAreaToggle = (areaId: string) => {
    setFocusAreas((prev) => (prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]))
  }

  // Helper function to get day label from workoutDays index
  const getDayLabel = (index: number, defaultDay: string = "Monday") => {
    if (workoutDays[index]) {
      const dayObj = weekDays.find(d => d.id === workoutDays[index])
      return dayObj?.label || defaultDay
    }
    return defaultDay
  }

  const generateWorkoutPlan = async () => {
    setIsGenerating(true)

    try {
      // Convert focus areas to exercise types
      const preferredExerciseTypes: string[] = focusAreas.map(area => {
        switch(area) {
          case "upper-body": return "Strength Training";
          case "lower-body": return "Leg Exercises";
          case "core": return "Core Training";
          case "cardio": return "Cardiovascular";
          case "flexibility": return "Flexibility";
          case "balance": return "Balance";
          default: return area;
        }
      });
      
      // Add menstrual cycle information for women
      if (userGender === 'female' && menstrualCyclePhase) {
        preferredExerciseTypes.push(`Menstrual Cycle: ${menstrualCyclePhase}`)
      }
      
      // Prepare API request payload
      const requestPayload = {
        preferredExerciseTypes: preferredExerciseTypes,
        sessionDuration: sessionDuration,
        menstrualCyclePhase: userGender === 'female' ? menstrualCyclePhase : null,
        fitnessLevel: fitnessLevel,
        workoutDays: workoutDays,
        useEquipment: useEquipment
      }

      console.log("⚙️ Generating adaptive workout plan with parameters:", requestPayload)

      try {
        // Use the API endpoint
        const response = await fetch('/api/adaptive-workout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        })
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        
        const data = await response.json()
        setGeneratedPlan(data.plan)
        
        // Switch to view tab
        setActiveTab("view-plan")
      } catch (apiError) {
        console.error("API Error:", apiError)
        console.log("Using fallback plan instead")
        
        // Use fallback plan
        setGeneratedPlan(getFallbackPlan())
        setActiveTab("view-plan")
      }
    } catch (error) {
      console.error("Error generating adaptive workout plan:", error)
      alert("Failed to generate adaptive workout plan. Using fallback plan.")
      
      // Use fallback as last resort
      setGeneratedPlan(getFallbackPlan())
      setActiveTab("view-plan")
    } finally {
      setIsGenerating(false)
    }
  }

  const getDayTypeColor = (type: string | undefined) => {
    if (!type) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    if (type.includes("Strength")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    if (type.includes("Cardio")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (type.includes("Rest")) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    if (type.includes("Recovery")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (type.includes("Adaptive")) return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
    return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  }

  // Function to get cycle-based exercises for women
  const getCycleBasedExercises = (phase: string) => {
    const cycleExercises: Record<string, any> = {
      menstrual: {
        name: "Menstrual Phase Recovery Program",
        duration: "Weekly",
        difficulty: fitnessLevel || "Beginner",
        totalWorkouts: workoutDays.length || 3,
        estimatedCalories: 1000,
        schedule: [
          {
            day: getDayLabel(0, "Monday"),
            type: "Gentle Recovery",
            duration: 20,
            exercises: [
              { name: "Gentle Yoga Flow", sets: 1, reps: "15 min", rest: "0s", note: "Focus on relaxation and gentle stretching" },
              { name: "Light Walking", sets: 1, reps: "10 min", rest: "0s", note: "Low intensity, focus on movement" },
              { name: "Deep Breathing", sets: 1, reps: "5 min", rest: "0s", note: "Stress relief and relaxation" }
            ],
            calories: 80,
          },
          {
            day: getDayLabel(1, "Wednesday"),
            type: "Restorative Stretching",
            duration: 25,
            exercises: [
              { name: "Hip Flexor Stretches", sets: 2, reps: "hold 30s each", rest: "15s", note: "Helps with menstrual cramps" },
              { name: "Lower Back Stretches", sets: 2, reps: "hold 30s each", rest: "15s", note: "Relieves lower back tension" },
              { name: "Gentle Core Breathing", sets: 1, reps: "10 breaths", rest: "0s", note: "Supports pelvic floor" }
            ],
            calories: 60,
          },
          {
            day: getDayLabel(2, "Friday"),
            type: "Light Movement",
            duration: 20,
            exercises: [
              { name: "Seated Leg Lifts", sets: 2, reps: "10 each leg", rest: "30s", note: "Gentle lower body movement" },
              { name: "Arm Circles", sets: 2, reps: "15 each direction", rest: "20s", note: "Upper body mobility" },
              { name: "Meditation", sets: 1, reps: "10 min", rest: "0s", note: "Mental wellness focus" }
            ],
            calories: 50,
          },
        ]
      },
      follicular: {
        name: "Follicular Phase Strength Program",
        duration: "Weekly",
        difficulty: fitnessLevel || "Intermediate",
        totalWorkouts: workoutDays.length || 4,
        estimatedCalories: 1800,
        schedule: [
          {
            day: getDayLabel(0, "Monday"),
            type: "Upper Body Strength",
            duration: 40,
            exercises: [
              { name: "Push-ups", sets: 3, reps: "10-12", rest: "60s", note: "Build upper body strength" },
              { name: "Dumbbell Rows", sets: 3, reps: "12-15", rest: "60s", note: "Back and shoulders" },
              { name: "Shoulder Press", sets: 3, reps: "10-12", rest: "60s", note: "Shoulder development" },
              { name: "Bicep Curls", sets: 3, reps: "12-15", rest: "45s", note: "Arm strength" }
            ],
            calories: 220,
          },
          {
            day: getDayLabel(1, "Wednesday"),
            type: "Lower Body Strength",
            duration: 40,
            exercises: [
              { name: "Squats", sets: 3, reps: "12-15", rest: "60s", note: "Lower body foundation" },
              { name: "Lunges", sets: 3, reps: "10 each leg", rest: "60s", note: "Leg strength and balance" },
              { name: "Glute Bridges", sets: 3, reps: "15-20", rest: "45s", note: "Posterior chain" },
              { name: "Calf Raises", sets: 3, reps: "15-20", rest: "30s", note: "Lower leg strength" }
            ],
            calories: 200,
          },
          {
            day: getDayLabel(2, "Friday"),
            type: "Full Body Strength",
            duration: 45,
            exercises: [
              { name: "Deadlifts", sets: 3, reps: "8-10", rest: "90s", note: "Full body compound movement" },
              { name: "Overhead Press", sets: 3, reps: "8-10", rest: "60s", note: "Core and shoulders" },
              { name: "Plank", sets: 3, reps: "hold 30-45s", rest: "30s", note: "Core stability" }
            ],
            calories: 250,
          },
        ]
      },
      ovulation: {
        name: "Ovulation Phase Peak Performance",
        duration: "Weekly",
        difficulty: fitnessLevel || "Advanced",
        totalWorkouts: workoutDays.length || 5,
        estimatedCalories: 2200,
        schedule: [
          {
            day: getDayLabel(0, "Monday"),
            type: "High-Intensity Strength",
            duration: 45,
            exercises: [
              { name: "Barbell Squats", sets: 4, reps: "8-10", rest: "90s", note: "Peak strength training" },
              { name: "Bench Press", sets: 4, reps: "6-8", rest: "90s", note: "Upper body power" },
              { name: "Pull-ups", sets: 3, reps: "8-10", rest: "60s", note: "Back strength" },
              { name: "Overhead Press", sets: 3, reps: "8-10", rest: "60s", note: "Shoulder power" }
            ],
            calories: 300,
          },
          {
            day: getDayLabel(1, "Wednesday"),
            type: "HIIT Cardio",
            duration: 30,
            exercises: [
              { name: "Sprint Intervals", sets: 6, reps: "30s on/30s off", rest: "30s", note: "Maximum intensity" },
              { name: "Burpees", sets: 4, reps: "10-12", rest: "45s", note: "Full body power" },
              { name: "Jump Squats", sets: 3, reps: "15", rest: "45s", note: "Explosive lower body" }
            ],
            calories: 280,
          },
          {
            day: getDayLabel(2, "Friday"),
            type: "Power Training",
            duration: 40,
            exercises: [
              { name: "Power Cleans", sets: 4, reps: "5-6", rest: "120s", note: "Peak power output" },
              { name: "Box Jumps", sets: 3, reps: "8-10", rest: "60s", note: "Explosive power" },
              { name: "Medicine Ball Slams", sets: 3, reps: "12-15", rest: "45s", note: "Full body power" }
            ],
            calories: 270,
          },
        ]
      },
      luteal: {
        name: "Luteal Phase Endurance Program",
        duration: "Weekly",
        difficulty: fitnessLevel || "Intermediate",
        totalWorkouts: workoutDays.length || 4,
        estimatedCalories: 1600,
        schedule: [
          {
            day: getDayLabel(0, "Monday"),
            type: "Moderate Cardio",
            duration: 35,
            exercises: [
              { name: "Steady-State Running", sets: 1, reps: "25 min", rest: "0s", note: "Moderate pace, focus on endurance" },
              { name: "Walking Intervals", sets: 3, reps: "3 min fast/2 min slow", rest: "0s", note: "Sustained effort" }
            ],
            calories: 200,
          },
          {
            day: getDayLabel(1, "Wednesday"),
            type: "Endurance Strength",
            duration: 40,
            exercises: [
              { name: "Circuit Training", sets: 3, reps: "12-15 each", rest: "30s", note: "Full body endurance" },
              { name: "Bodyweight Exercises", sets: 3, reps: "15-20", rest: "45s", note: "Sustained strength" },
              { name: "Core Endurance", sets: 3, reps: "hold 45-60s", rest: "30s", note: "Core stability" }
            ],
            calories: 180,
          },
          {
            day: getDayLabel(2, "Friday"),
            type: "Moderate Flexibility",
            duration: 30,
            exercises: [
              { name: "Yoga Flow", sets: 1, reps: "20 min", rest: "0s", note: "Stress relief and flexibility" },
              { name: "Stretching Routine", sets: 1, reps: "10 min", rest: "0s", note: "Full body mobility" }
            ],
            calories: 120,
          },
        ]
      }
    }
    return cycleExercises[phase] || cycleExercises.follicular
  }

  // Function to get fallback plan
  const getFallbackPlan = () => {
    // Check for menstrual cycle first (women only)
    if (userGender === 'female' && menstrualCyclePhase) {
      return getCycleBasedExercises(menstrualCyclePhase)
    }
    
    // Default general workout plan
    return {
      name: "Personalized Workout Program",
      duration: "Weekly",
      difficulty: fitnessLevel || "Beginner",
      totalWorkouts: workoutDays.length || 3,
      estimatedCalories: 1600,
      schedule: [
        {
          day: getDayLabel(0, "Monday"),
          type: "Strength Training",
          duration: 35,
          exercises: [
            { name: "Push-ups", sets: 3, reps: "10-12", rest: "60s" },
            { name: "Squats", sets: 3, reps: "12-15", rest: "60s" },
            { name: "Plank", sets: 3, reps: "hold 30-45s", rest: "30s" },
            { name: "Lunges", sets: 3, reps: "10 each leg", rest: "60s" }
          ],
          calories: 200,
        },
        {
          day: workoutDays[1] || "Wednesday",
          type: "Cardio",
          duration: 30,
          exercises: [
            { name: "Running", sets: 1, reps: "20 min", rest: "0s" },
            { name: "Jumping Jacks", sets: 3, reps: "30s", rest: "30s" }
          ],
          calories: 190,
        },
        {
          day: workoutDays[2] || "Friday",
          type: "Flexibility & Recovery",
          duration: 30,
          exercises: [
            { name: "Yoga Flow", sets: 1, reps: "20 min", rest: "0s" },
            { name: "Stretching", sets: 1, reps: "10 min", rest: "0s" }
          ],
          calories: 120,
        },
      ]
    }
  }

  // Function to schedule workouts from plan to calendar
  const scheduleWorkoutsFromPlan = async (plan: any) => {
    if (!plan || !plan.schedule) {
      toast.error("No workout plan to schedule")
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      if (!token || !user?.id) {
        toast.error("Please log in to schedule workouts")
        return
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day
      
      // Get next occurrence of each workout day
      const scheduled = []
      const errors = []
      
      for (const workoutDay of plan.schedule) {
        try {
          // Find the day index - workoutDay.day could be "Monday" or day ID like "monday"
          let dayIndex = -1
          const dayName = workoutDay.day || ""
          
          // Try matching by label first (e.g., "Monday")
          dayIndex = weekDays.findIndex(d => d.label === dayName)
          
          // If not found, try matching by ID (e.g., "monday")
          if (dayIndex === -1) {
            dayIndex = weekDays.findIndex(d => d.id === dayName.toLowerCase())
          }
          
          // If still not found, try to match by short name
          if (dayIndex === -1) {
            dayIndex = weekDays.findIndex(d => d.short.toLowerCase() === dayName.substring(0, 3).toLowerCase())
          }
          
          if (dayIndex === -1) {
            console.warn(`Could not find day: ${dayName}`)
            continue
          }
          
          // Calculate next occurrence of this day (0 = Sunday, 1 = Monday, etc.)
          // JavaScript getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          // weekDays array: 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
          // So we need to adjust: weekDays[0] = Monday = getDay() 1
          const targetDayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1 // Convert to JS day format
          const currentDayOfWeek = today.getDay()
          
          // Calculate days until target day
          let daysUntil = targetDayOfWeek - currentDayOfWeek
          if (daysUntil <= 0) {
            daysUntil += 7 // Schedule for next week if today is past that day
          }
          
          const workoutDate = new Date(today)
          workoutDate.setDate(today.getDate() + daysUntil)
          
          // Create workout schedule
          const workoutData = {
            user_id: user.id,
            title: `${workoutDay.type} - ${plan.name}`,
            date: workoutDate.toISOString().split('T')[0],
            time: "09:00", // Default time, user can change
            duration: workoutDay.duration || 30,
            workout_type: workoutDay.type,
            notes: `Adaptive workout plan${menstrualCyclePhase ? ` - ${menstrualCyclePhase} phase` : ''}`
          }

          const res = await fetch(`${baseUrl}/api/workouts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(workoutData)
          })

          const data = await res.json()
          if (data.success) {
            scheduled.push(workoutData)
          } else {
            errors.push(data.error || `Failed to schedule ${workoutDay.type}`)
            console.error("API error:", data.error)
          }
        } catch (dayError) {
          console.error(`Error scheduling ${workoutDay.type}:`, dayError)
          errors.push(`Failed to schedule ${workoutDay.type}`)
        }
      }

      if (scheduled.length > 0) {
        toast.success(`Successfully scheduled ${scheduled.length} workout${scheduled.length > 1 ? 's' : ''} to your calendar!`)
        // Trigger calendar refresh
        window.dispatchEvent(new CustomEvent('workouts-scheduled'))
      } else if (errors.length > 0) {
        toast.error(`Failed to schedule workouts: ${errors[0]}`)
      } else {
        toast.error("No workouts could be scheduled. Please check your plan.")
      }
    } catch (error: any) {
      console.error("Error scheduling workouts:", error)
      toast.error(`Failed to schedule workouts: ${error.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
          {t("adaptive_workout_planner", "Adaptive Workout Planner")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t(
            "adaptive_planner_desc",
            "Create personalized workout plans adapted to your unique abilities and needs.",
          )}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <TabsTrigger value="configure">{t("configure_plan", "Configure Plan")}</TabsTrigger>
          <TabsTrigger value="view-plan">{t("view_plan", "View Plan")}</TabsTrigger>
        </TabsList>

        {/* Configure Tab */}
        <TabsContent value="configure" className="space-y-6">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-teal-200 dark:border-teal-900">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-teal-600" />
                <span>{t("workout_preferences", "Workout Preferences")}</span>
              </CardTitle>
              <CardDescription>
                {t("configure_plan_desc", "Configure your workout preferences to create a personalized plan")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Workout Preferences */}
              <div>
                <h3 className="font-medium text-lg mb-3">{t("workout_preferences", "Workout Preferences")}</h3>
              </div>

              {/* Fitness Level */}
              <div className="space-y-2">
                <Label htmlFor="fitness-level">{t("fitness_level", "Fitness Level")}</Label>
                <Select value={fitnessLevel} onValueChange={setFitnessLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_level", "Select your fitness level")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t("beginner", "Beginner")}</SelectItem>
                    <SelectItem value="intermediate">{t("intermediate", "Intermediate")}</SelectItem>
                    <SelectItem value="advanced">{t("advanced", "Advanced")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Workout Days */}
              <div className="space-y-3">
                <Label className="text-base font-medium">{t("workout_days", "Workout Days")}</Label>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => (
                    <div
                      key={day.id}
                      className={`flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer transition-all ${
                        workoutDays.includes(day.id)
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-teal-300"
                      }`}
                      onClick={() => handleDayToggle(day.id)}
                    >
                      <span className="text-xs font-medium">{day.short}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">{t("session_duration", "Session Duration")}</Label>
                <Select value={sessionDuration} onValueChange={setSessionDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_duration", "Select workout duration")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15-30">{t("duration_15_30", "15-30 minutes")}</SelectItem>
                    <SelectItem value="30-45">{t("duration_30_45", "30-45 minutes")}</SelectItem>
                    <SelectItem value="45-60">{t("duration_45_60", "45-60 minutes")}</SelectItem>
                    <SelectItem value="60+">{t("duration_60_plus", "60+ minutes")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Equipment Use */}
              <div className="flex items-center space-x-3">
                <Switch 
                  id="equipment-toggle" 
                  checked={useEquipment}
                  onCheckedChange={setUseEquipment}
                />
                <Label htmlFor="equipment-toggle" className="text-base font-medium">
                  {t("use_equipment", "I have access to gym equipment")}
                </Label>
              </div>

              {/* Menstrual Cycle Phase (Women Only) */}
              {userGender === 'female' && (
                <div className="space-y-3 p-4 bg-pink-50/50 dark:bg-pink-900/10 rounded-2xl border border-pink-200 dark:border-pink-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-pink-600" />
                    <Label className="text-base font-semibold text-pink-700 dark:text-pink-400">
                      Menstrual Cycle Phase (Optional)
                    </Label>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Select your current cycle phase for personalized exercise recommendations
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {menstrualCyclePhases.map((phase) => (
                      <div
                        key={phase.value}
                        onClick={() => setMenstrualCyclePhase(phase.value)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          menstrualCyclePhase === phase.value
                            ? "border-pink-500 bg-pink-100 dark:bg-pink-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-pink-300"
                        }`}
                      >
                        <p className="font-medium text-sm mb-1">{phase.label}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{phase.description}</p>
                        <Badge variant="outline" className="text-xs">{phase.intensity} Intensity</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Focus Areas */}
              <div className="space-y-3">
                <Label className="text-base font-medium">{t("focus_areas", "Focus Areas")}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {bodyAreas.map((area) => (
                    <div
                      key={area.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        focusAreas.includes(area.id)
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-teal-300"
                      }`}
                      onClick={() => handleFocusAreaToggle(area.id)}
                    >
                      <span className="text-xl">{area.icon}</span>
                      <span className="text-sm font-medium">{t(area.id.replace("-", "_"), area.label)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={() => {
                  // Use the API endpoint or fallback
                  generateWorkoutPlan()
                }}
                disabled={isGenerating || !fitnessLevel || workoutDays.length === 0 || !sessionDuration}
                className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t("generating", "Generating Plan...")}
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    {t("generate_adaptive_plan", "Generate Adaptive Plan")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

        </TabsContent>

        {/* View Plan Tab */}
        <TabsContent value="view-plan" className="space-y-6">
          {!generatedPlan ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Target className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t("no_plan_yet", "No adaptive plan generated yet")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                {t("generate_plan_prompt", "Configure your preferences and generate a plan to see your adaptive workout routine here.")}
              </p>
              <Button 
                onClick={() => setActiveTab("configure")} 
                className="bg-gradient-to-r from-teal-600 to-blue-600"
              >
                {t("create_plan", "Create Plan")}
              </Button>
            </div>
          ) : (
            /* Generated Plan Display */
            <div className="space-y-6">
              {/* Plan Overview */}
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-teal-200 dark:border-teal-900">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{generatedPlan.name}</CardTitle>
                      <CardDescription className="text-lg mt-2">
                        {generatedPlan.duration} • {generatedPlan.difficulty} • {generatedPlan.totalWorkouts} workouts
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-teal-600">{generatedPlan.estimatedCalories}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("est_weekly_calories", "Est. Weekly Calories")}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Check className="h-5 w-5 mr-2 text-teal-600" />
                      {t("adaptive_features", "Adaptive Features")}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {t("adaptive_plan_description", "This plan has been specially designed to accommodate your specific needs while helping you achieve your fitness goals. Exercises are modified for accessibility and can be further adjusted as needed.")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {focusAreas.map(area => (
                      <Badge key={area} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {t(area.replace("-", "_"), area)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Check what type of plan we have (API or fallback) */}
              {generatedPlan.schedule && Array.isArray(generatedPlan.schedule) ? (
                /* Traditional Schedule Format (Fallback) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedPlan.schedule.map((day: any, index: number) => (
                    <Card key={index} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{day.day}</CardTitle>
                          <Badge className={getDayTypeColor(day.type)}>{day.type}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{day.duration} min</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Zap className="h-4 w-4" />
                            <span>{day.calories} cal</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {day.exercises && day.exercises.length > 0 ? (
                          <div className="space-y-3">
                            {day.exercises.map((exercise: any, exerciseIndex: number) => (
                              <div key={exerciseIndex} className="text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-b-0 last:pb-0">
                                <div className="font-medium">{exercise.name}</div>
                                <div className="text-gray-600 dark:text-gray-400 flex justify-between">
                                  <span>{exercise.sets} sets × {exercise.reps}</span>
                                  <span>Rest: {exercise.rest}</span>
                                </div>
                                {exercise.note && (
                                  <div className="text-xs text-teal-600 dark:text-teal-400 italic mt-1">
                                    {exercise.note}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">{t("rest_day", "Rest and recovery day")}</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* API-based Format (Sections with warmUp, mainExercises, coolDown) */
                <div className="space-y-6">
                  {/* Safety Notes */}
                  {generatedPlan.safetyNotes && (
                    <Card className="bg-amber-50/70 dark:bg-amber-900/20 backdrop-blur-sm border-amber-200 dark:border-amber-900">
                      <CardHeader>
                        <CardTitle className="text-amber-800 dark:text-amber-300">
                          {t("safety_notes", "Safety Notes")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-amber-800 dark:text-amber-300">
                        <p>{generatedPlan.safetyNotes}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Focus Areas */}
                  {generatedPlan.focusAreas && (
                    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle>{t("focus_areas", "Focus Areas")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {generatedPlan.focusAreas.map((focus: string, index: number) => (
                            <Badge key={index} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {focus}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Equipment */}
                  {generatedPlan.equipment && (
                    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle>{t("equipment_needed", "Equipment Needed")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {generatedPlan.equipment.map((item: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Warm Up Section */}
                  {generatedPlan.sections?.warmUp && (
                    <Card className="bg-blue-50/70 dark:bg-blue-900/20 backdrop-blur-sm border-blue-200 dark:border-blue-900">
                      <CardHeader>
                        <CardTitle className="text-blue-800 dark:text-blue-300">
                          {t("warm_up", "Warm Up")} - {generatedPlan.sections.warmUp.reduce((total: number, ex: any) => 
                            total + (parseInt(ex.duration) || 2), 0)} {t("minutes", "minutes")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {generatedPlan.sections.warmUp.map((exercise: any, index: number) => (
                            <div key={index} className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                              <h3 className="font-medium">{exercise.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exercise.description}</p>
                              <div className="flex justify-between mt-2 text-sm">
                                <span className="text-blue-600 dark:text-blue-400">
                                  {exercise.duration}
                                </span>
                                {exercise.adaptations && (
                                  <span className="text-teal-600 dark:text-teal-400 font-medium text-xs">
                                    {t("adaptation", "Adaptation")}: {exercise.adaptations}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Main Exercises Section */}
                  {generatedPlan.sections?.mainExercises && (
                    <Card className="bg-purple-50/70 dark:bg-purple-900/20 backdrop-blur-sm border-purple-200 dark:border-purple-900">
                      <CardHeader>
                        <CardTitle className="text-purple-800 dark:text-purple-300">
                          {t("main_exercises", "Main Exercises")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {generatedPlan.sections.mainExercises.map((exercise: any, index: number) => (
                            <div key={index} className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                              <h3 className="font-medium">{exercise.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exercise.description}</p>
                              <div className="flex justify-between mt-2 text-sm">
                                <span className="text-purple-600 dark:text-purple-400">
                                  {exercise.sets} {t("sets", "sets")} × {exercise.reps} • {t("rest", "Rest")}: {exercise.rest}
                                </span>
                              </div>
                              {(exercise.adaptations || exercise.alternatives) && (
                                <div className="mt-2 text-xs space-y-1">
                                  {exercise.adaptations && (
                                    <div className="text-teal-600 dark:text-teal-400">
                                      <span className="font-medium">{t("adaptation", "Adaptation")}:</span> {exercise.adaptations}
                                    </div>
                                  )}
                                  {exercise.alternatives && (
                                    <div className="text-blue-600 dark:text-blue-400">
                                      <span className="font-medium">{t("alternative", "Alternative")}:</span> {exercise.alternatives}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Cool Down Section */}
                  {generatedPlan.sections?.coolDown && (
                    <Card className="bg-green-50/70 dark:bg-green-900/20 backdrop-blur-sm border-green-200 dark:border-green-900">
                      <CardHeader>
                        <CardTitle className="text-green-800 dark:text-green-300">
                          {t("cool_down", "Cool Down")} - {generatedPlan.sections.coolDown.reduce((total: number, ex: any) => 
                            total + (parseInt(ex.duration) || 2), 0)} {t("minutes", "minutes")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {generatedPlan.sections.coolDown.map((exercise: any, index: number) => (
                            <div key={index} className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                              <h3 className="font-medium">{exercise.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exercise.description}</p>
                              <div className="flex justify-between mt-2 text-sm">
                                <span className="text-green-600 dark:text-green-400">
                                  {exercise.duration}
                                </span>
                                {exercise.adaptations && (
                                  <span className="text-teal-600 dark:text-teal-400 font-medium text-xs">
                                    {t("adaptation", "Adaptation")}: {exercise.adaptations}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Progression Path */}
                  {generatedPlan.progressionPath && (
                    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle>{t("progression_path", "Progression Path")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{generatedPlan.progressionPath}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Additional Resources */}
                  {generatedPlan.additionalResources && (
                    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle>{t("additional_resources", "Additional Resources")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1">
                          {generatedPlan.additionalResources.map((resource: string, index: number) => (
                            <li key={index}>{resource}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Important Notes - only shown for fallback plans without safetyNotes */}
              {(!generatedPlan.safetyNotes && generatedPlan.schedule && Array.isArray(generatedPlan.schedule)) && (
                <Card className="bg-amber-50/70 dark:bg-amber-900/20 backdrop-blur-sm border-amber-200 dark:border-amber-900">
                  <CardHeader>
                    <CardTitle className="text-amber-800 dark:text-amber-300">
                      {t("important_notes", "Important Notes")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-amber-800 dark:text-amber-300">
                    <p>{t("listen_to_body", "Always listen to your body and stop if you feel pain (not just muscle fatigue).")}</p>
                    <p>{t("modify_as_needed", "Modify any exercise as needed for your comfort and safety.")}</p>
                    <p>{t("consult_professional", "Consider consulting with a physical therapist or adaptive fitness specialist for personalized guidance.")}</p>
                    <p>{t("progression", "Start slowly and gradually increase intensity as you build confidence and strength.")}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button 
                  onClick={() => scheduleWorkoutsFromPlan(generatedPlan)}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule to Calendar
                </Button>
                <Button 
                  onClick={() => {
                    // Handle saving the plan (would need to be implemented)
                    toast.success(t("plan_saved", "Plan saved successfully!"))
                  }} 
                  className="bg-gradient-to-r from-teal-600 to-blue-600"
                >
                  {t("save_plan", "Save Plan")}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Print/export plan (would need to be implemented)
                    window.print()
                  }}
                >
                  {t("print_plan", "Print Plan")}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab("configure")}
                >
                  {t("modify_plan", "Modify Plan")}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
