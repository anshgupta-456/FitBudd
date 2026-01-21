"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Slider } from "@/components/ui/slider"
import { 
  Users, 
  UtensilsCrossed, 
  Activity, 
  Home, 
  Star, 
  MapPin, 
  Clock, 
  Calendar,
  TrendingUp,
  Target,
  Award,
  Phone,
  Mail,
  Filter,
  Search,
  Sparkles
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { toast } from "sonner"
import FitnessTracker from "./FitnessTracker"

interface ProfessionalTrainer {
  id: number
  name: string
  gender: string
  specialization: string
  experience_years: number
  certification: string[]
  bio: string
  avatar_url: string
  rating: number
  review_count: number
  hourly_rate: number
  location: string
  languages: string[]
  female_friendly: boolean
  is_available: boolean
}

interface DietPlan {
  id: number
  name: string
  gender_target: string
  description: string
  duration_weeks: number
  daily_calories: number
  meal_plan: any
  goals: string[]
  difficulty: string
  created_by_trainer_id: number | null
  trainer_name: string | null
  price: number
}

const SPECIALIZATIONS = [
  "All Specializations",
  "Weight Loss",
  "Strength Training",
  "Yoga",
  "Pilates",
  "HIIT",
  "Women's Fitness",
  "Postnatal Training",
  "Nutrition",
  "Flexibility",
  "Cardio"
]

const DIET_GOALS = [
  "All Goals",
  "weight_loss",
  "muscle_gain",
  "hormone_balance",
  "health",
  "performance",
  "recovery"
]

const CUSTOM_DIET_GOALS = [
  "weight_loss",
  "muscle_gain",
  "hormone_balance",
  "health",
  "performance",
  "recovery",
  "maintenance"
]

const DIETARY_RESTRICTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Low-Carb",
  "Keto"
]

const MENSTRUAL_CYCLE_PHASES = [
  { value: "menstrual", label: "Menstrual (Days 1-5)", description: "Focus on iron, magnesium, and vitamin B6" },
  { value: "follicular", label: "Follicular (Days 6-14)", description: "Balanced nutrition, normal macros" },
  { value: "ovulation", label: "Ovulation (Days 15-17)", description: "Peak energy, normal nutrition" },
  { value: "luteal", label: "Luteal (Days 18-28)", description: "Increased magnesium, complex carbs" }
]

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", description: "Little to no exercise" },
  { value: "light", label: "Light", description: "Light exercise 1-3 days/week" },
  { value: "moderate", label: "Moderate", description: "Moderate exercise 3-5 days/week" },
  { value: "active", label: "Active", description: "Hard exercise 6-7 days/week" },
  { value: "very_active", label: "Very Active", description: "Very hard exercise, physical job" }
]

export default function ProfessionalTraining() {
  const { user } = useAuth()
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'
  
  const [trainers, setTrainers] = useState<ProfessionalTrainer[]>([])
  const [filteredTrainers, setFilteredTrainers] = useState<ProfessionalTrainer[]>([])
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([])
  const [filteredDietPlans, setFilteredDietPlans] = useState<DietPlan[]>([])
  const [trainersLoading, setTrainersLoading] = useState(true)
  const [dietPlansLoading, setDietPlansLoading] = useState(true)
  
  // Filters
  const [trainerSpecialization, setTrainerSpecialization] = useState("All Specializations")
  const [trainerPriceRange, setTrainerPriceRange] = useState([0, 2000])
  const [trainerMinRating, setTrainerMinRating] = useState(0)
  const [trainerSearch, setTrainerSearch] = useState("")
  
  const [dietGoalFilter, setDietGoalFilter] = useState("All Goals")
  const [dietDifficultyFilter, setDietDifficultyFilter] = useState("all")
  const [dietPriceRange, setDietPriceRange] = useState([0, 2000])
  
  // Custom diet plan builder state
  const [showCustomBuilder, setShowCustomBuilder] = useState(false)
  const [customPlanGoals, setCustomPlanGoals] = useState<string[]>([])
  const [customPlanDifficulty, setCustomPlanDifficulty] = useState("beginner")
  const [customPlanDuration, setCustomPlanDuration] = useState("4")
  const [customDietaryRestrictions, setCustomDietaryRestrictions] = useState<string[]>([])
  const [menstrualCyclePhase, setMenstrualCyclePhase] = useState<string>("")
  const [activityLevel, setActivityLevel] = useState("moderate")
  const [customPlanLoading, setCustomPlanLoading] = useState(false)
  const [generatedCustomPlan, setGeneratedCustomPlan] = useState<any>(null)
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<DietPlan | null>(null)
  const [planDetailsDialogOpen, setPlanDetailsDialogOpen] = useState(false)
  
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [selectedTrainer, setSelectedTrainer] = useState<ProfessionalTrainer | null>(null)
  const [bookingDate, setBookingDate] = useState("")
  const [bookingTime, setBookingTime] = useState("")
  const [bookingDuration, setBookingDuration] = useState("1")
  const [bookingLocation, setBookingLocation] = useState("")
  const [bookingType, setBookingType] = useState("personal_training")
  const [bookingNotes, setBookingNotes] = useState("")
  const [bookingLoading, setBookingLoading] = useState(false)

  // Get user gender from profile
  const getUserGender = async (): Promise<string | null> => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token || !user?.id) return null
      
      const res = await fetch(`${baseUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      
      if (data.success && data.user?.gender) {
        return data.user.gender.toLowerCase()
      }
      return null
    } catch (error) {
      console.error("Error fetching user gender:", error)
      return null
    }
  }

  const fetchTrainers = useCallback(async () => {
    try {
      setTrainersLoading(true)
      const userGender = await getUserGender()
      const params = new URLSearchParams()
      if (userGender) {
        params.append("user_gender", userGender)
      }
      
      const res = await fetch(`${baseUrl}/api/trainers?${params}`)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.success) {
        const trainersList = data.trainers || []
        console.log(`✅ Loaded ${trainersList.length} trainers from backend (user_gender: ${userGender || 'not specified'})`)
        setTrainers(trainersList)
        setFilteredTrainers(trainersList)
        
        // Only show info if no trainers found
        if (trainersList.length === 0) {
          console.warn("No trainers found in database. Backend may need initialization.")
        }
      } else {
        console.error("API error:", data.error || data.message)
        setTrainers([])
        setFilteredTrainers([])
        // Only show error for actual connection issues, not empty results
        if (data.error && !data.error.includes("No trainers")) {
          console.error(`Failed to load trainers: ${data.error}`)
        }
      }
    } catch (error) {
      console.error("Error fetching trainers:", error)
      setTrainers([])
      setFilteredTrainers([])
      // Only show toast for network errors, not for empty results
      if (error instanceof Error && error.message.includes("HTTP error")) {
        toast.error("Unable to connect to backend. Please ensure the server is running.")
      }
    } finally {
      setTrainersLoading(false)
    }
  }, [baseUrl, user?.id])

  const fetchDietPlans = useCallback(async () => {
    try {
      setDietPlansLoading(true)
      const userGender = await getUserGender()
      const params = new URLSearchParams()
      if (userGender) {
        params.append("user_gender", userGender)
      }
      
      const res = await fetch(`${baseUrl}/api/diet-plans?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setDietPlans(data.diet_plans || [])
        setFilteredDietPlans(data.diet_plans || [])
      } else {
        setDietPlans([])
        setFilteredDietPlans([])
      }
    } catch (error) {
      console.error("Error fetching diet plans:", error)
      setDietPlans([])
      setFilteredDietPlans([])
    } finally {
      setDietPlansLoading(false)
    }
  }, [baseUrl, user?.id])

  useEffect(() => {
    fetchTrainers()
    fetchDietPlans()
  }, [fetchTrainers, fetchDietPlans])

  // Filter trainers
  useEffect(() => {
    let filtered = [...trainers]
    
    // Specialization filter
    if (trainerSpecialization !== "All Specializations") {
      filtered = filtered.filter(t => 
        t.specialization.toLowerCase().includes(trainerSpecialization.toLowerCase())
      )
    }
    
    // Price range filter
    filtered = filtered.filter(t => 
      t.hourly_rate >= trainerPriceRange[0] && t.hourly_rate <= trainerPriceRange[1]
    )
    
    // Rating filter
    filtered = filtered.filter(t => t.rating >= trainerMinRating)
    
    // Search filter
    if (trainerSearch) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(trainerSearch.toLowerCase()) ||
        t.specialization.toLowerCase().includes(trainerSearch.toLowerCase()) ||
        t.location.toLowerCase().includes(trainerSearch.toLowerCase())
      )
    }
    
    setFilteredTrainers(filtered)
  }, [trainers, trainerSpecialization, trainerPriceRange, trainerMinRating, trainerSearch])

  // Filter diet plans
  useEffect(() => {
    let filtered = [...dietPlans]
    
    // Goal filter
    if (dietGoalFilter !== "All Goals") {
      filtered = filtered.filter(p => p.goals.includes(dietGoalFilter))
    }
    
    // Difficulty filter
    if (dietDifficultyFilter !== "all") {
      filtered = filtered.filter(p => p.difficulty === dietDifficultyFilter)
    }
    
    // Price filter
    filtered = filtered.filter(p => p.price >= dietPriceRange[0] && p.price <= dietPriceRange[1])
    
    setFilteredDietPlans(filtered)
  }, [dietPlans, dietGoalFilter, dietDifficultyFilter, dietPriceRange])

  const handleBookTrainer = (trainer: ProfessionalTrainer) => {
    if (!user?.id) {
      toast.error("Please log in to book a trainer")
      return
    }
    setSelectedTrainer(trainer)
    setBookingDate("")
    setBookingTime("")
    setBookingDuration("1")
    setBookingLocation("")
    setBookingType("personal_training")
    setBookingNotes("")
    setBookingDialogOpen(true)
  }

  const handleBookingSubmit = async () => {
    if (!user?.id || !selectedTrainer || !bookingDate || !bookingTime || !bookingLocation) {
      toast.error("Please fill in all required fields")
      return
    }

    setBookingLoading(true)
    try {
      const res = await fetch(`${baseUrl}/api/home-sessions/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          trainer_id: selectedTrainer.id,
          session_date: bookingDate,
          session_time: bookingTime,
          duration_hours: parseFloat(bookingDuration),
          location: bookingLocation,
          session_type: bookingType,
          notes: bookingNotes,
        }),
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success("Home session booked successfully!")
        setBookingDialogOpen(false)
        setBookingDate("")
        setBookingTime("")
        setBookingDuration("1")
        setBookingLocation("")
        setBookingNotes("")
      } else {
        toast.error(data.error || "Booking failed")
      }
    } catch (error) {
      console.error("Booking error:", error)
      toast.error("Failed to complete booking")
    } finally {
      setBookingLoading(false)
    }
  }

  const handleGenerateCustomPlan = async () => {
    if (customPlanGoals.length === 0) {
      toast.error("Please select at least one goal")
      return
    }

    setCustomPlanLoading(true)
    try {
      const userGender = await getUserGender()
      const userProfile = await fetch(`${baseUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      }).then(r => r.json())

      const res = await fetch(`${baseUrl}/api/diet-plans/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_gender: userGender || user?.gender || 'unisex',
          goals: customPlanGoals,
          difficulty: customPlanDifficulty,
          duration_weeks: parseInt(customPlanDuration),
          dietary_restrictions: customDietaryRestrictions,
          menstrual_cycle_phase: userGender === 'female' ? menstrualCyclePhase : null,
          activity_level: activityLevel,
          age: userProfile?.user?.age || 30,
          weight: userProfile?.user?.weight || 65,
          height: userProfile?.user?.height || 165,
        }),
      })

      const data = await res.json()
      
      if (data.success) {
        setGeneratedCustomPlan(data.diet_plan)
        toast.success("Custom diet plan generated successfully!")
      } else {
        toast.error(data.error || "Failed to generate plan")
      }
    } catch (error) {
      console.error("Error generating custom plan:", error)
      toast.error("Failed to generate custom diet plan")
    } finally {
      setCustomPlanLoading(false)
    }
  }

  const handleViewPlanDetails = (plan: DietPlan) => {
    setSelectedPlanDetails(plan)
    setPlanDetailsDialogOpen(true)
  }

  const toggleCustomGoal = (goal: string) => {
    setCustomPlanGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    )
  }

  const toggleDietaryRestriction = (restriction: string) => {
    setCustomDietaryRestrictions(prev => 
      prev.includes(restriction) 
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    )
  }

  const userGender = user?.gender?.toLowerCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Professional Training & Nutrition
          </h2>
          <Sparkles className="h-8 w-8 text-purple-500" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Connect with certified trainers, create personalized diet plans tailored to your goals, track your fitness progress, and book home training sessions.
          {userGender === 'female' && (
            <span className="block mt-2 text-pink-600 font-medium">
              ✨ Women-friendly trainers and plans tailored for you, including menstrual cycle nutrition support
            </span>
          )}
          {userGender === 'male' && (
            <span className="block mt-2 text-blue-600 font-medium">
              💪 Unisex trainers and balanced nutrition plans for optimal performance
            </span>
          )}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-4xl mx-auto">
          <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardContent className="pt-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold mb-1">Expert Trainers</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Certified professionals specializing in your fitness goals
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
            <CardContent className="pt-4 text-center">
              <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-pink-600" />
              <h3 className="font-semibold mb-1">Custom Nutrition</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Personalized meal plans based on your preferences and goals
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardContent className="pt-4 text-center">
              <Home className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold mb-1">Home Sessions</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Book personalized training sessions at your location
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="trainers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur border rounded-full p-1">
          <TabsTrigger value="trainers" className="rounded-full px-4 py-1 text-xs md:text-sm">
            <Users className="h-4 w-4 mr-2" />
            Trainers
          </TabsTrigger>
          <TabsTrigger value="diet-plans" className="rounded-full px-4 py-1 text-xs md:text-sm">
            <UtensilsCrossed className="h-4 w-4 mr-2" />
            Diet Plans
          </TabsTrigger>
          <TabsTrigger value="tracker" className="rounded-full px-4 py-1 text-xs md:text-sm">
            <Activity className="h-4 w-4 mr-2" />
            Tracker
          </TabsTrigger>
          <TabsTrigger value="home-sessions" className="rounded-full px-4 py-1 text-xs md:text-sm">
            <Home className="h-4 w-4 mr-2" />
            Home Sessions
          </TabsTrigger>
        </TabsList>

        {/* Professional Trainers Tab */}
        <TabsContent value="trainers" className="space-y-4">
          {/* Gender-Specific Information Cards */}
          {userGender === 'female' && (
            <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-pink-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-pink-700 dark:text-pink-400 mb-2">
                      Women-Safe Training Environment
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      All trainers shown here are either female trainers or certified female-friendly trainers who specialize in women's fitness. They understand:
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 mt-1">•</span>
                        <span>Women's hormonal cycles and how they affect training</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 mt-1">•</span>
                        <span>Postnatal and prenatal fitness considerations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 mt-1">•</span>
                        <span>Body-positive and inclusive training approaches</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 mt-1">•</span>
                        <span>Safe spaces for women to train comfortably</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {userGender === 'male' && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                      Professional Training for Men
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      Our trainers specialize in strength training, athletic performance, and overall fitness optimization. They focus on:
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Strength and muscle building programs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Cardiovascular fitness and endurance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Functional movement and injury prevention</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Performance-based training methodologies</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span>Professional Trainers</span>
              </CardTitle>
              <CardDescription>
                {userGender === 'female' 
                  ? "Female-friendly trainers specializing in women's fitness, hormonal health, and safe training practices"
                  : "Certified trainers available for personal training, strength building, and performance optimization"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="space-y-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Filters</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search trainers..."
                        value={trainerSearch}
                        onChange={(e) => setTrainerSearch(e.target.value)}
                        className="pl-8 h-9 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Specialization</Label>
                    <Select value={trainerSpecialization} onValueChange={setTrainerSpecialization}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALIZATIONS.map((spec) => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Min Rating: {trainerMinRating.toFixed(1)}</Label>
                    <Slider
                      value={[trainerMinRating]}
                      onValueChange={(value) => setTrainerMinRating(value[0])}
                      max={5}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Price Range: ₹{trainerPriceRange[0]} - ₹{trainerPriceRange[1]}</Label>
                    <Slider
                      value={trainerPriceRange}
                      onValueChange={setTrainerPriceRange}
                      max={200}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {trainersLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 animate-pulse text-purple-400" />
                  <p>Loading trainers...</p>
                </div>
              ) : filteredTrainers.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">No trainers found matching your criteria</p>
                    {trainers.length === 0 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg max-w-md mx-auto mb-4">
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          <strong>Note:</strong> Trainers are not loaded. Please ensure:
                        </p>
                        <ul className="text-xs text-amber-700 dark:text-amber-400 mt-2 list-disc list-inside space-y-1">
                          <li>Backend server is running on port 5001</li>
                          <li>Database is initialized (restart backend to auto-initialize)</li>
                          <li>Check backend console for errors</li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setTrainerSpecialization("All Specializations")
                        setTrainerPriceRange([0, 2000])
                        setTrainerMinRating(0)
                        setTrainerSearch("")
                      }}
                    >
                      Clear Filters
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => fetchTrainers()}
                    >
                      Retry Loading
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {filteredTrainers.length} of {trainers.length} trainers
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTrainers.map((trainer) => (
                      <Card 
                        key={trainer.id} 
                        className="border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                      >
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-16 w-16 ring-2 ring-purple-200 dark:ring-purple-800 group-hover:ring-purple-400 transition-all">
                              <AvatarImage src={trainer.avatar_url || "/placeholder-user.jpg"} />
                              <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold">
                                {trainer.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-sm truncate">{trainer.name}</h3>
                                {trainer.female_friendly && (
                                  <Badge className="rounded-full text-[10px] px-2 py-0.5 bg-pink-100 text-pink-700 border-pink-200">
                                    Female-Friendly
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mb-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-medium">{trainer.rating.toFixed(1)}</span>
                                <span className="text-xs text-gray-500">({trainer.review_count})</span>
                              </div>
                              <p className="text-xs text-gray-500">{trainer.experience_years} years experience</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization:</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{trainer.specialization}</p>
                          </div>
                          
                          {trainer.bio && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{trainer.bio}</p>
                          )}

                          {/* Gender-Specific Badges */}
                          {userGender === 'female' && trainer.female_friendly && (
                            <div className="flex items-center gap-1 text-xs text-pink-600">
                              <Sparkles className="h-3 w-3" />
                              <span>Women-Safe Training</span>
                            </div>
                          )}
                          {userGender === 'female' && trainer.gender === 'female' && (
                            <div className="flex items-center gap-1 text-xs text-pink-600">
                              <Users className="h-3 w-3" />
                              <span>Female Trainer</span>
                            </div>
                          )}
                          {userGender === 'male' && trainer.gender === 'male' && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Users className="h-3 w-3" />
                              <span>Male Trainer</span>
                            </div>
                          )}
                          
                          {trainer.certification && trainer.certification.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {trainer.certification.slice(0, 2).map((cert, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] px-2 py-0.5">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs pt-2 border-t">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {trainer.location}
                            </span>
                            <span className="font-bold text-lg text-purple-600">₹{trainer.hourly_rate}/hr</span>
                          </div>
                          
                          <Button 
                            className="w-full h-9 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm"
                            onClick={() => handleBookTrainer(trainer)}
                            disabled={!trainer.is_available}
                          >
                            {trainer.is_available ? "Book Session" : "Not Available"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diet Plans Tab */}
        <TabsContent value="diet-plans" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Diet Plans</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userGender === 'female' 
                  ? "Women-specific nutrition plans designed for your unique needs"
                  : "Balanced nutrition plans for optimal health and performance"}
              </p>
            </div>
            <Button
              onClick={() => setShowCustomBuilder(!showCustomBuilder)}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            >
              {showCustomBuilder ? "Browse Plans" : "Create Custom Plan"}
            </Button>
          </div>

          {showCustomBuilder ? (
            /* Custom Diet Plan Builder */
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink-600" />
                  <span>Custom Diet Plan Builder</span>
                </CardTitle>
                <CardDescription>
                  Create a personalized nutrition plan tailored to your goals, preferences, and needs
                  {userGender === 'female' && " - including menstrual cycle support"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Goals Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Select Your Goals *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CUSTOM_DIET_GOALS.map((goal) => (
                      <Button
                        key={goal}
                        variant={customPlanGoals.includes(goal) ? "default" : "outline"}
                        onClick={() => toggleCustomGoal(goal)}
                        className={`h-auto py-3 px-4 text-xs ${
                          customPlanGoals.includes(goal)
                            ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                            : ""
                        }`}
                      >
                        {goal.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Menstrual Cycle Phase (Women Only) */}
                {userGender === 'female' && (
                  <div className="space-y-3 p-4 bg-pink-50/50 dark:bg-pink-900/10 rounded-2xl border border-pink-200 dark:border-pink-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-pink-600" />
                      <Label className="text-sm font-semibold text-pink-700 dark:text-pink-400">
                        Menstrual Cycle Phase (Optional)
                      </Label>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Select your current cycle phase for personalized nutrition support
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {MENSTRUAL_CYCLE_PHASES.map((phase) => (
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
                          <p className="text-xs text-gray-600 dark:text-gray-400">{phase.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity Level */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Activity Level</Label>
                  <Select value={activityLevel} onValueChange={setActivityLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <p className="font-medium">{level.label}</p>
                            <p className="text-xs text-gray-500">{level.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty and Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Difficulty Level</Label>
                    <Select value={customPlanDifficulty} onValueChange={setCustomPlanDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Duration (weeks)</Label>
                    <Select value={customPlanDuration} onValueChange={setCustomPlanDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 weeks</SelectItem>
                        <SelectItem value="4">4 weeks</SelectItem>
                        <SelectItem value="6">6 weeks</SelectItem>
                        <SelectItem value="8">8 weeks</SelectItem>
                        <SelectItem value="12">12 weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Dietary Restrictions (Optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_RESTRICTIONS.map((restriction) => (
                      <Button
                        key={restriction}
                        variant={customDietaryRestrictions.includes(restriction) ? "default" : "outline"}
                        onClick={() => toggleDietaryRestriction(restriction)}
                        size="sm"
                        className={`h-8 ${
                          customDietaryRestrictions.includes(restriction)
                            ? "bg-pink-600 text-white"
                            : ""
                        }`}
                      >
                        {restriction}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateCustomPlan}
                  disabled={customPlanLoading || customPlanGoals.length === 0}
                  className="w-full h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold"
                >
                  {customPlanLoading ? (
                    <>Generating Plan...</>
                  ) : (
                    <>Generate Custom Diet Plan</>
                  )}
                </Button>

                {/* Generated Plan Display */}
                {generatedCustomPlan && (
                  <Card className="mt-6 border-2 border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-pink-600" />
                        {generatedCustomPlan.name}
                      </CardTitle>
                      <CardDescription>{generatedCustomPlan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Daily Calories</p>
                          <p className="text-2xl font-bold text-pink-600">{generatedCustomPlan.daily_calories}</p>
                        </div>
                        <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                          <p className="text-2xl font-bold text-pink-600">{generatedCustomPlan.duration_weeks} weeks</p>
                        </div>
                        <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Protein</p>
                          <p className="text-lg font-bold text-pink-600">{generatedCustomPlan.meal_plan?.macros?.protein}</p>
                        </div>
                        <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Carbs</p>
                          <p className="text-lg font-bold text-pink-600">{generatedCustomPlan.meal_plan?.macros?.carbs}</p>
                        </div>
                      </div>

                      {/* Meal Plan */}
                      {generatedCustomPlan.meal_plan && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Meal Plan</h4>
                          {['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (
                            <div key={meal} className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium capitalize">{meal}</h5>
                                <span className="text-xs text-gray-600">{generatedCustomPlan.meal_plan[meal]?.calories} cal</span>
                              </div>
                              <ul className="space-y-1">
                                {generatedCustomPlan.meal_plan[meal]?.suggestions?.map((suggestion: string, idx: number) => (
                                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">• {suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cycle-Specific Nutrition */}
                      {generatedCustomPlan.menstrual_cycle_phase && generatedCustomPlan.meal_plan?.cycle_specific_nutrition && (
                        <div className="p-4 bg-pink-100 dark:bg-pink-900/30 rounded-xl border border-pink-300 dark:border-pink-700">
                          <h5 className="font-semibold text-pink-700 dark:text-pink-400 mb-2">
                            Cycle-Specific Nutrition Tips
                          </h5>
                          {Object.entries(generatedCustomPlan.meal_plan.cycle_specific_nutrition).map(([key, foods]: [string, any]) => (
                            <div key={key} className="mb-2">
                              <p className="text-xs font-medium text-pink-600 capitalize mb-1">
                                {key.replace('_', ' ')}:
                              </p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {Array.isArray(foods) ? foods.join(', ') : foods}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Browse Existing Plans */
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-pink-600" />
                  <span>Browse Diet Plans</span>
                </CardTitle>
                <CardDescription>
                  {userGender === 'female' 
                    ? "Women-specific nutrition plans designed for your unique needs"
                    : "Balanced nutrition plans for optimal health and performance"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="space-y-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Filters</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Goal</Label>
                      <Select value={dietGoalFilter} onValueChange={setDietGoalFilter}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIET_GOALS.map((goal) => (
                            <SelectItem key={goal} value={goal}>
                              {goal === "All Goals" ? goal : goal.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Difficulty</Label>
                      <Select value={dietDifficultyFilter} onValueChange={setDietDifficultyFilter}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Price Range: ₹{dietPriceRange[0]} - ₹{dietPriceRange[1]}</Label>
                      <Slider
                        value={dietPriceRange}
                        onValueChange={setDietPriceRange}
                        max={200}
                        min={0}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {dietPlansLoading ? (
                  <div className="text-center py-12 text-gray-500">
                    <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 animate-pulse text-pink-400" />
                    <p>Loading diet plans...</p>
                  </div>
                ) : filteredDietPlans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No diet plans found matching your criteria</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setDietGoalFilter("All Goals")
                        setDietDifficultyFilter("all")
                        setDietPriceRange([0, 2000])
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredDietPlans.length} of {dietPlans.length} plans
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredDietPlans.map((plan) => (
                        <Card 
                          key={plan.id} 
                          className="border-0 bg-gradient-to-br from-white to-pink-50/30 dark:from-gray-900 dark:to-pink-900/10 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                        >
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm">{plan.name}</h3>
                                  {plan.gender_target === 'female' && (
                                    <Badge className="rounded-full text-[10px] px-2 py-0.5 bg-pink-100 text-pink-700 border-pink-200">
                                      Women's Plan
                                    </Badge>
                                  )}
                                </div>
                                {plan.trainer_name && (
                                  <p className="text-xs text-gray-500 mb-1">By {plan.trainer_name}</p>
                                )}
                              </div>
                              <span className="font-bold text-xl text-pink-600">₹{plan.price}</span>
                            </div>
                            
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{plan.description}</p>
                            
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline" className="rounded-full px-2 py-0.5">
                                <Clock className="h-3 w-3 mr-1 inline" />
                                {plan.duration_weeks} weeks
                              </Badge>
                              <Badge variant="outline" className="rounded-full px-2 py-0.5">
                                <Target className="h-3 w-3 mr-1 inline" />
                                {plan.daily_calories} cal/day
                              </Badge>
                              <Badge variant="outline" className="rounded-full px-2 py-0.5 capitalize">
                                {plan.difficulty}
                              </Badge>
                            </div>
                            
                            <div>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Goals:</p>
                              <div className="flex flex-wrap gap-1">
                                {plan.goals.map((goal, idx) => (
                                  <Badge key={idx} className="rounded-full text-[10px] px-2 py-0.5 bg-pink-100 text-pink-700">
                                    {goal.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <Button 
                              onClick={() => handleViewPlanDetails(plan)}
                              className="w-full h-9 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-sm"
                            >
                              View Plan Details
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fitness Tracker Tab */}
        <TabsContent value="tracker">
          <FitnessTracker />
        </TabsContent>

        {/* Home Sessions Tab */}
        <TabsContent value="home-sessions" className="space-y-4">
          {/* Gender-Specific Home Session Information */}
          {userGender === 'female' && (
            <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                      <Home className="h-6 w-6 text-pink-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-pink-700 dark:text-pink-400 mb-2">
                      Safe & Comfortable Home Training for Women
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      Our home training sessions are designed with your comfort and safety in mind:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 mt-1">✓</span>
                        <span><strong>Privacy & Comfort:</strong> Train in your own space with female-friendly trainers who respect your boundaries</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 mt-1">✓</span>
                        <span><strong>Hormonal Awareness:</strong> Trainers understand menstrual cycles and adjust workouts accordingly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 mt-1">✓</span>
                        <span><strong>Postnatal Support:</strong> Specialized programs for postpartum recovery and strength building</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 mt-1">✓</span>
                        <span><strong>Body-Positive Approach:</strong> Focus on health and strength, not just appearance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 mt-1">✓</span>
                        <span><strong>Flexible Scheduling:</strong> Book sessions that work around your schedule and energy levels</span>
                      </li>
                    </ul>
                    <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                      <p className="text-xs text-pink-700 dark:text-pink-300">
                        <strong>Note:</strong> All trainers are vetted for professionalism and create safe, supportive training environments. 
                        You can request a female trainer specifically if preferred.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {userGender === 'male' && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Home className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                      Professional Home Training Sessions
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      Get expert training in the comfort of your home with our certified trainers:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span><strong>Convenience:</strong> Train at your preferred location and time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span><strong>Personalized Programs:</strong> Customized workouts based on your goals and equipment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span><strong>Strength & Performance:</strong> Focus on building muscle, power, and athletic performance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span><strong>Form Correction:</strong> Expert guidance on proper technique and form</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span><strong>Flexible Scheduling:</strong> Book sessions that fit your busy schedule</span>
                      </li>
                    </ul>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Tip:</strong> Our trainers can work with minimal equipment or help you set up a home gym. 
                        Sessions can include strength training, cardio, flexibility, and functional movements.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-green-600" />
                <span>Book Home Training Session</span>
              </CardTitle>
              <CardDescription>
                {userGender === 'female'
                  ? "Select a female-friendly trainer from the Trainers tab to book a safe and personalized home session"
                  : "Select a trainer from the Trainers tab to book a personalized home training session"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {trainers.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <Label className="text-base font-medium mb-2 block">Select a Trainer</Label>
                      <Select 
                        value={selectedTrainer?.id?.toString() || ""} 
                        onValueChange={(value) => {
                          const trainer = trainers.find(t => t.id.toString() === value)
                          setSelectedTrainer(trainer || null)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a trainer for home session" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainers
                            .filter(t => userGender === 'female' ? (t.gender === 'female' || t.female_friendly) : true)
                            .map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id.toString()}>
                              {trainer.name} - ₹{trainer.hourly_rate}/hr
                              {userGender === 'female' && trainer.female_friendly && ' (Women-Safe)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedTrainer && (
                      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={selectedTrainer.avatar_url} alt={selectedTrainer.name} />
                              <AvatarFallback>{selectedTrainer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{selectedTrainer.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{selectedTrainer.specialization}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span>{selectedTrainer.rating.toFixed(1)}</span>
                                  <span className="text-gray-500">({selectedTrainer.review_count} reviews)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                  <span>{selectedTrainer.location}</span>
                                </div>
                                <div className="font-semibold text-green-600">
                                  ₹{selectedTrainer.hourly_rate}/hr
                                </div>
                              </div>
                              {userGender === 'female' && selectedTrainer.female_friendly && (
                                <Badge className="mt-2 bg-pink-100 text-pink-700 border-pink-200">
                                  Women-Safe Training
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 mb-4">
                      <Home className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Ready to train at home?</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                      {userGender === 'female'
                        ? "Browse our selection of female-friendly trainers who specialize in women's fitness and create safe, supportive training environments."
                        : "Browse our certified trainers who can help you achieve your fitness goals with personalized home training sessions."}
                    </p>
                    <Button 
                      onClick={() => {
                        const trainersTab = document.querySelector('[value="trainers"]') as HTMLElement
                        trainersTab?.click()
                      }}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      Browse Trainers
                    </Button>
                  </div>
                )}

                {/* What to Expect Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
                  <Card className="border-0 bg-gray-50 dark:bg-gray-800/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold">Session Details</h4>
                      </div>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>• 1-2 hour sessions</li>
                        <li>• Flexible scheduling</li>
                        <li>• Equipment provided if needed</li>
                        <li>• Progress tracking included</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-gray-50 dark:bg-gray-800/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold">What's Included</h4>
                      </div>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Personalized workout plan</li>
                        <li>• Form correction & technique</li>
                        {userGender === 'female' && (
                          <>
                            <li>• Hormonal cycle awareness</li>
                            <li>• Women-specific modifications</li>
                          </>
                        )}
                        {userGender === 'male' && (
                          <>
                            <li>• Strength & performance focus</li>
                            <li>• Athletic training methods</li>
                          </>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Details Dialog */}
      <Dialog open={planDetailsDialogOpen} onOpenChange={setPlanDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-pink-600" />
              {selectedPlanDetails?.name}
            </DialogTitle>
            <DialogDescription>{selectedPlanDetails?.description}</DialogDescription>
          </DialogHeader>
          {selectedPlanDetails && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="text-lg font-bold text-pink-600">{selectedPlanDetails.duration_weeks} weeks</p>
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Daily Calories</p>
                  <p className="text-lg font-bold text-pink-600">{selectedPlanDetails.daily_calories}</p>
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Difficulty</p>
                  <p className="text-lg font-bold text-pink-600 capitalize">{selectedPlanDetails.difficulty}</p>
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Price</p>
                  <p className="text-lg font-bold text-pink-600">₹{selectedPlanDetails.price}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Goals</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPlanDetails.goals.map((goal, idx) => (
                    <Badge key={idx} className="bg-pink-100 text-pink-700">
                      {goal.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedPlanDetails.meal_plan && typeof selectedPlanDetails.meal_plan === 'object' && (
                <div>
                  <h4 className="font-semibold mb-3">Meal Plan</h4>
                  <div className="space-y-3">
                    {['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => {
                      const mealData = selectedPlanDetails.meal_plan[meal]
                      if (!mealData) return null
                      return (
                        <div key={meal} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium capitalize">{meal}</h5>
                            {mealData.calories && (
                              <span className="text-sm text-gray-600">{mealData.calories} calories</span>
                            )}
                          </div>
                          {mealData.suggestions && Array.isArray(mealData.suggestions) && (
                            <ul className="space-y-1">
                              {mealData.suggestions.map((suggestion: string, idx: number) => (
                                <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                                  • {suggestion}
                                </li>
                              ))}
                            </ul>
                          )}
                          {mealData.protein && (
                            <div className="mt-2 text-xs text-gray-600">
                              Protein: {mealData.protein} | Carbs: {mealData.carbs} | Fat: {mealData.fat}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedPlanDetails.trainer_name && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-sm">
                    <span className="font-medium">Created by:</span> {selectedPlanDetails.trainer_name}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPlanDetailsDialogOpen(false)}
              className="rounded-xl"
            >
              Close
            </Button>
            <Button
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl"
              onClick={() => {
                toast.success("Diet plan saved to your profile!")
                setPlanDetailsDialogOpen(false)
              }}
            >
              Save Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-purple-600" />
              Book Home Session
            </DialogTitle>
            <DialogDescription>
              {selectedTrainer && (
                <>
                  Book a session with <strong>{selectedTrainer.name}</strong>
                  <br />
                  Rate: ₹{selectedTrainer.hourly_rate}/hour
                  {userGender === 'female' && selectedTrainer.female_friendly && (
                    <span className="block mt-2 text-xs text-pink-600">
                      ✓ Female-friendly trainer - Safe and supportive environment
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Session Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Session Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours) *</Label>
                <Select value={bookingDuration} onValueChange={setBookingDuration}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="1.5">1.5 hours</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Session Type *</Label>
                <Select value={bookingType} onValueChange={setBookingType}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal_training">Personal Training</SelectItem>
                    <SelectItem value="nutrition_consultation">Nutrition Consultation</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Your Address *</Label>
              <Input
                id="location"
                placeholder="Enter your home address"
                value={bookingLocation}
                onChange={(e) => setBookingLocation(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requests or notes..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                className="min-h-[100px] rounded-xl"
              />
            </div>
            
            {selectedTrainer && bookingDate && bookingTime && bookingDuration && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-medium mb-1">Total Cost:</p>
                <p className="text-3xl font-bold text-purple-600">
                  ₹{(selectedTrainer.hourly_rate * parseFloat(bookingDuration)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ₹{selectedTrainer.hourly_rate}/hr × {bookingDuration} {parseFloat(bookingDuration) === 1 ? 'hour' : 'hours'}
                </p>
              </div>
            )}

            {/* Gender-Specific Tips */}
            {userGender === 'female' && selectedTrainer && (
              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-pink-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-pink-700 dark:text-pink-300">
                    <p className="font-medium mb-1">Women-Friendly Training Tips:</p>
                    <ul className="space-y-1 text-pink-600 dark:text-pink-400">
                      <li>• Feel free to communicate your comfort level and any concerns</li>
                      <li>• Trainer will adjust workouts based on your menstrual cycle if needed</li>
                      <li>• All sessions are conducted in a safe, respectful environment</li>
                      <li>• You can request breaks or modifications at any time</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {userGender === 'male' && selectedTrainer && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Training Session Tips:</p>
                    <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                      <li>• Trainer will assess your current fitness level and goals</li>
                      <li>• Focus on proper form and technique to prevent injuries</li>
                      <li>• Sessions can be adapted to your available equipment</li>
                      <li>• Progress tracking and adjustments will be provided</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBookingDialogOpen(false)}
              disabled={bookingLoading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookingSubmit}
              disabled={bookingLoading || !bookingDate || !bookingTime || !bookingLocation}
              className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white shadow-sm rounded-xl"
            >
              {bookingLoading ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
