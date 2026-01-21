"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Search, MessageCircle, UserPlus, Check, X, MapPin, Clock, Target, Send, Loader2 } from "lucide-react"

interface Partner {
  id: string
  name: string
  username: string
  avatar: string
  fitnessLevel: "Beginner" | "Intermediate" | "Advanced"
  goals: string[]
  location: string
  distance: number
  lastActive: string
  bio: string
  workoutsCompleted: number
  isOnline: boolean
}

interface PartnerRequest {
  id: string
  from: Partner
  message: string
  timestamp: string
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
}

const mockPartners: Partner[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    username: "sarahfit",
    avatar: "/placeholder.svg?height=40&width=40",
    fitnessLevel: "Intermediate",
    goals: ["Weight Loss", "Cardio"],
    location: "Downtown Gym",
    distance: 2.5,
    lastActive: "2 hours ago",
    bio: "Love morning workouts and trying new fitness classes!",
    workoutsCompleted: 156,
    isOnline: true,
  },
  {
    id: "2",
    name: "Mike Chen",
    username: "mikestrong",
    avatar: "/placeholder.svg?height=40&width=40",
    fitnessLevel: "Advanced",
    goals: ["Strength Training", "Muscle Gain"],
    location: "Iron Paradise Gym",
    distance: 1.8,
    lastActive: "30 minutes ago",
    bio: "Powerlifter looking for training partners. Let's get strong together!",
    workoutsCompleted: 234,
    isOnline: true,
  },
  {
    id: "3",
    name: "Emma Wilson",
    username: "emmayoga",
    avatar: "/placeholder.svg?height=40&width=40",
    fitnessLevel: "Beginner",
    goals: ["Flexibility", "General Fitness"],
    location: "Zen Fitness Studio",
    distance: 3.2,
    lastActive: "1 day ago",
    bio: "New to fitness, looking for supportive workout buddies!",
    workoutsCompleted: 23,
    isOnline: false,
  },
  {
    id: "4",
    name: "David Rodriguez",
    username: "davidrun",
    avatar: "/placeholder.svg?height=40&width=40",
    fitnessLevel: "Intermediate",
    goals: ["Endurance", "Running"],
    location: "City Park",
    distance: 4.1,
    lastActive: "5 hours ago",
    bio: "Marathon runner seeking running partners for long distance training.",
    workoutsCompleted: 189,
    isOnline: false,
  },
]

const mockRequests: PartnerRequest[] = [
  {
    id: "1",
    from: mockPartners[0],
    message: "Hi! I saw we have similar fitness goals. Would you like to be workout partners?",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    from: mockPartners[1],
    message: "Looking for a lifting partner. Interested in training together?",
    timestamp: "1 day ago",
  },
]

const mockCurrentPartners: Partner[] = [mockPartners[2], mockPartners[3]]

export default function PartnerFinder() {
  const [searchQuery, setSearchQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [goalFilter, setGoalFilter] = useState("all")
  const [partners, setPartners] = useState<Partner[]>([])
  const [requests, setRequests] = useState<PartnerRequest[]>(mockRequests)
  const [currentPartners, setCurrentPartners] = useState<Partner[]>(mockCurrentPartners)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [chatMessages, setChatMessages] = useState<{ [key: string]: ChatMessage[] }>({
    "3": [
      {
        id: "1",
        senderId: "3",
        senderName: "Emma Wilson",
        message: "Hey! Ready for our workout session tomorrow?",
        timestamp: "10:30 AM",
      },
      {
        id: "2",
        senderId: "me",
        senderName: "You",
        message: "What time works best for you?",
        timestamp: "10:32 AM",
      },
      {
        id: "3",
        senderId: "3",
        senderName: "Emma Wilson",
        message: "How about 7 AM? I know it's early but the gym is less crowded.",
        timestamp: "10:35 AM",
      },
      {
        id: "4",
        senderId: "me",
        senderName: "You",
        message: "Perfect! See you at 7 AM sharp 💪",
        timestamp: "10:36 AM",
      },
    ],
    "4": [
      {
        id: "1",
        senderId: "4",
        senderName: "David Rodriguez",
        message: "Want to go for a run this weekend?",
        timestamp: "9:15 AM",
      },
      {
        id: "2",
        senderId: "me",
        senderName: "You",
        message: "Sounds great! What distance are you thinking?",
        timestamp: "9:20 AM",
      },
    ],
  })
  const [chatInputs, setChatInputs] = useState<{ [key: string]: string }>({})
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [connectingPartners, setConnectingPartners] = useState<Set<string>>(new Set())
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchPartners()
  }, [searchQuery, levelFilter, goalFilter])

  const fetchPartners = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.95) {
            reject(new Error("Network error: Unable to fetch partners"))
          } else {
            resolve(true)
          }
        }, 500)
      })

      let filteredPartners = mockPartners.filter((partner) => !currentPartners.some((cp) => cp.id === partner.id))

      if (searchQuery) {
        filteredPartners = filteredPartners.filter(
          (partner) =>
            partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            partner.username.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      }

      if (levelFilter !== "all") {
        filteredPartners = filteredPartners.filter((partner) => partner.fitnessLevel.toLowerCase() === levelFilter)
      }

      if (goalFilter !== "all") {
        filteredPartners = filteredPartners.filter((partner) =>
          partner.goals.some((goal) => goal.toLowerCase().includes(goalFilter.toLowerCase())),
        )
      }

      setPartners(filteredPartners)
    } catch (error) {
      console.error("Error fetching partners:", error)
      setError(error instanceof Error ? error.message : "Failed to load partners")
      setPartners(mockPartners.filter((partner) => !currentPartners.some((cp) => cp.id === partner.id)))
    } finally {
      setIsLoading(false)
    }
  }

  const sendPartnerRequest = async (partnerId: string) => {
    setConnectingPartners((prev) => new Set(prev).add(partnerId))

    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.85) {
            reject(new Error("Connection failed: Unable to send partner request"))
          } else {
            resolve(true)
          }
        }, 1500)
      })

      setPartners(partners.filter((p) => p.id !== partnerId))

      const partner = partners.find((p) => p.id === partnerId)
      if (partner) {
        console.log(`Partner request sent to ${partner.name}`)
      }
    } catch (error) {
      console.error("Error sending partner request:", error)
      setError(error instanceof Error ? error.message : "Failed to send partner request")
    } finally {
      setConnectingPartners((prev) => {
        const newSet = new Set(prev)
        newSet.delete(partnerId)
        return newSet
      })
    }
  }

  const openChat = (partner: Partner) => {
    setSelectedPartner(partner)
    setIsDialogOpen(true)
    setError(null)

    // Initialize chat if it doesn't exist
    if (!chatMessages[partner.id]) {
      setChatMessages((prev) => ({
        ...prev,
        [partner.id]: [],
      }))
    }

    // Initialize chat input for this partner if it doesn't exist
    if (!chatInputs[partner.id]) {
      setChatInputs((prev) => ({
        ...prev,
        [partner.id]: "",
      }))
    }

    // Set the current message to this partner's input
    setNewMessage(chatInputs[partner.id] || "")
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPartner || sendingMessage) return

    setSendingMessage(true)
    const messageText = newMessage.trim()
    setNewMessage("")

    // Clear the input for this partner
    setChatInputs((prev) => ({
      ...prev,
      [selectedPartner.id]: "",
    }))

    try {
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.95) {
            reject(new Error("Failed to send message"))
          } else {
            resolve(true)
          }
        }, 800)
      })

      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: "me",
        senderName: "You",
        message: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setChatMessages((prev) => ({
        ...prev,
        [selectedPartner.id]: [...(prev[selectedPartner.id] || []), message],
      }))

      // Simulate partner response after a delay
      setTimeout(
        () => {
          const responses = [
            "That sounds great!",
            "I'm looking forward to it!",
            "Let's do this! 💪",
            "Perfect timing!",
            "Count me in!",
            "Awesome, see you there!",
          ]

          const response: ChatMessage = {
            id: (Date.now() + 1).toString(),
            senderId: selectedPartner.id,
            senderName: selectedPartner.name,
            message: responses[Math.floor(Math.random() * responses.length)],
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }

          setChatMessages((prev) => ({
            ...prev,
            [selectedPartner.id]: [...(prev[selectedPartner.id] || []), response],
          }))
        },
        2000 + Math.random() * 3000,
      )
    } catch (error) {
      console.error("Error sending message:", error)
      setError(error instanceof Error ? error.message : "Failed to send message")
      setNewMessage(messageText) // Restore message on error
      setChatInputs((prev) => ({
        ...prev,
        [selectedPartner.id]: messageText,
      }))
    } finally {
      setSendingMessage(false)
    }
  }

  const acceptRequest = async (requestId: string) => {
    try {
      const request = requests.find((r) => r.id === requestId)
      if (request) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setCurrentPartners([...currentPartners, request.from])
        setRequests(requests.filter((r) => r.id !== requestId))
      }
    } catch (error) {
      console.error("Error accepting request:", error)
      setError("Failed to accept partner request")
    }
  }

  const declineRequest = async (requestId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setRequests(requests.filter((r) => r.id !== requestId))
    } catch (error) {
      console.error("Error declining request:", error)
      setError("Failed to decline partner request")
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const retryFetch = () => {
    setError(null)
    fetchPartners()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (value: string) => {
    setNewMessage(value)
    if (selectedPartner) {
      setChatInputs((prev) => ({
        ...prev,
        [selectedPartner.id]: value,
      }))
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      // Save current input state when closing dialog
      if (selectedPartner) {
        setChatInputs((prev) => ({
          ...prev,
          [selectedPartner.id]: newMessage,
        }))
      }
      setSelectedPartner(null)
      setNewMessage("")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fitness Partners
          </CardTitle>
          <CardDescription>
            Find your perfect workout buddy and connect with like-minded fitness enthusiasts
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-800">
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <Button onClick={retryFetch} size="sm" variant="outline" className="bg-transparent">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="find" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="find">Find Partners</TabsTrigger>
          <TabsTrigger value="current" className="relative">
            My Partners
            {currentPartners.length > 0 && <Badge className="ml-2 h-5 w-5 p-0 text-xs">{currentPartners.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Partner Requests
            {requests.length > 0 && <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-red-500">{requests.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Find Partners */}
        <TabsContent value="find" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for partners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by fitness level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={goalFilter} onValueChange={setGoalFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Goals</SelectItem>
                    <SelectItem value="weight">Weight Loss</SelectItem>
                    <SelectItem value="muscle">Muscle Gain</SelectItem>
                    <SelectItem value="strength">Strength Building</SelectItem>
                    <SelectItem value="endurance">Endurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Partners List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : partners.length > 0 ? (
              partners.map((partner) => (
                <Card key={partner.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={partner.avatar || "/placeholder.svg"} alt={partner.name} />
                          <AvatarFallback>
                            {partner.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {partner.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{partner.name}</h3>
                          <Badge className={getLevelColor(partner.fitnessLevel)}>{partner.fitnessLevel}</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">@{partner.username}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{partner.distance}km away</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{partner.lastActive}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {partner.goals.slice(0, 2).map((goal, index) => (
                            <Badge key={index} variant="secondary">
                              {goal}
                            </Badge>
                          ))}
                          {partner.goals.length > 2 && <Badge variant="secondary">+{partner.goals.length - 2}</Badge>}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{partner.bio}</p>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => sendPartnerRequest(partner.id)}
                            className="gap-1"
                            disabled={connectingPartners.has(partner.id)}
                          >
                            {connectingPartners.has(partner.id) ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3" />
                                Connect
                              </>
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 bg-transparent"
                            onClick={() => openChat(partner)}
                          >
                            <MessageCircle className="h-3 w-3" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No partners found</h3>
                <p className="text-muted-foreground">Try adjusting your search filters or check back later</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Current Partners */}
        <TabsContent value="current" className="space-y-6">
          {currentPartners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPartners.map((partner) => (
                <Card key={partner.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={partner.avatar || "/placeholder.svg"} alt={partner.name} />
                          <AvatarFallback>
                            {partner.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {partner.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{partner.name}</h3>
                          <Badge className={getLevelColor(partner.fitnessLevel)}>{partner.fitnessLevel}</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">@{partner.username}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>{partner.workoutsCompleted} workouts</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{partner.lastActive}</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 bg-transparent"
                          onClick={() => openChat(partner)}
                        >
                          <MessageCircle className="h-3 w-3" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No current partners</h3>
              <p className="text-muted-foreground">
                Start connecting with other fitness enthusiasts to build your network
              </p>
            </div>
          )}
        </TabsContent>

        {/* Partner Requests */}
        <TabsContent value="requests" className="space-y-6">
          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={request.from.avatar || "/placeholder.svg"} alt={request.from.name} />
                        <AvatarFallback>
                          {request.from.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{request.from.name}</h3>
                          <Badge className={getLevelColor(request.from.fitnessLevel)}>
                            {request.from.fitnessLevel}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">wants to connect with you</p>

                        <p className="text-sm mb-3">{request.message}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <Clock className="h-3 w-3" />
                          <span>{request.timestamp}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => acceptRequest(request.id)} className="gap-1">
                            <Check className="h-3 w-3" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => declineRequest(request.id)}
                            className="gap-1"
                          >
                            <X className="h-3 w-3" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No pending requests</h3>
              <p className="text-muted-foreground">
                New partner requests will appear here when someone wants to connect
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Chat Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedPartner?.avatar || "/placeholder.svg"} alt={selectedPartner?.name} />
                <AvatarFallback>
                  {selectedPartner?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span>Chat with {selectedPartner?.name}</span>
                {selectedPartner?.isOnline && <span className="text-xs text-green-600 font-normal">Online</span>}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg min-h-[300px] max-h-[400px]">
              {selectedPartner && chatMessages[selectedPartner.id]?.length > 0 ? (
                chatMessages[selectedPartner.id].map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        message.senderId === "me" ? "bg-blue-500 text-white" : "bg-white border border-gray-200"
                      }`}
                    >
                      <p className="break-words">{message.message}</p>
                      <p className={`text-xs mt-1 ${message.senderId === "me" ? "text-blue-100" : "text-gray-500"}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-sm">Start a conversation with {selectedPartner?.name}!</p>
                  <p className="text-gray-400 text-xs mt-1">Send a message to break the ice</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-2 flex-shrink-0">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sendingMessage}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim() || sendingMessage} className="px-3">
                {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
