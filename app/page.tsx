"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload,
  Clock,
  Calculator,
  FileImage,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  ChevronUp,
  Info,
  Calendar,
  CheckCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollToSection } from "@/components/scroll-to-section"
import { SectionReveal } from "@/components/section-reveal"
import { StepIndicator } from "@/components/step-indicator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Image compression utility
const compressImage = (file: File, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxWidth) {
          width = (width * maxWidth) / height
          height = maxWidth
        }
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to base64 with compression
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality)
      resolve(compressedDataUrl)
    }

    img.src = URL.createObjectURL(file)
  })
}

const CelebrationAnimation = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="text-6xl animate-bounce mb-4">🎉</div>
        <div className="text-4xl font-bold text-green-600 animate-pulse">Congratulations!</div>
        <div className="text-xl text-green-500 mt-2">You've completed your 8-hour target!</div>
        <div className="text-lg text-green-400 mt-1 animate-bounce">You're ready to go home! 🏠</div>
      </div>

      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random()}s`,
            }}
          >
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface TimeEntry {
  clockIn: string
  clockOut: string
  duration: number
  isManual?: boolean
  isExtracted?: boolean
}

interface WorkData {
  date: string
  totalWorked: number
  entries: TimeEntry[]
  isCurrentlyWorking: boolean
  lastClockIn?: string
}

export default function HRMSTimeCalculator() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [workData, setWorkData] = useState<WorkData | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showCelebration, setShowCelebration] = useState(false)
  const [hasShownCelebration, setHasShownCelebration] = useState(false)
  const [manualEntries, setManualEntries] = useState<TimeEntry[]>([])
  const [extractedEntries, setExtractedEntries] = useState<TimeEntry[]>([])
  const [newEntry, setNewEntry] = useState({ clockIn: "", clockOut: "" })
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(false)
  const [lastClockIn, setLastClockIn] = useState("")
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string>("")
  const [aiProgress, setAiProgress] = useState<string>("")
  const [currentStep, setCurrentStep] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const resultsRef = useRef<HTMLDivElement>(null)
  const uploadRef = useRef<HTMLDivElement>(null)
  const calculateRef = useRef<HTMLDivElement>(null)

  // Handle file drop
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Update step based on user progress
  useEffect(() => {
    if (uploadedImage && extractedEntries.length > 0) {
      setCurrentStep(2)
    } else if (uploadedImage) {
      setCurrentStep(1)
    } else {
      setCurrentStep(0)
    }
  }, [uploadedImage, extractedEntries])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToResults = () => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      await processUploadedFile(files[0])
    }
  }

  const processUploadedFile = async (file: File) => {
    try {
      // Show loading state
      setAiProgress("Compressing image...")

      // Compress the image
      const compressedImage = await compressImage(file, 1024, 0.8)

      // Calculate file size reduction
      const originalSize = file.size
      const compressedSize = Math.round((compressedImage.length * 3) / 4) // Approximate base64 size
      const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100)

      setUploadedImage(compressedImage)
      setExtractedEntries([])
      setExtractedText("")
      setAiError(null)
      setShowImagePreview(false)

      // Show compression info
      setAiProgress(
        `✅ Image compressed by ${reduction}% (${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(compressedSize / 1024 / 1024).toFixed(1)}MB)`,
      )

      // Clear progress after 3 seconds
      setTimeout(() => setAiProgress(""), 3000)
    } catch (error) {
      console.error("Image compression failed:", error)
      setAiError("Failed to compress image. Please try a different image.")
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processUploadedFile(file)
    }
  }

  const parseTimeToMinutes = (timeStr: string): number => {
    try {
      const cleanTime = timeStr.replace(/[^\d:APM\s]/g, "").trim()
      const parts = cleanTime.split(" ")
      if (parts.length < 2) return 0

      const time = parts[0]
      const period = parts[1]

      const [hours, minutes] = time.split(":").map(Number)
      if (isNaN(hours) || isNaN(minutes)) return 0

      let totalMinutes = hours * 60 + (minutes || 0)

      if (period === "PM" && hours !== 12) {
        totalMinutes += 12 * 60
      } else if (period === "AM" && hours === 12) {
        totalMinutes = minutes || 0
      }

      return totalMinutes
    } catch {
      return 0
    }
  }

  const calculateDuration = (clockIn: string, clockOut: string): number => {
    const inMinutes = parseTimeToMinutes(clockIn)
    const outMinutes = parseTimeToMinutes(clockOut)
    let duration = outMinutes - inMinutes

    if (duration < 0) {
      duration += 24 * 60
    }

    return duration
  }

  const formatMinutesToHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const calculateExitTime = (): string => {
    if (!workData || !workData.isCurrentlyWorking) return ""

    const targetMinutes = 8 * 60
    const remainingMinutes = targetMinutes - workData.totalWorked

    if (remainingMinutes <= 0) return "You can leave now!"

    const now = new Date()
    const exitTime = new Date(now.getTime() + remainingMinutes * 60000)

    return exitTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const extractTimeWithGemini = async () => {
    if (!uploadedImage) return

    setIsProcessingAI(true)
    setAiError(null)
    setAiProgress("Analyzing image with AI...")

    try {
      const base64Data = uploadedImage.split(",")[1]

      setAiProgress("Sending image to Gemini API...")

      const response = await fetch("/api/extract-time", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Data,
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setAiProgress("Processing AI response...")
      setExtractedText(data.analysis || "")

      const timeEntries = parseGeminiResponse(data.timeEntries || [])
      setExtractedEntries(timeEntries)

      if (data.isCurrentlyWorking) {
        setIsCurrentlyWorking(true)
        if (data.lastClockIn) {
          setLastClockIn(data.lastClockIn)
        }
      }

      setAiProgress("✅ AI extraction completed successfully!")

      // Auto-scroll to calculate button
      if (calculateRef.current) {
        setTimeout(() => {
          calculateRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 500)
      }
    } catch (error) {
      console.error("Gemini API Error:", error)
      setAiError(`AI extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessingAI(false)
      setTimeout(() => setAiProgress(""), 3000)
    }
  }

  const parseGeminiResponse = (timeEntries: any[]): TimeEntry[] => {
    const entries: TimeEntry[] = []

    for (const entry of timeEntries) {
      if (entry.clockIn && entry.clockOut && !entry.clockOut.toLowerCase().includes("missing")) {
        const duration = calculateDuration(entry.clockIn, entry.clockOut)
        if (duration > 0 && duration < 24 * 60) {
          entries.push({
            clockIn: entry.clockIn,
            clockOut: entry.clockOut,
            duration,
            isExtracted: true,
          })
        }
      }
    }

    return entries
  }

  const addManualEntry = () => {
    if (newEntry.clockIn && newEntry.clockOut) {
      const duration = calculateDuration(newEntry.clockIn, newEntry.clockOut)
      const entry: TimeEntry = {
        clockIn: newEntry.clockIn,
        clockOut: newEntry.clockOut,
        duration,
        isManual: true,
      }
      setManualEntries([...manualEntries, entry])
      setNewEntry({ clockIn: "", clockOut: "" })
    }
  }

  const removeManualEntry = (index: number) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index))
  }

  const removeExtractedEntry = (index: number) => {
    setExtractedEntries(extractedEntries.filter((_, i) => i !== index))
  }

  const processTimeData = () => {
    const allEntries = [...manualEntries, ...extractedEntries]

    const processedData: WorkData = {
      date: new Date().toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      entries: allEntries,
      totalWorked: 0,
      isCurrentlyWorking,
      lastClockIn: isCurrentlyWorking ? lastClockIn : undefined,
    }

    processedData.totalWorked = processedData.entries.reduce((total, entry) => total + entry.duration, 0)

    if (processedData.isCurrentlyWorking && processedData.lastClockIn) {
      const now = new Date()
      const currentHours = now.getHours()
      const currentMinutes = now.getMinutes()
      const currentTotalMinutes = currentHours * 60 + currentMinutes

      const lastClockInMinutes = parseTimeToMinutes(processedData.lastClockIn)
      const currentSessionDuration = currentTotalMinutes - lastClockInMinutes

      if (currentSessionDuration > 0) {
        const currentTimeStr = now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })

        processedData.entries.push({
          clockIn: processedData.lastClockIn,
          clockOut: `${currentTimeStr} (Current)`,
          duration: currentSessionDuration,
        })

        processedData.totalWorked += currentSessionDuration
      }
    }

    setWorkData(processedData)

    // Auto-scroll to results
    setTimeout(() => {
      scrollToResults()
    }, 300)
  }

  const calculateRemainingTime = (): { remaining: number; overtime: number; status: string } => {
    if (!workData) return { remaining: 0, overtime: 0, status: "No data" }

    const targetMinutes = 8 * 60
    const workedMinutes = workData.totalWorked

    if (workedMinutes >= targetMinutes) {
      return {
        remaining: 0,
        overtime: workedMinutes - targetMinutes,
        status: "completed",
      }
    } else {
      return {
        remaining: targetMinutes - workedMinutes,
        overtime: 0,
        status: "pending",
      }
    }
  }

  const timeCalculation = calculateRemainingTime()

  useEffect(() => {
    if (workData && timeCalculation.status === "completed" && !hasShownCelebration) {
      setShowCelebration(true)
      setHasShownCelebration(true)
    }
  }, [workData, timeCalculation.status, hasShownCelebration])

  const handleCelebrationComplete = () => {
    setShowCelebration(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <SectionReveal>
          <div className="text-center space-y-2 px-2 py-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">HRMS Time Calculator</h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Upload your HRMS portal screenshot and instantly calculate your work hours and exit time using AI
            </p>
            <StepIndicator steps={["Upload", "Extract", "Calculate"]} currentStep={currentStep} className="mt-6" />
          </div>
        </SectionReveal>

        {/* Current Time Display */}
        <SectionReveal delay={200}>
          <Card className="border-indigo-100 shadow-sm">
            <CardContent className="flex items-center justify-center p-4 sm:p-6">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-gray-600">Current Time</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {currentTime.toLocaleDateString([], {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionReveal>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Upload and Manual Entry Section */}
          <div ref={uploadRef}>
            <SectionReveal delay={400}>
              <Card className="border-indigo-100 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>HRMS Data Input</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Upload your HRMS screenshot for automatic AI extraction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  {/* Primary Image Upload Section */}
                  <div className="space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 transition-all ${
                        isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <FileImage className={`h-10 w-10 ${isDragging ? "text-indigo-500" : "text-gray-400"}`} />
                        <div className="text-center">
                          <p className="text-sm font-medium">Drag & drop your HRMS screenshot here</p>
                          <p className="text-xs text-gray-500 mt-1">or</p>
                        </div>
                        <Label
                          htmlFor="image-upload"
                          className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm transition-colors"
                        >
                          Browse Files
                        </Label>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500">Supports: JPG, PNG, WEBP (max 10MB)</p>
                      </div>
                    </div>

                    {/* Image Upload Status and Actions */}
                    {uploadedImage && (
                      <div className="space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-xs sm:text-sm font-medium text-green-600">
                              Image uploaded successfully
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowImagePreview(!showImagePreview)}
                            className="text-xs"
                          >
                            {showImagePreview ? (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Preview
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Image Preview (Collapsible) */}
                        {showImagePreview && (
                          <div className="border rounded-lg p-3 bg-gray-50 animate-fade-in">
                            <img
                              src={uploadedImage || "/placeholder.svg"}
                              alt="Uploaded HRMS screenshot"
                              className="max-w-full h-auto rounded border"
                            />
                          </div>
                        )}

                        {/* AI Extraction Button */}
                        <Button
                          onClick={extractTimeWithGemini}
                          disabled={isProcessingAI}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                          size="lg"
                        >
                          {isProcessingAI ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              <span className="text-sm">{aiProgress || "Processing..."}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              <span className="text-sm sm:text-base">Extract Time Data with AI</span>
                            </>
                          )}
                        </Button>

                        {/* AI Progress and Errors */}
                        {aiProgress && !isProcessingAI && (
                          <Alert>
                            <AlertDescription className="text-green-600 text-sm">{aiProgress}</AlertDescription>
                          </Alert>
                        )}

                        {aiError && (
                          <Alert variant="destructive">
                            <AlertDescription className="text-sm">{aiError}</AlertDescription>
                          </Alert>
                        )}

                        {/* AI Analysis (Collapsible) */}
                        {extractedText && (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full text-xs">
                                <Settings className="h-3 w-3 mr-1" />
                                View AI Analysis
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <Textarea value={extractedText} readOnly className="h-24 text-xs" />
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                        {/* Extracted Entries */}
                        {extractedEntries.length > 0 && (
                          <div className="space-y-2 animate-fade-in">
                            <h5 className="font-medium text-green-600 text-sm flex items-center">
                              <Sparkles className="h-4 w-4 mr-1" />
                              AI Extracted Time Entries
                            </h5>
                            {extractedEntries.map((entry, index) => (
                              <div
                                key={index}
                                className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-green-50 rounded border border-green-200 space-y-2 sm:space-y-0"
                              >
                                <span className="text-xs sm:text-sm">
                                  {entry.clockIn} → {entry.clockOut}
                                </span>
                                <div className="flex items-center justify-between sm:justify-end space-x-2">
                                  <Badge variant="outline" className="bg-green-100 text-xs">
                                    {formatMinutesToHours(entry.duration)}
                                  </Badge>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="sm" variant="ghost" onClick={() => removeExtractedEntry(index)}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Remove entry</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Manual Entry Toggle */}
                  <Collapsible open={showManualEntry} onOpenChange={setShowManualEntry}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        <span className="text-sm sm:text-base">
                          {showManualEntry ? "Hide Manual Entry" : "Add Manual Time Entries"}
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4 animate-fade-in">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm sm:text-base">Manual Time Entry</h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label htmlFor="clock-in" className="text-sm">
                              Clock In
                            </Label>
                            <Input
                              id="clock-in"
                              placeholder="9:00 AM"
                              value={newEntry.clockIn}
                              onChange={(e) => setNewEntry({ ...newEntry, clockIn: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="clock-out" className="text-sm">
                              Clock Out
                            </Label>
                            <Input
                              id="clock-out"
                              placeholder="5:00 PM"
                              value={newEntry.clockOut}
                              onChange={(e) => setNewEntry({ ...newEntry, clockOut: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                        </div>

                        <Button onClick={addManualEntry} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          <span className="text-sm sm:text-base">Add Time Entry</span>
                        </Button>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="currently-working"
                              checked={isCurrentlyWorking}
                              onChange={(e) => setIsCurrentlyWorking(e.target.checked)}
                              className="rounded"
                            />
                            <Label htmlFor="currently-working" className="text-sm">
                              Currently Working
                            </Label>
                          </div>

                          {isCurrentlyWorking && (
                            <div>
                              <Label htmlFor="last-clock-in" className="text-sm">
                                Last Clock-in Time
                              </Label>
                              <Input
                                id="last-clock-in"
                                placeholder="4:03 PM"
                                value={lastClockIn}
                                onChange={(e) => setLastClockIn(e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          )}
                        </div>

                        {manualEntries.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Manual Entries:</h5>
                            {manualEntries.map((entry, index) => (
                              <div
                                key={index}
                                className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-blue-50 rounded border border-blue-200 space-y-2 sm:space-y-0"
                              >
                                <span className="text-xs sm:text-sm">
                                  {entry.clockIn} → {entry.clockOut}
                                </span>
                                <div className="flex items-center justify-between sm:justify-end space-x-2">
                                  <Badge variant="outline" className="bg-blue-100 text-xs">
                                    {formatMinutesToHours(entry.duration)}
                                  </Badge>
                                  <Button size="sm" variant="ghost" onClick={() => removeManualEntry(index)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Calculate Button */}
                  <div ref={calculateRef}>
                    <Button
                      onClick={processTimeData}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      size="lg"
                      disabled={extractedEntries.length === 0 && manualEntries.length === 0}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      <span className="text-sm sm:text-base">Calculate Work Time</span>
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-gray-500 text-center">
                  <div className="w-full flex items-center justify-center space-x-1">
                    <Info className="h-3 w-3" />
                    <span>Your data is processed securely and never stored</span>
                  </div>
                </CardFooter>
              </Card>
            </SectionReveal>
          </div>

          {/* Results Section */}
          <div ref={resultsRef}>
            <SectionReveal delay={600}>
              <Card className="border-indigo-100 shadow-sm" id="results">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    <span>Time Analysis</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Your work time breakdown and remaining hours calculation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workData ? (
                    <div className="space-y-4 sm:space-y-6 animate-fade-in">
                      {/* Summary */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 bg-indigo-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-600">Total Worked</p>
                          <p className="text-lg sm:text-2xl font-bold text-indigo-600">
                            {formatMinutesToHours(workData.totalWorked)}
                          </p>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-600">Target</p>
                          <p className="text-lg sm:text-2xl font-bold text-green-600">8h 0m</p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="text-center p-3 sm:p-4 border rounded-lg">
                        {timeCalculation.status === "completed" ? (
                          <div className="space-y-2">
                            <Badge variant="default" className="mb-2 bg-green-600">
                              🎯 Target Completed!
                            </Badge>
                            <p className="text-base sm:text-lg font-semibold text-green-600">
                              Overtime: {formatMinutesToHours(timeCalculation.overtime)}
                            </p>
                            <div className="text-sm text-green-500 font-medium">🏠 Ready to go home!</div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Badge variant="secondary" className="mb-2">
                              ⏳ In Progress
                            </Badge>
                            <p className="text-base sm:text-lg font-semibold text-orange-600">
                              Remaining: {formatMinutesToHours(timeCalculation.remaining)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Exit Time Display */}
                      {workData.isCurrentlyWorking && timeCalculation.status === "pending" && (
                        <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg shadow-sm">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <LogOut className="h-5 w-5 text-indigo-600" />
                            <span className="font-semibold text-indigo-800 text-sm sm:text-base">Exit Time</span>
                          </div>
                          <p className="text-xl sm:text-2xl font-bold text-indigo-600">{calculateExitTime()}</p>
                          <p className="text-xs sm:text-sm text-indigo-500 mt-1">
                            You can leave the office at this time
                          </p>
                        </div>
                      )}

                      {/* Current Status */}
                      {workData.isCurrentlyWorking && (
                        <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-medium text-yellow-800 text-sm sm:text-base">Currently Working</span>
                          </div>
                          <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                            Last clock-in: {workData.lastClockIn}
                          </p>
                        </div>
                      )}

                      <Separator />

                      {/* Time Entries */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm sm:text-base flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            Today's Time Entries
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {workData.entries.length} entries
                          </Badge>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {workData.entries.map((entry, index) => (
                            <div
                              key={index}
                              className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 rounded space-y-2 sm:space-y-0 ${
                                entry.isExtracted
                                  ? "bg-green-50 border border-green-200"
                                  : entry.isManual
                                    ? "bg-blue-50 border border-blue-200"
                                    : "bg-gray-50"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0">
                                <span className="text-xs sm:text-sm text-gray-600">In: {entry.clockIn}</span>
                                <span className="text-xs sm:text-sm text-gray-600">Out: {entry.clockOut}</span>
                                <div className="flex space-x-2">
                                  {entry.isExtracted && (
                                    <Badge variant="outline" className="text-xs bg-green-100">
                                      AI
                                    </Badge>
                                  )}
                                  {entry.isManual && (
                                    <Badge variant="outline" className="text-xs bg-blue-100">
                                      Manual
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs self-start sm:self-center">
                                {formatMinutesToHours(entry.duration)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-gray-500">
                      <FileImage className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm sm:text-base">Upload an HRMS screenshot to get started</p>
                      <p className="text-xs text-gray-400 mt-2">Your exit time will appear here after calculation</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </SectionReveal>
          </div>
        </div>

        {/* Help Section */}
        <SectionReveal delay={800}>
          <Card className="border-indigo-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <HelpCircle className="h-4 w-4" />
                <span>How It Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <h3 className="font-semibold">Upload Screenshot</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Upload a screenshot of your HRMS portal showing your time entries
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <h3 className="font-semibold">AI Extraction</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Our AI automatically extracts all time entries from your screenshot
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <h3 className="font-semibold">Get Your Exit Time</h3>
                  </div>
                  <p className="text-sm text-gray-600">See exactly when you can leave based on your 8-hour target</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionReveal>

        {/* Footer */}
        <SectionReveal delay={1000}>
          <div className="text-center text-sm text-gray-500 py-4">
            <p>© {new Date().getFullYear()} HRMS Time Calculator • Privacy-focused • No data stored</p>
          </div>
        </SectionReveal>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-4 right-4 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-all z-10"
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        )}

        {/* Next Step Guidance */}
        {uploadedImage && !extractedEntries.length && !isProcessingAI && (
          <ScrollToSection targetId="calculate" className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
            Extract Time Data
          </ScrollToSection>
        )}

        {showCelebration && <CelebrationAnimation onComplete={handleCelebrationComplete} />}
      </div>
    </div>
  )
}
