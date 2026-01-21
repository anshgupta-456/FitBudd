"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { 
  Heart, 
  Users, 
  MapPin, 
  Star, 
  Zap, 
  Calendar,
  Dumbbell,
  Camera,
  ArrowRight,
  Sparkles,
  Clock,
  MessageSquare,
  UserPlus,
  Check,
  Loader2,
  Send,
  Building2,
  Plus,
  MoreHorizontal
} from "lucide-react"
import { toast } from "sonner"

// Types
interface Connection {
  id: string
  name: string
  avatar: string
  age: number
  fitnessLevel: string
  location: string
  goals: string[]
  bio: string
  rating: number
  isOnline: boolean
  lastSeen: string
  lastMessage?: string
  unreadCount?: number
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
}

// Will be populated from backend recommendations
const fitConnections: Connection[] = []

const mockChatMessages: { [key: string]: ChatMessage[] } = {
  "1": [
    {
      id: "1",
      senderId: "2",
      senderName: "Akaksha Singh",
      message: "Want to go for a run this weekend?",
      timestamp: "1 hour ago"
    },
    {
      id: "2",
      senderId: "user",
      senderName: "You",
      message: "Absolutely! See you at 7 AM at the gym.",
      timestamp: "5 min ago"
    }
  ],
  "2": [
    {
      id: "1",
      senderId: "1",
      senderName: "Aaniya Tomar",
      message: "Hey! Ready for our workout session tomorrow?",
      timestamp: "10 min ago"
    },
    {
      id: "2",
      senderId: "user",
      senderName: "You",
      message: "Absolutely! See you at 7 AM at the gym.",
      timestamp: "5 min ago"
    }
  ]
}

export default function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [connections, setConnections] = useState<Connection[]>(fitConnections)
  const [chatMessages, setChatMessages] = useState<{ [key: string]: ChatMessage[] }>(mockChatMessages)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedChatPartner, setSelectedChatPartner] = useState<Connection | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        if (!user?.id) return
        const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'
        const res = await fetch(`${base}/api/partners/connections?user_id=${user.id}&status=accepted`)
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to load')
        const mapped: Connection[] = (data.connections || []).map((p: any) => ({
          id: String(p.id),
          name: p.name,
          avatar: p.avatar_url || "/placeholder-user.jpg",
          age: 0,
          location: p.location || '',
          fitnessLevel: (p.fitness_level || 'Beginner').charAt(0).toUpperCase() + (p.fitness_level || 'Beginner').slice(1),
          goals: p.goals || [],
          bio: p.bio || '',
          rating: 4.7,
          isOnline: true,
          lastSeen: 'recently',
        }))
        setConnections(mapped)
      } catch (e) {
        // keep empty on failure
      }
    }
    fetchConnections()
  }, [user?.id])

  const openChat = (connection: Connection) => {
    setSelectedChatPartner(connection)
    setIsChatOpen(true)
  }

  const sendMessage = async (connectionId: string) => {
    if (!newMessage.trim() || sendingMessage) return
    
    const connection = connections.find(c => c.id === connectionId) || selectedChatPartner
    if (!connection) return
    
    setSendingMessage(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: "user",
        senderName: "You",
        message: newMessage,
        timestamp: "Just now"
      }
      
      setChatMessages(prev => ({
        ...prev,
        [connectionId]: [...(prev[connectionId] || []), message]
      }))
      setNewMessage("")
      
      toast.success("Message sent!", {
        duration: 2000,
      })

      // Simulate partner response after a delay
      setTimeout(() => {
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
          senderId: connection.id,
          senderName: connection.name,
          message: responses[Math.floor(Math.random() * responses.length)],
          timestamp: "Just now"
        }

        setChatMessages(prev => ({
          ...prev,
          [connectionId]: [...(prev[connectionId] || []), response]
        }))
      }, 2000 + Math.random() * 3000)
      
    } catch (error) {
      toast.error("Failed to send message", {
        description: "Please try again.",
        duration: 4000,
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && selectedChatPartner) {
      sendMessage(selectedChatPartner.id)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to FitBudd
          </h1>
          
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Connect with fitness enthusiasts, find your perfect workout partner, and achieve your goals together. 
          Your fitness journey starts with the right connections.
        </p>
      </div>

      {/* Fit Connect Section */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-purple-600" />
                <span>Fit Connect</span>
              </CardTitle>
              <CardDescription>
                Your fitness connections and chat with workout partners
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              // Navigate to partners tab by dispatching a custom event
              try {
                window.dispatchEvent(new CustomEvent('FitBudd:navigate', { detail: { tab: 'partners' } }))
              } catch {}
              
              // As a fallback, try changing hash for client logic
              try { location.hash = '#partners' } catch {}
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Find More
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {connections.map((connection) => (
              <Card key={connection.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={connection.avatar} alt={connection.name} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white">
                          {connection.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {connection.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">{connection.name}</h3>
                        {connection.unreadCount && connection.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                            {connection.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {connection.fitnessLevel}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-500">{connection.rating}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {connection.lastMessage || connection.bio}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{connection.lastSeen}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openChat(connection)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gym Listing Card */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Find Nearby Gyms</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Discover fitness centers, check equipment, and find the perfect gym for your workouts
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>12 gyms nearby</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>4.8 avg rating</span>
                  </div>
                </div>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              Browse Gyms
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Scheduling Card */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Schedule Workouts</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Plan your fitness routine, set reminders, and coordinate with your workout partners
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>3 workouts this week</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>2 with partners</span>
                  </div>
                </div>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600">
              Schedule Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Jump into your fitness journey with these quick actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              className="h-auto p-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <div className="flex flex-col items-center space-y-2 text-white">
                <Users className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Find Partners</div>
                  <div className="text-xs opacity-90">Connect with fitness buddies</div>
                </div>
              </div>
            </Button>
            
            <Button
              className="h-auto p-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <div className="flex flex-col items-center space-y-2 text-white">
                <Camera className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Form Analysis</div>
                  <div className="text-xs opacity-90">Check your exercise form</div>
                </div>
              </div>
            </Button>
            
            <Button
              className="h-auto p-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <div className="flex flex-col items-center space-y-2 text-white">
                <Dumbbell className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Start Workout</div>
                  <div className="text-xs opacity-90">Begin your fitness session</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pb-3">
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedChatPartner?.avatar || "/placeholder-user.jpg"} alt={selectedChatPartner?.name} />
                <AvatarFallback>
                  {selectedChatPartner?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-gray-900 dark:text-white">Chat with {selectedChatPartner?.name}</span>
                {selectedChatPartner?.isOnline && <span className="text-xs text-green-600 dark:text-green-400 font-normal">Online</span>}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[300px] max-h-[400px]">
              {selectedChatPartner && chatMessages[selectedChatPartner.id]?.length > 0 ? (
                chatMessages[selectedChatPartner.id].map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        message.senderId === "user" 
                          ? "bg-purple-600 dark:bg-purple-700 text-white" 
                          : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <p className="break-words">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === "user" 
                          ? "text-purple-200 dark:text-purple-300" 
                          : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Start a conversation with {selectedChatPartner?.name}!</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Send a message to break the ice</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-2 flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-3">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sendingMessage}
                className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
              <Button 
                onClick={() => selectedChatPartner && sendMessage(selectedChatPartner.id)} 
                disabled={!newMessage.trim() || sendingMessage || !selectedChatPartner}
                className="px-3 bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 text-white"
              >
                {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
