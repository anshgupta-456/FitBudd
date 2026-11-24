// Rep counting and form cues from MediaPipe pose landmarks.
//
// Everything here is plain geometry on the 33 BlazePose landmarks, so it runs per frame in the
// browser and the video never leaves the device. Each exercise tracks one main joint angle,
// counts a rep when that angle goes through its full range, and checks one or two form rules.

export interface Point {
  x: number
  y: number
  z?: number
  visibility?: number
}

export const LM = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const

// Body-only skeleton (no face or finger points) for drawing.
export const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 31], [28, 32], [27, 29], [28, 30],
]

type Side = "left" | "right"

function pick(side: Side, name: "Shoulder" | "Elbow" | "Wrist" | "Hip" | "Knee" | "Ankle"): number {
  return LM[`${side}${name}` as keyof typeof LM]
}

/** Angle ABC in degrees, measured in pixel space so a non-square frame doesn't skew it. */
export function angle(a: Point, b: Point, c: Point, aspect = 1): number {
  const abx = (a.x - b.x) * aspect
  const aby = a.y - b.y
  const cbx = (c.x - b.x) * aspect
  const cby = c.y - b.y
  const dot = abx * cbx + aby * cby
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby)
  if (!mag) return 180
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI
}

/** Angle of the segment from `from` to `to` away from straight down (0 = vertical, 90 = horizontal). */
export function fromVertical(from: Point, to: Point, aspect = 1): number {
  const dx = (to.x - from.x) * aspect
  const dy = to.y - from.y
  return (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI
}

function visible(points: Point[], min = 0.5) {
  return points.every((p) => (p.visibility ?? 1) >= min)
}

/** Use whichever side of the body faces the camera more. */
function bestSide(lm: Point[], joints: Parameters<typeof pick>[1][]): Side {
  const score = (side: Side) => joints.reduce((sum, j) => sum + (lm[pick(side, j)].visibility ?? 0), 0)
  return score("left") >= score("right") ? "left" : "right"
}

export interface FrameReading {
  ok: boolean
  /** Shown when the body isn't fully in view. */
  problem?: string
  angle: number
  /** Landmark index the main angle is measured at, for drawing. */
  joint: number
  /** Form problems in this frame. */
  faults: string[]
}

export interface Exercise {
  id: "squat" | "pushup" | "curl"
  name: string
  view: string
  setup: string
  /** Main angle at full extension (rep start/end) and at full flexion (bottom of the rep). */
  top: number
  bottom: number
  /** Angle that counts as having started a rep. */
  start: number
  shallowCue: string
  read: (lm: Point[], aspect: number) => FrameReading
}

export const EXERCISES: Exercise[] = [
  {
    id: "squat",
    name: "Squat",
    view: "Side on",
    setup: "Stand side-on to the camera, 2–3 m away, with your whole body from head to feet in frame.",
    top: 160,
    start: 145,
    bottom: 100,
    shallowCue: "Go deeper: aim for thighs parallel to the floor",
    read(lm, aspect) {
      const side = bestSide(lm, ["Shoulder", "Hip", "Knee", "Ankle"])
      const [shoulder, hip, knee, ankle] = (["Shoulder", "Hip", "Knee", "Ankle"] as const).map((j) => lm[pick(side, j)])
      if (!visible([shoulder, hip, knee, ankle])) {
        return { ok: false, problem: "Step back so your shoulders, hips, knees and ankles are all in view", angle: 180, joint: pick(side, "Knee"), faults: [] }
      }
      const kneeAngle = angle(hip, knee, ankle, aspect)
      const lean = fromVertical(hip, shoulder, aspect)
      const faults: string[] = []
      // Some forward lean is normal; past ~50° the lower back usually takes over.
      if (kneeAngle < 130 && lean > 50) faults.push("Chest up: you're folding forward")
      return { ok: true, angle: kneeAngle, joint: pick(side, "Knee"), faults }
    },
  },
  {
    id: "pushup",
    name: "Push-up",
    view: "Side on",
    setup: "Put the camera at floor level, side-on, so your head, hips and feet are all in frame.",
    top: 155,
    start: 140,
    bottom: 95,
    shallowCue: "Lower until your elbows reach 90°",
    read(lm, aspect) {
      const side = bestSide(lm, ["Shoulder", "Elbow", "Wrist", "Hip", "Ankle"])
      const [shoulder, elbow, wrist, hip, ankle] = (["Shoulder", "Elbow", "Wrist", "Hip", "Ankle"] as const).map((j) => lm[pick(side, j)])
      if (!visible([shoulder, elbow, wrist, hip, ankle], 0.4)) {
        return { ok: false, problem: "Move the camera so it sees you side-on from head to feet", angle: 180, joint: pick(side, "Elbow"), faults: [] }
      }
      const elbowAngle = angle(shoulder, elbow, wrist, aspect)
      const bodyLine = angle(shoulder, hip, ankle, aspect)
      const faults: string[] = []
      if (bodyLine < 155) {
        // Is the hip below the shoulder-ankle line (sagging) or above it (piking)? Image y grows downward.
        const t = (hip.x - shoulder.x) / (ankle.x - shoulder.x || 1e-6)
        const lineY = shoulder.y + t * (ankle.y - shoulder.y)
        faults.push(hip.y > lineY ? "Hips are sagging: squeeze glutes and brace" : "Hips are too high: lower them into a straight line")
      }
      return { ok: true, angle: elbowAngle, joint: pick(side, "Elbow"), faults }
    },
  },
  {
    id: "curl",
    name: "Bicep curl",
    view: "Side on or facing",
    setup: "Stand 1.5–2 m from the camera with your working arm, shoulder and hip in view.",
    top: 150,
    start: 130,
    bottom: 60,
    shallowCue: "Curl all the way up",
    read(lm, aspect) {
      const side = bestSide(lm, ["Shoulder", "Elbow", "Wrist"])
      const [shoulder, elbow, wrist, hip] = (["Shoulder", "Elbow", "Wrist", "Hip"] as const).map((j) => lm[pick(side, j)])
      if (!visible([shoulder, elbow, wrist])) {
        return { ok: false, problem: "Make sure your shoulder, elbow and wrist are in view", angle: 180, joint: pick(side, "Elbow"), faults: [] }
      }
      const elbowAngle = angle(shoulder, elbow, wrist, aspect)
      const upperArm = fromVertical(shoulder, elbow, aspect)
      const faults: string[] = []
      if (upperArm > 35) faults.push("Keep your elbow pinned to your side")
      if (visible([hip], 0.5) && fromVertical(hip, shoulder, aspect) > 15) faults.push("Stand tall: don't swing your body")
      return { ok: true, angle: elbowAngle, joint: pick(side, "Elbow"), faults }
    },
  },
]

export interface Rep {
  n: number
  depth: number
  faults: string[]
  counted: boolean
}

export type Phase = "waiting" | "top" | "lowering" | "bottom"

/** Turns a stream of joint angles into reps. Smooths the angle to stop jitter double-counting. */
export class RepCounter {
  phase: Phase = "waiting"
  reps: Rep[] = []
  smoothed: number | null = null
  private minAngle = 180
  private faults = new Set<string>()

  constructor(private exercise: Exercise) {}

  get count() {
    return this.reps.filter((r) => r.counted).length
  }

  update(reading: FrameReading): Rep | null {
    if (!reading.ok) return null
    const a = (this.smoothed = this.smoothed === null ? reading.angle : this.smoothed * 0.6 + reading.angle * 0.4)
    const { top, start, bottom } = this.exercise

    if (this.phase === "waiting" || this.phase === "top") {
      if (a >= top) this.phase = "top"
      else if (a < start && this.phase === "top") {
        this.phase = "lowering"
        this.minAngle = a
        this.faults = new Set(reading.faults)
      }
      return null
    }

    this.minAngle = Math.min(this.minAngle, a)
    reading.faults.forEach((f) => this.faults.add(f))
    if (a <= bottom) this.phase = "bottom"

    if (a >= top) {
      const reachedBottom = this.phase === "bottom"
      const rep: Rep = {
        n: this.reps.length + 1,
        depth: Math.round(this.minAngle),
        faults: reachedBottom ? [...this.faults] : [this.exercise.shallowCue, ...this.faults],
        counted: reachedBottom,
      }
      this.reps.push(rep)
      this.phase = "top"
      return rep
    }
    return null
  }
}
