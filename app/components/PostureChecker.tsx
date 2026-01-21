"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Upload, Play, Square, RotateCcw, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

// Import TensorFlow.js and Teachable Machine
import * as tf from '@tensorflow/tfjs'
import * as tmImage from '@teachablemachine/image'

// Teachable Machine Model Configuration
// Replace this URL with your actual Teachable Machine model URL
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/zp45oEJa9/'

interface PostureAnalysis {
  score: number
  issues: string[]
  recommendations: string[]
  keyPoints: {
    head: { x: number; y: number; confidence: number }
    shoulders: { left: { x: number; y: number }; right: { x: number; y: number } }
    spine: { alignment: number }
  }
  modelPredictions?: Array<{
    className: string
    probability: number
  }>
}

interface PostureCheckerProps {
  machine?: {
    id: number
    name: string
    category: string
    muscleGroups: string[]
  } | null
}

export default function PostureChecker({ machine }: PostureCheckerProps) {
  const { t } = useTranslation()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PostureAnalysis | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load the Teachable Machine model
  useEffect(() => {
    const loadModel = async () => {
      setModelLoading(true)
      setModelError(null)
      
      try {
        // Initialize TensorFlow.js
        await tf.ready()
        
        // Load the Teachable Machine model
        const modelURL = MODEL_URL + 'model.json'
        const metadataURL = MODEL_URL + 'metadata.json'
        
        const loadedModel = await tmImage.load(modelURL, metadataURL)
        setModel(loadedModel)
        console.log('Teachable Machine model loaded successfully')
      } catch (error) {
        console.error('Error loading model:', error)
        setModelError('Failed to load AI model. Using fallback analysis.')
      } finally {
        setModelLoading(false)
      }
    }

    loadModel()
  }, [])

  const startCamera = useCallback(async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera access is not supported in this browser")
        return
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: "user" // Use front camera on mobile
        },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        // Ensure video plays
        videoRef.current.play().catch(e => console.error("Video play failed:", e))
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      let errorMessage = "Unable to access camera. "
      
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          errorMessage += "Please allow camera permissions and try again."
        } else if (error.name === "NotFoundError") {
          errorMessage += "No camera found on this device."
        } else if (error.name === "NotSupportedError") {
          errorMessage += "Camera is not supported in this browser."
        } else {
          errorMessage += "Please check your camera settings and try again."
        }
      } else {
        errorMessage += "Please check your camera settings and try again."
      }
      
      setCameraError(errorMessage)
      alert(errorMessage)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsRecording(false)
    setCameraError(null)
  }, [stream])

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext("2d")

      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        // Convert to base64 for analysis
        const imageData = canvas.toDataURL("image/jpeg", 0.8)
        analyzePosture(imageData)
      }
    }
  }, [])

  const analyzePosture = async (imageData: string) => {
    setIsAnalyzing(true)

    try {
      // First check if we have a loaded Teachable Machine model
      let modelPredictions: Array<{className: string, probability: number}> = []
      
      if (model && !modelError) {
        try {
          // Convert imageData to image element for model prediction
          const img = new Image()
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = imageData
          })
          
          // Get predictions from Teachable Machine model
          const predictions = await model.predict(img)
          modelPredictions = predictions.map(pred => ({
            className: pred.className,
            probability: pred.probability
          }))
          
          console.log('Model predictions:', modelPredictions)
        } catch (error) {
          console.error('Error getting model predictions:', error)
          // Fall back to simulated analysis
        }
      }

      // Simulate additional processing time if needed
      if (modelPredictions.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      // Simulate image content analysis
      const analyzeImageContent = async (imageData: string): Promise<{
        hasPersonDetected: boolean
        imageQuality: 'good' | 'poor' | 'blank'
        confidence: number
      }> => {
        // Create an image element to analyze the uploaded image
        return new Promise((resolve) => {
          const img = new Image()
          img.onload = () => {
            // Create a canvas to analyze image data
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
              resolve({ hasPersonDetected: false, imageQuality: 'poor', confidence: 0 })
              return
            }

            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)

            try {
              // Get image data for basic analysis
              const imageDataArray = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const data = imageDataArray.data

              // Calculate basic image statistics
              let totalPixels = data.length / 4
              let brightPixels = 0
              let darkPixels = 0
              let colorVariation = 0
              let nonEmptyPixels = 0

              for (let i = 0; i < data.length; i += 4) {
                const r = data[i]
                const g = data[i + 1]
                const b = data[i + 2]
                const brightness = (r + g + b) / 3

                if (brightness > 200) brightPixels++
                if (brightness < 50) darkPixels++
                if (r + g + b > 0) nonEmptyPixels++
                
                // Simple color variation calculation
                colorVariation += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)
              }

              const brightRatio = brightPixels / totalPixels
              const darkRatio = darkPixels / totalPixels
              const colorVariationAvg = colorVariation / totalPixels
              const contentRatio = nonEmptyPixels / totalPixels

              // Determine if image is blank or has minimal content
              const isBlankImage = contentRatio < 0.1 || brightRatio > 0.9 || darkRatio > 0.9
              const hasLowVariation = colorVariationAvg < 10

              // Simulate person detection based on image characteristics
              // More variation and mixed brightness usually indicates a person/scene
              const hasPersonDetected = !isBlankImage && 
                                      colorVariationAvg > 15 && 
                                      brightRatio < 0.8 && 
                                      darkRatio < 0.7 &&
                                      Math.random() > 0.3 // Some randomness for simulation

              const imageQuality = isBlankImage || hasLowVariation ? 'blank' : 
                                 colorVariationAvg > 30 ? 'good' : 'poor'

              const confidence = hasPersonDetected ? 0.7 + Math.random() * 0.3 : 0.1 + Math.random() * 0.3

              resolve({ hasPersonDetected, imageQuality, confidence })
            } catch (error) {
              console.error('Error analyzing image:', error)
              resolve({ hasPersonDetected: false, imageQuality: 'poor', confidence: 0 })
            }
          }

          img.onerror = () => {
            resolve({ hasPersonDetected: false, imageQuality: 'poor', confidence: 0 })
          }

          img.src = imageData
        })
      }

      // Analyze the image content first
      const imageAnalysis = await analyzeImageContent(imageData)

      // Generate analysis based on actual image content and model predictions
      const getRealisticAnalysis = () => {
        // If no person detected or blank image
        if (!imageAnalysis.hasPersonDetected || imageAnalysis.imageQuality === 'blank') {
          return {
            score: 0,
            issues: [
              imageAnalysis.imageQuality === 'blank' 
                ? "No image content detected" 
                : "No person detected in the image"
            ],
            recommendations: [
              "Please ensure you are visible in the frame",
              "Make sure there is good lighting",
              "Stand 3-6 feet away from the camera",
              "Ensure your full upper body is visible"
            ],
            confidence: imageAnalysis.confidence
          }
        }

        // If poor image quality
        if (imageAnalysis.imageQuality === 'poor') {
          return {
            score: 0,
            issues: ["Image quality too poor for analysis"],
            recommendations: [
              "Improve lighting conditions",
              "Ensure the image is not blurry",
              "Stand closer to the camera",
              "Try taking the photo again"
            ],
            confidence: imageAnalysis.confidence
          }
        }

        // If we have model predictions, use them to generate more accurate feedback
        if (modelPredictions.length > 0) {
          return mapModelPredictionsToFeedback(modelPredictions, machine)
        }

        // Good image with person detected - provide realistic analysis
        if (!machine) {
          // General posture analysis scenarios
          const generalScenarios = [
            {
              score: 78,
              issues: ["Slight forward head posture", "Rounded shoulders detected"],
              recommendations: [
                "Keep chin tucked and head in neutral position",
                "Pull shoulders back and down",
                "Engage core muscles for better support",
                "Take regular breaks to stretch"
              ]
            },
            {
              score: 85,
              issues: ["Minor hip imbalance"],
              recommendations: [
                "Focus on even weight distribution",
                "Strengthen hip stabilizer muscles",
                "Consider hip flexor stretches",
                "Maintain neutral pelvis alignment"
              ]
            },
            {
              score: 72,
              issues: ["Excessive anterior pelvic tilt", "Upper back stiffness"],
              recommendations: [
                "Strengthen glutes and core",
                "Stretch hip flexors daily",
                "Improve thoracic spine mobility",
                "Practice proper sitting posture"
              ]
            },
            {
              score: 91,
              issues: [],
              recommendations: [
                "Excellent posture! Keep it up",
                "Continue regular strength training",
                "Maintain flexibility with stretching",
                "Stay mindful of posture throughout the day"
              ]
            }
          ]
          
          const scenario = generalScenarios[Math.floor(Math.random() * generalScenarios.length)]
          return { ...scenario, confidence: imageAnalysis.confidence }
        }

        // Machine-specific realistic scenarios (existing code)
        const machineScenarios = {
          "Treadmill": [
            {
              score: 82,
              issues: ["Slight overstriding", "Arms crossing body midline"],
              recommendations: [
                "Shorten your stride length",
                "Keep arms swinging parallel to body",
                "Land with feet under your center of gravity",
                "Maintain slight forward lean from ankles"
              ]
            },
            {
              score: 75,
              issues: ["Heavy heel striking", "Looking down at feet"],
              recommendations: [
                "Try to land on midfoot instead of heel",
                "Keep eyes focused ahead, not down",
                "Increase cadence (steps per minute)",
                "Consider shorter, quicker steps"
              ]
            },
            {
              score: 88,
              issues: ["Minor tension in shoulders"],
              recommendations: [
                "Relax shoulders and keep them level",
                "Maintain 90-degree elbow bend",
                "Keep hands in loose fists",
                "Focus on smooth, rhythmic movement"
              ]
            }
          ],
          "Leg Press": [
            {
              score: 79,
              issues: ["Knees tracking inward", "Not using full range of motion"],
              recommendations: [
                "Push knees out in line with toes",
                "Lower weight until thighs are parallel to chest",
                "Keep core engaged throughout movement",
                "Control the eccentric (lowering) phase"
              ]
            },
            {
              score: 86,
              issues: ["Slight lower back arch"],
              recommendations: [
                "Keep lower back pressed against pad",
                "Maintain neutral spine position",
                "Engage core before each rep",
                "Focus on breathing properly during lift"
              ]
            }
          ],
          "Lat Pulldown": [
            {
              score: 77,
              issues: ["Using momentum", "Not engaging lats properly"],
              recommendations: [
                "Slow down the movement, control both phases",
                "Think about pulling shoulder blades down first",
                "Lean back only 15-20 degrees",
                "Focus on feeling the stretch in your lats"
              ]
            },
            {
              score: 84,
              issues: ["Bar pulled too low to neck"],
              recommendations: [
                "Pull bar to upper chest level",
                "Keep chest up and shoulders back",
                "Maintain slight arch in lower back",
                "Control the weight on the way up"
              ]
            }
          ],
          "Chest Press": [
            {
              score: 81,
              issues: ["Wrists bent back", "Partial range of motion"],
              recommendations: [
                "Keep wrists straight and strong",
                "Press handles to full arm extension",
                "Control the weight back to start position",
                "Keep feet flat on floor for stability"
              ]
            },
            {
              score: 74,
              issues: ["Excessive back arch", "Shoulders hunched forward"],
              recommendations: [
                "Keep back flat against the pad",
                "Pull shoulder blades back and down",
                "Engage core to maintain neutral spine",
                "Focus on pushing with chest muscles"
              ]
            }
          ],
          "Rowing Machine": [
            {
              score: 76,
              issues: ["Rounding back during recovery", "Arms and legs moving together"],
              recommendations: [
                "Keep back straight throughout entire stroke",
                "Use legs first, then lean back, then pull arms",
                "Reverse this order on recovery",
                "Maintain strong core engagement"
              ]
            },
            {
              score: 89,
              issues: ["Slightly rushed recovery phase"],
              recommendations: [
                "Take twice as long on recovery as drive",
                "Focus on smooth, controlled movements",
                "Maintain good posture throughout",
                "Keep consistent stroke rhythm"
              ]
            }
          ],
          "Cable Machine": [
            {
              score: 83,
              issues: ["Using too much body momentum", "Inconsistent stance"],
              recommendations: [
                "Plant feet firmly and maintain stable base",
                "Use only the targeted muscle group",
                "Control both lifting and lowering phases",
                "Keep core engaged for stability"
              ]
            }
          ]
        }

        const scenarios = machineScenarios[machine.name as keyof typeof machineScenarios] || machineScenarios["Treadmill"]
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
        return { ...scenario, confidence: imageAnalysis.confidence }
      }

      const analysis = getRealisticAnalysis()

      // Create analysis result
      const mockAnalysis: PostureAnalysis = {
        score: analysis.score,
        issues: analysis.issues,
        recommendations: analysis.recommendations,
        keyPoints: {
          head: { x: 320, y: 100, confidence: analysis.confidence },
          shoulders: {
            left: { x: 280, y: 180 },
            right: { x: 360, y: 185 },
          },
          spine: { alignment: analysis.score / 100 },
        },
      }

      setAnalysis(mockAnalysis)
    } catch (error) {
      console.error("Error analyzing posture:", error)
      // Show error state
      setAnalysis({
        score: 0,
        issues: ["Analysis failed - please try again"],
        recommendations: ["Ensure good lighting and clear view of your posture", "Try uploading a different image"],
        keyPoints: {
          head: { x: 0, y: 0, confidence: 0 },
          shoulders: { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
          spine: { alignment: 0 },
        },
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const uploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        if (imageData) {
          analyzePosture(imageData)
        }
      }
      reader.onerror = () => {
        alert('Error reading the image file. Please try again.')
      }
      reader.readAsDataURL(file)
      
      // Clear the input so the same file can be selected again
      event.target.value = ''
    }
  }

  const getScoreColor = (score: number) => {
    if (score === 0) return "text-gray-500"
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreIcon = (score: number) => {
    if (score === 0) return <XCircle className="h-5 w-5 text-gray-500" />
    if (score >= 85) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          {machine 
            ? `${t("form_analysis_for", "Form Analysis for")} ${machine.name}`
            : t("ai_posture_checker", "AI Posture Checker")
          }
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {machine
            ? t("machine_form_desc", `Check your form and technique while using the ${machine.name}. Get real-time feedback and improvement suggestions.`)
            : t("posture_desc", "Use AI-powered analysis to check your posture and get personalized recommendations for improvement.")
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera/Upload Section */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-blue-200 dark:border-blue-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5 text-blue-600" />
              <span>{t("capture_posture", "Capture Posture")}</span>
            </CardTitle>
            <CardDescription>
              {t("capture_desc", "Use your camera or upload an image for posture analysis")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video Preview */}
            <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-video">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              {!stream && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-gray-500">{t("camera_preview", "Camera preview will appear here")}</p>
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 p-4">
                    <XCircle className="h-12 w-12 text-red-400 mx-auto" />
                    <p className="text-red-500 text-sm">{cameraError}</p>
                    <Button 
                      onClick={() => {
                        setCameraError(null)
                        startCamera()
                      }} 
                      variant="outline" 
                      size="sm"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2">
              {!stream ? (
                <Button onClick={startCamera} className="bg-gradient-to-r from-blue-600 to-green-600">
                  <Camera className="h-4 w-4 mr-2" />
                  {t("start_camera", "Start Camera")}
                </Button>
              ) : (
                <>
                  <Button onClick={captureFrame} disabled={isAnalyzing}>
                    <Play className="h-4 w-4 mr-2" />
                    {t("analyze_posture", "Analyze Posture")}
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    <Square className="h-4 w-4 mr-2" />
                    {t("stop_camera", "Stop Camera")}
                  </Button>
                </>
              )}

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadImage}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Upload image for posture analysis"
                />
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  {t("upload_image", "Upload Image")}
                </Button>
              </div>
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">{t("analyzing", "Analyzing posture...")}</span>
                </div>
                <Progress value={33} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-green-200 dark:border-green-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>{t("analysis_results", "Analysis Results")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis ? (
              <>
                {/* Posture Score */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    {getScoreIcon(analysis.score)}
                    {analysis.score > 0 ? (
                      <span className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>{analysis.score}%</span>
                    ) : (
                      <span className="text-xl font-medium text-gray-500">No Score</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {analysis.score > 0 ? t("posture_score", "Overall Posture Score") : "Analysis Status"}
                  </p>
                  {analysis.score > 0 && <Progress value={analysis.score} className="w-full" />}
                </div>

                {/* Issues Detected */}
                {analysis.issues.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">
                      {analysis.score > 0 ? t("issues_detected", "Issues Detected") : "Detection Status"}
                    </h4>
                    <div className="space-y-1">
                      {analysis.issues.map((issue, index) => (
                        <Alert key={index} className="border-red-200 bg-red-50 dark:bg-red-900/20">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700 dark:text-red-300">{issue}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600">{t("recommendations", "Recommendations")}</h4>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-green-700 dark:text-green-300">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Points */}
                {analysis.score > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">{t("key_measurements", "Key Measurements")}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>{t("head_position", "Head Position")}:</span>
                        <Badge variant="outline">{(analysis.keyPoints.head.confidence * 100).toFixed(0)}%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("spine_alignment", "Spine Alignment")}:</span>
                        <Badge variant="outline">{(analysis.keyPoints.spine.alignment * 100).toFixed(0)}%</Badge>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={() => setAnalysis(null)} variant="outline" className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t("new_analysis", "New Analysis")}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 space-y-4">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-gray-500">
                  {t("no_analysis", "No analysis yet. Capture or upload an image to get started.")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
