"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useWorkout } from "../contexts/WorkoutContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Target, Zap, Plus, Edit, Play, CheckCircle, Save, Trash2 } from "lucide-react"
import PostureChecker from "./PostureChecker"

export default function WorkoutPlanner() {
  const { t } = useTranslation()
  const { 
    savedPlans, 
    setSavedPlans, 
    savePlan: contextSavePlan, 
    deletePlan: contextDeletePlan, 
    startPlan: contextStartPlan 
  } = useWorkout()
  
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [fitnessLevel, setFitnessLevel] = useState("")
  const [workoutDays, setWorkoutDays] = useState<string[]>([])
  const [sessionDuration, setSessionDuration] = useState("")
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
  const [showPostureChecker, setShowPostureChecker] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [activeTab, setActiveTab] = useState("create")
  const [isCustomizing, setIsCustomizing] = useState(false)

  // Remove the local localStorage effects since they're handled in context

  const fitnessGoals = [
    { id: "weight-loss", label: "Weight Loss", icon: "🔥" },
    { id: "muscle-gain", label: "Muscle Gain", icon: "💪" },
    { id: "endurance", label: "Endurance", icon: "🏃" },
    { id: "strength", label: "Strength", icon: "🏋️" },
    { id: "flexibility", label: "Flexibility", icon: "🧘" },
    { id: "general-fitness", label: "General Fitness", icon: "⚡" },
  ]

  const weekDays = [
    { id: "monday", label: "Monday", short: "Mon" },
    { id: "tuesday", label: "Tuesday", short: "Tue" },
    { id: "wednesday", label: "Wednesday", short: "Wed" },
    { id: "thursday", label: "Thursday", short: "Thu" },
    { id: "friday", label: "Friday", short: "Fri" },
    { id: "saturday", label: "Saturday", short: "Sat" },
    { id: "sunday", label: "Sunday", short: "Sun" },
  ]

  const sampleWorkoutPlan = {
    name: "7-Day Balanced Fitness Plan",
    duration: "1 week",
    difficulty: "Intermediate",
    totalWorkouts: 5,
    estimatedCalories: 2100,
    schedule: [
      {
        day: "Monday",
        type: "Upper Body Strength",
        duration: 45,
        exercises: [
          { name: "Push-ups", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Pull-ups/Lat Pulldown", sets: 3, reps: "8-12", rest: "90s" },
          { name: "Shoulder Press", sets: 3, reps: "10-12", rest: "60s" },
          { name: "Bicep Curls", sets: 3, reps: "12-15", rest: "45s" },
          { name: "Tricep Dips", sets: 3, reps: "10-12", rest: "45s" },
        ],
        calories: 320,
      },
      {
        day: "Tuesday",
        type: "Cardio & Core",
        duration: 30,
        exercises: [
          { name: "Warm-up Jog", sets: 1, reps: "5 min", rest: "0s" },
          { name: "High-Intensity Intervals", sets: 6, reps: "30s on/30s off", rest: "30s" },
          { name: "Plank", sets: 3, reps: "45-60s", rest: "30s" },
          { name: "Mountain Climbers", sets: 3, reps: "20 each leg", rest: "30s" },
          { name: "Cool-down Walk", sets: 1, reps: "5 min", rest: "0s" },
        ],
        calories: 280,
      },
      {
        day: "Wednesday",
        type: "Rest Day",
        duration: 0,
        exercises: [
          { name: "Light Stretching", sets: 1, reps: "15-20 min", rest: "0s" },
          { name: "Meditation", sets: 1, reps: "10 min", rest: "0s" },
        ],
        calories: 50,
      },
      {
        day: "Thursday",
        type: "Lower Body Strength",
        duration: 45,
        exercises: [
          { name: "Squats", sets: 3, reps: "12-15", rest: "90s" },
          { name: "Deadlifts", sets: 3, reps: "8-10", rest: "120s" },
          { name: "Lunges", sets: 3, reps: "12 each leg", rest: "60s" },
          { name: "Calf Raises", sets: 3, reps: "15-20", rest: "45s" },
          { name: "Glute Bridges", sets: 3, reps: "15-20", rest: "45s" },
        ],
        calories: 350,
      },
      {
        day: "Friday",
        type: "Full Body Circuit",
        duration: 40,
        exercises: [
          { name: "Burpees", sets: 3, reps: "8-10", rest: "60s" },
          { name: "Kettlebell Swings", sets: 3, reps: "15-20", rest: "60s" },
          { name: "Jump Squats", sets: 3, reps: "12-15", rest: "45s" },
          { name: "Push-up to T", sets: 3, reps: "10-12", rest: "60s" },
          { name: "Plank Jacks", sets: 3, reps: "15-20", rest: "45s" },
        ],
        calories: 380,
      },
      {
        day: "Saturday",
        type: "Active Recovery",
        duration: 30,
        exercises: [
          { name: "Yoga Flow", sets: 1, reps: "20 min", rest: "0s" },
          { name: "Light Walking", sets: 1, reps: "10 min", rest: "0s" },
        ],
        calories: 120,
      },
      {
        day: "Sunday",
        type: "Rest Day",
        duration: 0,
        exercises: [],
        calories: 0,
      },
    ],
  }

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) => (prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]))
  }

  const handleDayToggle = (dayId: string) => {
    setWorkoutDays((prev) => (prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]))
  }

  const generateWorkoutPlan = async () => {
    setIsGenerating(true)

    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Generate plan based on user selections
    const customPlan = createCustomWorkoutPlan()
    setGeneratedPlan(customPlan)
    setIsGenerating(false)
    
    // Reset customization state after generating new plan
    setIsCustomizing(false)
  }

  const createCustomWorkoutPlan = () => {
    const planName = generatePlanName()
    const workoutTypes = getWorkoutTypesForGoals()
    const schedule = generateSchedule()
    
    return {
      id: Date.now(),
      name: planName,
      duration: `${workoutDays.length} days/week`,
      difficulty: fitnessLevel,
      totalWorkouts: workoutDays.length,
      estimatedCalories: calculateEstimatedCalories(),
      goals: selectedGoals,
      schedule: schedule,
      createdAt: new Date().toISOString(),
      status: 'active'
    }
  }

  const generatePlanName = () => {
    const goalNames = selectedGoals.map(goal => {
      switch(goal) {
        case 'weight-loss': return 'Fat Loss'
        case 'muscle-gain': return 'Muscle Building'
        case 'endurance': return 'Endurance'
        case 'strength': return 'Strength'
        case 'flexibility': return 'Flexibility'
        case 'general-fitness': return 'Fitness'
        default: return 'Custom'
      }
    })
    return `${goalNames.join(' & ')} ${fitnessLevel} Plan`
  }

  const getWorkoutTypesForGoals = () => {
    const types = []
    if (selectedGoals.includes('weight-loss')) {
      types.push('Cardio', 'HIIT', 'Core', 'Functional')
    }
    if (selectedGoals.includes('muscle-gain')) {
      types.push('Strength Training', 'Upper Body', 'Lower Body', 'Full Body')
    }
    if (selectedGoals.includes('endurance')) {
      types.push('Cardio', 'Functional', 'Full Body')
    }
    if (selectedGoals.includes('strength')) {
      types.push('Strength Training', 'Upper Body', 'Lower Body', 'Functional')
    }
    if (selectedGoals.includes('flexibility')) {
      types.push('Yoga', 'Flexibility', 'Core')
    }
    if (selectedGoals.includes('general-fitness')) {
      types.push('Full Body', 'Cardio', 'Core', 'Flexibility')
    }
    
    // Remove duplicates and ensure variety
    const uniqueTypes = [...new Set(types)]
    return uniqueTypes.length > 0 ? uniqueTypes : ['Full Body', 'Cardio']
  }

  const generateSchedule = () => {
    const workoutTypes = getWorkoutTypesForGoals()
    const exercises = getExercisesForGoals()
    const selectedDays = weekDays.filter(day => workoutDays.includes(day.id))
    
    // Ensure variety by rotating through workout types
    const schedule = selectedDays.map((day, index) => {
      const workoutType = workoutTypes[index % workoutTypes.length]
      const dayExercises = (exercises as any)[workoutType] || (exercises as any)['Full Body']
      const duration = getDurationFromSelection()
      
      // Add variety within the same workout type by shuffling exercises
      const shuffledExercises = [...dayExercises].sort(() => Math.random() - 0.5)
      const selectedExercises = shuffledExercises.slice(0, Math.min(6, dayExercises.length))
      
      return {
        day: day.label,
        type: workoutType,
        duration: duration,
        exercises: selectedExercises,
        calories: Math.floor(duration * (fitnessLevel === 'beginner' ? 6 : fitnessLevel === 'intermediate' ? 8 : 10))
      }
    })
    
    // If user has multiple days, ensure we use different workout types
    if (selectedDays.length > 1 && workoutTypes.length > 1) {
      const typeUsageCount = new Map()
      
      schedule.forEach((day, index) => {
        const currentType = day.type
        const count = typeUsageCount.get(currentType) || 0
        typeUsageCount.set(currentType, count + 1)
        
        // If this type is overused, try to find an alternative
        if (count > 0 && workoutTypes.length > index + 1) {
          const unusedTypes = workoutTypes.filter(type => 
            !schedule.slice(0, index).some(d => d.type === type)
          )
          if (unusedTypes.length > 0) {
            const newType = unusedTypes[0]
            const newExercises = (exercises as any)[newType] || (exercises as any)['Full Body']
            const shuffledNewExercises = [...newExercises].sort(() => Math.random() - 0.5)
            
            day.type = newType
            day.exercises = shuffledNewExercises.slice(0, Math.min(6, newExercises.length))
          }
        }
      })
    }
    
    return schedule
  }

  const getDurationFromSelection = () => {
    switch(sessionDuration) {
      case '15-30': return 25
      case '30-45': return 40
      case '45-60': return 55
      case '60+': return 70
      default: return 45
    }
  }

  const getExercisesForGoals = () => {
    const baseReps = fitnessLevel === 'beginner' ? '8-10' : fitnessLevel === 'intermediate' ? '10-12' : '12-15'
    const heavyReps = fitnessLevel === 'beginner' ? '5-6' : fitnessLevel === 'intermediate' ? '6-8' : '8-10'
    
    return {
      'Cardio': [
        { name: t("treadmill", "Treadmill Running"), sets: 1, reps: "20-30 min", rest: "0s" },
        { name: t("elliptical_machine", "Elliptical Machine"), sets: 1, reps: "15-25 min", rest: "0s" },
        { name: t("stationary_bike", "Stationary Bike"), sets: 1, reps: "20-30 min", rest: "0s" },
        { name: t("rowing_machine", "Rowing Machine"), sets: 1, reps: "15-20 min", rest: "0s" },
        { name: t("stair_climber", "Stair Climber"), sets: 1, reps: "10-15 min", rest: "0s" },
      ],
      'HIIT': [
        { name: t("battle_ropes", "Battle Ropes"), sets: 4, reps: "30s", rest: "30s" },
        { name: t("box_jumps", "Box Jumps"), sets: 4, reps: baseReps, rest: "60s" },
        { name: t("kettlebell_swings", "Kettlebell Swings"), sets: 4, reps: "15-20", rest: "45s" },
        { name: t("medicine_ball_slams", "Medicine Ball Slams"), sets: 4, reps: baseReps, rest: "45s" },
        { name: t("burpees", "Burpees"), sets: 3, reps: baseReps, rest: "60s" },
        { name: t("high_knees", "High Knees"), sets: 3, reps: "30s", rest: "30s" },
      ],
      'Strength Training': [
        { name: t("barbell_squats", "Barbell Squats"), sets: 4, reps: heavyReps, rest: "2-3 min" },
        { name: t("deadlifts", "Deadlifts"), sets: 4, reps: heavyReps, rest: "3 min" },
        { name: t("bench_press", "Bench Press"), sets: 4, reps: heavyReps, rest: "2-3 min" },
        { name: t("lat_pulldown", "Lat Pulldown Machine"), sets: 3, reps: baseReps, rest: "90s" },
        { name: t("leg_press", "Leg Press Machine"), sets: 3, reps: baseReps, rest: "90s" },
        { name: t("shoulder_press_machine", "Shoulder Press Machine"), sets: 3, reps: baseReps, rest: "90s" },
      ],
      'Upper Body': [
        { name: t("chest_press_machine", "Chest Press Machine"), sets: 3, reps: baseReps, rest: "90s" },
        { name: t("cable_rows", "Cable Rows"), sets: 3, reps: baseReps, rest: "90s" },
        { name: t("lat_pulldown", "Lat Pulldown"), sets: 3, reps: baseReps, rest: "90s" },
        { name: t("tricep_dips_machine", "Tricep Dips Machine"), sets: 3, reps: baseReps, rest: "60s" },
        { name: t("bicep_curl_machine", "Bicep Curl Machine"), sets: 3, reps: baseReps, rest: "60s" },
        { name: t("pec_fly_machine", "Pec Fly Machine"), sets: 3, reps: baseReps, rest: "60s" },
      ],
      'Lower Body': [
        { name: t("leg_press", "Leg Press Machine"), sets: 4, reps: baseReps, rest: "2 min" },
        { name: t("leg_extension", "Leg Extension Machine"), sets: 3, reps: baseReps, rest: "90s" },
        { name: t("leg_curl", "Leg Curl Machine"), sets: 3, reps: baseReps, rest: "90s" },
        { name: t("calf_raise_machine", "Calf Raise Machine"), sets: 3, reps: "15-20", rest: "60s" },
        { name: t("hip_abductor", "Hip Abductor Machine"), sets: 3, reps: baseReps, rest: "60s" },
        { name: t("smith_machine_squats", "Smith Machine Squats"), sets: 4, reps: baseReps, rest: "2 min" },
      ],
      'Yoga': [
        { name: t("sun_salutation", "Sun Salutation (Surya Namaskara)"), sets: 1, reps: "5 rounds", rest: "30s" },
        { name: t("warrior_pose", "Warrior I & II Poses"), sets: 1, reps: "Hold 1 min each side", rest: "30s" },
        { name: t("tree_pose", "Tree Pose (Vrikshasana)"), sets: 1, reps: "Hold 1 min each leg", rest: "30s" },
        { name: t("downward_dog", "Downward Facing Dog"), sets: 1, reps: "Hold 2 min", rest: "30s" },
        { name: t("cobra_pose", "Cobra Pose (Bhujangasana)"), sets: 1, reps: "Hold 30s x3", rest: "15s" },
        { name: t("child_pose", "Child's Pose (Balasana)"), sets: 1, reps: "Hold 2 min", rest: "0s" },
        { name: t("triangle_pose", "Triangle Pose (Trikonasana)"), sets: 1, reps: "Hold 1 min each side", rest: "30s" },
      ],
      'Flexibility': [
        { name: t("seated_forward_bend", "Seated Forward Bend"), sets: 1, reps: "Hold 2 min", rest: "30s" },
        { name: t("spinal_twist", "Seated Spinal Twist"), sets: 1, reps: "Hold 1 min each side", rest: "30s" },
        { name: t("hip_flexor_stretch", "Hip Flexor Stretch"), sets: 1, reps: "Hold 1 min each leg", rest: "30s" },
        { name: t("hamstring_stretch", "Hamstring Stretch"), sets: 1, reps: "Hold 1 min each leg", rest: "30s" },
        { name: t("shoulder_stretch", "Shoulder Cross-Body Stretch"), sets: 1, reps: "Hold 30s each arm", rest: "15s" },
        { name: t("neck_rolls", "Gentle Neck Rolls"), sets: 1, reps: "10 each direction", rest: "0s" },
      ],
      'Core': [
        { name: t("cable_crunches", "Cable Crunches"), sets: 3, reps: "15-20", rest: "60s" },
        { name: t("hanging_leg_raises", "Hanging Leg Raises"), sets: 3, reps: baseReps, rest: "90s" },
        { name: t("ab_machine", "Ab Crunch Machine"), sets: 3, reps: "15-20", rest: "60s" },
        { name: t("russian_twists", "Russian Twists with Weight"), sets: 3, reps: "20 each side", rest: "60s" },
        { name: t("plank_variations", "Plank Variations"), sets: 3, reps: "45-60s", rest: "30s" },
        { name: t("wood_choppers", "Cable Wood Choppers"), sets: 3, reps: "12 each side", rest: "60s" },
      ],
      'Functional': [
        { name: t("farmers_walk", "Farmer's Walk"), sets: 3, reps: "40-60 steps", rest: "90s" },
        { name: t("tire_flips", "Tire Flips"), sets: 3, reps: "8-10", rest: "2 min" },
        { name: t("sled_push", "Sled Push/Pull"), sets: 4, reps: "20-30m", rest: "90s" },
        { name: t("sandbag_carries", "Sandbag Carries"), sets: 3, reps: "30-50m", rest: "90s" },
        { name: t("atlas_stones", "Atlas Stone Lifts"), sets: 3, reps: "5-8", rest: "2 min" },
        { name: t("prowler_push", "Prowler Push"), sets: 4, reps: "15-25m", rest: "90s" },
      ],
      'Full Body': [
        { name: t("deadlifts", "Deadlifts"), sets: 3, reps: heavyReps, rest: "2-3 min" },
        { name: t("squat_to_press", "Squat to Overhead Press"), sets: 3, reps: baseReps, rest: "90s" },
        { name: t("clean_and_press", "Clean and Press"), sets: 3, reps: "6-8", rest: "2 min" },
        { name: t("thrusters", "Thrusters"), sets: 3, reps: baseReps, rest: "90s" },
        { name: t("renegade_rows", "Renegade Rows"), sets: 3, reps: baseReps, rest: "90s" },
        { name: t("turkish_getups", "Turkish Get-ups"), sets: 2, reps: "5 each side", rest: "2 min" },
      ]
    }
  }

  const calculateEstimatedCalories = () => {
    const daysPerWeek = workoutDays.length
    const duration = getDurationFromSelection()
    const multiplier = fitnessLevel === 'beginner' ? 6 : fitnessLevel === 'intermediate' ? 8 : 10
    return daysPerWeek * duration * multiplier
  }

  const customizePlan = (plan: any) => {
    // Set customization mode
    setIsCustomizing(true)
    
    // Pre-fill the form with current plan settings
    if (plan.goals && plan.goals.length > 0) {
      setSelectedGoals(plan.goals)
    } else {
      // Infer goals from plan content if not explicitly set
      const inferredGoals = []
      if (plan.schedule?.some((day: any) => day.type?.includes('Strength'))) {
        inferredGoals.push('strength')
      }
      if (plan.schedule?.some((day: any) => day.type?.includes('Cardio'))) {
        inferredGoals.push('endurance')
      }
      if (plan.schedule?.some((day: any) => day.type?.includes('Yoga'))) {
        inferredGoals.push('flexibility')
      }
      setSelectedGoals(inferredGoals.length > 0 ? inferredGoals : ['general-fitness'])
    }
    
    // Set fitness level
    setFitnessLevel(plan.difficulty?.toLowerCase() || "intermediate")
    
    // Set workout days based on plan schedule
    if (plan.schedule && plan.schedule.length > 0) {
      const planDays = plan.schedule
        .filter((day: any) => day.type !== 'Rest Day')
        .map((day: any) => {
          const dayName = day.day.toLowerCase()
          return weekDays.find(d => d.label.toLowerCase() === dayName)?.id
        })
        .filter(Boolean)
      setWorkoutDays(planDays)
    }
    
    // Set session duration based on average workout duration
    if (plan.schedule && plan.schedule.length > 0) {
      const avgDuration = plan.schedule.reduce((sum: number, day: any) => sum + (day.duration || 0), 0) / plan.schedule.length
      if (avgDuration <= 30) {
        setSessionDuration("30")
      } else if (avgDuration <= 45) {
        setSessionDuration("45")
      } else {
        setSessionDuration("60")
      }
    }
    
    // Keep the current plan for reference
    setGeneratedPlan(plan)
    
    // Switch to create tab for editing
    setActiveTab("create")
    
    // Force a re-render by clearing and setting the generated plan
    setTimeout(() => {
      setGeneratedPlan(null)
      setTimeout(() => {
        setGeneratedPlan(plan)
      }, 10)
    }, 10)
  }

  const savePlan = (plan: any) => {
    const savedPlan = { 
      ...plan, 
      id: Date.now().toString(), // Add unique ID
      status: 'saved', 
      savedAt: new Date().toISOString(),
      goals: selectedGoals,
      originalFitnessLevel: fitnessLevel,
      createdFrom: isCustomizing ? 'customized' : 'generated'
    }
    
    // Use context function
    contextSavePlan(savedPlan)
    setActiveTab("my-plans")
    
    // Reset customization state
    setIsCustomizing(false)
    
    // Show success message
    alert(t("plan_saved", "Plan saved successfully!"))
  }

  const deletePlan = (planId: string) => {
    contextDeletePlan(planId)
  }

  const startPlan = (plan: any) => {
    setIsStarting(true)
    
    // Use context function
    contextStartPlan(plan)
    
    setTimeout(() => {
      setIsStarting(false)
      // Show success message or redirect to tracking
      alert(t("plan_started", "Plan started successfully! You can track your progress in the tracker."))
    }, 1000)
  }

  const getDayTypeColor = (type: string) => {
    if (type.includes("Strength")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    if (type.includes("Cardio")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (type.includes("Rest")) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    if (type.includes("Recovery")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  }

  if (showPostureChecker) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("posture_analysis", "Posture Analysis")}</h2>
          <Button onClick={() => setShowPostureChecker(false)} variant="outline">
            {t("back_to_planner", "Back to Planner")}
          </Button>
        </div>
        <PostureChecker />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          {t("ai_workout_planner", "AI Workout Planner")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t(
            "planner_desc",
            "Get personalized workout plans tailored to your goals, fitness level, and schedule using AI.",
          )}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <TabsTrigger value="create">{t("create_plan", "Create Plan")}</TabsTrigger>
          <TabsTrigger value="my-plans">{t("my_plans", "My Plans")}</TabsTrigger>
        </TabsList>

        {/* Create Plan Tab */}
        <TabsContent value="create" className="space-y-6">
          {!generatedPlan ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plan Configuration */}
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-orange-200 dark:border-orange-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    <span>{t("plan_configuration", "Plan Configuration")}</span>
                  </CardTitle>
                  <CardDescription>
                    {t("config_desc", "Tell us about your fitness goals and preferences")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Fitness Goals */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">{t("fitness_goals", "Fitness Goals")}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {fitnessGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedGoals.includes(goal.id)
                              ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
                          }`}
                          onClick={() => handleGoalToggle(goal.id)}
                        >
                          <span className="text-xl">{goal.icon}</span>
                          <span className="text-sm font-medium">{t(goal.id.replace("-", "_"), goal.label)}</span>
                        </div>
                      ))}
                    </div>
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
                              ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
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

                  <Button
                    onClick={generateWorkoutPlan}
                    disabled={isGenerating || selectedGoals.length === 0 || !fitnessLevel || workoutDays.length === 0}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t("generating", "Generating Plan...")}
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        {isCustomizing 
                          ? t("regenerate_plan", "Regenerate Customized Plan") 
                          : t("generate_plan", "Generate AI Plan")}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview/Tips */}
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-orange-200 dark:border-orange-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <span>{t("ai_recommendations", "AI Recommendations")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        {t("personalization", "Personalization")}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {t(
                          "personalization_desc",
                          "Our AI analyzes your goals, fitness level, and schedule to create a plan that's perfect for you.",
                        )}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                        {t("progressive", "Progressive Training")}
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {t(
                          "progressive_desc",
                          "Plans automatically adjust difficulty and intensity as you progress and get stronger.",
                        )}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                        {t("form_analysis", "Form Analysis")}
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {t("form_desc", "Use our AI posture checker to ensure proper form and prevent injuries.")}
                      </p>
                      <Button
                        onClick={() => setShowPostureChecker(true)}
                        size="sm"
                        className="mt-2 bg-gradient-to-r from-blue-600 to-green-600"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        {t("try_posture_checker", "Try Posture Checker")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Generated Plan Display */
            <div className="space-y-6">
              {/* Plan Overview */}
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-orange-200 dark:border-orange-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{generatedPlan.name}</CardTitle>
                      <CardDescription className="text-lg mt-2">
                        {generatedPlan.duration} • {generatedPlan.difficulty} • {generatedPlan.totalWorkouts} workouts
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">{generatedPlan.estimatedCalories}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("total_calories", "Total Calories")}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <Button 
                      onClick={() => startPlan(generatedPlan)}
                      disabled={isStarting}
                      className="bg-gradient-to-r from-orange-600 to-red-600"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isStarting ? t("starting", "Starting...") : t("start_plan", "Start Plan")}
                    </Button>
                    <Button 
                      onClick={() => customizePlan(generatedPlan)}
                      variant="outline"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t("customize", "Customize")}
                    </Button>
                    <Button 
                      onClick={() => savePlan(generatedPlan)}
                      variant="outline"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {t("save_plan", "Save Plan")}
                    </Button>
                    <Button onClick={() => setShowPostureChecker(true)} variant="outline">
                      <Target className="h-4 w-4 mr-2" />
                      {t("check_form", "Check Form")}
                    </Button>
                    <Button onClick={() => setGeneratedPlan(null)} variant="outline">
                      {t("create_new", "Create New")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      {day.exercises.length > 0 ? (
                        <div className="space-y-2">
                          {day.exercises.slice(0, 3).map((exercise: any, exerciseIndex: number) => (
                            <div key={exerciseIndex} className="text-sm">
                              <div className="font-medium">{exercise.name}</div>
                              <div className="text-gray-600 dark:text-gray-400">
                                {exercise.sets} sets × {exercise.reps}
                              </div>
                            </div>
                          ))}
                          {day.exercises.length > 3 && (
                            <div className="text-sm text-gray-500">+{day.exercises.length - 3} more exercises</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">{t("rest_day", "Rest and recovery day")}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* My Plans Tab */}
        <TabsContent value="my-plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Display saved plans */}
            {savedPlans.map((plan) => (
              <Card key={plan.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-orange-200 dark:border-orange-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge className={plan.status === 'active' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                      {plan.status === 'active' ? t("active", "Active") : t("saved", "Saved")}
                    </Badge>
                  </div>
                  <CardDescription>{plan.duration} • {t(plan.difficulty, plan.difficulty)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t("goals", "Goals")}:</span>
                      <span className="font-medium">{plan.goals?.map((g: string) => t(g.replace('-', '_'), g)).join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("total_workouts", "Total workouts")}:</span>
                      <span className="font-medium">{plan.totalWorkouts}/week</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("estimated_calories", "Est. calories")}:</span>
                      <span className="font-medium">{plan.estimatedCalories}/week</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    {plan.status === 'active' ? (
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-to-r from-orange-600 to-red-600"
                        onClick={() => alert(t("continue_plan", "Continue with your active plan!"))}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {t("continue", "Continue")}
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-to-r from-orange-600 to-red-600"
                        onClick={() => startPlan(plan)}
                        disabled={isStarting}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {isStarting ? t("starting", "Starting...") : t("start_plan", "Start Plan")}
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => customizePlan(plan)}
                      className="border-orange-200 hover:bg-orange-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        if (confirm(t("delete_plan_confirm", "Are you sure you want to delete this plan?"))) {
                          deletePlan(plan.id)
                        }
                      }}
                      className="border-red-200 hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Create New Plan Card */}
            <Card className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-dashed border-orange-300 dark:border-orange-700">
              <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Plus className="h-12 w-12 text-orange-600 mb-4" />
                <h3 className="font-medium text-lg mb-2">{t("create_new_plan", "Create New Plan")}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t("create_plan_desc", "Generate a personalized workout plan with AI")}
                </p>
                <Button 
                  onClick={() => {
                    setGeneratedPlan(null)
                    setActiveTab("create")
                  }} 
                  className="bg-gradient-to-r from-orange-600 to-red-600"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {t("get_started", "Get Started")}
                </Button>
              </CardContent>
            </Card>

            {/* Empty state when no plans */}
            {savedPlans.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t("no_plans_yet", "No workout plans yet")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t("create_first_plan", "Create your first personalized workout plan to get started")}
                </p>
                <Button 
                  onClick={() => {
                    setGeneratedPlan(null)
                    setActiveTab("create")
                  }}
                  className="bg-gradient-to-r from-orange-600 to-red-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("create_plan", "Create Plan")}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
