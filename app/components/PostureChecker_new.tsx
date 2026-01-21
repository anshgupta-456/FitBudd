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
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/'

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
      // Check if model is loaded
      if (!model) {
        throw new Error('AI model not loaded. Please wait for model to load or refresh the page.')
      }

      // Create image element for model prediction
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageData
      })

      // Make prediction using Teachable Machine model
      const predictions = await model.predict(img)
      console.log('Model predictions:', predictions)

      // Process predictions to generate analysis
      const processModelPredictions = (predictions: Array<{className: string, probability: number}>) => {
        // Sort predictions by probability (highest first)
        const sortedPredictions = predictions.sort((a, b) => b.probability - a.probability)
        const topPrediction = sortedPredictions[0]
        const confidence = topPrediction.probability

        // Map class names to analysis results
        // You'll need to adjust these mappings based on your actual model classes
        const postureAnalysisMap: Record<string, {
          score: number
          issues: string[]
          recommendations: string[]
        }> = {
          'Good Posture': {
            score: Math.round(confidence * 100),
            issues: [],
            recommendations: [
              'Excellent posture! Keep it up',
              'Continue maintaining this position',
              'Stay mindful of your posture throughout the day'
            ]
          },
          'Forward Head': {
            score: Math.round((1 - confidence) * 60 + 40), // Score between 40-60 for poor posture
            issues: ['Forward head posture detected'],
            recommendations: [
              'Pull your head back to neutral position',
              'Keep chin tucked',
              'Strengthen neck muscles',
              'Take regular breaks from screen time'
            ]
          },
          'Rounded Shoulders': {
            score: Math.round((1 - confidence) * 50 + 30),
            issues: ['Rounded shoulders detected'],
            recommendations: [
              'Pull shoulders back and down',
              'Stretch chest muscles',
              'Strengthen upper back muscles',
              'Practice wall slides exercise'
            ]
          },
          'Slouching': {
            score: Math.round((1 - confidence) * 40 + 20),
            issues: ['Slouching posture detected'],
            recommendations: [
              'Sit or stand up straight',
              'Engage your core muscles',
              'Adjust your workspace ergonomics',
              'Practice posture awareness exercises'
            ]
          },
          'Poor Posture': {
            score: Math.round((1 - confidence) * 50 + 25),
            issues: ['Multiple posture issues detected'],
            recommendations: [
              'Focus on overall posture improvement',
              'Consider professional posture assessment',
              'Strengthen core and back muscles',
              'Practice daily posture exercises'
            ]
          },
          'No Person': {
            score: 0,
            issues: ['No person detected in image'],
            recommendations: [
              'Please ensure you are visible in the frame',
              'Make sure there is good lighting',
              'Stand 3-6 feet away from the camera',
              'Ensure your full upper body is visible'
            ]
          }
        }

        // Get analysis based on top prediction
        let analysis = postureAnalysisMap[topPrediction.className]
        
        // If class not found in map, create generic analysis
        if (!analysis) {
          if (confidence > 0.7) {
            analysis = {
              score: Math.round(confidence * 100),
              issues: [],
              recommendations: [`Detected: ${topPrediction.className}`, 'Continue maintaining good form']
            }
          } else {
            analysis = {
              score: Math.round(confidence * 60),
              issues: [`Posture issue detected: ${topPrediction.className}`],
              recommendations: ['Focus on improving your posture', 'Consider the detected posture issue']
            }
          }
        }

        // Add machine-specific recommendations if analyzing for a specific machine
        if (machine && analysis.score > 0) {
          const machineSpecificTips: Record<string, string[]> = {
            'Treadmill': [
              'Keep eyes forward, not down at feet',
              'Maintain slight forward lean from ankles',
              'Keep arms bent at 90 degrees'
            ],
            'Leg Press': [
              'Keep knees aligned with toes',
              'Press back firmly against pad',
              'Control both lifting and lowering phases'
            ],
            'Lat Pulldown': [
              'Pull bar to upper chest level',
              'Engage lats by pulling shoulder blades down',
              'Maintain slight lean back (15-20 degrees)'
            ],
            'Chest Press': [
              'Keep back flat against pad',
              'Maintain straight, strong wrists',
              'Press handles to full extension'
            ],
            'Rowing Machine': [
              'Keep back straight throughout stroke',
              'Use legs first, then lean back, then pull arms',
              'Maintain strong core engagement'
            ],
            'Cable Machine': [
              'Plant feet firmly for stable base',
              'Use controlled movements, no momentum',
              'Engage core for stability'
            ]
          }

          const machineTips = machineSpecificTips[machine.name]
          if (machineTips) {
            analysis.recommendations = [...analysis.recommendations, ...machineTips]
          }
        }

        return {
          ...analysis,
          confidence,
          modelPredictions: sortedPredictions
        }
      }

      const analysisResult = processModelPredictions(predictions)

      // Create final analysis object
      const finalAnalysis: PostureAnalysis = {
        score: analysisResult.score,
        issues: analysisResult.issues,
        recommendations: analysisResult.recommendations,
        keyPoints: {
          head: { x: 320, y: 100, confidence: analysisResult.confidence },
          shoulders: {
            left: { x: 280, y: 180 },
            right: { x: 360, y: 185 },
          },
          spine: { alignment: analysisResult.score / 100 },
        },
        modelPredictions: analysisResult.modelPredictions
      }

      setAnalysis(finalAnalysis)

    } catch (error) {
      console.error("Error analyzing posture:", error)
      
      // Fallback analysis if model fails
      setAnalysis({
        score: 0,
        issues: ["AI analysis failed - " + (error instanceof Error ? error.message : "Unknown error")],
        recommendations: [
          "Please try again",
          "Ensure good lighting and clear view",
          "Check your internet connection"
        ],
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
        
        {/* Model Status */}
        {modelLoading && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              Loading AI model... Please wait.
            </AlertDescription>
          </Alert>
        )}
        
        {modelError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {modelError}
            </AlertDescription>
          </Alert>
        )}
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
                <Button 
                  onClick={startCamera} 
                  className="bg-gradient-to-r from-blue-600 to-green-600"
                  disabled={modelLoading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {t("start_camera", "Start Camera")}
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={captureFrame} 
                    disabled={isAnalyzing || !model}
                  >
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
                  disabled={modelLoading || !model}
                />
                <Button variant="outline" disabled={modelLoading || !model}>
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

                {/* Model Predictions */}
                {analysis.modelPredictions && analysis.modelPredictions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-600">AI Model Predictions</h4>
                    <div className="space-y-1">
                      {analysis.modelPredictions.slice(0, 3).map((prediction, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{prediction.className}</span>
                          <Badge variant="outline">{(prediction.probability * 100).toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                  {modelLoading 
                    ? "Loading AI model..." 
                    : t("no_analysis", "No analysis yet. Capture or upload an image to get started.")
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
