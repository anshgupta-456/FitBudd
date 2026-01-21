"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  User,
  Settings,
  Trophy,
  Target,
  Bell,
  Shield,
  Camera,
  Edit,
  Save,
  TrendingUp,
  Star,
  MapPin,
  Clock,
  Activity,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export default function UserProfile() {
  const { t } = useTranslation()
  const { token, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    age: 0,
    height: 0, // cm
    weight: 0, // kg
    gender: "",
    fitnessLevel: "beginner",
    goals: [] as string[],
    location: "",
    bio: "",
    workoutSchedule: [] as string[],
    preferredWorkoutTime: "",
    equipment: [] as string[],
  })

  useEffect(() => {
    const load = async () => {
      if (!token) return
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const u = data.user
        const [firstName, ...rest] = (u.name || '').split(' ')
        setProfileData((prev) => ({
          ...prev,
          firstName: firstName || '',
          lastName: rest.join(' '),
          email: u.email || '',
          age: u.age || 0,
          height: u.height || 0,
          weight: u.weight || 0,
          gender: u.gender || '',
          fitnessLevel: u.fitness_level || 'beginner',
          goals: u.goals || [],
          location: u.location || '',
          bio: u.bio || '',
          preferredWorkoutTime: u.preferred_workout_time || '',
        }))
      }
    }
    load()
  }, [token])

  const [settings, setSettings] = useState({
    notifications: {
      workoutReminders: true,
      progressUpdates: true,
      partnerMessages: true,
      achievements: true,
    },
    privacy: {
      profileVisibility: "public",
      showProgress: true,
      showLocation: true,
    },
    preferences: {
      units: "metric",
      language: "en",
      theme: "system",
    },
  })

  const userStats = {
    totalWorkouts: 156,
    totalCalories: 18420,
    totalMinutes: 4680,
    currentStreak: 12,
    longestStreak: 28,
    averageWorkoutTime: 35,
    favoriteExercise: "Push-ups",
    joinDate: "January 2024",
  }

  const achievements = [
    {
      id: 1,
      name: "First Workout",
      description: "Complete your first workout",
      earned: true,
      date: "2024-01-15",
      icon: "🏃",
    },
    {
      id: 2,
      name: "Week Warrior",
      description: "Complete 5 workouts in a week",
      earned: true,
      date: "2024-01-20",
      icon: "💪",
    },
    {
      id: 3,
      name: "Step Master",
      description: "Walk 10,000 steps in a day",
      earned: true,
      date: "2024-01-18",
      icon: "👟",
    },
    {
      id: 4,
      name: "Consistency King",
      description: "Work out for 30 days straight",
      earned: false,
      date: null,
      icon: "👑",
    },
    {
      id: 5,
      name: "Calorie Crusher",
      description: "Burn 3000 calories in a day",
      earned: false,
      date: null,
      icon: "🔥",
    },
    {
      id: 6,
      name: "Strength Builder",
      description: "Complete 50 strength workouts",
      earned: true,
      date: "2024-02-10",
      icon: "🏋️",
    },
  ]

  const recentActivity = [
    { date: "2024-01-22", type: "workout", description: "Completed Upper Body Strength", duration: 45, calories: 320 },
    { date: "2024-01-21", type: "achievement", description: "Earned 'Week Warrior' badge", icon: "💪" },
    { date: "2024-01-20", type: "workout", description: "Completed Morning Cardio", duration: 30, calories: 280 },
    { date: "2024-01-19", type: "partner", description: "Connected with Sarah Johnson", icon: "👥" },
    { date: "2024-01-18", type: "milestone", description: "Reached 150 total workouts", icon: "🎯" },
  ]

  const handleSaveProfile = async () => {
    if (!token) return
    const payload: any = {
      name: `${profileData.firstName} ${profileData.lastName}`.trim(),
      age: profileData.age,
      fitness_level: profileData.fitnessLevel,
      location: profileData.location,
      bio: profileData.bio,
      goals: profileData.goals,
      preferred_workout_time: profileData.preferredWorkoutTime,
      height: profileData.height,
      weight: profileData.weight,
      gender: profileData.gender,
    }
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    await refreshProfile()
    setIsEditing(false)
  }

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }))
  }

  const calculateBMI = () => {
    const heightInM = profileData.height / 100
    return (profileData.weight / (heightInM * heightInM)).toFixed(1)
  }

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-600" }
    if (bmi < 25) return { category: "Normal", color: "text-green-600" }
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-600" }
    return { category: "Obese", color: "text-red-600" }
  }

  const bmi = Number.parseFloat(calculateBMI())
  const bmiInfo = getBMICategory(bmi)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t("user_profile", "User Profile")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t("profile_desc", "Manage your profile, track your progress, and customize your fitness journey.")}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>{t("profile", "Profile")}</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>{t("stats", "Stats")}</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span>{t("achievements", "Achievements")}</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>{t("settings", "Settings")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-blue-200 dark:border-blue-700">
              <CardHeader className="text-center">
                <div className="relative mx-auto">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl">
                      {profileData.firstName[0]}
                      {profileData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl">
                  {profileData.firstName} {profileData.lastName}
                </CardTitle>
                <CardDescription className="flex items-center justify-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{profileData.location}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{profileData.bio}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="font-bold text-blue-600">{userStats.totalWorkouts}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t("workouts", "Workouts")}</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="font-bold text-green-600">{userStats.currentStreak}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t("day_streak", "Day Streak")}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("fitness_level", "Fitness Level")}:</span>
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      {t(profileData.fitnessLevel, profileData.fitnessLevel)}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("member_since", "Member Since")}:</span>
                    <span className="font-medium">{userStats.joinDate}</span>
                  </div>
                </div>

                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t("edit_profile", "Edit Profile")}
                </Button>
              </CardContent>
            </Card>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span>{t("basic_information", "Basic Information")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{t("first_name", "First Name")}</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">{t("last_name", "Last Name")}</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("email", "Email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">{t("age", "Age")}</Label>
                        <Input
                          id="age"
                          type="number"
                          value={profileData.age}
                          onChange={(e) => setProfileData({ ...profileData, age: Number.parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">{t("height_cm", "Height (cm)")}</Label>
                        <Input
                          id="height"
                          type="number"
                          value={profileData.height}
                          onChange={(e) => setProfileData({ ...profileData, height: Number.parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">{t("weight_kg", "Weight (kg)")}</Label>
                        <Input
                          id="weight"
                          type="number"
                          value={profileData.weight}
                          onChange={(e) => setProfileData({ ...profileData, weight: Number.parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="bio">{t("bio", "Bio")}</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="md:col-span-2 flex space-x-2">
                        <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-blue-600 to-purple-600">
                          <Save className="h-4 w-4 mr-2" />
                          {t("save_changes", "Save Changes")}
                        </Button>
                        <Button onClick={() => setIsEditing(false)} variant="outline">
                          {t("cancel", "Cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t("email", "Email")}
                          </Label>
                          <p className="font-medium">{profileData.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t("age", "Age")}
                          </Label>
                          <p className="font-medium">{profileData.age} years old</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t("location", "Location")}
                          </Label>
                          <p className="font-medium">{profileData.location}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t("height", "Height")}
                          </Label>
                          <p className="font-medium">{profileData.height} cm</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t("weight", "Weight")}
                          </Label>
                          <p className="font-medium">{profileData.weight} kg</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t("bmi", "BMI")}
                          </Label>
                          <p className={`font-medium ${bmiInfo.color}`}>
                            {calculateBMI()} ({t(bmiInfo.category.toLowerCase(), bmiInfo.category)})
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fitness Goals */}
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>{t("fitness_goals", "Fitness Goals")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profileData.goals.map((goal, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {t(goal.replace("-", "_"), goal)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>{t("recent_activity", "Recent Activity")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="text-lg">
                          {activity.type === "workout" && "🏃"}
                          {activity.type === "achievement" && activity.icon}
                          {activity.type === "partner" && activity.icon}
                          {activity.type === "milestone" && activity.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{activity.date}</p>
                        </div>
                        {activity.duration && (
                          <div className="text-right text-sm">
                            <div>{activity.duration} min</div>
                            <div className="text-gray-500">{activity.calories} cal</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{userStats.totalWorkouts}</div>
                <div className="text-blue-100">{t("total_workouts", "Total Workouts")}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{userStats.totalCalories.toLocaleString()}</div>
                <div className="text-green-100">{t("calories_burned", "Calories Burned")}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{Math.floor(userStats.totalMinutes / 60)}h</div>
                <div className="text-purple-100">{t("total_time", "Total Time")}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6 text-center">
                <Star className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{userStats.currentStreak}</div>
                <div className="text-orange-100">{t("current_streak", "Current Streak")}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{t("workout_statistics", "Workout Statistics")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>{t("average_workout_time", "Average Workout Time")}:</span>
                  <span className="font-medium">{userStats.averageWorkoutTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("longest_streak", "Longest Streak")}:</span>
                  <span className="font-medium">{userStats.longestStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("favorite_exercise", "Favorite Exercise")}:</span>
                  <span className="font-medium">{userStats.favoriteExercise}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("calories_per_workout", "Avg Calories/Workout")}:</span>
                  <span className="font-medium">{Math.round(userStats.totalCalories / userStats.totalWorkouts)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{t("health_metrics", "Health Metrics")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>{t("bmi", "BMI")}:</span>
                    <span className={`font-medium ${bmiInfo.color}`}>{calculateBMI()}</span>
                  </div>
                  <Progress value={(bmi / 35) * 100} className="h-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t(bmiInfo.category.toLowerCase(), bmiInfo.category)} range
                  </p>
                </div>
                <div className="flex justify-between">
                  <span>{t("fitness_level", "Fitness Level")}:</span>
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {t(profileData.fitnessLevel, profileData.fitnessLevel)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>{t("weekly_goal", "Weekly Goal")}:</span>
                  <span className="font-medium">3/5 workouts</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-yellow-200 dark:border-yellow-700">
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
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{achievement.description}</p>
                        {achievement.earned && achievement.date && (
                          <Badge variant="secondary" className="mt-2">
                            {t("earned_on", "Earned on")} {achievement.date}
                          </Badge>
                        )}
                        {!achievement.earned && (
                          <Badge variant="outline" className="mt-2">
                            {t("not_earned", "Not Earned Yet")}
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

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notifications */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span>{t("notifications", "Notifications")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("workout_reminders", "Workout Reminders")}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("workout_reminders_desc", "Get notified about scheduled workouts")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.workoutReminders}
                    onCheckedChange={(checked) => handleSettingChange("notifications", "workoutReminders", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("progress_updates", "Progress Updates")}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("progress_updates_desc", "Weekly progress summaries")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.progressUpdates}
                    onCheckedChange={(checked) => handleSettingChange("notifications", "progressUpdates", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("partner_messages", "Partner Messages")}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("partner_messages_desc", "Messages from workout partners")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.partnerMessages}
                    onCheckedChange={(checked) => handleSettingChange("notifications", "partnerMessages", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("achievements", "Achievements")}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("achievements_notifications_desc", "New badges and milestones")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.achievements}
                    onCheckedChange={(checked) => handleSettingChange("notifications", "achievements", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <span>{t("privacy", "Privacy")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("profile_visibility", "Profile Visibility")}</Label>
                  <Select
                    value={settings.privacy.profileVisibility}
                    onValueChange={(value) => handleSettingChange("privacy", "profileVisibility", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">{t("public", "Public")}</SelectItem>
                      <SelectItem value="friends">{t("friends_only", "Friends Only")}</SelectItem>
                      <SelectItem value="private">{t("private", "Private")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("show_progress", "Show Progress")}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("show_progress_desc", "Display workout stats to others")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.showProgress}
                    onCheckedChange={(checked) => handleSettingChange("privacy", "showProgress", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("show_location", "Show Location")}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("show_location_desc", "Display your city to find partners")}
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.showLocation}
                    onCheckedChange={(checked) => handleSettingChange("privacy", "showLocation", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span>{t("preferences", "Preferences")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("units", "Units")}</Label>
                  <Select
                    value={settings.preferences.units}
                    onValueChange={(value) => handleSettingChange("preferences", "units", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">{t("metric", "Metric (kg, cm)")}</SelectItem>
                      <SelectItem value="imperial">{t("imperial", "Imperial (lbs, ft)")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("language", "Language")}</Label>
                  <Select
                    value={settings.preferences.language}
                    onValueChange={(value) => handleSettingChange("preferences", "language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("english", "English")}</SelectItem>
                      <SelectItem value="es">{t("spanish", "Spanish")}</SelectItem>
                      <SelectItem value="fr">{t("french", "French")}</SelectItem>
                      <SelectItem value="de">{t("german", "German")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("theme", "Theme")}</Label>
                  <Select
                    value={settings.preferences.theme}
                    onValueChange={(value) => handleSettingChange("preferences", "theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t("light", "Light")}</SelectItem>
                      <SelectItem value="dark">{t("dark", "Dark")}</SelectItem>
                      <SelectItem value="system">{t("system", "System")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-red-200 dark:border-red-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <Shield className="h-5 w-5" />
                  <span>{t("account_actions", "Account Actions")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full bg-transparent">
                  {t("export_data", "Export My Data")}
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  {t("delete_account", "Delete Account")}
                </Button>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t("delete_warning", "Account deletion is permanent and cannot be undone.")}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
