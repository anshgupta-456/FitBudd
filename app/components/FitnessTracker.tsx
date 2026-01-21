"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useWorkout } from "../contexts/WorkoutContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Activity, Target, TrendingUp, Calendar, Clock, Flame, Zap, Heart, Plus, Trophy } from "lucide-react"

export default function FitnessTracker() {
  const { t } = useTranslation()
  const { savedPlans, activePlan } = useWorkout()
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  
  // Measurement state
  const [measurements, setMeasurements] = useState<any[]>([])
  const [newWeight, setNewWeight] = useState("")
  const [newBodyFat, setNewBodyFat] = useState("")
  const [newMuscle, setNewMuscle] = useState("")

  // Load measurements from localStorage on component mount
  useEffect(() => {
    const savedMeasurements = localStorage.getItem('fitness-measurements')
    if (savedMeasurements) {
      setMeasurements(JSON.parse(savedMeasurements))
    } else {
      // Initialize with some sample data
      const defaultMeasurements = [
        { date: "2024-01-01", weight: 75.2, bodyFat: 18.5, muscle: 32.1 },
        { date: "2024-01-08", weight: 74.8, bodyFat: 18.2, muscle: 32.3 },
        { date: "2024-01-15", weight: 74.5, bodyFat: 17.9, muscle: 32.5 },
        { date: "2024-01-22", weight: 74.1, bodyFat: 17.6, muscle: 32.7 },
      ]
      setMeasurements(defaultMeasurements)
      localStorage.setItem('fitness-measurements', JSON.stringify(defaultMeasurements))
    }
  }, [])

  // Save measurements to localStorage whenever they change
  useEffect(() => {
    if (measurements.length > 0) {
      localStorage.setItem('fitness-measurements', JSON.stringify(measurements))
    }
  }, [measurements])

  const addMeasurement = () => {
    if (!newWeight && !newBodyFat && !newMuscle) {
      return // Don't add empty measurements
    }

    const currentMeasurement = measurements[measurements.length - 1] || { weight: 75, bodyFat: 18, muscle: 32 }
    
    const newMeasurement = {
      date: new Date().toISOString().split('T')[0],
      weight: newWeight ? parseFloat(newWeight) : currentMeasurement.weight,
      bodyFat: newBodyFat ? parseFloat(newBodyFat) : currentMeasurement.bodyFat,
      muscle: newMuscle ? parseFloat(newMuscle) : currentMeasurement.muscle,
    }

    setMeasurements(prev => [...prev, newMeasurement])
    
    // Clear form
    setNewWeight("")
    setNewBodyFat("")
    setNewMuscle("")
  }

  // Mock data
  const weeklyData = [
    { day: "Mon", calories: 2200, steps: 8500, workouts: 1 },
    { day: "Tue", calories: 2100, steps: 9200, workouts: 0 },
    { day: "Wed", calories: 2300, steps: 7800, workouts: 1 },
    { day: "Thu", calories: 2000, steps: 10500, workouts: 1 },
    { day: "Fri", calories: 2400, steps: 6900, workouts: 0 },
    { day: "Sat", calories: 2600, steps: 12000, workouts: 2 },
    { day: "Sun", calories: 2200, steps: 8800, workouts: 1 },
  ]

  const monthlyProgress = measurements.length > 0 ? measurements.map((m, index) => ({
    week: `Week ${index + 1}`,
    weight: m.weight,
    bodyFat: m.bodyFat,
    date: m.date
  })) : [
    { week: "Week 1", weight: 75.2, bodyFat: 18.5, date: "2024-01-01" },
    { week: "Week 2", weight: 74.8, bodyFat: 18.2, date: "2024-01-08" },
    { week: "Week 3", weight: 74.5, bodyFat: 17.9, date: "2024-01-15" },
    { week: "Week 4", weight: 74.1, bodyFat: 17.6, date: "2024-01-22" },
  ]

  const workoutTypes = [
    { name: "Cardio", value: 35, color: "#8884d8" },
    { name: "Strength", value: 40, color: "#82ca9d" },
    { name: "Flexibility", value: 15, color: "#ffc658" },
    { name: "Sports", value: 10, color: "#ff7300" },
  ]

  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null

  const currentStats = {
    todaySteps: 8247,
    stepGoal: 10000,
    caloriesBurned: 2180,
    calorieGoal: 2500,
    activeMinutes: 45,
    activeGoal: 60,
    workoutsThisWeek: 4,
    workoutGoal: 5,
    currentWeight: latestMeasurement?.weight || 74.1,
    currentBodyFat: latestMeasurement?.bodyFat || 17.6,
    currentMuscle: latestMeasurement?.muscle || 32.7,
  }

  const achievements = [
    { id: 1, title: "First Workout", description: "Complete your first workout", earned: true, date: "2024-01-15" },
    { id: 2, title: "Week Warrior", description: "Complete 5 workouts in a week", earned: true, date: "2024-01-20" },
    { id: 3, title: "Step Master", description: "Walk 10,000 steps in a day", earned: true, date: "2024-01-18" },
    { id: 4, title: "Consistency King", description: "Work out for 30 days straight", earned: false, date: null },
    { id: 5, title: "Calorie Crusher", description: "Burn 3000 calories in a day", earned: false, date: null },
  ]

  const recentWorkouts = [
    { id: 1, type: "Strength Training", duration: 45, calories: 320, date: "2024-01-22" },
    { id: 2, type: "Running", duration: 30, calories: 280, date: "2024-01-21" },
    { id: 3, type: "Yoga", duration: 60, calories: 180, date: "2024-01-20" },
    { id: 4, type: "HIIT", duration: 25, calories: 250, date: "2024-01-19" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          {t("fitness_tracker", "Fitness Tracker")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t("tracker_desc", "Track your progress, monitor your goals, and stay motivated on your fitness journey.")}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">{t("steps_today", "Steps Today")}</p>
                <p className="text-2xl font-bold">{currentStats.todaySteps.toLocaleString()}</p>
                <Progress
                  value={(currentStats.todaySteps / currentStats.stepGoal) * 100}
                  className="mt-2 bg-blue-400"
                />
              </div>
              <Activity className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">{t("calories_burned", "Calories Burned")}</p>
                <p className="text-2xl font-bold">{currentStats.caloriesBurned}</p>
                <Progress
                  value={(currentStats.caloriesBurned / currentStats.calorieGoal) * 100}
                  className="mt-2 bg-green-400"
                />
              </div>
              <Flame className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">{t("active_minutes", "Active Minutes")}</p>
                <p className="text-2xl font-bold">{currentStats.activeMinutes}</p>
                <Progress
                  value={(currentStats.activeMinutes / currentStats.activeGoal) * 100}
                  className="mt-2 bg-purple-400"
                />
              </div>
              <Clock className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">{t("workouts_week", "Workouts This Week")}</p>
                <p className="text-2xl font-bold">{currentStats.workoutsThisWeek}</p>
                <Progress
                  value={(currentStats.workoutsThisWeek / currentStats.workoutGoal) * 100}
                  className="mt-2 bg-orange-400"
                />
              </div>
              <Zap className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <TabsTrigger value="overview">{t("overview", "Overview")}</TabsTrigger>
          <TabsTrigger value="progress">{t("progress", "Progress")}</TabsTrigger>
          <TabsTrigger value="workouts">{t("workouts", "Workouts")}</TabsTrigger>
          <TabsTrigger value="achievements">{t("achievements", "Achievements")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity Chart */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>{t("weekly_activity", "Weekly Activity")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="calories" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="steps" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Workout Distribution */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>{t("workout_distribution", "Workout Distribution")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={workoutTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {workoutTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weight Progress */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>{t("weight_progress", "Weight Progress")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Body Fat Progress */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  <span>{t("body_fat_progress", "Body Fat Progress")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bodyFat" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Add New Measurement */}
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-green-600" />
                <span>{t("add_measurement", "Add New Measurement")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">{t("weight", "Weight (kg)")}</Label>
                  <Input 
                    id="weight" 
                    type="number" 
                    placeholder="74.5" 
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyFat">{t("body_fat", "Body Fat (%)")}</Label>
                  <Input 
                    id="bodyFat" 
                    type="number" 
                    placeholder="17.5" 
                    value={newBodyFat}
                    onChange={(e) => setNewBodyFat(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="muscle">{t("muscle_mass", "Muscle Mass (kg)")}</Label>
                  <Input 
                    id="muscle" 
                    type="number" 
                    placeholder="32.1" 
                    value={newMuscle}
                    onChange={(e) => setNewMuscle(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                    onClick={addMeasurement}
                  >
                    {t("add_measurement", "Add Measurement")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workouts Tab */}
        <TabsContent value="workouts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Workouts */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span>{t("recent_workouts_tracker", "Recent Workouts")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{workout.type}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{workout.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{workout.duration} min</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{workout.calories} cal</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Workout Chart */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <span>{t("weekly_workouts", "Weekly Workouts")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="workouts" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* My Workout Plans */}
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>{t("my_workout_plans", "My Workout Plans")}</span>
              </CardTitle>
              <CardDescription>
                {t("plans_tracker_desc", "Monitor your saved and active workout plans")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activePlan ? (
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-green-600">{t("active_plan", "Active Plan")}</h4>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{activePlan.name}</h5>
                      <Badge className="bg-green-100 text-green-800">
                        {t("active", "Active")}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>{t("difficulty", "Difficulty")}: {t(activePlan.difficulty?.toLowerCase() || "intermediate", activePlan.difficulty)}</p>
                      <p>{t("duration", "Duration")}: {activePlan.duration}</p>
                      <p>{t("workouts_per_week", "Workouts per week")}: {activePlan.totalWorkouts}</p>
                      <p>{t("estimated_calories", "Est. calories")}: {activePlan.estimatedCalories}/week</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("no_active_plan", "No active workout plan")}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {t("create_plan_suggestion", "Create a plan in the Workout Planner to get started")}
                  </p>
                </div>
              )}

              {savedPlans.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">{t("saved_plans", "Saved Plans")} ({savedPlans.length})</h4>
                  <div className="space-y-3">
                    {savedPlans.slice(0, 3).map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <h5 className="font-medium">{plan.name}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {plan.difficulty} • {plan.duration}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={plan.status === 'active' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                            {t(plan.status, plan.status)}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {t("created", "Created")}: {new Date(plan.savedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {savedPlans.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{savedPlans.length - 3} {t("more_plans", "more plans")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span>{t("achievements", "Achievements")}</span>
              </CardTitle>
              <CardDescription>
                {t("achievements_desc", "Track your milestones and celebrate your progress")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 ${
                      achievement.earned
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Trophy className={`h-6 w-6 ${achievement.earned ? "text-yellow-600" : "text-gray-400"}`} />
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{achievement.description}</p>
                        {achievement.earned && achievement.date && (
                          <Badge variant="secondary" className="mt-2">
                            {t("earned_on", "Earned on")} {achievement.date}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
