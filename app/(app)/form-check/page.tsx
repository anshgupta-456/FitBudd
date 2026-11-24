"use client"

import type { PoseLandmarker } from "@mediapipe/tasks-vision"
import { Camera, FileVideo, RotateCcw, SwitchCamera, Square } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { PageHeader } from "@/components/app-shell"
import { Chips, Panel, Spinner, Tag } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { BONES, EXERCISES, RepCounter, type Exercise, type FrameReading, type Phase, type Rep } from "@/lib/pose"
import { cn } from "@/lib/utils"

// Keep in step with the @mediapipe/tasks-vision version in package.json.
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm"
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"

type Source = "none" | "camera" | "file"

let landmarkerPromise: Promise<PoseLandmarker> | null = null

/** Load the model once per page visit; later visits reuse it. */
function loadLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision")
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
      const options = (delegate: "GPU" | "CPU") => ({
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "VIDEO" as const,
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
      try {
        return await PoseLandmarker.createFromOptions(fileset, options("GPU"))
      } catch {
        return await PoseLandmarker.createFromOptions(fileset, options("CPU"))
      }
    })()
    landmarkerPromise.catch(() => {
      landmarkerPromise = null
    })
  }
  return landmarkerPromise
}

const PHASE_LABEL: Record<Phase, string> = {
  waiting: "Get into the start position",
  top: "Ready",
  lowering: "Moving",
  bottom: "Full range",
}

function draw(canvas: HTMLCanvasElement, landmarks: { x: number; y: number; visibility?: number }[] | undefined, reading: FrameReading | null) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (!landmarks) return
  const w = canvas.width
  const h = canvas.height
  const scale = Math.max(w, h) / 640
  const fault = !!reading?.faults.length

  ctx.lineCap = "round"
  ctx.lineWidth = 4 * scale
  ctx.strokeStyle = "rgba(255,255,255,0.85)"
  for (const [a, b] of BONES) {
    const p = landmarks[a]
    const q = landmarks[b]
    if ((p.visibility ?? 1) < 0.4 || (q.visibility ?? 1) < 0.4) continue
    ctx.beginPath()
    ctx.moveTo(p.x * w, p.y * h)
    ctx.lineTo(q.x * w, q.y * h)
    ctx.stroke()
  }
  ctx.fillStyle = "#ffffff"
  for (const i of new Set(BONES.flat())) {
    const p = landmarks[i]
    if ((p.visibility ?? 1) < 0.4) continue
    ctx.beginPath()
    ctx.arc(p.x * w, p.y * h, 4 * scale, 0, Math.PI * 2)
    ctx.fill()
  }
  if (reading?.ok) {
    const j = landmarks[reading.joint]
    ctx.lineWidth = 3 * scale
    ctx.strokeStyle = fault ? "#f59e0b" : "#ff422b"
    ctx.beginPath()
    ctx.arc(j.x * w, j.y * h, 14 * scale, 0, Math.PI * 2)
    ctx.stroke()
  }
}

export default function FormCheckPage() {
  const [exercise, setExercise] = useState<Exercise>(EXERCISES[0])
  const [source, setSource] = useState<Source>("none")
  const [facing, setFacing] = useState<"user" | "environment">("user")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reading, setReading] = useState<FrameReading | null>(null)
  const [phase, setPhase] = useState<Phase>("waiting")
  const [reps, setReps] = useState<Rep[]>([])
  const [noPerson, setNoPerson] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileUrlRef = useRef<string | null>(null)
  const rafRef = useRef<number>(0)
  const counterRef = useRef(new RepCounter(exercise))
  const exerciseRef = useRef(exercise)

  const reset = useCallback((ex: Exercise = exerciseRef.current) => {
    counterRef.current = new RepCounter(ex)
    setReps([])
    setPhase("waiting")
    setReading(null)
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current)
    fileUrlRef.current = null
    const video = videoRef.current
    if (video) {
      video.pause()
      video.removeAttribute("src")
      video.srcObject = null
      video.load()
    }
    const canvas = canvasRef.current
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height)
    setSource("none")
    setNoPerson(false)
  }, [])

  useEffect(() => stop, [stop])

  const run = useCallback(async () => {
    const landmarker = await loadLandmarker()
    const video = videoRef.current!
    const canvas = canvasRef.current!
    let lastTime = -1
    let lastUiUpdate = 0

    const tick = () => {
      if (video.readyState >= 2 && video.currentTime !== lastTime && !video.paused) {
        lastTime = video.currentTime
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }
        const result = landmarker.detectForVideo(video, performance.now())
        const lm = result.landmarks[0]
        let frame: FrameReading | null = null
        if (lm) {
          frame = exerciseRef.current.read(lm, video.videoWidth / video.videoHeight)
          const rep = counterRef.current.update(frame)
          if (rep) setReps([...counterRef.current.reps])
        }
        draw(canvas, lm, frame)
        const now = performance.now()
        if (now - lastUiUpdate > 120) {
          lastUiUpdate = now
          setNoPerson(!lm)
          setReading(frame)
          setPhase(counterRef.current.phase)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
  }, [])

  async function startCamera(mode = facing) {
    stop()
    setError(null)
    setLoading(true)
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser can't use the camera. Try Chrome, Edge or Safari.")
      const [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }),
        loadLandmarker(),
      ])
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      setSource("camera")
      reset()
      run()
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ""
      setError(
        name === "NotAllowedError"
          ? "Camera access was blocked. Allow it in your browser's site settings, or use a video file instead."
          : name === "NotFoundError"
            ? "No camera found. You can use a recorded video instead."
            : err instanceof Error
              ? err.message
              : "Couldn't start the camera.",
      )
    } finally {
      setLoading(false)
    }
  }

  async function startFile(file: File) {
    stop()
    setError(null)
    setLoading(true)
    try {
      await loadLandmarker()
      const url = URL.createObjectURL(file)
      fileUrlRef.current = url
      const video = videoRef.current!
      video.src = url
      await video.play()
      setSource("file")
      reset()
      run()
    } catch (err) {
      setError(err instanceof Error ? `Couldn't play that video: ${err.message}` : "Couldn't play that video.")
    } finally {
      setLoading(false)
    }
  }

  function chooseExercise(id: Exercise["id"]) {
    const ex = EXERCISES.find((e) => e.id === id)!
    exerciseRef.current = ex
    setExercise(ex)
    reset(ex)
  }

  const counted = reps.filter((r) => r.counted)
  const clean = counted.filter((r) => r.faults.length === 0).length
  const lastRep = reps[reps.length - 1]
  const liveCue = noPerson
    ? "No one in frame"
    : reading && !reading.ok
      ? reading.problem
      : reading?.faults[0] ?? (lastRep && lastRep.faults[0] && phase === "top" ? lastRep.faults[0] : null)

  return (
    <>
      <PageHeader
        eyebrow="Technique"
        title="Form check"
        description="Counts your reps and flags common form faults from your camera. Runs entirely in your browser; video is never uploaded."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Chips label="Exercise" options={EXERCISES.map((e) => ({ value: e.id, label: e.name }))} value={exercise.id} onChange={chooseExercise} />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{exercise.view}.</span> {exercise.setup}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="relative overflow-hidden rounded-lg border bg-[#141311]">
            <div className={cn("relative mx-auto aspect-video w-full", source === "camera" && facing === "user" && "-scale-x-100")}>
              <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-contain" controls={source === "file"} />
              <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
            </div>

            {source === "none" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-[#efece6]">
                {loading ? (
                  <>
                    <Spinner className="size-6 text-white/70" />
                    <p className="text-sm text-white/70">Loading the pose model. About 20 MB the first time, cached after that…</p>
                  </>
                ) : (
                  <>
                    <p className="max-w-sm text-sm text-white/70">
                      Prop your phone or laptop up, step back so the camera sees you {exercise.view.toLowerCase()}, and start.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button variant="primary" onClick={() => startCamera()}>
                        <Camera /> Start camera
                      </Button>
                      <Button asChild variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                        <label className="cursor-pointer">
                          <FileVideo /> Use a video
                          <input type="file" accept="video/*" className="sr-only" onChange={(e) => e.target.files?.[0] && startFile(e.target.files[0])} />
                        </label>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {source !== "none" && liveCue && (
              <p className="absolute inset-x-0 top-0 bg-black/60 px-4 py-2.5 text-center text-sm font-medium text-white" aria-live="polite">
                {liveCue}
              </p>
            )}
          </div>

          {error && (
            <p className="mt-3 rounded border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          {source !== "none" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={stop}>
                <Square /> Stop
              </Button>
              <Button variant="ghost" onClick={() => reset()}>
                <RotateCcw /> Reset count
              </Button>
              {source === "camera" && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const next = facing === "user" ? "environment" : "user"
                    setFacing(next)
                    startCamera(next)
                  }}
                >
                  <SwitchCamera /> Switch camera
                </Button>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <Panel>
            <div className="grid grid-cols-2 divide-x">
              <div className="px-4 py-4">
                <p className="eyebrow text-[11px]">Reps</p>
                <p className="num font-display text-6xl font-semibold leading-none">{counted.length}</p>
              </div>
              <div className="px-4 py-4">
                <p className="eyebrow text-[11px]">{exercise.id === "squat" ? "Knee" : "Elbow"} angle</p>
                <p className="num font-display text-6xl font-semibold leading-none">
                  {reading?.ok ? Math.round(counterRef.current.smoothed ?? reading.angle) : "—"}
                  {reading?.ok && <span className="text-2xl text-muted-foreground">°</span>}
                </p>
              </div>
            </div>
            <div className="border-t px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">Status: </span>
              {source === "none" ? "Not started" : PHASE_LABEL[phase]}
            </div>
            <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">
              A rep counts when the angle goes above {exercise.top}°, below {exercise.bottom}°, and back.
            </div>
          </Panel>

          <Panel title="Rep by rep" action={counted.length > 0 && <span className="text-xs text-muted-foreground">{clean} clean</span>}>
            {reps.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">Reps show up here as you do them.</p>
            ) : (
              <ol className="max-h-80 divide-y overflow-y-auto">
                {[...reps].reverse().map((r) => (
                  <li key={r.n} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                    <span className="num w-6 shrink-0 font-mono text-xs leading-5 text-muted-foreground">{r.n}</span>
                    <div className="min-w-0 flex-1">
                      {r.faults.length === 0 ? (
                        <span className="text-success">Good rep</span>
                      ) : (
                        r.faults.map((f) => <p key={f}>{f}</p>)
                      )}
                    </div>
                    {r.counted ? <Tag tone="outline">{r.depth}°</Tag> : <Tag tone="warning">Not counted</Tag>}
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Uses Google&apos;s MediaPipe pose model in your browser. It works best in good light with loose clothing that
            doesn&apos;t hide your joints. It can&apos;t see everything a coach would, like bar path or foot pressure.
          </p>
        </aside>
      </div>
    </>
  )
}
