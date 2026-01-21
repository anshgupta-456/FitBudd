// "use client"

// import { useState, useEffect, useRef } from "react"
// import { useTranslation } from "react-i18next"
// import { Card, CardContent } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { 
//   Heart, 
//   X, 
//   Star, 
//   MapPin, 
//   MessageSquare, 
//   UserPlus, 
//   Users, 
//   Clock,
//   Check,
//   Loader2,
//   Info,
//   Send
// } from "lucide-react"
// import { toast } from "sonner"
// import { useAuth } from "../contexts/AuthContext"

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
//   photos?: string[]
// }

// interface PartnerRequest {
//   id: string
//   name: string
//   avatar: string
//   message: string
//   timestamp: string
//   partnerId: string
//   type: "incoming" | "outgoing"
// }

// interface ChatMessage {
//   id: string
//   senderId: string
//   senderName: string
//   message: string
//   timestamp: string
// }

// // Start with empty; will fetch from backend
// const mockPartners: Partner[] = []

// const mockRequests: PartnerRequest[] = []

// const mockCurrentPartners: Partner[] = []

// const mockChatMessages: { [key: string]: ChatMessage[] } = {
//   "1": [
//     {
//       id: "1",
//       senderId: "1",
//       senderName: "Aaniya Tomar",
//       message: "Hey! Ready for our workout session tomorrow?",
//       timestamp: "10 min ago"
//     },
//     {
//       id: "2",
//       senderId: "user",
//       senderName: "You",
//       message: "Absolutely! See you at 7 AM at the gym.",
//       timestamp: "5 min ago"
//     }
//   ],
//   "2": [
//     {
//       id: "1",
//       senderId: "2",
//       senderName: "Akaksha Singh",
//       message: "Want to go for a run this weekend?",
//       timestamp: "1 hour ago"
//     },
//     {
//       id: "2",
//       senderId: "user",
//       senderName: "You",
//       message: "Sounds great! What distance are you thinking?",
//       timestamp: "30 min ago"
//     }
//   ]
// }

// export default function TinderStylePartnerFinder() {
//   const { t } = useTranslation()
//   const { user } = useAuth()
//   const [partners, setPartners] = useState<Partner[]>([])
//   const [currentIndex, setCurrentIndex] = useState(0)
//   const [requests, setRequests] = useState<PartnerRequest[]>(mockRequests)
//   const [pendingRequests, setPendingRequests] = useState<PartnerRequest[]>([])
//   const [currentPartners, setCurrentPartners] = useState<Partner[]>(mockCurrentPartners)
//   const [activeTab, setActiveTab] = useState<"discover" | "requests" | "partners">("discover")
//   const [isLoading, setIsLoading] = useState(false)
//   const [sendingRequest, setSendingRequest] = useState(false)
//   const [showProfile, setShowProfile] = useState(false)
//   const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
//   const [chatMessages, setChatMessages] = useState<{ [key: string]: ChatMessage[] }>(mockChatMessages)
//   const [newMessage, setNewMessage] = useState("")
//   const [sendingMessage, setSendingMessage] = useState(false)
//   const [selectedChatPartner, setSelectedChatPartner] = useState<Partner | null>(null)
//   const [isChatOpen, setIsChatOpen] = useState(false)
//   const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
//   const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
//   const [isDragging, setIsDragging] = useState(false)
//   const cardRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'
//         // recommendations for swipe deck
//         const rec = await fetch(`${base}/api/partners/recommendations?limit=20`)
//         const recData = await rec.json()
//         if (rec.ok && recData.success) {
//           const mapped: Partner[] = (recData.recommendations || []).map((p: any) => ({
//             id: String(p.id), name: p.name, avatar: p.avatar_url || "/placeholder-user.jpg",
//             age: 0, fitnessLevel: (p.fitness_level || 'Beginner').charAt(0).toUpperCase() + (p.fitness_level || 'Beginner').slice(1),
//             location: p.location || '', goals: p.goals || [], bio: p.bio || '', rating: 4.7,
//             isOnline: true, lastSeen: 'recently', workoutPreferences: [], availability: [], photos: [p.avatar_url || "/placeholder-user.jpg"]
//           }))
//           setPartners(mapped)
//         }

//         if (user?.id) {
//           // current partners
//           const con = await fetch(`${base}/api/partners/connections?user_id=${user.id}&status=accepted`)
//           const conData = await con.json()
//           if (con.ok && conData.success) {
//             const mapped: Partner[] = (conData.connections || []).map((p: any) => ({
//               id: String(p.id), name: p.name, avatar: p.avatar_url || "/placeholder-user.jpg",
//               age: 0, fitnessLevel: (p.fitness_level || 'Beginner').charAt(0).toUpperCase() + (p.fitness_level || 'Beginner').slice(1),
//               location: p.location || '', goals: p.goals || [], bio: p.bio || '', rating: 4.7,
//               isOnline: true, lastSeen: 'recently', workoutPreferences: [], availability: [], photos: [p.avatar_url || "/placeholder-user.jpg"]
//             }))
//             setCurrentPartners(mapped)
//           }

//           // requests
//           const req = await fetch(`${base}/api/partners/requests?user_id=${user.id}`)
//           const reqData = await req.json()
//           if (req.ok && reqData.success) {
//             const mappedReq: PartnerRequest[] = (reqData.requests || []).map((r: any) => ({
//               id: String(r.id), name: r.from?.name || 'User', avatar: r.from?.avatar_url || "/placeholder-user.jpg",
//               message: r.message || 'Wants to connect', timestamp: r.timestamp, partnerId: String(r.from?.id || ''), type: 'incoming'
//             }))
//             setRequests(mappedReq)
//           }
//         }
//       } catch (e) {
//         // ignore
//       }
//     }
//     load()
//   }, [user?.id])

//   const currentPartner = partners[currentIndex]

//   const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
//     const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
//     const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
//     setDragStart({ x: clientX, y: clientY })
//     setIsDragging(true)
//   }

//   const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
//     if (!isDragging) return
    
//     const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
//     const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
//     setDragOffset({
//       x: clientX - dragStart.x,
//       y: clientY - dragStart.y
//     })
//   }

//   const handleDragEnd = () => {
//     if (!isDragging) return
    
//     const threshold = 100
//     const rotation = dragOffset.x * 0.1
    
//     if (Math.abs(dragOffset.x) > threshold) {
//       if (dragOffset.x > 0) {
//         handleLike()
//       } else {
//         handlePass()
//       }
//     }
    
//     setDragOffset({ x: 0, y: 0 })
//     setIsDragging(false)
//   }

//   const handleLike = async () => {
//     if (!currentPartner || sendingRequest) return
    
//     setSendingRequest(true)
//     setIsLoading(true)

//     try {
//       // Send connect request to backend
//       const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'
//       await fetch(`${base}/api/partners/connect`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ user_id: user?.id, partner_id: Number(currentPartner.id) })
//       })
      
//       // Remove current partner from stack
//       setPartners(prev => prev.filter(p => p.id !== currentPartner.id))
      
//       // Add to pending requests
//       const newPendingRequest: PartnerRequest = {
//         id: `pending-${Date.now()}`,
//         name: currentPartner.name,
//         avatar: currentPartner.avatar,
//         message: `Connection request sent to ${currentPartner.name}`,
//         timestamp: "Just now",
//         partnerId: currentPartner.id,
//         type: "outgoing"
//       }
      
//       setPendingRequests(prev => [newPendingRequest, ...prev])
      
//       toast.success(`Liked ${currentPartner.name}!`, {
//         description: "They'll receive a notification and can accept your request.",
//         duration: 4000,
//       })
      
//       // Move to next card
//       setCurrentIndex(0)
      
//     } catch (error) {
//       toast.error("Failed to send like", {
//         description: "Please try again.",
//         duration: 4000,
//       })
//     } finally {
//       setSendingRequest(false)
//       setIsLoading(false)
//     }
//   }

//   const handlePass = () => {
//     if (!currentPartner) return
    
//     // Remove current partner from stack
//     setPartners(prev => prev.filter(p => p.id !== currentPartner.id))
//     setCurrentIndex(0)
    
//     toast.success(`Passed on ${currentPartner.name}`, {
//       duration: 2000,
//     })
//   }

//   const handleSuperLike = async () => {
//     if (!currentPartner || sendingRequest) return
    
//     setSendingRequest(true)
//     setIsLoading(true)

//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1000))
      
//       // Remove current partner from stack
//       setPartners(prev => prev.filter(p => p.id !== currentPartner.id))
      
//       // Add to pending requests with super like indicator
//       const newPendingRequest: PartnerRequest = {
//         id: `pending-${Date.now()}`,
//         name: currentPartner.name,
//         avatar: currentPartner.avatar,
//         message: `Super like sent to ${currentPartner.name}! ⭐`,
//         timestamp: "Just now",
//         partnerId: currentPartner.id,
//         type: "outgoing"
//       }
      
//       setPendingRequests(prev => [newPendingRequest, ...prev])
      
//       toast.success(`Super liked ${currentPartner.name}! ⭐`, {
//         description: "Super likes get priority in their feed!",
//         duration: 4000,
//       })
      
//       // Move to next card
//       setCurrentIndex(0)
      
//     } catch (error) {
//       toast.error("Failed to send super like", {
//         description: "Please try again.",
//         duration: 4000,
//       })
//     } finally {
//       setSendingRequest(false)
//       setIsLoading(false)
//     }
//   }

//   const acceptRequest = async (requestId: string) => {
//     const request = requests.find(r => r.id === requestId)
//     if (!request) return

//     try {
//       const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'
//       await fetch(`${base}/api/partners/accept`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ user_id: user?.id, partner_id: Number(request.partnerId) })
//       })
      
//       setRequests(prev => prev.filter(r => r.id !== requestId))
      
//       const newPartner: Partner = {
//         id: request.partnerId,
//         name: request.name,
//         avatar: request.avatar,
//         age: 25,
//         fitnessLevel: "Intermediate",
//         location: "Unknown",
//         goals: ["General Fitness"],
//         bio: "New workout partner!",
//         rating: 4.5,
//         isOnline: false,
//         lastSeen: "Just now",
//         workoutPreferences: ["General"],
//         availability: ["Flexible"],
//         photos: ["/placeholder-user.jpg"]
//       }
      
//       setCurrentPartners(prev => [...prev, newPartner])
//       setPendingRequests(prev => prev.filter(r => r.partnerId !== request.partnerId))
      
//       toast.success(`You're now connected with ${request.name}!`, {
//         description: "You can now chat and plan workouts together.",
//         duration: 4000,
//       })
//     } catch (error) {
//       toast.error("Failed to accept request", {
//         description: "Please try again.",
//         duration: 4000,
//       })
//     }
//   }

//   const declineRequest = async (requestId: string) => {
//     const request = requests.find(r => r.id === requestId)
//     if (!request) return

//     try {
//       const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'
//       await fetch(`${base}/api/partners/decline`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ user_id: user?.id, partner_id: Number(request.partnerId) })
//       })
//       setRequests(prev => prev.filter(r => r.id !== requestId))
//       toast.success(`Request from ${request.name} declined`, {
//         duration: 3000,
//       })
//     } catch (error) {
//       toast.error("Failed to decline request", {
//         description: "Please try again.",
//         duration: 4000,
//       })
//     }
//   }

//   const openProfile = (partner: Partner) => {
//     setSelectedPartner(partner)
//     setShowProfile(true)
//   }

//   const openChat = (partner: Partner) => {
//     setSelectedChatPartner(partner)
//     setIsChatOpen(true)
//   }

//   const sendMessage = async (partnerId: string) => {
//     if (!newMessage.trim() || sendingMessage) return
    
//     const partner = currentPartners.find(p => p.id === partnerId) || selectedChatPartner
//     if (!partner) return
    
//     setSendingMessage(true)
    
//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 300))
      
//       const message: ChatMessage = {
//         id: Date.now().toString(),
//         senderId: "user",
//         senderName: "You",
//         message: newMessage,
//         timestamp: "Just now"
//       }
      
//       setChatMessages(prev => ({
//         ...prev,
//         [partnerId]: [...(prev[partnerId] || []), message]
//       }))
//       setNewMessage("")
      
//       // Show a subtle success indicator
//       toast.success("Message sent!", {
//         duration: 2000,
//       })

//       // Simulate partner response after a delay
//       setTimeout(() => {
//         const responses = [
//           "That sounds great!",
//           "I'm looking forward to it!",
//           "Let's do this! 💪",
//           "Perfect timing!",
//           "Count me in!",
//           "Awesome, see you there!",
//         ]

//         const response: ChatMessage = {
//           id: (Date.now() + 1).toString(),
//           senderId: partner.id,
//           senderName: partner.name,
//           message: responses[Math.floor(Math.random() * responses.length)],
//           timestamp: "Just now"
//         }

//         setChatMessages(prev => ({
//           ...prev,
//           [partnerId]: [...(prev[partnerId] || []), response]
//         }))
//       }, 2000 + Math.random() * 3000)
      
//     } catch (error) {
//       toast.error("Failed to send message", {
//         description: "Please try again.",
//         duration: 4000,
//       })
//       console.error("Error sending message:", error)
//     } finally {
//       setSendingMessage(false)
//     }
//   }

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && selectedChatPartner) {
//       sendMessage(selectedChatPartner.id)
//     }
//   }

//   const getRotation = () => {
//     return dragOffset.x * 0.1
//   }

//   const getOpacity = () => {
//     return 1 - Math.abs(dragOffset.x) / 300
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="text-center">
//         <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
//           {t("partner_finder_title", "Find Your Workout Partner")}
//         </h2>
//         <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
//           {t("partner_finder_desc", "Swipe right to like, left to pass. Find your perfect workout buddy!")}
//         </p>
//       </div>

//       {/* Tab Navigation */}
//       <div className="flex justify-center">
//         <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-1">
//           <div className="flex space-x-1">
//             <Button
//               variant={activeTab === "discover" ? "default" : "ghost"}
//               size="sm"
//               onClick={() => setActiveTab("discover")}
//               className="flex items-center space-x-2"
//             >
//               <Heart className="h-4 w-4" />
//               <span>Discover</span>
//             </Button>
//             <Button
//               variant={activeTab === "requests" ? "default" : "ghost"}
//               size="sm"
//               onClick={() => setActiveTab("requests")}
//               className="flex items-center space-x-2"
//             >
//               <UserPlus className="h-4 w-4" />
//               <span>Requests ({requests.length})</span>
//             </Button>
//             <Button
//               variant={activeTab === "partners" ? "default" : "ghost"}
//               size="sm"
//               onClick={() => setActiveTab("partners")}
//               className="flex items-center space-x-2"
//             >
//               <Users className="h-4 w-4" />
//               <span>Partners ({currentPartners.length})</span>
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Discover Tab - Tinder Style */}
//       {activeTab === "discover" && (
//         <div className="flex justify-center">
//           <div className="relative w-full max-w-sm h-[600px]">
//             {partners.length === 0 ? (
//               <Card className="w-full h-full flex items-center justify-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
//                 <CardContent className="text-center">
//                   <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
//                   <h3 className="text-xl font-semibold mb-2">No more partners!</h3>
//                   <p className="text-gray-600 dark:text-gray-400">
//                     You've seen all available partners. Check back later for new matches!
//                   </p>
//                 </CardContent>
//               </Card>
//             ) : (
//               <>
//                 {/* Current Card */}
//                 {currentPartner && (
//                   <Card
//                     ref={cardRef}
//                     className={`absolute inset-0 w-full h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm cursor-grab active:cursor-grabbing transition-transform duration-200 ${
//                       isDragging ? 'scale-105' : ''
//                     }`}
//                     style={{
//                       transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${getRotation()}deg)`,
//                       opacity: getOpacity(),
//                       zIndex: 10
//                     }}
//                     onMouseDown={handleDragStart}
//                     onMouseMove={handleDragMove}
//                     onMouseUp={handleDragEnd}
//                     onMouseLeave={handleDragEnd}
//                     onTouchStart={handleDragStart}
//                     onTouchMove={handleDragMove}
//                     onTouchEnd={handleDragEnd}
//                   >
//                     <CardContent className="p-0 h-full relative overflow-hidden rounded-lg">
//                       {/* Photo */}
//                       <div className="relative h-2/3 bg-gradient-to-br from-purple-400 to-pink-400">
//                         <Avatar className="absolute inset-0 w-full h-full rounded-none">
//                           <AvatarImage src={currentPartner.avatar} alt={currentPartner.name} className="object-cover" />
//                           <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
//                             {currentPartner.name.slice(0, 2)}
//                           </AvatarFallback>
//                         </Avatar>
                        
//                         {/* Online Status */}
//                         {currentPartner.isOnline && (
//                           <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
//                             Online
//                           </div>
//                         )}
                        
//                         {/* Age Badge */}
//                         <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
//                           <span className="font-semibold text-lg">{currentPartner.age}</span>
//                         </div>
//                       </div>

//                       {/* Info */}
//                       <div className="p-4 h-1/3 flex flex-col justify-between">
//                         <div>
//                           <div className="flex items-center justify-between mb-2">
//                             <h3 className="text-xl font-bold">{currentPartner.name}</h3>
//                             <div className="flex items-center space-x-1">
//                               <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
//                               <span className="text-sm font-medium">{currentPartner.rating}</span>
//                             </div>
//                           </div>
                          
//                           <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 mb-2">
//                             <MapPin className="h-3 w-3" />
//                             <span className="text-sm">{currentPartner.location}</span>
//                           </div>
                          
//                           <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
//                             {currentPartner.bio}
//                           </p>
                          
//                           <div className="flex flex-wrap gap-1">
//                             {currentPartner.goals.slice(0, 2).map((goal, index) => (
//                               <Badge key={index} variant="secondary" className="text-xs">
//                                 {goal}
//                               </Badge>
//                             ))}
//                             {currentPartner.goals.length > 2 && (
//                               <Badge variant="outline" className="text-xs">
//                                 +{currentPartner.goals.length - 2}
//                               </Badge>
//                             )}
//                           </div>
//                         </div>
//                       </div>

//                       {/* Action Buttons */}
//                       <div className="absolute bottom-4 right-4 flex space-x-2">
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() => openProfile(currentPartner)}
//                           className="bg-white/90 backdrop-blur-sm"
//                         >
//                           <Info className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 )}

//                 {/* Next Card (Preview) */}
//                 {partners.length > 1 && (
//                   <Card className="absolute inset-0 w-full h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm opacity-50 scale-95">
//                     <CardContent className="p-0 h-full relative overflow-hidden rounded-lg">
//                       <div className="relative h-2/3 bg-gradient-to-br from-purple-400 to-pink-400">
//                         <Avatar className="absolute inset-0 w-full h-full rounded-none">
//                           <AvatarImage src={partners[1]?.avatar} alt={partners[1]?.name} className="object-cover" />
//                           <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
//                             {partners[1]?.name.slice(0, 2)}
//                           </AvatarFallback>
//                         </Avatar>
//                       </div>
//                       <div className="p-4 h-1/3">
//                         <h3 className="text-xl font-bold">{partners[1]?.name}</h3>
//                         <p className="text-sm text-gray-600 dark:text-gray-400">{partners[1]?.age} • {partners[1]?.fitnessLevel}</p>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 )}
//               </>
//             )}

//             {/* Action Buttons */}
//             {partners.length > 0 && (
//               <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-4">
//                 <Button
//                   size="lg"
//                   variant="outline"
//                   onClick={handlePass}
//                   disabled={isLoading}
//                   className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border-2 border-red-200 hover:border-red-300 hover:bg-red-50"
//                 >
//                   <X className="h-6 w-6 text-red-500" />
//                 </Button>
                
//                 <Button
//                   size="lg"
//                   variant="outline"
//                   onClick={handleSuperLike}
//                   disabled={isLoading}
//                   className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
//                 >
//                   <Star className="h-6 w-6 text-blue-500" />
//                 </Button>
                
//                 <Button
//                   size="lg"
//                   variant="outline"
//                   onClick={handleLike}
//                   disabled={isLoading}
//                   className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border-2 border-green-200 hover:border-green-300 hover:bg-green-50"
//                 >
//                   {isLoading ? (
//                     <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
//                   ) : (
//                     <Heart className="h-6 w-6 text-green-500" />
//                   )}
//                 </Button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Requests Tab */}
//       {activeTab === "requests" && (
//         <div className="max-w-2xl mx-auto space-y-4">
//           {requests.length === 0 ? (
//             <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
//               <CardContent className="text-center py-12">
//                 <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
//                 <h3 className="text-xl font-semibold mb-2">No requests yet</h3>
//                 <p className="text-gray-600 dark:text-gray-400">
//                   Keep swiping to find potential workout partners!
//                 </p>
//               </CardContent>
//             </Card>
//           ) : (
//             requests.map((request) => (
//               <Card key={request.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
//                 <CardContent className="p-6">
//                   <div className="flex items-start space-x-4">
//                     <Avatar className="h-16 w-16">
//                       <AvatarImage src={request.avatar} alt={request.name} />
//                       <AvatarFallback>{request.name.slice(0, 2)}</AvatarFallback>
//                     </Avatar>
//                     <div className="flex-1">
//                       <h4 className="font-semibold text-lg">{request.name}</h4>
//                       <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{request.message}</p>
//                       <p className="text-xs text-gray-500 mt-2">{request.timestamp}</p>
//                     </div>
//                     <div className="flex space-x-2">
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         onClick={() => declineRequest(request.id)}
//                         className="text-red-600 hover:text-red-700 hover:bg-red-50"
//                       >
//                         <X className="h-3 w-3 mr-1" />
//                         Decline
//                       </Button>
//                       <Button
//                         size="sm"
//                         className="bg-gradient-to-r from-green-600 to-blue-600"
//                         onClick={() => acceptRequest(request.id)}
//                       >
//                         <Check className="h-3 w-3 mr-1" />
//                         Accept
//                       </Button>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))
//           )}
//         </div>
//       )}

//       {/* Partners Tab */}
//       {activeTab === "partners" && (
//         <div className="max-w-2xl mx-auto space-y-4">
//           {currentPartners.length === 0 ? (
//             <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
//               <CardContent className="text-center py-12">
//                 <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
//                 <h3 className="text-xl font-semibold mb-2">No partners yet</h3>
//                 <p className="text-gray-600 dark:text-gray-400">
//                   Start swiping to find your workout buddies!
//                 </p>
//               </CardContent>
//             </Card>
//           ) : (
//             currentPartners.map((partner) => (
//               <Card key={partner.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
//                 <CardContent className="p-6">
//                   <div className="flex items-center space-x-4">
//                     <Avatar className="h-16 w-16">
//                       <AvatarImage src={partner.avatar} alt={partner.name} />
//                       <AvatarFallback>{partner.name.slice(0, 2)}</AvatarFallback>
//                     </Avatar>
//                     <div className="flex-1">
//                       <h4 className="font-semibold text-lg">{partner.name}</h4>
//                       <p className="text-sm text-gray-600 dark:text-gray-400">{partner.fitnessLevel} • {partner.location}</p>
//                       <div className="flex items-center space-x-1 mt-1">
//                         <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
//                         <span className="text-xs">{partner.rating}</span>
//                       </div>
//                     </div>
//                     <Button 
//                       size="sm" 
//                       variant="outline"
//                       onClick={() => openChat(partner)}
//                     >
//                       <MessageSquare className="h-3 w-3 mr-1" />
//                       Message
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))
//           )}
//         </div>
//       )}

//       {/* Chat Dialog */}
//       <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
//         <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
//           <DialogHeader className="flex-shrink-0">
//             <DialogTitle className="flex items-center gap-2">
//               <Avatar className="w-8 h-8">
//                 <AvatarImage src={selectedChatPartner?.avatar || "/placeholder-user.jpg"} alt={selectedChatPartner?.name} />
//                 <AvatarFallback>
//                   {selectedChatPartner?.name
//                     .split(" ")
//                     .map((n) => n[0])
//                     .join("")}
//                 </AvatarFallback>
//               </Avatar>
//               <div className="flex flex-col items-start">
//                 <span>Chat with {selectedChatPartner?.name}</span>
//                 {selectedChatPartner?.isOnline && <span className="text-xs text-green-600 font-normal">Online</span>}
//               </div>
//             </DialogTitle>
//           </DialogHeader>

//           <div className="flex flex-col flex-1 min-h-0 space-y-4">
//             {/* Messages Container */}
//             <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg min-h-[300px] max-h-[400px]">
//               {selectedChatPartner && chatMessages[selectedChatPartner.id]?.length > 0 ? (
//                 chatMessages[selectedChatPartner.id].map((message) => (
//                   <div
//                     key={message.id}
//                     className={`flex ${message.senderId === "user" ? "justify-end" : "justify-start"}`}
//                   >
//                     <div
//                       className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
//                         message.senderId === "user" ? "bg-purple-600 text-white" : "bg-white border border-gray-200"
//                       }`}
//                     >
//                       <p className="break-words">{message.message}</p>
//                       <p className={`text-xs mt-1 ${message.senderId === "user" ? "text-purple-200" : "text-gray-500"}`}>
//                         {message.timestamp}
//                       </p>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="flex flex-col items-center justify-center h-full text-center py-8">
//                   <MessageSquare className="h-12 w-12 text-gray-400 mb-3" />
//                   <p className="text-gray-500 text-sm">Start a conversation with {selectedChatPartner?.name}!</p>
//                   <p className="text-gray-400 text-xs mt-1">Send a message to break the ice</p>
//                 </div>
//               )}
//             </div>

//             {/* Message Input */}
//             <div className="flex gap-2 flex-shrink-0">
//               <Input
//                 placeholder="Type your message..."
//                 value={newMessage}
//                 onChange={(e) => setNewMessage(e.target.value)}
//                 onKeyPress={handleKeyPress}
//                 disabled={sendingMessage}
//                 className="flex-1"
//               />
//               <Button 
//                 onClick={() => selectedChatPartner && sendMessage(selectedChatPartner.id)} 
//                 disabled={!newMessage.trim() || sendingMessage || !selectedChatPartner}
//                 className="px-3"
//               >
//                 {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Profile Dialog */}
//       <Dialog open={showProfile} onOpenChange={setShowProfile}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>{selectedPartner?.name}'s Profile</DialogTitle>
//           </DialogHeader>
//           {selectedPartner && (
//             <div className="space-y-4">
//               <div className="flex items-center space-x-4">
//                 <Avatar className="h-20 w-20">
//                   <AvatarImage src={selectedPartner.avatar} alt={selectedPartner.name} />
//                   <AvatarFallback>{selectedPartner.name.slice(0, 2)}</AvatarFallback>
//                 </Avatar>
//                 <div>
//                   <h3 className="text-xl font-semibold">{selectedPartner.name}</h3>
//                   <p className="text-gray-600">{selectedPartner.age} years • {selectedPartner.fitnessLevel}</p>
//                   <div className="flex items-center space-x-1 text-gray-500">
//                     <MapPin className="h-4 w-4" />
//                     <span>{selectedPartner.location}</span>
//                   </div>
//                 </div>
//               </div>
              
//               <div>
//                 <h4 className="font-semibold mb-2">Bio</h4>
//                 <p className="text-gray-600">{selectedPartner.bio}</p>
//               </div>
              
//               <div>
//                 <h4 className="font-semibold mb-2">Fitness Goals</h4>
//                 <div className="flex flex-wrap gap-2">
//                   {selectedPartner.goals.map((goal, index) => (
//                     <Badge key={index} variant="secondary">{goal}</Badge>
//                   ))}
//                 </div>
//               </div>
              
//               <div>
//                 <h4 className="font-semibold mb-2">Workout Preferences</h4>
//                 <div className="flex flex-wrap gap-2">
//                   {selectedPartner.workoutPreferences.map((pref, index) => (
//                     <Badge key={index} variant="outline">{pref}</Badge>
//                   ))}
//                 </div>
//               </div>
              
//               <div>
//                 <h4 className="font-semibold mb-2">Availability</h4>
//                 <div className="flex flex-wrap gap-2">
//                   {selectedPartner.availability.map((day, index) => (
//                     <Badge key={index} variant="outline">{day}</Badge>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }
"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Heart, 
  X, 
  Star, 
  MapPin, 
  MessageSquare, 
  UserPlus, 
  Users, 
  Clock,
  Check,
  Loader2,
  Info,
  Send
} from "lucide-react"
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
  photos?: string[]
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
    avatar: "/placeholder-user.jpg",
    age: 21,
    fitnessLevel: "Intermediate",
    location: "New Delhi",
    goals: ["Weight Loss", "Strength"],
    bio: "Looking for a consistent workout partner for morning sessions. Love weightlifting and cardio!",
    rating: 4.8,
    isOnline: true,
    lastSeen: "2 min ago",
    workoutPreferences: ["Weightlifting", "Cardio", "CrossFit"],
    availability: ["Monday", "Wednesday", "Friday", "Saturday"],
    photos: ["/placeholder-user.jpg", "/placeholder-user.jpg", "/placeholder-user.jpg"]
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
    availability: ["Tuesday", "Thursday", "Saturday", "Sunday"],
    photos: ["/placeholder-user.jpg", "/placeholder-user.jpg", "/placeholder-user.jpg"]
  },
  {
    id: "3",
    name: "Arpit Garg",
    avatar: "/placeholder-user.jpg",
    age: 19,
    fitnessLevel: "Beginner",
    location: "Rajasthan",
    goals: ["Endurance", "Weight Loss"],
    bio: "Marathon runner looking for training partners. Love outdoor activities and group runs.",
    rating: 4.6,
    isOnline: true,
    lastSeen: "5 min ago",
    workoutPreferences: ["Running", "Cycling"],
    availability: ["Monday", "Wednesday", "Friday"],
    photos: ["/placeholder-user.jpg", "/placeholder-user.jpg", "/placeholder-user.jpg"]
  },
  {
    id: "4",
    name: "Priyam Saxena",
    avatar: "/placeholder-user.jpg",
    age: 19,
    fitnessLevel: "Intermediate",
    location: "Rampur, UP",
    goals: ["Endurance", "Weight Loss"],
    bio: "Marathon runner looking for training partners. Love outdoor activities and group runs.",
    rating: 4.6,
    isOnline: true,
    lastSeen: "5 min ago",
    workoutPreferences: ["Running", "Cycling"],
    availability: ["Monday", "Wednesday", "Friday"],
    photos: ["/placeholder-user.jpg", "/placeholder-user.jpg", "/placeholder-user.jpg"]
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
    availability: ["Monday", "Tuesday", "Thursday", "Sunday"],
    photos: ["/placeholder-user.jpg"]
  },
  {
    id: "2",
    name: "Akaksha Singh",
    avatar: "/placeholder-user.jpg",
    age: 19,
    fitnessLevel: "Intermediate",
    location: "Kanpur, UP",
    goals: ["Endurance", "Weight Gain"],
    bio: "Marathon runner looking for training partners. Love outdoor activities and group runs.",
    rating: 4.6,
    isOnline: true,
    lastSeen: "5 min ago",
    workoutPreferences: ["Running", "Cycling", "Swimming"],
    availability: ["Monday", "Wednesday", "Friday", "Sunday"],
    photos: ["/placeholder-user.jpg"]
  }
]

const mockChatMessages: { [key: string]: ChatMessage[] } = {
  "1": [
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
  ],
  "2": [
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
      message: "Sounds great! What distance are you thinking?",
      timestamp: "30 min ago"
    }
  ]
}

export default function TinderStylePartnerFinder() {
  const { t } = useTranslation()
  const [partners, setPartners] = useState<Partner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [requests, setRequests] = useState<PartnerRequest[]>(mockRequests)
  const [pendingRequests, setPendingRequests] = useState<PartnerRequest[]>([])
  const [currentPartners, setCurrentPartners] = useState<Partner[]>(mockCurrentPartners)
  const [activeTab, setActiveTab] = useState<"discover" | "requests" | "partners">("discover")
  const [isLoading, setIsLoading] = useState(false)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [chatMessages, setChatMessages] = useState<{ [key: string]: ChatMessage[] }>(mockChatMessages)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedChatPartner, setSelectedChatPartner] = useState<Partner | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPartners(mockPartners)
  }, [])

  const currentPartner = partners[currentIndex]

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setDragStart({ x: clientX, y: clientY })
    setIsDragging(true)
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setDragOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    })
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    
    const threshold = 100
    const rotation = dragOffset.x * 0.1
    
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) {
        handleLike()
      } else {
        handlePass()
      }
    }
    
    setDragOffset({ x: 0, y: 0 })
    setIsDragging(false)
  }

  const handleLike = async () => {
    if (!currentPartner || sendingRequest) return
    
    setSendingRequest(true)
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remove current partner from stack
      setPartners(prev => prev.filter(p => p.id !== currentPartner.id))
      
      // Add to pending requests
      const newPendingRequest: PartnerRequest = {
        id: `pending-${Date.now()}`,
        name: currentPartner.name,
        avatar: currentPartner.avatar,
        message: `Connection request sent to ${currentPartner.name}`,
        timestamp: "Just now",
        partnerId: currentPartner.id,
        type: "outgoing"
      }
      
      setPendingRequests(prev => [newPendingRequest, ...prev])
      
      toast.success(`Liked ${currentPartner.name}!`, {
        description: "They'll receive a notification and can accept your request.",
        duration: 4000,
      })
      
      // Move to next card
      setCurrentIndex(0)
      
    } catch (error) {
      toast.error("Failed to send like", {
        description: "Please try again.",
        duration: 4000,
      })
    } finally {
      setSendingRequest(false)
      setIsLoading(false)
    }
  }

  const handlePass = () => {
    if (!currentPartner) return
    
    // Remove current partner from stack
    setPartners(prev => prev.filter(p => p.id !== currentPartner.id))
    setCurrentIndex(0)
    
    toast.success(`Passed on ${currentPartner.name}`, {
      duration: 2000,
    })
  }

  const handleSuperLike = async () => {
    if (!currentPartner || sendingRequest) return
    
    setSendingRequest(true)
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remove current partner from stack
      setPartners(prev => prev.filter(p => p.id !== currentPartner.id))
      
      // Add to pending requests with super like indicator
      const newPendingRequest: PartnerRequest = {
        id: `pending-${Date.now()}`,
        name: currentPartner.name,
        avatar: currentPartner.avatar,
        message: `Super like sent to ${currentPartner.name}! ⭐`,
        timestamp: "Just now",
        partnerId: currentPartner.id,
        type: "outgoing"
      }
      
      setPendingRequests(prev => [newPendingRequest, ...prev])
      
      toast.success(`Super liked ${currentPartner.name}! ⭐`, {
        description: "Super likes get priority in their feed!",
        duration: 4000,
      })
      
      // Move to next card
      setCurrentIndex(0)
      
    } catch (error) {
      toast.error("Failed to send super like", {
        description: "Please try again.",
        duration: 4000,
      })
    } finally {
      setSendingRequest(false)
      setIsLoading(false)
    }
  }

  const acceptRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    if (!request) return

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setRequests(prev => prev.filter(r => r.id !== requestId))
      
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
        availability: ["Flexible"],
        photos: ["/placeholder-user.jpg"]
      }
      
      setCurrentPartners(prev => [...prev, newPartner])
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
    }
  }

  const declineRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    if (!request) return

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setRequests(prev => prev.filter(r => r.id !== requestId))
      toast.success(`Request from ${request.name} declined`, {
        duration: 3000,
      })
    } catch (error) {
      toast.error("Failed to decline request", {
        description: "Please try again.",
        duration: 4000,
      })
    }
  }

  const openProfile = (partner: Partner) => {
    setSelectedPartner(partner)
    setShowProfile(true)
  }

  const openChat = (partner: Partner) => {
    setSelectedChatPartner(partner)
    setIsChatOpen(true)
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
          senderId: partner.id,
          senderName: partner.name,
          message: responses[Math.floor(Math.random() * responses.length)],
          timestamp: "Just now"
        }

        setChatMessages(prev => ({
          ...prev,
          [partnerId]: [...(prev[partnerId] || []), response]
        }))
      }, 2000 + Math.random() * 3000)
      
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && selectedChatPartner) {
      sendMessage(selectedChatPartner.id)
    }
  }

  const getRotation = () => {
    return dragOffset.x * 0.1
  }

  const getOpacity = () => {
    return 1 - Math.abs(dragOffset.x) / 300
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {t("partner_finder_title", "Find Your Workout Partner")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t("partner_finder_desc", "Swipe right to like, left to pass. Find your perfect workout buddy!")}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-1">
          <div className="flex space-x-1">
            <Button
              variant={activeTab === "discover" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("discover")}
              className="flex items-center space-x-2"
            >
              <Heart className="h-4 w-4" />
              <span>Discover</span>
            </Button>
            <Button
              variant={activeTab === "requests" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("requests")}
              className="flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Requests ({requests.length})</span>
            </Button>
            <Button
              variant={activeTab === "partners" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("partners")}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Partners ({currentPartners.length})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Discover Tab - Tinder Style */}
      {activeTab === "discover" && (
        <div className="flex justify-center">
          <div className="relative w-full max-w-sm h-[600px]">
            {partners.length === 0 ? (
              <Card className="w-full h-full flex items-center justify-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardContent className="text-center">
                  <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No more partners!</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You've seen all available partners. Check back later for new matches!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Current Card */}
                {currentPartner && (
                  <Card
                    ref={cardRef}
                    className={`absolute inset-0 w-full h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm cursor-grab active:cursor-grabbing transition-transform duration-200 ${
                      isDragging ? 'scale-105' : ''
                    }`}
                    style={{
                      transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${getRotation()}deg)`,
                      opacity: getOpacity(),
                      zIndex: 10
                    }}
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={handleDragStart}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                  >
                    <CardContent className="p-0 h-full relative overflow-hidden rounded-lg">
                      {/* Photo */}
                      <div className="relative h-2/3 bg-gradient-to-br from-purple-400 to-pink-400">
                        <Avatar className="absolute inset-0 w-full h-full rounded-none">
                          <AvatarImage src={currentPartner.avatar} alt={currentPartner.name} className="object-cover" />
                          <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                            {currentPartner.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Online Status */}
                        {currentPartner.isOnline && (
                          <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Online
                          </div>
                        )}
                        
                        {/* Age Badge */}
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="font-semibold text-lg">{currentPartner.age}</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 h-1/3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold">{currentPartner.name}</h3>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{currentPartner.rating}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 mb-2">
                            <MapPin className="h-3 w-3" />
                            <span className="text-sm">{currentPartner.location}</span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {currentPartner.bio}
                          </p>
                          
                          <div className="flex flex-wrap gap-1">
                            {currentPartner.goals.slice(0, 2).map((goal, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {goal}
                              </Badge>
                            ))}
                            {currentPartner.goals.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{currentPartner.goals.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute bottom-4 right-4 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openProfile(currentPartner)}
                          className="bg-white/90 backdrop-blur-sm"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Next Card (Preview) */}
                {partners.length > 1 && (
                  <Card className="absolute inset-0 w-full h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm opacity-50 scale-95">
                    <CardContent className="p-0 h-full relative overflow-hidden rounded-lg">
                      <div className="relative h-2/3 bg-gradient-to-br from-purple-400 to-pink-400">
                        <Avatar className="absolute inset-0 w-full h-full rounded-none">
                          <AvatarImage src={partners[1]?.avatar} alt={partners[1]?.name} className="object-cover" />
                          <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                            {partners[1]?.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="p-4 h-1/3">
                        <h3 className="text-xl font-bold">{partners[1]?.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{partners[1]?.age} • {partners[1]?.fitnessLevel}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Action Buttons */}
            {partners.length > 0 && (
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handlePass}
                  disabled={isLoading}
                  className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border-2 border-red-200 hover:border-red-300 hover:bg-red-50"
                >
                  <X className="h-6 w-6 text-red-500" />
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleSuperLike}
                  disabled={isLoading}
                  className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Star className="h-6 w-6 text-blue-500" />
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleLike}
                  disabled={isLoading}
                  className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border-2 border-green-200 hover:border-green-300 hover:bg-green-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
                  ) : (
                    <Heart className="h-6 w-6 text-green-500" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="max-w-2xl mx-auto space-y-4">
          {requests.length === 0 ? (
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No requests yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Keep swiping to find potential workout partners!
                </p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={request.avatar} alt={request.name} />
                      <AvatarFallback>{request.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{request.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{request.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{request.timestamp}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => declineRequest(request.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-green-600 to-blue-600"
                        onClick={() => acceptRequest(request.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === "partners" && (
        <div className="max-w-2xl mx-auto space-y-4">
          {currentPartners.length === 0 ? (
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No partners yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Start swiping to find your workout buddies!
                </p>
              </CardContent>
            </Card>
          ) : (
            currentPartners.map((partner) => (
              <Card key={partner.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={partner.avatar} alt={partner.name} />
                      <AvatarFallback>{partner.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{partner.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{partner.fitnessLevel} • {partner.location}</p>
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
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

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

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPartner?.name}'s Profile</DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedPartner.avatar} alt={selectedPartner.name} />
                  <AvatarFallback>{selectedPartner.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedPartner.name}</h3>
                  <p className="text-gray-600">{selectedPartner.age} years • {selectedPartner.fitnessLevel}</p>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedPartner.location}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Bio</h4>
                <p className="text-gray-600">{selectedPartner.bio}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Fitness Goals</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.goals.map((goal, index) => (
                    <Badge key={index} variant="secondary">{goal}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Workout Preferences</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.workoutPreferences.map((pref, index) => (
                    <Badge key={index} variant="outline">{pref}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Availability</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.availability.map((day, index) => (
                    <Badge key={index} variant="outline">{day}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}