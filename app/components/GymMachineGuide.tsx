"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Filter, BookOpen, Target, Zap } from "lucide-react"
import PostureChecker from "./PostureChecker"

export default function GymMachineGuide() {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [selectedMachine, setSelectedMachine] = useState<{
    id: number
    name: string
    category: string
    muscleGroups: string[]
  } | null>(null)
  const [showPostureChecker, setShowPostureChecker] = useState(false)

  const gymMachines = [
    {
      id: 1,
      name: "Treadmill",
      category: "cardio",
      difficulty: "beginner",
      muscleGroups: ["legs", "cardiovascular"],
      description: "Perfect for walking, jogging, and running workouts",
      instructions: [
        "Step onto the treadmill and hold the handrails",
        "Start with a slow walking pace (2-3 mph)",
        "Gradually increase speed as you warm up",
        "Maintain good posture - look ahead, not down",
        "Use the emergency stop clip for safety",
      ],
      tips: [
        "Start with 10-15 minutes for beginners",
        "Increase incline for added challenge",
        "Stay hydrated throughout your workout",
        "Cool down with a 5-minute walk",
      ],
      safetyNotes: [
        "Always use the safety clip",
        "Don't hold onto handrails while running",
        "Step off to the sides, not backwards",
      ],
      caloriesPerMinute: 10,
      image: "images/treadmill.jpg",
    },
    {
      id: 2,
      name: "Leg Press",
      category: "strength",
      difficulty: "intermediate",
      muscleGroups: ["quadriceps", "glutes", "hamstrings"],
      description: "Build lower body strength with controlled resistance",
      instructions: [
        "Sit on the leg press machine with back flat against the pad",
        "Place feet shoulder-width apart on the footplate",
        "Release the safety handles",
        "Lower the weight by bending your knees to 90 degrees",
        "Press through your heels to return to starting position",
      ],
      tips: [
        "Keep your core engaged throughout",
        "Don't lock your knees at the top",
        "Control the weight on both up and down phases",
        "Start with lighter weight to learn proper form",
      ],
      safetyNotes: [
        "Never let knees cave inward",
        "Keep feet flat on the footplate",
        "Use safety handles when adjusting position",
      ],
      caloriesPerMinute: 8,
      image: "images/legpress.jpg",
    },
    {
      id: 3,
      name: "Lat Pulldown",
      category: "strength",
      difficulty: "beginner",
      muscleGroups: ["lats", "biceps", "rhomboids"],
      description: "Develop upper body pulling strength and back muscles",
      instructions: [
        "Sit at the lat pulldown machine",
        "Adjust the thigh pad to secure your legs",
        "Grab the bar with a wide overhand grip",
        "Pull the bar down to your upper chest",
        "Slowly return to the starting position",
      ],
      tips: [
        "Lean back slightly during the pull",
        "Focus on squeezing your shoulder blades together",
        "Don't use momentum to pull the weight",
        "Keep your chest up throughout the movement",
      ],
      safetyNotes: [
        "Don't pull the bar behind your neck",
        "Control the weight on the return",
        "Ensure proper seat height adjustment",
      ],
      caloriesPerMinute: 7,
      image: "images/latpulldown.jpg",
    },
    {
      id: 4,
      name: "Chest Press",
      category: "strength",
      difficulty: "beginner",
      muscleGroups: ["chest", "shoulders", "triceps"],
      description: "Build chest and arm strength with guided motion",
      instructions: [
        "Adjust the seat so handles are at chest level",
        "Sit with back flat against the pad",
        "Grip handles with palms facing down",
        "Press handles forward until arms are extended",
        "Slowly return to starting position",
      ],
      tips: [
        "Keep your wrists straight and strong",
        "Don't arch your back excessively",
        "Breathe out as you press forward",
        "Control the negative portion of the movement",
      ],
      safetyNotes: ["Ensure proper seat adjustment", "Don't lock elbows completely", "Keep feet flat on the floor"],
      caloriesPerMinute: 7,
      image: "images/chest_press.jpg",
    },
    {
      id: 5,
      name: "Rowing Machine",
      category: "cardio",
      difficulty: "intermediate",
      muscleGroups: ["back", "arms", "legs", "core"],
      description: "Full-body cardio workout with low impact",
      instructions: [
        "Sit on the rowing machine with feet secured",
        "Grab the handle with both hands",
        "Start with legs bent, arms extended",
        "Push with legs first, then pull with arms",
        "Reverse the motion to return to start",
      ],
      tips: [
        "Maintain a strong core throughout",
        "Keep your back straight",
        "Focus on smooth, controlled movements",
        "Aim for a 1:2 ratio of pull to recovery time",
      ],
      safetyNotes: ["Don't round your back", "Keep knees aligned with toes", "Start with shorter sessions"],
      caloriesPerMinute: 12,
      image: "/images/rowingmachine.jpg",
    },
    {
      id: 6,
      name: "Cable Machine",
      category: "strength",
      difficulty: "advanced",
      muscleGroups: ["full body"],
      description: "Versatile machine for countless exercise variations",
      instructions: [
        "Select appropriate weight on the stack",
        "Choose the right attachment for your exercise",
        "Position yourself according to the specific movement",
        "Maintain proper form throughout the range of motion",
        "Control both the lifting and lowering phases",
      ],
      tips: [
        "Start with lighter weights to master form",
        "Keep core engaged for stability",
        "Use full range of motion",
        "Try different angles for muscle variation",
      ],
      safetyNotes: [
        "Check all connections before starting",
        "Don't let weights slam down",
        "Be aware of others around the machine",
      ],
      caloriesPerMinute: 6,
      image: "images/cablemachine.jpg",
    },
  ]

  const filteredMachines = gymMachines.filter((machine) => {
    const matchesSearch =
      machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.muscleGroups.some((group) => group.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || machine.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "all" || machine.difficulty === selectedDifficulty

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "cardio":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "strength":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (showPostureChecker) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("posture_analysis", "Posture Analysis")}</h2>
          <Button 
            onClick={() => {
              setShowPostureChecker(false)
              setSelectedMachine(null)
            }} 
            variant="outline"
          >
            {t("back_to_machines", "Back to Machines")}
          </Button>
        </div>
        <PostureChecker machine={selectedMachine} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {t("gym_machine_guide", "Gym Machine Guide")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t(
            "machine_guide_desc",
            "Learn how to use gym equipment safely and effectively with step-by-step instructions and AI-powered form analysis.",
          )}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          onClick={() => {
            setSelectedMachine(null)
            setShowPostureChecker(true)
          }}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
        >
          <Target className="h-4 w-4 mr-2" />
          {t("check_form", "Check My Form")}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-purple-200 dark:border-purple-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-purple-600" />
            <span>{t("search_filter", "Search & Filter")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("search", "Search")}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("search_machines", "Search machines or muscle groups...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("category", "Category")}</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t("all_categories", "All Categories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_categories", "All Categories")}</SelectItem>
                  <SelectItem value="cardio">{t("cardio", "Cardio")}</SelectItem>
                  <SelectItem value="strength">{t("strength", "Strength")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("difficulty", "Difficulty")}</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder={t("all_levels", "All Levels")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_levels", "All Levels")}</SelectItem>
                  <SelectItem value="beginner">{t("beginner", "Beginner")}</SelectItem>
                  <SelectItem value="intermediate">{t("intermediate", "Intermediate")}</SelectItem>
                  <SelectItem value="advanced">{t("advanced", "Advanced")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Machine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMachines.map((machine) => (
          <Card
            key={machine.id}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all duration-300"
          >
            <CardHeader className="pb-4">
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                <img
                  src={machine.image || "/placeholder.svg"}
                  alt={machine.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{machine.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Badge className={getCategoryColor(machine.category)}>
                      {t(machine.category, machine.category)}
                    </Badge>
                    <Badge className={getDifficultyColor(machine.difficulty)}>
                      {t(machine.difficulty, machine.difficulty)}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{machine.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">{t("target_muscles", "Target Muscles")}:</p>
                <div className="flex flex-wrap gap-1">
                  {machine.muscleGroups.map((muscle, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {t(muscle, muscle)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>{machine.caloriesPerMinute} cal/min</span>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t("view_instructions", "View Instructions")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                      <span>{machine.name}</span>
                      <Badge className={getDifficultyColor(machine.difficulty)}>
                        {t(machine.difficulty, machine.difficulty)}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">{machine.description}</DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="instructions" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="instructions">{t("instructions", "Instructions")}</TabsTrigger>
                      <TabsTrigger value="tips">{t("tips", "Tips")}</TabsTrigger>
                      <TabsTrigger value="safety">{t("safety", "Safety")}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="instructions" className="space-y-4">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={machine.image || "/placeholder.svg"}
                          alt={machine.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">{t("step_by_step", "Step-by-Step Instructions")}:</h4>
                        <ol className="space-y-2">
                          {machine.instructions.map((instruction, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </TabsContent>

                    <TabsContent value="tips" className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">{t("pro_tips", "Pro Tips")}:</h4>
                        <ul className="space-y-2">
                          {machine.tips.map((tip, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <Target className="flex-shrink-0 h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </TabsContent>

                    <TabsContent value="safety" className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3 text-red-600 dark:text-red-400">{t("safety_notes", "Safety Notes")}:</h4>
                        <ul className="space-y-2">
                          {machine.safetyNotes.map((note, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <div className="flex-shrink-0 w-4 h-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mt-0.5">
                                <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full"></div>
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() => {
                        setSelectedMachine(machine)
                        setShowPostureChecker(true)
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-green-600"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      {t("check_form_machine", "Check My Form")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMachines.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t("no_machines_found", "No machines found")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t("try_different_search", "Try adjusting your search terms or filters")}
          </p>
        </div>
      )}
    </div>
  )
}
