// "use client"

// import { useState, useEffect } from "react"
// import { useTranslation } from "react-i18next"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Textarea } from "@/components/ui/textarea"
// import { Heart, MapPin, Star, Users, MessageSquare, Plus, Filter, Search, Dumbbell, Calendar, Clock, Trophy, UserPlus } from "lucide-react"

// // Types
// interface Partner {
//   id: string
//   name: string
//   avatar: string
//   age: number
//   fitnessLevel: string
//   location: string
//   goals: string[]
//   bio: string
//   rating: number
//   isOnline: boolean
//   lastSeen: string
//   workoutPreferences: string[]
//   availability: string[]
// }

// interface PartnerRequest {
//   id: string
//   name: string
//   avatar: string
//   message: string
//   timestamp: string
// }

// interface ChatMessage {
//   id: string
//   senderId: string
//   senderName: string
//   message: string
//   timestamp: string
// }

// // Mock data
// const mockPartners: Partner[] = [
//   {
//     id: "1",
//     name: "Alex Johnson",
//     avatar: "/placeholder-user.jpg",
//     age: 28,
//     fitnessLevel: "Intermediate",
//     location: "New York, NY",
//     goals: ["Weight Loss", "Strength"],
//     bio: "Looking for a consistent workout partner for morning sessions. Love weightlifting and cardio!",
//     rating: 4.8,
//     isOnline: true,
//     lastSeen: "2 min ago",
//     workoutPreferences: ["Weightlifting", "Cardio", "CrossFit"],
//     availability: ["Monday", "Wednesday", "Friday", "Saturday"]
//   },
//   {
//     id: "2",
//     name: "Sarah Chen",
//     avatar: "/placeholder-user.jpg",
//     age: 25,
//     fitnessLevel: "Advanced",
//     location: "San Francisco, CA",
//     goals: ["Muscle Gain", "Competition"],
//     bio: "Competitive powerlifter seeking training partners. Available evenings and weekends.",
//     rating: 4.9,
//     isOnline: false,
//     lastSeen: "1 hour ago",
//     workoutPreferences: ["Powerlifting", "Strength Training", "Nutrition"],
//     availability: ["Tuesday", "Thursday", "Saturday", "Sunday"]
//   },
//   {
//     id: "3",
//     name: "Emma Wilson",
//     avatar: "/placeholder-user.jpg",
//     age: 32,
//     fitnessLevel: "Beginner",
//     location: "Austin, TX",
//     goals: ["Weight Loss", "General Fitness"],
//     bio: "New to fitness and looking for a supportive partner to start this journey together!",
//     rating: 4.7,
//     isOnline: true,
//     lastSeen: "Just now",
//     workoutPreferences: ["Yoga", "Walking", "Swimming"],
//     availability: ["Monday", "Tuesday", "Thursday", "Sunday"]
//   },
//   {
//     id: "4",
//     name: "Mike Rodriguez",
//     avatar: "/placeholder-user.jpg",
//     age: 35,
//     fitnessLevel: "Intermediate",
//     location: "Miami, FL",
//     goals: ["Endurance", "Weight Loss"],
//     bio: "Marathon runner looking for training partners. Love outdoor activities and group runs.",
//     rating: 4.6,
//     isOnline: true,
//     lastSeen: "5 min ago",
//     workoutPreferences: ["Running", "Cycling", "Swimming"],
//     availability: ["Monday", "Wednesday", "Friday", "Sunday"]
//   }
// ]

// const mockRequests: PartnerRequest[] = [
//   {
//     id: "1",
//     name: "Jessica Adams",
//     avatar: "/placeholder-user.jpg",
//     message: "Hi! I saw your profile and would love to be workout partners. I'm also into morning workouts!",
//     timestamp: "2 hours ago",
//   },
//   {
//     id: "2",
//     name: "David Kim",
//     avatar: "/placeholder-user.jpg",
//     message: "Hey! Looking for someone to hit the gym with. Your schedule matches mine perfectly.",
//     timestamp: "1 day ago",
//   },
// ]

// const mockCurrentPartners: Partner[] = [mockPartners[2], mockPartners[3]]

// export default function PartnerFinder() {
//   const { t } = useTranslation()
//   const [searchQuery, setSearchQuery] = useState("")
//   const [levelFilter, setLevelFilter] = useState("all")
//   const [goalFilter, setGoalFilter] = useState("all")
//   const [partners, setPartners] = useState<Partner[]>([])
//   const [requests, setRequests] = useState<PartnerRequest[]>(mockRequests)
//   const [currentPartners, setCurrentPartners] = useState<Partner[]>(mockCurrentPartners)
//   const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
//   const [chatMessages, setChatMessages] = useState<{ [key: string]: ChatMessage[] }>({
//     "3": [
//       {
//         id: "1",
//         senderId: "3",
//         senderName: "Emma Wilson",
//         message: "Hey! Ready for our workout session tomorrow?",
//         timestamp: "10 min ago"
//       },
//       {
//         id: "2",
//         senderId: "user",
//         senderName: "You",
//         message: "Absolutely! See you at 7 AM at the gym.",
//         timestamp: "5 min ago"
//       }
//     ]
//   })
//   const [newMessage, setNewMessage] = useState("")

//   useEffect(() => {
//     // Simulate fetching partners
//     setPartners(mockPartners)
//   }, [])

//   const filteredPartners = partners.filter(partner => {
//     const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                          partner.location.toLowerCase().includes(searchQuery.toLowerCase())
//     const matchesLevel = levelFilter === "all" || partner.fitnessLevel.toLowerCase() === levelFilter
//     const matchesGoal = goalFilter === "all" || partner.goals.some(goal => 
//       goal.toLowerCase().includes(goalFilter.toLowerCase())
//     )
//     return matchesSearch && matchesLevel && matchesGoal
//   })

//   const sendPartnerRequest = (partnerId: string) => {
//     console.log(`Sending request to partner ${partnerId}`)
//     // In a real app, this would send a request to the backend
//   }

//   const acceptRequest = (requestId: string) => {
//     const request = requests.find(r => r.id === requestId)
//     if (request) {
//       setRequests(requests.filter(r => r.id !== requestId))
//       // Add to current partners
//       console.log(`Accepted request from ${request.name}`)
//     }
//   }

//   const sendMessage = (partnerId: string) => {
//     if (!newMessage.trim()) return
    
//     const message: ChatMessage = {
//       id: Date.now().toString(),
//       senderId: "user",
//       senderName: "You",
//       message: newMessage,
//       timestamp: "Just now"
//     }
    
//     setChatMessages(prev => ({
//       ...prev,
//       [partnerId]: [...(prev[partnerId] || []), message]
//     }))
//     setNewMessage("")
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="text-center">
//         <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
//           {t("partner_finder_title", "Find Your Workout Partner")}
//         </h2>
//         <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
//           {t("partner_finder_desc", "Connect with like-minded fitness enthusiasts, find accountability partners, and make your fitness journey more fun and social.")}
//         </p>
//       </div>

//       <Tabs defaultValue="discover" className="w-full">
//         <TabsList className="grid w-full grid-cols-4">
//           <TabsTrigger value="discover" className="flex items-center space-x-2">
//             <Search className="h-4 w-4" />
//             <span>{t("discover", "Discover")}</span>
//           </TabsTrigger>
//           <TabsTrigger value="requests" className="flex items-center space-x-2">
//             <UserPlus className="h-4 w-4" />
//             <span>{t("requests", "Requests")} ({requests.length})</span>
//           </TabsTrigger>
//           <TabsTrigger value="partners" className="flex items-center space-x-2">
//             <Users className="h-4 w-4" />
//             <span>{t("my_partners", "My Partners")} ({currentPartners.length})</span>
//           </TabsTrigger>
//           <TabsTrigger value="chat" className="flex items-center space-x-2">
//             <MessageSquare className="h-4 w-4" />
//             <span>{t("chat", "Chat")}</span>
//           </TabsTrigger>
//         </TabsList>

//         {/* Discover Tab */}
//         <TabsContent value="discover" className="space-y-6">
//           {/* Search and Filters */}
//           <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
//             <CardContent className="p-4">
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 <div className="md:col-span-2">
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                     <Input
//                       placeholder={t("search_partners", "Search partners by name or location...")}
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                       className="pl-10"
//                     />
//                   </div>
//                 </div>
//                 <Select value={levelFilter} onValueChange={setLevelFilter}>
//                   <SelectTrigger>
//                     <SelectValue placeholder={t("fitness_level", "Fitness Level")} />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">{t("all_levels", "All Levels")}</SelectItem>
//                     <SelectItem value="beginner">{t("beginner", "Beginner")}</SelectItem>
//                     <SelectItem value="intermediate">{t("intermediate", "Intermediate")}</SelectItem>
//                     <SelectItem value="advanced">{t("advanced", "Advanced")}</SelectItem>
//                   </SelectContent>
//                 </Select>
//                 <Select value={goalFilter} onValueChange={setGoalFilter}>
//                   <SelectTrigger>
//                     <SelectValue placeholder={t("fitness_goals", "Fitness Goals")} />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">{t("all_goals", "All Goals")}</SelectItem>
//                     <SelectItem value="weight loss">{t("weight_loss", "Weight Loss")}</SelectItem>
//                     <SelectItem value="muscle gain">{t("muscle_gain", "Muscle Gain")}</SelectItem>
//                     <SelectItem value="endurance">{t("endurance", "Endurance")}</SelectItem>
//                     <SelectItem value="strength">{t("strength", "Strength")}</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Partners Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredPartners.map((partner) => (
//               <Card key={partner.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
//                 <CardContent className="p-6">
//                   <div className="flex items-start space-x-4">
//                     <div className="relative">
//                       <Avatar className="h-16 w-16">
//                         <AvatarImage src={partner.avatar} alt={partner.name} />
//                         <AvatarFallback>{partner.name.slice(0, 2)}</AvatarFallback>
//                       </Avatar>
//                       {partner.isOnline && (
//                         <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-2 border-white rounded-full"></div>
//                       )}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <h3 className="font-semibold text-lg">{partner.name}</h3>
//                       <p className="text-sm text-gray-600 dark:text-gray-400">
//                         {partner.age} years • {partner.fitnessLevel}
//                       </p>
//                       <div className="flex items-center space-x-1 text-sm text-gray-500">
//                         <MapPin className="h-3 w-3" />
//                         <span>{partner.location}</span>
//                       </div>
//                       <div className="flex items-center space-x-1 mt-1">
//                         <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
//                         <span className="text-sm font-medium">{partner.rating}</span>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
//                     {partner.bio}
//                   </p>
                  
//                   <div className="flex flex-wrap gap-1 mt-3">
//                     {partner.goals.slice(0, 2).map((goal, index) => (
//                       <Badge key={index} variant="secondary" className="text-xs">
//                         {goal}
//                       </Badge>
//                     ))}
//                     {partner.goals.length > 2 && (
//                       <Badge variant="outline" className="text-xs">
//                         +{partner.goals.length - 2}
//                       </Badge>
//                     )}
//                   </div>
                  
//                   <div className="flex space-x-2 mt-4">
//                     <Dialog>
//                       <DialogTrigger asChild>
//                         <Button variant="outline" size="sm" className="flex-1">
//                           {t("view_profile", "View Profile")}
//                         </Button>
//                       </DialogTrigger>
//                       <DialogContent className="max-w-2xl">
//                         <DialogHeader>
//                           <DialogTitle>{partner.name}'s Profile</DialogTitle>
//                         </DialogHeader>
//                         <div className="space-y-4">
//                           <div className="flex items-center space-x-4">
//                             <Avatar className="h-20 w-20">
//                               <AvatarImage src={partner.avatar} alt={partner.name} />
//                               <AvatarFallback>{partner.name.slice(0, 2)}</AvatarFallback>
//                             </Avatar>
//                             <div>
//                               <h3 className="text-xl font-semibold">{partner.name}</h3>
//                               <p className="text-gray-600">{partner.age} years • {partner.fitnessLevel}</p>
//                               <div className="flex items-center space-x-1 text-gray-500">
//                                 <MapPin className="h-4 w-4" />
//                                 <span>{partner.location}</span>
//                               </div>
//                             </div>
//                           </div>
                          
//                           <div>
//                             <h4 className="font-semibold mb-2">{t("bio", "Bio")}</h4>
//                             <p className="text-gray-600">{partner.bio}</p>
//                           </div>
                          
//                           <div>
//                             <h4 className="font-semibold mb-2">{t("fitness_goals", "Fitness Goals")}</h4>
//                             <div className="flex flex-wrap gap-2">
//                               {partner.goals.map((goal, index) => (
//                                 <Badge key={index} variant="secondary">{goal}</Badge>
//                               ))}
//                             </div>
//                           </div>
                          
//                           <div>
//                             <h4 className="font-semibold mb-2">{t("workout_preferences", "Workout Preferences")}</h4>
//                             <div className="flex flex-wrap gap-2">
//                               {partner.workoutPreferences.map((pref, index) => (
//                                 <Badge key={index} variant="outline">{pref}</Badge>
//                               ))}
//                             </div>
//                           </div>
                          
//                           <div>
//                             <h4 className="font-semibold mb-2">{t("availability", "Availability")}</h4>
//                             <div className="flex flex-wrap gap-2">
//                               {partner.availability.map((day, index) => (
//                                 <Badge key={index} variant="outline">{day}</Badge>
//                               ))}
//                             </div>
//                           </div>
//                         </div>
//                       </DialogContent>
//                     </Dialog>
//                     <Button 
//                       size="sm" 
//                       className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
//                       onClick={() => sendPartnerRequest(partner.id)}
//                     >
//                       {t("send_request", "Send Request")}
//                     </Button>
//                   </div>
                  
//                   <p className="text-xs text-gray-500 mt-2">
//                     {partner.isOnline ? t("online_now", "Online now") : `${t("last_seen", "Last seen")} ${partner.lastSeen}`}
//                   </p>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </TabsContent>

//         {/* Requests Tab */}
//         <TabsContent value="requests" className="space-y-6">
//           <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
//             <CardHeader>
//               <CardTitle className="flex items-center space-x-2">
//                 <UserPlus className="h-5 w-5 text-purple-600" />
//                 <span>{t("partner_requests", "Partner Requests")}</span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {requests.length === 0 ? (
//                 <div className="text-center py-8">
//                   <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                   <p className="text-gray-500">{t("no_requests", "No partner requests yet")}</p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {requests.map((request) => (
//                     <div key={request.id} className="flex items-start space-x-4 p-4 border rounded-lg">
//                       <Avatar>
//                         <AvatarImage src={request.avatar} alt={request.name} />
//                         <AvatarFallback>{request.name.slice(0, 2)}</AvatarFallback>
//                       </Avatar>
//                       <div className="flex-1">
//                         <h4 className="font-semibold">{request.name}</h4>
//                         <p className="text-gray-600 text-sm mt-1">{request.message}</p>
//                         <p className="text-xs text-gray-500 mt-2">{request.timestamp}</p>
//                       </div>
//                       <div className="flex space-x-2">
//                         <Button size="sm" variant="outline">
//                           {t("decline", "Decline")}
//                         </Button>
//                         <Button 
//                           size="sm" 
//                           className="bg-gradient-to-r from-green-600 to-blue-600"
//                           onClick={() => acceptRequest(request.id)}
//                         >
//                           {t("accept", "Accept")}
//                         </Button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Partners Tab */}
//         <TabsContent value="partners" className="space-y-6">
//           <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
//             <CardHeader>
//               <CardTitle className="flex items-center space-x-2">
//                 <Users className="h-5 w-5 text-purple-600" />
//                 <span>{t("current_partners", "Current Partners")}</span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {currentPartners.length === 0 ? (
//                 <div className="text-center py-8">
//                   <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                   <p className="text-gray-500">{t("no_partners", "No workout partners yet")}</p>
//                   <p className="text-sm text-gray-400 mt-2">{t("find_partners_prompt", "Discover new partners in the Discover tab!")}</p>
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {currentPartners.map((partner) => (
//                     <div key={partner.id} className="flex items-center space-x-4 p-4 border rounded-lg">
//                       <Avatar>
//                         <AvatarImage src={partner.avatar} alt={partner.name} />
//                         <AvatarFallback>{partner.name.slice(0, 2)}</AvatarFallback>
//                       </Avatar>
//                       <div className="flex-1">
//                         <h4 className="font-semibold">{partner.name}</h4>
//                         <p className="text-sm text-gray-600">{partner.fitnessLevel} • {partner.location}</p>
//                         <div className="flex items-center space-x-1 mt-1">
//                           <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
//                           <span className="text-xs">{partner.rating}</span>
//                         </div>
//                       </div>
//                       <Button 
//                         size="sm" 
//                         variant="outline"
//                         onClick={() => setSelectedPartner(partner)}
//                       >
//                         {t("message", "Message")}
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Chat Tab */}
//         <TabsContent value="chat" className="space-y-6">
//           <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
//             <CardHeader>
//               <CardTitle className="flex items-center space-x-2">
//                 <MessageSquare className="h-5 w-5 text-purple-600" />
//                 <span>{t("chat_with_partners", "Chat with Partners")}</span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {currentPartners.length === 0 ? (
//                 <div className="text-center py-8">
//                   <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                   <p className="text-gray-500">{t("no_chats", "No active chats")}</p>
//                   <p className="text-sm text-gray-400 mt-2">{t("add_partners_to_chat", "Add workout partners to start chatting!")}</p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {currentPartners.map((partner) => (
//                     <div key={partner.id} className="border rounded-lg">
//                       <div className="flex items-center justify-between p-4 border-b">
//                         <div className="flex items-center space-x-3">
//                           <Avatar>
//                             <AvatarImage src={partner.avatar} alt={partner.name} />
//                             <AvatarFallback>{partner.name.slice(0, 2)}</AvatarFallback>
//                           </Avatar>
//                           <div>
//                             <h4 className="font-semibold">{partner.name}</h4>
//                             <p className="text-sm text-gray-600">
//                               {partner.isOnline ? t("online_now", "Online now") : partner.lastSeen}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
                      
//                       <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
//                         {(chatMessages[partner.id] || []).map((message) => (
//                           <div
//                             key={message.id}
//                             className={`flex ${message.senderId === "user" ? "justify-end" : "justify-start"}`}
//                           >
//                             <div
//                               className={`max-w-xs px-3 py-2 rounded-lg ${
//                                 message.senderId === "user"
//                                   ? "bg-purple-600 text-white"
//                                   : "bg-gray-200 dark:bg-gray-700"
//                               }`}
//                             >
//                               <p className="text-sm">{message.message}</p>
//                               <p className={`text-xs mt-1 ${
//                                 message.senderId === "user" ? "text-purple-200" : "text-gray-500"
//                               }`}>
//                                 {message.timestamp}
//                               </p>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
                      
//                       <div className="p-4 border-t">
//                         <div className="flex space-x-2">
//                           <Input
//                             placeholder={t("type_message", "Type a message...")}
//                             value={newMessage}
//                             onChange={(e) => setNewMessage(e.target.value)}
//                             onKeyPress={(e) => e.key === "Enter" && sendMessage(partner.id)}
//                             className="flex-1"
//                           />
//                           <Button 
//                             onClick={() => sendMessage(partner.id)}
//                             size="sm"
//                             className="bg-gradient-to-r from-purple-600 to-pink-600"
//                           >
//                             {t("send", "Send")}
//                           </Button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   )
// }
"use client"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MapPin, Star, Users, MessageSquare, Plus, Filter, Search, Dumbbell, Calendar, Clock, Trophy, UserPlus, Check, X, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Types
interface Partner {
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
  workoutPreferences: string[]
  availability: string[]
}

interface PartnerRequest {
  id: string
  name: string
  avatar: string
  message: string
  timestamp: string
  partnerId: string
  type: "incoming" | "outgoing"
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
}

// Mock data
const mockPartners: Partner[] = [
  {
    id: "1",
    name: "Ansh Gupta",
    avatar: "/male1.jpg",
    age: 21,
    fitnessLevel: "Intermediate",
    location: "New Delhi",
    goals: ["Weight Loss", "Strength"],
    bio: "Looking for a consistent workout partner for morning sessions. Love weightlifting and cardio!",
    rating: 4.8,
    isOnline: true,
    lastSeen: "2 min ago",
    workoutPreferences: ["Weightlifting", "Cardio", "CrossFit"],
    availability: ["Monday", "Wednesday", "Friday", "Saturday"]
  },
  {
    id: "2",
    name: "Krishnendra Singh",
    avatar: "/placeholder-user.jpg",
    age: 21,
    fitnessLevel: "Advanced",
    location: "Mathura, UP",
    goals: ["Muscle Gain", "Competition"],
    bio: "Competitive powerlifter seeking training partners. Available evenings and weekends.",
    rating: 4.9,
    isOnline: false,
    lastSeen: "1 hour ago",
    workoutPreferences: ["Powerlifting", "Strength Training", "Nutrition"],
    availability: ["Tuesday", "Thursday", "Saturday", "Sunday"]
  },
  
 {
    id: "5",
    name: "Arpit Garg",
    avatar: "/placeholder-user.jpg",
    age: 19,
    fitnessLevel: "Beginner",
    location: "Rajasthan ",
    goals: ["Endurance", "Weight Loss"],
    bio: "Marathon runner looking for training partners. Love outdoor activities and group runs.",
    rating: 4.6,
    isOnline: true,
    lastSeen: "5 min ago",
    workoutPreferences: ["Running", "Cycling"],
    availability: ["Monday", "Wednesday", "Friday"]
  },
  {
    id: "6",
    name: "Priyam Saxena",
    avatar: "/placeholder-user.jpg",
    age: 19,
    fitnessLevel: "Intermediate",
    location: "Rampur, UP ",
    goals: ["Endurance", "Weight Loss"],
    bio: "Marathon runner looking for training partners. Love outdoor activities and group runs.",
    rating: 4.6,
    isOnline: true,
    lastSeen: "5 min ago",
    workoutPreferences: ["Running", "Cycling"],
    availability: ["Monday", "Wednesday", "Friday"]
  }
]

const mockRequests: PartnerRequest[] = [
  {
    id: "1",
    name: "Srishti Rana",
    avatar: "/placeholder-user.jpg",
    message: "Hi! I saw your profile and would love to be workout partners. I'm also into morning workouts!",
    timestamp: "2 hours ago",
    partnerId: "5",
    type: "incoming"
  },
  {
    id: "2",
    name: "Ritik Kumar",
    avatar: "/placeholder-user.jpg",
    message: "Hey! Looking for someone to hit the gym with. Your schedule matches mine perfectly.",
    timestamp: "1 day ago",
    partnerId: "6",
    type: "incoming"
  },
]

const mockCurrentPartners: Partner[] = [
  {
    id: "1",
    name: "Aaniya Tomar",
    avatar: "/placeholder-user.jpg",
    age: 20,
    fitnessLevel: "Beginner",
    location: "Uttarakhand",
    goals: ["Weight Loss", "General Fitness"],
    bio: "New to fitness and looking for a supportive partner to start this journey together!",
    rating: 4.7,
    isOnline: true,
    lastSeen: "Just now",
    workoutPreferences: ["Yoga", "Walking", "Swimming"],
    availability: ["Monday", "Tuesday", "Thursday", "Sunday"]
  },
  {
    id: "2",
    name: "Akaksha Singh",
    avatar: "/female1.png",
    age: 19,
    fitnessLevel: "Intermediate",
    location: "Kanpur, UP",
    goals: ["Endurance", "Weight Gain"],
    bio: "Marathon runner looking for training partners. Love outdoor activities and group runs.",
    rating: 4.6,
    isOnline: true,
    lastSeen: "5 min ago",
    workoutPreferences: ["Running", "Cycling", "Swimming"],
    availability: ["Monday", "Wednesday", "Friday", "Sunday"]
  }
]

export default function PartnerFinder() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [goalFilter, setGoalFilter] = useState("all")
  const [partners, setPartners] = useState<Partner[]>([])
  const [requests, setRequests] = useState<PartnerRequest[]>(mockRequests)
  const [pendingRequests, setPendingRequests] = useState<PartnerRequest[]>([])
  const [currentPartners, setCurrentPartners] = useState<Partner[]>(mockCurrentPartners)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [chatMessages, setChatMessages] = useState<{ [key: string]: ChatMessage[] }>({
    "3": [
      {
        id: "1",
        senderId: "3",
        senderName: "Emma Wilson",
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
    ],
    "4": [
      {
        id: "1",
        senderId: "4",
        senderName: "Mike Rodriguez",
        message: "Want to go for a run this weekend?",
        timestamp: "1 hour ago"
      },
      {
        id: "2",
        senderId: "user",
        senderName: "You",
        message: "Sounds great! What distance are you thinking?",
        timestamp: "30 min ago"
      }
    ]
  })
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sendingRequest, setSendingRequest] = useState<Set<string>>(new Set())
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedChatPartner, setSelectedChatPartner] = useState<Partner | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    // Simulate fetching partners
    setPartners(mockPartners)
  }, [])

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         partner.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = levelFilter === "all" || partner.fitnessLevel.toLowerCase() === levelFilter
    const matchesGoal = goalFilter === "all" || partner.goals.some(goal => 
      goal.toLowerCase().includes(goalFilter.toLowerCase())
    )
    return matchesSearch && matchesLevel && matchesGoal
  })

  const sendPartnerRequest = async (partnerId: string) => {
    if (sendingRequest.has(partnerId)) return
    
    const partner = partners.find(p => p.id === partnerId)
    if (!partner) return
    
    setSendingRequest(prev => new Set(prev).add(partnerId))
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remove partner from discover list
      setPartners(prev => prev.filter(p => p.id !== partnerId))
      
      // Add to pending requests
      const newPendingRequest: PartnerRequest = {
        id: `pending-${Date.now()}`,
        name: partner.name,
        avatar: partner.avatar,
        message: `Connection request sent to ${partner.name}`,
        timestamp: "Just now",
        partnerId: partner.id,
        type: "outgoing"
      }
      
      setPendingRequests(prev => [newPendingRequest, ...prev])
      
      // Show success message
      toast.success(`Connection request sent to ${partner.name}!`, {
        description: "They'll receive a notification and can accept your request.",
        duration: 4000,
      })
      
      console.log(`Sending request to partner ${partnerId} (${partner.name})`)
      
    } catch (error) {
      toast.error("Failed to send partner request", {
        description: "Please check your connection and try again.",
        duration: 4000,
      })
      console.error("Error sending partner request:", error)
    } finally {
      setSendingRequest(prev => {
        const newSet = new Set(prev)
        newSet.delete(partnerId)
        return newSet
      })
      setIsLoading(false)
    }
  }

  const acceptRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    if (!request) return

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Remove from requests
      setRequests(prev => prev.filter(r => r.id !== requestId))
      
      // Add to current partners (in a real app, you'd get the full partner data)
      const newPartner: Partner = {
        id: request.partnerId,
        name: request.name,
        avatar: request.avatar,
        age: 25,
        fitnessLevel: "Intermediate",
        location: "Unknown",
        goals: ["General Fitness"],
        bio: "New workout partner!",
        rating: 4.5,
        isOnline: false,
        lastSeen: "Just now",
        workoutPreferences: ["General"],
        availability: ["Flexible"]
      }
      
      setCurrentPartners(prev => [...prev, newPartner])
      
      // If this was a pending request that got accepted, remove it from pending
      setPendingRequests(prev => prev.filter(r => r.partnerId !== request.partnerId))
      
      toast.success(`You're now connected with ${request.name}!`, {
        description: "You can now chat and plan workouts together.",
        duration: 4000,
      })
    } catch (error) {
      toast.error("Failed to accept request", {
        description: "Please try again.",
        duration: 4000,
      })
      console.error("Error accepting request:", error)
    }
  }

  const declineRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    if (!request) return

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setRequests(prev => prev.filter(r => r.id !== requestId))
      toast.success(`Request from ${request.name} declined`, {
        description: "The request has been removed from your inbox.",
        duration: 3000,
      })
    } catch (error) {
      toast.error("Failed to decline request", {
        description: "Please try again.",
        duration: 4000,
      })
      console.error("Error declining request:", error)
    }
  }

  const sendMessage = async (partnerId: string) => {
    if (!newMessage.trim() || sendingMessage) return
    
    const partner = currentPartners.find(p => p.id === partnerId) || selectedChatPartner
    if (!partner) return
    
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
        [partnerId]: [...(prev[partnerId] || []), message]
      }))
      setNewMessage("")
      
      // Show a subtle success indicator
      toast.success("Message sent!", {
        duration: 2000,
      })
    } catch (error) {
      toast.error("Failed to send message", {
        description: "Please try again.",
        duration: 4000,
      })
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  const openChat = (partner: Partner) => {
    setSelectedChatPartner(partner)
    setIsChatOpen(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && selectedChatPartner) {
      sendMessage(selectedChatPartner.id)
    }
  }

  const cancelPendingRequest = async (requestId: string) => {
    const request = pendingRequests.find(r => r.id === requestId)
    if (!request) return

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
      
      // Add partner back to discover list
      const partner = mockPartners.find(p => p.id === request.partnerId)
      if (partner) {
        setPartners(prev => [...prev, partner])
      }
      
      toast.success(`Request to ${request.name} cancelled`, {
        description: "You can send a new request anytime.",
        duration: 3000,
      })
    } catch (error) {
      toast.error("Failed to cancel request", {
        description: "Please try again.",
        duration: 4000,
      })
      console.error("Error cancelling request:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {t("partner_finder_title", "Find Your Workout Partner")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t("partner_finder_desc", "Connect with like-minded fitness enthusiasts, find accountability partners, and make your fitness journey more fun and social.")}
        </p>
      </div>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="discover" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>{t("discover", "Discover")}</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>{t("pending", "Pending")} ({pendingRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>{t("requests", "Requests")} ({requests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="partners" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{t("my_partners", "My Partners")} ({currentPartners.length})</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>{t("chat", "Chat")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          {/* Search and Filters */}
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={t("search_partners", "Search partners by name or location...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("fitness_level", "Fitness Level")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_levels", "All Levels")}</SelectItem>
                    <SelectItem value="beginner">{t("beginner", "Beginner")}</SelectItem>
                    <SelectItem value="intermediate">{t("intermediate", "Intermediate")}</SelectItem>
                    <SelectItem value="advanced">{t("advanced", "Advanced")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={goalFilter} onValueChange={setGoalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("fitness_goals", "Fitness Goals")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_goals", "All Goals")}</SelectItem>
                    <SelectItem value="weight loss">{t("weight_loss", "Weight Loss")}</SelectItem>
                    <SelectItem value="muscle gain">{t("muscle_gain", "Muscle Gain")}</SelectItem>
                    <SelectItem value="endurance">{t("endurance", "Endurance")}</SelectItem>
                    <SelectItem value="strength">{t("strength", "Strength")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Partners Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <Card key={partner.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={partner.avatar} alt={partner.name} />
                        <AvatarFallback>{partner.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      {partner.isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{partner.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {partner.age} years • {partner.fitnessLevel}
                      </p>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{partner.location}</span>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{partner.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
                    {partner.bio}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {partner.goals.slice(0, 2).map((goal, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                    {partner.goals.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{partner.goals.length - 2}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          {t("view_profile", "View Profile")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{partner.name}'s Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20">
                              <AvatarImage src={partner.avatar} alt={partner.name} />
                              <AvatarFallback>{partner.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-xl font-semibold">{partner.name}</h3>
                              <p className="text-gray-600">{partner.age} years • {partner.fitnessLevel}</p>
                              <div className="flex items-center space-x-1 text-gray-500">
                                <MapPin className="h-4 w-4" />
                                <span>{partner.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">{t("bio", "Bio")}</h4>
                            <p className="text-gray-600">{partner.bio}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">{t("fitness_goals", "Fitness Goals")}</h4>
                            <div className="flex flex-wrap gap-2">
                              {partner.goals.map((goal, index) => (
                                <Badge key={index} variant="secondary">{goal}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">{t("workout_preferences", "Workout Preferences")}</h4>
                            <div className="flex flex-wrap gap-2">
                              {partner.workoutPreferences.map((pref, index) => (
                                <Badge key={index} variant="outline">{pref}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">{t("availability", "Availability")}</h4>
                            <div className="flex flex-wrap gap-2">
                              {partner.availability.map((day, index) => (
                                <Badge key={index} variant="outline">{day}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                      onClick={() => sendPartnerRequest(partner.id)}
                      disabled={sendingRequest.has(partner.id)}
                    >
                      {sendingRequest.has(partner.id) ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Sending...
                        </>
                      ) : (
                        t("send_request", "Send Request")
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {partner.isOnline ? t("online_now", "Online now") : `${t("last_seen", "Last seen")} ${partner.lastSeen}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-6">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span>{t("pending_requests", "Pending Requests")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t("no_pending_requests", "No pending requests")}</p>
                  <p className="text-sm text-gray-400 mt-2">{t("send_requests_prompt", "Send connection requests to see them here!")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <Avatar>
                        <AvatarImage src={request.avatar} alt={request.name} />
                        <AvatarFallback>{request.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{request.name}</h4>
                        <p className="text-gray-600 text-sm mt-1">{request.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{request.timestamp}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            {t("pending", "Pending")}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => cancelPendingRequest(request.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        {t("cancel", "Cancel")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-purple-600" />
                <span>{t("partner_requests", "Partner Requests")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t("no_requests", "No partner requests yet")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <Avatar>
                        <AvatarImage src={request.avatar} alt={request.name} />
                        <AvatarFallback>{request.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{request.name}</h4>
                        <p className="text-gray-600 text-sm mt-1">{request.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{request.timestamp}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => declineRequest(request.id)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          {t("decline", "Decline")}
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-green-600 to-blue-600"
                          onClick={() => acceptRequest(request.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {t("accept", "Accept")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-6">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span>{t("current_partners", "Current Partners")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentPartners.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t("no_partners", "No workout partners yet")}</p>
                  <p className="text-sm text-gray-400 mt-2">{t("find_partners_prompt", "Discover new partners in the Discover tab!")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentPartners.map((partner) => (
                    <div key={partner.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Avatar>
                        <AvatarImage src={partner.avatar} alt={partner.name} />
                        <AvatarFallback>{partner.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{partner.name}</h4>
                        <p className="text-sm text-gray-600">{partner.fitnessLevel} • {partner.location}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{partner.rating}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openChat(partner)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {t("message", "Message")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <span>{t("chat_with_partners", "Chat with Partners")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentPartners.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t("no_chats", "No active chats")}</p>
                  <p className="text-sm text-gray-400 mt-2">{t("add_partners_to_chat", "Add workout partners to start chatting!")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentPartners.map((partner) => (
                    <div key={partner.id} className="border rounded-lg">
                      <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={partner.avatar} alt={partner.name} />
                            <AvatarFallback>{partner.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{partner.name}</h4>
                            <p className="text-sm text-gray-600">
                              {partner.isOnline ? t("online_now", "Online now") : partner.lastSeen}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openChat(partner)}
                        >
                          {t("open_chat", "Open Chat")}
                        </Button>
                      </div>
                      
                      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                        {(chatMessages[partner.id] || []).map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs px-3 py-2 rounded-lg ${
                                message.senderId === "user"
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-200 dark:bg-gray-700"
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <p className={`text-xs mt-1 ${
                                message.senderId === "user" ? "text-purple-200" : "text-gray-500"
                              }`}>
                                {message.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
