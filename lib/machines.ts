export interface Machine {
  slug: string
  name: string
  category: "cardio" | "strength"
  level: "beginner" | "intermediate"
  muscles: string[]
  image: string
  summary: string
  setup: string[]
  steps: string[]
  cues: string[]
  mistakes: string[]
  starting: string
}

export const MACHINES: Machine[] = [
  {
    slug: "treadmill",
    name: "Treadmill",
    category: "cardio",
    level: "beginner",
    muscles: ["Legs", "Heart and lungs"],
    image: "/images/treadmill.jpg",
    summary: "Walking, running and incline work at a pace you control.",
    setup: ["Clip the safety key to your clothing before you start the belt.", "Stand on the side rails, press start, and step on once the belt is moving slowly."],
    steps: [
      "Start at a walk of 4–5 km/h for three to five minutes.",
      "Raise the speed in small steps until you reach your target pace.",
      "For incline walking, keep speed around 5 km/h and raise the incline instead.",
      "Finish with three minutes of easy walking before stopping the belt.",
    ],
    cues: ["Look ahead, not at your feet.", "Land under your hips, not out in front.", "Let your arms swing naturally; only hold the rails to steady yourself."],
    mistakes: ["Holding the handrails while walking on a steep incline, which takes the work away from your legs.", "Stepping off backwards or jumping off a moving belt."],
    starting: "Twenty minutes of brisk walking, then add a minute of jogging every few sessions.",
  },
  {
    slug: "leg-press",
    name: "Leg press",
    category: "strength",
    level: "beginner",
    muscles: ["Quads", "Glutes", "Hamstrings"],
    image: "/images/legpress.jpg",
    summary: "Heavy leg work without having to balance a bar on your back.",
    setup: ["Sit with your lower back and hips flat against the pad.", "Feet flat on the platform, hip-width apart, toes slightly out.", "Release the safety handles only once your legs are holding the weight."],
    steps: [
      "Lower the platform by bending your knees towards your chest.",
      "Stop when your knees are at about 90 degrees, or just before your lower back starts to lift off the pad.",
      "Push back up through your whole foot, mostly heels and mid-foot.",
      "Stop just short of locking your knees, then lower again.",
    ],
    cues: ["Knees track over your toes.", "Lower back stays glued to the pad.", "Two seconds down, one second up."],
    mistakes: ["Letting knees cave inwards on the way up.", "Going so deep that your hips roll and your lower back rounds.", "Snapping the knees straight at the top."],
    starting: "3 sets of 10–12 with a weight you could lift 3 more times.",
  },
  {
    slug: "lat-pulldown",
    name: "Lat pulldown",
    category: "strength",
    level: "beginner",
    muscles: ["Lats", "Upper back", "Biceps"],
    image: "/images/latpulldown.jpg",
    summary: "The machine version of a pull-up. Builds the back you need for one.",
    setup: ["Set the thigh pad so your legs are locked in snugly.", "Take the bar a little wider than shoulder-width, palms facing away."],
    steps: [
      "Sit down with arms straight and lean back slightly, about 10–15 degrees.",
      "Pull your shoulder blades down first, then drive your elbows down to your sides.",
      "Bring the bar to the top of your chest.",
      "Let it rise slowly until your arms are straight again.",
    ],
    cues: ["Chest up towards the bar.", "Think elbows into back pockets.", "Control the bar on the way up."],
    mistakes: ["Pulling the bar behind your neck.", "Swinging your whole body back to move the weight.", "Shrugging your shoulders up to your ears."],
    starting: "3 sets of 10–12. If you can't pause with the bar at your chest, it's too heavy.",
  },
  {
    slug: "chest-press",
    name: "Chest press",
    category: "strength",
    level: "beginner",
    muscles: ["Chest", "Front shoulders", "Triceps"],
    image: "/images/chestpress.jpg",
    summary: "A guided pressing movement that's a safe way to learn before the bench press.",
    setup: ["Adjust the seat so the handles line up with the middle of your chest.", "Sit back with your shoulder blades pulled back and down against the pad."],
    steps: [
      "Grip the handles with wrists straight.",
      "Press forward until your arms are almost straight.",
      "Return slowly until your hands are level with your chest.",
    ],
    cues: ["Breathe out as you press.", "Keep your shoulder blades against the pad.", "Elbows at about 45 degrees to your body, not flared out to the sides."],
    mistakes: ["Seat too low, which puts strain on the front of the shoulder.", "Letting the weight stack crash between reps."],
    starting: "3 sets of 10–12.",
  },
  {
    slug: "rowing-machine",
    name: "Rowing machine",
    category: "cardio",
    level: "intermediate",
    muscles: ["Legs", "Back", "Core", "Arms"],
    image: "/images/rowingmachine.jpg",
    summary: "Low-impact cardio that works almost every muscle you have.",
    setup: ["Strap your feet in so the strap crosses the widest part of your foot.", "Set the damper to 3–5. Higher feels heavier but isn't a better workout."],
    steps: [
      "Catch: shins vertical, arms straight, leaning slightly forward from the hips.",
      "Drive: push with your legs first, then swing your body back, then pull the handle to your lower ribs.",
      "Recovery: arms out, body forward, then bend your knees to slide back in.",
      "Aim for the recovery to take about twice as long as the drive.",
    ],
    cues: ["Legs, body, arms. Arms, body, legs.", "Most of the power comes from your legs.", "Keep your back straight, hinge from the hips."],
    mistakes: ["Pulling with the arms before the legs have finished pushing.", "Rounding the lower back at the catch.", "Rowing at a high stroke rate with no power behind it."],
    starting: "10 minutes at 20–24 strokes per minute, focusing on the sequence.",
  },
  {
    slug: "cable-machine",
    name: "Cable machine",
    category: "strength",
    level: "intermediate",
    muscles: ["Depends on the exercise"],
    image: "/images/cablemachine.jpg",
    summary: "Adjustable pulleys for rows, pushdowns, face pulls, flyes and much more.",
    setup: ["Set the pulley height for the exercise, e.g. high for pushdowns, chest height for rows and face pulls.", "Choose the attachment: rope, straight bar or single handle."],
    steps: [
      "Take a stable stance: feet planted, core braced.",
      "Move only the joints the exercise is meant to work.",
      "Return under control until the weight is just short of touching the stack.",
    ],
    cues: ["The cable keeps tension the whole way, so slow down the return.", "If your body is swaying, the weight is too heavy."],
    mistakes: ["Letting the stack slam between reps.", "Standing too close, so the weight rests at the bottom of the movement."],
    starting: "Pick one exercise per body part, 3 sets of 12–15 with a light weight.",
  },
]
