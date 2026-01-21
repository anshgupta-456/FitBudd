"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  Dumbbell, 
  Search,
  Filter,
  Phone,
  Globe,
  Wifi,
  Car,
  Coffee,
  WifiIcon,
  Parking
} from "lucide-react"
import { toast } from "sonner"

// Types
interface Gym {
  id: string
  name: string
  address: string
  city: string
  rating: number
  reviewCount: number
  distance: number
  pricePerMonth: number
  image: string
  amenities: string[]
  operatingHours: {
    weekdays: string
    weekends: string
  }
  phone: string
  website: string
  description: string
  equipment: string[]
  classes: string[]
  isOpen: boolean
}

// Mock data
const mockGyms: Gym[] = [
  {
    id: "1",
    name: "FitZone Premium",
    address: "73, Bhera Enclave",
    city: "Delhi, India",
    rating: 4.8,
    reviewCount: 1247,
    distance: 0.8,
    pricePerMonth: 2600,
    image: "/placeholder.svg",
    amenities: ["Parking", "Locker Rooms", "Showers", "WiFi", "Cafe"],
    operatingHours: {
      weekdays: "5:00 AM - 11:00 PM",
      weekends: "6:00 AM - 10:00 PM"
    },
    phone: "+91 98765 43210",
    website: "www.fitzonepremium.com",
    description: "Premium fitness center with state-of-the-art equipment and expert trainers.",
    equipment: ["Cardio Machines", "Weight Training", "Functional Training", "Swimming Pool"],
    classes: ["Yoga", "Pilates", "HIIT", "CrossFit", "Zumba"],
    isOpen: true
  },
  {
    id: "2",
    name: "cult.fit",
    address: "76, Mianwali Enclave",
    city: "Delhi, India",
    rating: 4.6,
    reviewCount: 892,
    distance: 1.2,
    pricePerMonth: 7000,
    image: "/placeholder.svg",
    amenities: ["Parking", "Locker Rooms", "Showers", "WiFi"],
    operatingHours: {
      weekdays: "6:00 AM - 10:00 PM",
      weekends: "7:00 AM - 9:00 PM"
    },
    phone: "+91 87654 32109",
    website: "www.cultfit.com",
    description: "Community-focused gym with friendly atmosphere and affordable membership.",
    equipment: ["Cardio Machines", "Weight Training", "Functional Training"],
    classes: ["Yoga", "HIIT", "Strength Training"],
    isOpen: true
  },
  {
    id: "3",
    name: "D-Fitness Club",
    address: "2908 Guru Harikishan",
    city: "Delhi, India",
    rating: 4.9,
    reviewCount: 2156,
    distance: 2.1,
    pricePerMonth: 1100,
    image: "/placeholder.svg",
    amenities: ["Parking", "Locker Rooms", "Showers", "WiFi", "Cafe", "Sauna"],
    operatingHours: {
      weekdays: "4:00 AM - 12:00 AM",
      weekends: "5:00 AM - 11:00 PM"
    },
    phone: "+91 76543 21098",
    website: "www.dfitnessclub.com",
    description: "Luxury fitness center with premium amenities and personal training services.",
    equipment: ["Cardio Machines", "Weight Training", "Functional Training", "Swimming Pool", "Spa"],
    classes: ["Yoga", "Pilates", "HIIT", "CrossFit", "Zumba", "Personal Training"],
    isOpen: false
  }
]

const amenityIcons: { [key: string]: any } = {
  "Parking": Car,
  "Locker Rooms": Users,
  "Showers": Users,
  "WiFi": WifiIcon,
  "Cafe": Coffee,
  "Sauna": Users
}

export default function GymListing() {
  const { t } = useTranslation()
  const [gyms, setGyms] = useState<Gym[]>([])
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [priceFilter, setPriceFilter] = useState("all")
  const [ratingFilter, setRatingFilter] = useState("all")
  const [amenityFilter, setAmenityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("distance")
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    setGyms(mockGyms)
    setFilteredGyms(mockGyms)
  }, [])

  useEffect(() => {
    let filtered = [...gyms]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(gym =>
        gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Price filter
    if (priceFilter !== "all") {
      const priceRanges = {
        "under-50": (gym: Gym) => gym.pricePerMonth < 2500,
        "50-80": (gym: Gym) => gym.pricePerMonth >= 2500 && gym.pricePerMonth <= 8000,
        "80-120": (gym: Gym) => gym.pricePerMonth > 8000 && gym.pricePerMonth <= 12000,
        "over-120": (gym: Gym) => gym.pricePerMonth > 12000
      }
      filtered = filtered.filter(priceRanges[priceFilter as keyof typeof priceRanges])
    }

    // Rating filter
    if (ratingFilter !== "all") {
      const minRating = parseFloat(ratingFilter)
      filtered = filtered.filter(gym => gym.rating >= minRating)
    }

    // Amenity filter
    if (amenityFilter !== "all") {
      filtered = filtered.filter(gym => gym.amenities.includes(amenityFilter))
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return a.distance - b.distance
        case "rating":
          return b.rating - a.rating
        case "price":
          return a.pricePerMonth - b.pricePerMonth
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    setFilteredGyms(filtered)
  }, [gyms, searchQuery, priceFilter, ratingFilter, amenityFilter, sortBy])

  const handleBookGym = (gym: Gym) => {
    toast.success(`Booking request sent to ${gym.name}!`, {
      description: "You'll receive a confirmation email shortly.",
      duration: 4000,
    })
  }

  const getAmenityIcon = (amenity: string) => {
    const IconComponent = amenityIcons[amenity] || Dumbbell
    return <IconComponent className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Find Your Perfect Gym
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover gyms near you with the amenities and equipment you need to reach your fitness goals.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search gyms by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Price Filter */}
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-50">Under 2500</SelectItem>
                <SelectItem value="50-80">2500 - 8000</SelectItem>
                <SelectItem value="80-120">8000 - 12000</SelectItem>
                <SelectItem value="over-120">Over 12000</SelectItem>
              </SelectContent>
            </Select>

            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Minimum Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
                <SelectItem value="4.0">4.0+ Stars</SelectItem>
                <SelectItem value="3.5">3.5+ Stars</SelectItem>
              </SelectContent>
            </Select>

            {/* Amenity Filter */}
            <Select value={amenityFilter} onValueChange={setAmenityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Amenities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Amenities</SelectItem>
                <SelectItem value="Parking">Parking</SelectItem>
                <SelectItem value="Locker Rooms">Locker Rooms</SelectItem>
                <SelectItem value="Showers">Showers</SelectItem>
                <SelectItem value="WiFi">WiFi</SelectItem>
                <SelectItem value="Cafe">Cafe</SelectItem>
                <SelectItem value="Sauna">Sauna</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {filteredGyms.length} gym{filteredGyms.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Filters applied</span>
        </div>
      </div>

      {/* Gym Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGyms.map((gym) => (
          <Card key={gym.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-0">
              {/* Gym Image */}
              <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-lg overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-4 right-4">
                  <Badge variant={gym.isOpen ? "default" : "secondary"} className="bg-green-500">
                    {gym.isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{gym.name}</h3>
                  <p className="text-sm opacity-90">{gym.city}</p>
                </div>
              </div>

              <div className="p-6">
                {/* Rating and Distance */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{gym.rating}</span>
                    <span className="text-sm text-gray-500">({gym.reviewCount})</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span>{gym.distance} mi</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-2xl font-bold text-green-600">₹{gym.pricePerMonth}</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>

                {/* Amenities */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-2">
                    {gym.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs flex items-center space-x-1">
                        {getAmenityIcon(amenity)}
                        <span>{amenity}</span>
                      </Badge>
                    ))}
                    {gym.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{gym.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Hours */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>Mon-Fri: {gym.operatingHours.weekdays}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setSelectedGym(gym)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{gym.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Contact Info</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-3 w-3" />
                                <span>{gym.address}, {gym.city}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="h-3 w-3" />
                                <span>{gym.phone}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Globe className="h-3 w-3" />
                                <span>{gym.website}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Operating Hours</h4>
                            <div className="space-y-1 text-sm">
                              <div>Weekdays: {gym.operatingHours.weekdays}</div>
                              <div>Weekends: {gym.operatingHours.weekends}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm text-gray-600">{gym.description}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Equipment</h4>
                          <div className="flex flex-wrap gap-2">
                            {gym.equipment.map((item) => (
                              <Badge key={item} variant="secondary">{item}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Classes</h4>
                          <div className="flex flex-wrap gap-2">
                            {gym.classes.map((cls) => (
                              <Badge key={cls} variant="outline">{cls}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 dark:bg-purple-600 hover:from-blue-700 hover:to-purple-700 dark:hover:bg-purple-700 text-white dark:text-white shadow-sm"
                    onClick={() => handleBookGym(gym)}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredGyms.length === 0 && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <Dumbbell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No gyms found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search criteria or filters to find more gyms.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
