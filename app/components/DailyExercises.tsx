"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Clock, Target, Zap, Play, RotateCcw, CheckCircle, Timer, Camera } from "lucide-react"
import PostureChecker from "./PostureChecker"

interface Exercise {
  name: string
  duration: number
  rest: number
  instructions: string
  tips: string
  muscles: string[]
  equipment?: string
}

interface Workout {
  id: number
  name: string
  type: string
  duration: number
  difficulty: string
  calories: number
  equipment?: string
  exercises: Exercise[]
  completed: boolean
}

export default function DailyExercises() {
  const { t } = useTranslation()
  const [currentExercise, setCurrentExercise] = useState(0)
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [workoutTimer, setWorkoutTimer] = useState(0)
  const [exerciseTimer, setExerciseTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [completedExercises, setCompletedExercises] = useState<number[]>([])
  const [showPostureChecker, setShowPostureChecker] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)

  // Generate different workouts based on day of week for variety
  const getDayOfWeek = () => new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
  const currentDay = getDayOfWeek()
  
  const todaysWorkouts = [
    // Morning Workout - varies by day
    currentDay % 2 === 0 ? {
      id: 1,
      name: t("gym_power_session"),
      type: t("strength"),
      duration: 35,
      difficulty: t("intermediate"),
      calories: 280,
      equipment: t("gym_required"),
      exercises: [
        {
          name: t("treadmill_warmup"),
          duration: 300, // 5 minutes
          rest: 60,
          instructions: t("treadmill_warmup_instructions"),
          tips: t("treadmill_warmup_tips"),
          muscles: [t("cardiovascular"), t("legs")],
          equipment: t("treadmill"),
        },
        {
          name: t("bench_press"),
          duration: 180, // 3 minutes (3 sets)
          rest: 90,
          instructions: t("bench_press_instructions"),
          tips: t("bench_press_tips"),
          muscles: [t("chest"), t("shoulders"), t("triceps")],
          equipment: t("bench_barbell"),
        },
        {
          name: t("lat_pulldown_machine"),
          duration: 180,
          rest: 90,
          instructions: t("lat_pulldown_instructions"),
          tips: t("lat_pulldown_tips"),
          muscles: [t("lats"), t("biceps"), t("rear_delts")],
          equipment: t("lat_pulldown"),
        },
        {
          name: t("leg_press_machine"),
          duration: 180,
          rest: 90,
          instructions: t("leg_press_instructions"),
          tips: t("leg_press_tips"),
          muscles: [t("quadriceps"), t("glutes"), t("hamstrings")],
          equipment: t("leg_press"),
        },
        {
          name: t("cable_rows"),
          duration: 180,
          rest: 60,
          instructions: t("cable_rows_instructions"),
          tips: t("cable_rows_tips"),
          muscles: [t("mid_traps"), t("rhomboids"), t("biceps")],
          equipment: t("cable_machine"),
        },
        {
          name: t("plank_hold"),
          duration: 60,
          rest: 0,
          instructions: t("plank_instructions"),
          tips: t("plank_tips"),
          muscles: [t("core"), t("shoulders")],
          equipment: t("none"),
        },
      ],
      completed: false,
    } : {
      id: 1,
      name: t("cardio_blast"),
      type: t("cardio"),
      duration: 30,
      difficulty: t("beginner"),
      calories: 220,
      equipment: t("gym_required"),
      exercises: [
        {
          name: t("elliptical_warmup"),
          duration: 300,
          rest: 30,
          instructions: t("elliptical_warmup_instructions"),
          tips: t("elliptical_warmup_tips"),
          muscles: [t("cardiovascular"), t("full_body")],
          equipment: t("elliptical"),
        },
        {
          name: t("stationary_bike"),
          duration: 600, // 10 minutes
          rest: 120,
          instructions: t("stationary_bike_instructions"),
          tips: t("stationary_bike_tips"),
          muscles: [t("cardiovascular"), t("legs")],
          equipment: t("exercise_bike"),
        },
        {
          name: t("rowing_machine"),
          duration: 360, // 6 minutes
          rest: 90,
          instructions: t("rowing_machine_instructions"),
          tips: t("rowing_machine_tips"),
          muscles: [t("full_body"), t("cardio")],
          equipment: t("rowing_machine"),
        },
        {
          name: t("treadmill_intervals"),
          duration: 480, // 8 minutes
          rest: 60,
          instructions: t("treadmill_intervals_instructions"),
          tips: t("treadmill_intervals_tips"),
          muscles: [t("cardiovascular"), t("legs")],
          equipment: t("treadmill"),
        },
        {
          name: t("stretching_cooldown"),
          duration: 180,
          rest: 0,
          instructions: t("stretching_cooldown_instructions"),
          tips: t("stretching_cooldown_tips"),
          muscles: [t("flexibility"), t("recovery")],
          equipment: t("none"),
        },
      ],
      completed: false,
    },

    // Yoga/Flexibility Workout
    {
      id: 2,
      name: t("morning_yoga_flow"),
      type: t("yoga"),
      duration: 25,
      difficulty: t("beginner"),
      calories: 150,
      equipment: t("yoga_mat"),
      exercises: [
        {
          name: t("mountain_pose"),
          duration: 60,
          rest: 10,
          instructions: t("mountain_pose_instructions"),
          tips: t("mountain_pose_tips"),
          muscles: [t("core"), t("posture")],
          equipment: t("yoga_mat"),
        },
        {
          name: t("downward_dog_pose"),
          duration: 90,
          rest: 15,
          instructions: t("downward_dog_instructions"),
          tips: t("downward_dog_tips"),
          muscles: [t("shoulders"), t("hamstrings"), t("calves")],
          equipment: t("yoga_mat"),
        },
        {
          name: t("warrior_pose"),
          duration: 120, // 60 seconds each side
          rest: 20,
          instructions: t("warrior_pose_instructions"),
          tips: t("warrior_pose_tips"),
          muscles: [t("legs"), t("core"), t("balance")],
          equipment: t("yoga_mat"),
        },
        {
          name: t("tree_pose"),
          duration: 90,
          rest: 15,
          instructions: t("tree_pose_instructions"),
          tips: t("tree_pose_tips"),
          muscles: [t("balance"), t("core"), t("legs")],
          equipment: t("yoga_mat"),
        },
        {
          name: t("cobra_pose"),
          duration: 60,
          rest: 15,
          instructions: t("cobra_pose_instructions"),
          tips: t("cobra_pose_tips"),
          muscles: [t("back"), t("chest"), t("shoulders")],
          equipment: t("yoga_mat"),
        },
        {
          name: t("child_pose"),
          duration: 90,
          rest: 10,
          instructions: t("child_pose_instructions"),
          tips: t("child_pose_tips"),
          muscles: [t("back"), t("shoulders"), t("relaxation")],
          equipment: t("yoga_mat"),
        },
        {
          name: t("sun_salutation"),
          duration: 180,
          rest: 0,
          instructions: t("sun_salutation_instructions"),
          tips: t("sun_salutation_tips"),
          muscles: [t("full_body"), t("flexibility")],
          equipment: t("yoga_mat"),
        },
      ],
      completed: false,
    },

    // Functional/Bodyweight Workout
    currentDay % 3 === 0 ? {
      id: 3,
      name: t("functional_fitness"),
      type: t("functional"),
      duration: 20,
      difficulty: t("intermediate"),
      calories: 180,
      equipment: t("minimal_equipment"),
      exercises: [
        {
          name: t("jump_rope"),
          duration: 120,
          rest: 30,
          instructions: t("jump_rope_instructions"),
          tips: t("jump_rope_tips"),
          muscles: [t("cardio"), t("coordination"), t("calves")],
          equipment: t("jump_rope"),
        },
        {
          name: t("kettlebell_swings"),
          duration: 90,
          rest: 60,
          instructions: t("kettlebell_swings_instructions"),
          tips: t("kettlebell_swings_tips"),
          muscles: [t("glutes"), t("hamstrings"), t("core")],
          equipment: t("kettlebell"),
        },
        {
          name: t("medicine_ball_slams"),
          duration: 60,
          rest: 45,
          instructions: t("medicine_ball_slams_instructions"),
          tips: t("medicine_ball_slams_tips"),
          muscles: [t("core"), t("shoulders"), t("cardio")],
          equipment: t("medicine_ball"),
        },
        {
          name: t("battle_ropes"),
          duration: 45,
          rest: 60,
          instructions: t("battle_ropes_instructions"),
          tips: t("battle_ropes_tips"),
          muscles: [t("full_body"), t("cardio"), t("core")],
          equipment: t("battle_ropes"),
        },
        {
          name: t("box_jumps"),
          duration: 60,
          rest: 45,
          instructions: t("box_jumps_instructions"),
          tips: t("box_jumps_tips"),
          muscles: [t("legs"), t("power"), t("cardio")],
          equipment: t("plyo_box"),
        },
        {
          name: t("farmers_walk"),
          duration: 90,
          rest: 0,
          instructions: t("farmers_walk_instructions"),
          tips: t("farmers_walk_tips"),
          muscles: [t("grip"), t("core"), t("traps")],
          equipment: t("dumbbells"),
        },
      ],
      completed: false,
    } : {
      id: 3,
      name: t("upper_body_focus"),
      type: t("strength"),
      duration: 25,
      difficulty: t("intermediate"),
      calories: 200,
      equipment: t("gym_required"),
      exercises: [
        {
          name: t("pull_ups"),
          duration: 120,
          rest: 90,
          instructions: t("pull_ups_instructions"),
          tips: t("pull_ups_tips"),
          muscles: [t("lats"), t("biceps"), t("rear_delts")],
          equipment: t("pull_up_bar"),
        },
        {
          name: t("dumbbell_press"),
          duration: 180,
          rest: 90,
          instructions: t("dumbbell_press_instructions"),
          tips: t("dumbbell_press_tips"),
          muscles: [t("chest"), t("shoulders"), t("triceps")],
          equipment: t("dumbbells"),
        },
        {
          name: t("cable_flyes"),
          duration: 120,
          rest: 60,
          instructions: t("cable_flyes_instructions"),
          tips: t("cable_flyes_tips"),
          muscles: [t("chest"), t("front_delts")],
          equipment: t("cable_machine"),
        },
        {
          name: t("shoulder_press_machine"),
          duration: 150,
          rest: 75,
          instructions: t("shoulder_press_instructions"),
          tips: t("shoulder_press_tips"),
          muscles: [t("shoulders"), t("triceps")],
          equipment: t("shoulder_press_machine"),
        },
        {
          name: t("tricep_dips"),
          duration: 90,
          rest: 60,
          instructions: t("tricep_dips_instructions"),
          tips: t("tricep_dips_tips"),
          muscles: [t("triceps"), t("chest")],
          equipment: t("dip_station"),
        },
        {
          name: t("face_pulls"),
          duration: 90,
          rest: 0,
          instructions: t("face_pulls_instructions"),
          tips: t("face_pulls_tips"),
          muscles: [t("rear_delts"), t("traps")],
          equipment: t("cable_machine"),
        },
      ],
      completed: false,
    },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case t("beginner"):
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case t("intermediate"):
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case t("advanced"):
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Full Body":
      case t("full_body"):
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "Strength":
      case t("strength"):
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "Flexibility":
      case t("flexibility"):
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Cardio":
      case t("cardio"):
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "Yoga":
      case t("yoga"):
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Functional":
      case t("functional"):
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getEquipmentIcon = (equipment: string) => {
    if (equipment?.includes("gym") || equipment?.includes("machine")) {
      return "🏋️"
    } else if (equipment?.includes("yoga") || equipment?.includes("mat")) {
      return "🧘"
    } else if (equipment?.includes("none") || equipment?.includes("minimal")) {
      return "💪"
    } else {
      return "⚡"
    }
  }

  const startWorkout = (workout: Workout) => {
    setSelectedWorkout(workout)
    setCurrentExercise(0)
    setIsWorkoutActive(true)
    setWorkoutTimer(0)
    setExerciseTimer(workout.exercises[0].duration)
    setCompletedExercises([])
  }

  const completeExercise = () => {
    if (!selectedWorkout) return

    const newCompleted = [...completedExercises, currentExercise]
    setCompletedExercises(newCompleted)

    if (currentExercise < selectedWorkout.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1)
      setExerciseTimer(selectedWorkout.exercises[currentExercise + 1].duration)
      setIsResting(true)
      setTimeout(() => setIsResting(false), selectedWorkout.exercises[currentExercise].rest * 1000)
    } else {
      // Workout completed
      setIsWorkoutActive(false)
      setSelectedWorkout(null)
    }
  }

  const resetWorkout = () => {
    setCurrentExercise(0)
    setIsWorkoutActive(false)
    setWorkoutTimer(0)
    setExerciseTimer(0)
    setIsResting(false)
    setCompletedExercises([])
    setSelectedWorkout(null)
  }

  if (showPostureChecker) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("posture_analysis")}</h2>
          <Button onClick={() => setShowPostureChecker(false)} variant="outline">
            {t("back_to_exercises")}
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
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          {t("daily_exercises")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t("daily_desc")}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          onClick={() => setShowPostureChecker(true)}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
        >
          <Camera className="h-4 w-4 mr-2" />
          {t("analyze_form", "Analyze My Form")}
        </Button>
      </div>

      {isWorkoutActive && selectedWorkout ? (
        /* Active Workout Interface */
        <div className="space-y-6">
          {/* Workout Progress */}
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-green-200 dark:border-green-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedWorkout.name}</CardTitle>
                  <CardDescription>
                    Exercise {currentExercise + 1} of {selectedWorkout.exercises.length}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.floor(workoutTimer / 60)}:{(workoutTimer % 60).toString().padStart(2, "0")}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t("total_time", "Total Time")}</div>
                </div>
              </div>
              <Progress value={(completedExercises.length / selectedWorkout.exercises.length) * 100} className="mt-4" />
            </CardHeader>
          </Card>

          {/* Current Exercise */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-green-200 dark:border-green-700">
              <CardHeader>
                <CardTitle className="text-2xl">{selectedWorkout.exercises[currentExercise].name}</CardTitle>
                <div className="flex space-x-2">
                  {selectedWorkout.exercises[currentExercise].muscles.map((muscle, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Exercise Timer */}
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-600 mb-2">{exerciseTimer}</div>
                  <div className="text-lg text-gray-600 dark:text-gray-400">
                    {isResting ? t("rest_time", "Rest Time") : t("exercise_time", "Exercise Time")}
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">{t("instructions", "Instructions")}:</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedWorkout.exercises[currentExercise].instructions}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">{t("tips", "Tips")}:</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedWorkout.exercises[currentExercise].tips}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex space-x-2">
                  <Button onClick={completeExercise} className="flex-1 bg-gradient-to-r from-green-600 to-teal-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t("complete_exercise", "Complete Exercise")}
                  </Button>
                  <Button onClick={() => setShowPostureChecker(true)} variant="outline">
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button onClick={resetWorkout} variant="outline">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Exercise List */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-green-200 dark:border-green-700">
              <CardHeader>
                <CardTitle>{t("workout_plan", "Workout Plan")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedWorkout.exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        index === currentExercise
                          ? "bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700"
                          : completedExercises.includes(index)
                            ? "bg-gray-100 dark:bg-gray-700 opacity-60"
                            : "bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          completedExercises.includes(index)
                            ? "bg-green-600 text-white"
                            : index === currentExercise
                              ? "bg-green-600 text-white"
                              : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {completedExercises.includes(index) ? <CheckCircle className="h-4 w-4" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {exercise.duration}s • {exercise.rest}s rest
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Workout Selection */
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <TabsTrigger value="today">{t("today", "Today")}</TabsTrigger>
            <TabsTrigger value="quick">{t("quick_workouts", "Quick Workouts")}</TabsTrigger>
            <TabsTrigger value="custom">{t("custom", "Custom")}</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            {/* Daily Summary */}
            <Card className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{t("todays_goal")}</h3>
                    <p className="text-green-100">
                      {t("complete_workouts_goal")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">0/3</div>
                    <div className="text-green-100">{t("completed")}</div>
                  </div>
                </div>
                <Progress value={0} className="mt-4 bg-green-400" />
              </CardContent>
            </Card>

            {/* Today's Workouts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todaysWorkouts.map((workout) => (
                <Card
                  key={workout.id}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{workout.name}</CardTitle>
                      {workout.completed && <CheckCircle className="h-5 w-5 text-green-600" />}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getTypeColor(workout.type)}>
                        {t(workout.type.toLowerCase().replace(" ", "_"), workout.type)}
                      </Badge>
                      <Badge className={getDifficultyColor(workout.difficulty)}>
                        {t(workout.difficulty.toLowerCase(), workout.difficulty)}
                      </Badge>
                      {workout.equipment && (
                        <Badge variant="outline" className="text-xs">
                          {getEquipmentIcon(workout.equipment)} {t(workout.equipment.toLowerCase().replace(" ", "_"), workout.equipment)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <Clock className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                        <div className="text-sm font-medium">{workout.duration} min</div>
                      </div>
                      <div>
                        <Zap className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                        <div className="text-sm font-medium">{workout.calories} cal</div>
                      </div>
                      <div>
                        <Target className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                        <div className="text-sm font-medium">{workout.exercises.length} exercises</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">{t("exercises", "Exercises")}:</h4>
                      <div className="space-y-1">
                        {workout.exercises.slice(0, 3).map((exercise, index) => (
                          <div key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
                            <span>• {exercise.name}</span>
                            <span className="text-xs">
                              {Math.floor(exercise.duration / 60) > 0 ? `${Math.floor(exercise.duration / 60)}m ` : ""}
                              {exercise.duration % 60 > 0 ? `${exercise.duration % 60}s` : ""}
                            </span>
                          </div>
                        ))}
                        {workout.exercises.length > 3 && (
                          <div className="text-sm text-gray-500">+{workout.exercises.length - 3} more exercises</div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => startWorkout(workout)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                        disabled={workout.completed}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {workout.completed ? t("completed", "Completed") : t("start", "Start")}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Timer className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm">
                          <DialogHeader>
                            <DialogTitle>{workout.name}</DialogTitle>
                            <DialogDescription>
                              {workout.type} • {workout.duration} minutes • {workout.difficulty}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <Clock className="h-6 w-6 mx-auto mb-2 text-green-600" />
                                <div className="font-medium">{workout.duration} min</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {t("duration", "Duration")}
                                </div>
                              </div>
                              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <Zap className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                                <div className="font-medium">{workout.calories} cal</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {t("calories", "Calories")}
                                </div>
                              </div>
                              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <Target className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                                <div className="font-medium">{workout.exercises.length}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {t("exercises", "Exercises")}
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-3">{t("exercise_breakdown", "Exercise Breakdown")}:</h4>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {workout.exercises.map((exercise, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                                  >
                                    <div>
                                      <div className="font-medium">{exercise.name}</div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {exercise.muscles.join(", ")}
                                        {exercise.equipment && ` • ${exercise.equipment}`}
                                      </div>
                                    </div>
                                    <div className="text-right text-sm">
                                      <div>{exercise.duration}s</div>
                                      <div className="text-gray-500">{exercise.rest}s rest</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => startWorkout(workout)}
                                className="flex-1 bg-gradient-to-r from-green-600 to-teal-600"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                {t("start_workout", "Start Workout")}
                              </Button>
                              <Button onClick={() => setShowPostureChecker(true)} variant="outline">
                                <Camera className="h-4 w-4 mr-2" />
                                {t("check_form", "Check Form")}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quick" className="space-y-6">
            <div className="text-center py-12">
              <Timer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t("quick_workouts_coming", "Quick Workouts Coming Soon")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t("quick_desc", "5-10 minute express workouts for busy schedules")}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t("custom_workouts_coming", "Custom Workouts Coming Soon")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t("custom_desc", "Create your own personalized workout routines")}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
