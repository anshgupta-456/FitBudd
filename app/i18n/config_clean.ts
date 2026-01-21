import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: "Dashboard",
      planner: "Planner",
      tracker: "Tracker",
      partners: "Partners",
      profile: "Profile",
      daily_exercises: "Daily Exercises",
      machine_guide: "Machine Guide",
      posture_checker: "Posture Checker",

      // General
      welcome: "Welcome to AI Fitness",
      getting_started: "Getting Started",
      language: "Language",
      english: "English",
      hindi: "हिंदी",
      spanish: "Español",
      french: "Français",

      // Dashboard
      dashboard_title: "Your Fitness Dashboard",
      dashboard_desc: "Track your progress, plan your workouts, and achieve your fitness goals with AI-powered insights.",
      
      // Quick Actions
      start_daily_workout: "Start Daily Workout",
      check_my_form: "Check My Form",
      find_partner: "Find Partner",
      track_progress: "Track Progress",

      // Workouts
      upper_body_strength: "Upper Body Strength",
      morning_cardio: "Morning Cardio",
      yoga_flow: "Yoga Flow",
      lower_body_strength: "Lower Body Strength",
      hiit_cardio: "HIIT Cardio",
      flexibility_stretch: "Flexibility & Stretch",
      completed: "Completed",
      duration: "Duration",

      // Fitness levels
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",

      // Exercise types
      cardio: "Cardio",
      strength: "Strength",
      flexibility: "Flexibility",
      yoga: "Yoga",
      functional: "Functional",

      // Workout Planner
      workout_planner_title: "AI Workout Planner",
      workout_planner_desc: "Create personalized workout plans tailored to your goals, fitness level, and schedule.",
      fitness_goals: "Fitness Goals",
      weight_loss: "Weight Loss",
      muscle_gain: "Muscle Gain",
      endurance: "Endurance",
      general_fitness: "General Fitness",
      fitness_level: "Fitness Level",
      workout_days: "Workout Days",
      session_duration: "Session Duration",
      minutes: "minutes",
      generate_plan: "Generate Plan",
      regenerate_plan: "Regenerate Plan",
      customize: "Customize",
      save_plan: "Save Plan",
      start_plan: "Start Plan",
      
      // Days of week
      monday: "Monday",
      tuesday: "Tuesday", 
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",

      // Fitness Tracker
      tracker_title: "Fitness Tracker",
      tracker_desc: "Track your progress, monitor your goals, and stay motivated on your fitness journey.",
      steps_today: "Steps Today",
      calories_burned: "Calories Burned",
      active_minutes: "Active Minutes",
      workouts_this_week: "Workouts This Week",
      weight_progress: "Weight Progress",
      body_fat_progress: "Body Fat Progress",
      add_measurement: "Add New Measurement",
      weight: "Weight (kg)",
      body_fat: "Body Fat (%)",
      muscle_mass: "Muscle Mass (kg)",
      recent_workouts_tracker: "Recent Workouts",

      // Partner Finder
      partner_finder_title: "Find Your Workout Partner",
      partner_finder_desc: "Connect with like-minded fitness enthusiasts, find accountability partners, and make your fitness journey more fun and social.",
      discover: "Discover",
      requests: "Requests",
      my_partners: "My Partners",
      chat: "Chat",
      search_partners: "Search partners by name or location...",
      all_levels: "All Levels",
      all_goals: "All Goals",
      view_profile: "View Profile",
      send_request: "Send Request",
      online_now: "Online now",
      last_seen: "Last seen",
      partner_requests: "Partner Requests",
      no_requests: "No partner requests yet",
      decline: "Decline",
      accept: "Accept",
      current_partners: "Current Partners",
      no_partners: "No workout partners yet",
      find_partners_prompt: "Discover new partners in the Discover tab!",
      message: "Message",
      chat_with_partners: "Chat with Partners",
      no_chats: "No active chats",
      add_partners_to_chat: "Add workout partners to start chatting!",
      type_message: "Type a message...",
      send: "Send",
      bio: "Bio",
      workout_preferences: "Workout Preferences",
      availability: "Availability",

      // Gym Equipment
      equipment: "Equipment",
      gym_machine_guide: "Gym Machine Guide",
      gym_guide_desc: "Learn proper form and techniques for gym equipment with AI-powered guidance.",
      treadmill: "Treadmill",
      elliptical: "Elliptical",
      rowing_machine: "Rowing Machine",
      stationary_bike: "Stationary Bike",
      lat_pulldown: "Lat Pulldown",
      leg_press: "Leg Press",
      chest_press: "Chest Press",
      shoulder_press: "Shoulder Press",
      leg_curl: "Leg Curl",
      leg_extension: "Leg Extension",
      cable_machine: "Cable Machine",
      smith_machine: "Smith Machine",

      // Daily Exercises
      daily_exercises_title: "Daily Exercises",
      daily_exercises_desc: "Discover your personalized daily workout routine with exercises tailored to your goals.",
      today_workout: "Today's Workout",
      equipment_needed: "Equipment Needed",
      rest_day: "Rest Day",
      rest_day_desc: "Take a well-deserved break and let your muscles recover.",

      // Common actions
      start: "Start",
      pause: "Pause",
      stop: "Stop",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      close: "Close",
      next: "Next",
      previous: "Previous",
      loading: "Loading...",
      error: "Error",
      success: "Success",
    }
  },
  hi: {
    translation: {
      // Navigation
      dashboard: "डैशबोर्ड",
      planner: "योजनाकार",
      tracker: "ट्रैकर",
      partners: "साथी",
      profile: "प्रोफ़ाइल",
      daily_exercises: "दैनिक व्यायाम",
      machine_guide: "मशीन गाइड",
      posture_checker: "मुद्रा जांचकर्ता",

      // General
      welcome: "AI फिटनेस में आपका स्वागत है",
      getting_started: "शुरुआत करना",
      language: "भाषा",
      english: "English",
      hindi: "हिंदी",
      spanish: "Español",
      french: "Français",

      // Dashboard
      dashboard_title: "आपका फिटनेस डैशबोर्ड",
      dashboard_desc: "AI-संचालित अंतर्दृष्टि के साथ अपनी प्रगति को ट्रैक करें, अपने वर्कआउट की योजना बनाएं, और अपने फिटनेस लक्ष्यों को प्राप्त करें।",

      // Quick Actions
      start_daily_workout: "दैनिक वर्कआउट शुरू करें",
      check_my_form: "मेरा फॉर्म जांचें",
      find_partner: "साथी खोजें",
      track_progress: "प्रगति ट्रैक करें",

      // Workouts
      upper_body_strength: "ऊपरी शरीर की शक्ति",
      morning_cardio: "सुबह का कार्डियो",
      yoga_flow: "योग फ्लो",
      lower_body_strength: "निचले शरीर की शक्ति",
      hiit_cardio: "HIIT कार्डियो",
      flexibility_stretch: "लचीलापन और खिंचाव",
      completed: "पूर्ण",
      duration: "अवधि",

      // Fitness levels
      beginner: "शुरुआती",
      intermediate: "मध्यम",
      advanced: "उन्नत",

      // Exercise types
      cardio: "कार्डियो",
      strength: "शक्ति",
      flexibility: "लचीलापन",
      yoga: "योग",
      functional: "कार्यात्मक",

      // Workout Planner
      workout_planner_title: "AI वर्कआउट प्लानर",
      workout_planner_desc: "अपने लक्ष्यों, फिटनेस स्तर और शेड्यूल के अनुरूप व्यक्तिगत वर्कआउट योजनाएं बनाएं।",
      fitness_goals: "फिटनेस लक्ष्य",
      weight_loss: "वजन घटाना",
      muscle_gain: "मांसपेशी वृद्धि",
      endurance: "सहनशीलता",
      general_fitness: "सामान्य फिटनेस",
      fitness_level: "फिटनेस स्तर",
      workout_days: "वर्कआउट दिन",
      session_duration: "सत्र अवधि",
      minutes: "मिनट",
      generate_plan: "योजना जेनरेट करें",
      regenerate_plan: "योजना पुनर्जनरेट करें",
      customize: "अनुकूलित करें",
      save_plan: "योजना सेव करें",
      start_plan: "योजना शुरू करें",

      // Days of week
      monday: "सोमवार",
      tuesday: "मंगलवार",
      wednesday: "बुधवार",
      thursday: "गुरुवार",
      friday: "शुक्रवार",
      saturday: "शनिवार",
      sunday: "रविवार",

      // Fitness Tracker
      tracker_title: "फिटनेस ट्रैकर",
      tracker_desc: "अपनी प्रगति को ट्रैक करें, अपने लक्ष्यों की निगरानी करें, और अपनी फिटनेस यात्रा में प्रेरित रहें।",
      steps_today: "आज के कदम",
      calories_burned: "कैलोरी जली",
      active_minutes: "सक्रिय मिनट",
      workouts_this_week: "इस सप्ताह वर्कआउट",
      weight_progress: "वजन की प्रगति",
      body_fat_progress: "शरीर की चर्बी की प्रगति",
      add_measurement: "नई माप जोड़ें",
      weight: "वजन (किग्रा)",
      body_fat: "शरीर की चर्बी (%)",
      muscle_mass: "मांसपेशी द्रव्यमान (किग्रा)",
      recent_workouts_tracker: "हाल के वर्कआउट्स",

      // Partner Finder
      partner_finder_title: "अपना वर्कआउट पार्टनर खोजें",
      partner_finder_desc: "समान विचारधारा वाले फिटनेस उत्साही लोगों से जुड़ें, जवाबदेही साझीदार खोजें, और अपनी फिटनेस यात्रा को और मजेदार और सामाजिक बनाएं।",
      discover: "खोजें",
      requests: "अनुरोध",
      my_partners: "मेरे साझीदार",
      chat: "चैट",
      search_partners: "नाम या स्थान के आधार पर साझीदार खोजें...",
      all_levels: "सभी स्तर",
      all_goals: "सभी लक्ष्य",
      view_profile: "प्रोफ़ाइल देखें",
      send_request: "अनुरोध भेजें",
      online_now: "अभी ऑनलाइन",
      last_seen: "अंतिम बार देखा गया",
      partner_requests: "साझीदार अनुरोध",
      no_requests: "अभी तक कोई साझीदार अनुरोध नहीं",
      decline: "अस्वीकार करें",
      accept: "स्वीकार करें",
      current_partners: "वर्तमान साझीदार",
      no_partners: "अभी तक कोई वर्कआउट साझीदार नहीं",
      find_partners_prompt: "डिस्कवर टैब में नए साझीदार खोजें!",
      message: "संदेश",
      chat_with_partners: "साझीदारों के साथ चैट करें",
      no_chats: "कोई सक्रिय चैट नहीं",
      add_partners_to_chat: "चैट शुरू करने के लिए वर्कआउट साझीदार जोड़ें!",
      type_message: "एक संदेश टाइप करें...",
      send: "भेजें",
      bio: "बायो",
      workout_preferences: "वर्कआउट प्राथमिकताएं",
      availability: "उपलब्धता",

      // Common actions
      start: "शुरू करें",
      pause: "रोकें",
      stop: "बंद करें",
      save: "सेव करें",
      cancel: "रद्द करें",
      edit: "संपादित करें",
      delete: "हटाएं",
      view: "देखें",
      close: "बंद करें",
      next: "अगला",
      previous: "पिछला",
      loading: "लोड हो रहा है...",
      error: "त्रुटि",
      success: "सफलता",
    }
  },
  es: {
    translation: {
      // For now, using English as fallback - would be replaced with proper Spanish translations
      dashboard: "Panel",
      planner: "Planificador",
      tracker: "Seguidor",
      partners: "Compañeros",
      profile: "Perfil",
      // ... other Spanish translations would go here
    }
  },
  fr: {
    translation: {
      // For now, using English as fallback - would be replaced with proper French translations
      dashboard: "Tableau de bord",
      planner: "Planificateur",
      tracker: "Tracker",
      partners: "Partenaires",
      profile: "Profil",
      // ... other French translations would go here
    }
  }
}

export default resources
