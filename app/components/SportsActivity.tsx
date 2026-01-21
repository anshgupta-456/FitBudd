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
import { Users, MapPin, Calendar, Clock, Sparkles, Star, Filter } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StudioClass {
  id: number
  name: string
  sport_type: string
  instructor_name: string
  date: string
  time: string
  duration: number
  level: string
  intensity: string
  max_spots: number
  spots_booked: number
  spots_left: number
  location: string
  description: string
  price: number
}

interface SportsVenue {
  id: number
  name: string
  sport_type: string
  date: string
  start_time: string
  end_time: string
  location: string
  court_number: string
  price_per_hour: number
  equipment_included: boolean
  lights_included: boolean
  description: string
}

const SPORT_TYPES_CLASSES = [
  { value: "all", label: "All Classes" },
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
  { value: "aerial", label: "Aerial" },
  { value: "dance_fitness", label: "Dance Fitness" },
]

const SPORT_TYPES_VENUES = [
  { value: "all", label: "All Venues" },
  { value: "pickleball", label: "Pickleball" },
  { value: "badminton", label: "Badminton" },
  { value: "tennis", label: "Tennis" },
  { value: "basketball", label: "Basketball" },
  { value: "volleyball", label: "Volleyball" },
  { value: "multi_sport", label: "Multi-Sport" },
]

export default function SportsActivity() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<StudioClass[]>([])
  const [venues, setVenues] = useState<SportsVenue[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [venuesLoading, setVenuesLoading] = useState(true)
  const [classFilter, setClassFilter] = useState("all")
  const [venueFilter, setVenueFilter] = useState("all")
  
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [bookingType, setBookingType] = useState<"class" | "venue">("class")
  const [selectedItem, setSelectedItem] = useState<StudioClass | SportsVenue | null>(null)
  const [bookingNotes, setBookingNotes] = useState("")
  const [bookingLoading, setBookingLoading] = useState(false)

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'
  const [activeTab, setActiveTab] = useState("classes")

  const fetchClasses = useCallback(async () => {
    try {
      setClassesLoading(true)
      const params = new URLSearchParams()
      if (classFilter !== "all") {
        params.append("sport_type", classFilter)
      }
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const res = await fetch(`${baseUrl}/api/sports/classes?${params}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.success) {
        setClasses(data.classes || [])
      } else {
        console.error("API error:", data.error)
        setClasses([])
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("Request timeout")
        toast.error("Request timed out. Please try again.")
      } else {
        console.error("Error fetching classes:", error)
        // Don't show toast on every error to reduce noise
      }
      setClasses([])
    } finally {
      setClassesLoading(false)
    }
  }, [baseUrl, classFilter])

  const fetchVenues = useCallback(async () => {
    try {
      setVenuesLoading(true)
      const params = new URLSearchParams()
      if (venueFilter !== "all") {
        params.append("sport_type", venueFilter)
      }
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const res = await fetch(`${baseUrl}/api/sports/venues?${params}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.success) {
        setVenues(data.venues || [])
      } else {
        console.error("API error:", data.error)
        setVenues([])
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("Request timeout")
        toast.error("Request timed out. Please try again.")
      } else {
        console.error("Error fetching venues:", error)
        // Don't show toast on every error to reduce noise
      }
      setVenues([])
    } finally {
      setVenuesLoading(false)
    }
  }, [baseUrl, venueFilter])

  // Fetch classes when filter changes
  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  // Fetch venues when filter changes
  useEffect(() => {
    fetchVenues()
  }, [fetchVenues])

  const handleBookClick = (type: "class" | "venue", item: StudioClass | SportsVenue) => {
    if (!user?.id) {
      toast.error("Please log in to book")
      return
    }
    setBookingType(type)
    setSelectedItem(item)
    setBookingNotes("")
    setBookingDialogOpen(true)
  }

  const handleBookingSubmit = async () => {
    if (!user?.id || !selectedItem) return

    setBookingLoading(true)
    try {
      const endpoint = bookingType === "class" 
        ? `${baseUrl}/api/sports/classes/book`
        : `${baseUrl}/api/sports/venues/book`
      
      const payload = {
        user_id: user.id,
        [bookingType === "class" ? "class_id" : "venue_id"]: selectedItem.id,
        notes: bookingNotes,
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(bookingType === "class" ? "Class booked successfully!" : "Venue reserved successfully!")
        setBookingDialogOpen(false)
        setBookingNotes("")
        // Refresh data
        fetchClasses()
        fetchVenues()
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    }
  }

  const getSportTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      yoga: "bg-purple-100 text-purple-700 border-purple-200",
      pilates: "bg-pink-100 text-pink-700 border-pink-200",
      aerial: "bg-indigo-100 text-indigo-700 border-indigo-200",
      dance_fitness: "bg-orange-100 text-orange-700 border-orange-200",
      pickleball: "bg-green-100 text-green-700 border-green-200",
      badminton: "bg-blue-100 text-blue-700 border-blue-200",
      tennis: "bg-yellow-100 text-yellow-700 border-yellow-200",
      basketball: "bg-red-100 text-red-700 border-red-200",
      volleyball: "bg-teal-100 text-teal-700 border-teal-200",
      multi_sport: "bg-gray-100 text-gray-700 border-gray-200",
    }
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Sports & Studio{" "}
          <span className="bg-gradient-to-r from-fuchsia-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
            activity
          </span>
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
          Book premium group classes like yoga, pilates and dance, or reserve high‑energy sports courts for
          pickleball, badminton and more — all in one place.
        </p>
      </div>

      <Tabs defaultValue="classes" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/60 dark:bg-gray-900/60 backdrop-blur border rounded-full p-1 inline-flex">
          <TabsTrigger value="classes" className="rounded-full px-4 py-1 text-xs md:text-sm">
            Studio classes
          </TabsTrigger>
          <TabsTrigger value="venues" className="rounded-full px-4 py-1 text-xs md:text-sm">
            Sports venues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-4">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border-0 shadow-lg shadow-gray-900/5">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-fuchsia-500" />
                    <span>Yoga, Pilates & Aerial</span>
                  </CardTitle>
                  <CardDescription>
                    Calm but powerful flows, pilates strength and aerial movement — designed for small, social groups.
                  </CardDescription>
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Filter className="h-4 w-4 text-gray-500" />
                {SPORT_TYPES_CLASSES.map((type) => (
                  <Button
                    key={type.value}
                    variant={classFilter === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setClassFilter(type.value)}
                    className={`rounded-full text-xs ${
                      classFilter === type.value
                        ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                        : ""
                    }`}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {classesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading classes...</div>
              ) : classes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No classes available{classFilter !== "all" ? ` for ${classFilter}` : ""}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((session) => (
                    <Card
                      key={session.id}
                      className="border-0 bg-gray-50/80 dark:bg-gray-900/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                    >
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`rounded-full text-[10px] px-2 py-0.5 ${getSportTypeColor(session.sport_type)}`}>
                                {session.sport_type.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm font-semibold">{session.name}</p>
                            {session.instructor_name && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                with {session.instructor_name}
                              </p>
                            )}
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(session.date)} • <Clock className="h-3 w-3 ml-1" />
                              {session.time}
                            </p>
                          </div>
                          <Badge className="rounded-full text-[10px] px-2 py-0.5 flex items-center gap-1 bg-slate-900 text-white">
                            <Users className="h-3 w-3" />
                            {session.spots_left} left
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Star className="h-3 w-3 text-amber-400" />
                            <span className="capitalize">{session.level.replace("_", " ")}</span>
                          </div>
                          <span className="capitalize">{session.intensity} intensity</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location}
                          </span>
                          <span className="font-semibold text-fuchsia-600">₹{session.price}</span>
                        </div>
                        <Button 
                          className="w-full h-8 rounded-full text-xs font-semibold !bg-slate-900 dark:!bg-purple-600 hover:!bg-slate-800 dark:hover:!bg-purple-700 !text-white shadow-sm"
                          onClick={() => handleBookClick("class", session)}
                          disabled={session.spots_left === 0}
                        >
                          {session.spots_left === 0 ? "Full" : "Book this class"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venues" className="space-y-4">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border-0 shadow-lg shadow-gray-900/5">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-emerald-500" />
                    <span>Sports courts & venues</span>
                  </CardTitle>
                  <CardDescription>
                    Reserve premium courts for pickleball, badminton and more — perfect for partner or group sessions.
                  </CardDescription>
                </div>
              </div>
              
              {/* Filter Dropdown */}
              <div className="flex items-center gap-3 mt-4">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={venueFilter} onValueChange={setVenueFilter}>
                  <SelectTrigger className="w-[200px] rounded-full">
                    <SelectValue placeholder="Filter by sport type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORT_TYPES_VENUES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {venuesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading venues...</div>
              ) : venues.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No venues available{venueFilter !== "all" ? ` for ${venueFilter.replace("_", " ")}` : ""}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {venues.map((venue) => (
                    <Card
                      key={venue.id}
                      className="border-0 bg-gray-50/80 dark:bg-gray-900/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                    >
                      <CardContent className="pt-4 space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`rounded-full text-[10px] px-2 py-0.5 ${getSportTypeColor(venue.sport_type)}`}>
                              {venue.sport_type.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold">{venue.name}</p>
                          {venue.court_number && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {venue.court_number}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(venue.date)} • {venue.start_time} - {venue.end_time}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {venue.location}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {venue.equipment_included && (
                            <Badge variant="outline" className="rounded-full px-2 py-0.5">
                              Equipment included
                            </Badge>
                          )}
                          {venue.lights_included && (
                            <Badge variant="outline" className="rounded-full px-2 py-0.5">
                              Lights included
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            ₹{venue.price_per_hour}/30mins
                          </span>
                        </div>
                        <Button 
                          className="w-full h-8 rounded-full text-xs font-semibold !bg-slate-900 dark:!bg-purple-600 hover:!bg-slate-800 dark:hover:!bg-purple-700 !text-white shadow-sm"
                          onClick={() => handleBookClick("venue", venue)}
                        >
                          Reserve this venue
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Book {bookingType === "class" ? "Class" : "Venue"}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <>
                  {bookingType === "class" ? (
                    <>
                      <strong>{(selectedItem as StudioClass).name}</strong>
                      <br />
                      {formatDate((selectedItem as StudioClass).date)} at {(selectedItem as StudioClass).time}
                      <br />
                      ₹{(selectedItem as StudioClass).price}
                    </>
                  ) : (
                    <>
                      <strong>{(selectedItem as SportsVenue).name}</strong>
                      <br />
                      {formatDate((selectedItem as SportsVenue).date)} from {(selectedItem as SportsVenue).start_time} to {(selectedItem as SportsVenue).end_time}
                      <br />
                      ₹{(selectedItem as SportsVenue).price_per_hour}/30mins
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBookingDialogOpen(false)}
              disabled={bookingLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookingSubmit}
              disabled={bookingLoading}
              className="!bg-slate-900 dark:!bg-purple-600 hover:!bg-slate-800 dark:hover:!bg-purple-700 !text-white shadow-sm"
            >
              {bookingLoading ? "Booking..." : `Confirm Booking`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
