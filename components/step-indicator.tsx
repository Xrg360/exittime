"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  const [activeStep, setActiveStep] = useState(currentStep)

  useEffect(() => {
    setActiveStep(currentStep)
  }, [currentStep])

  return (
    <div className={cn("flex justify-center items-center gap-2", className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === activeStep ? "w-8 bg-indigo-600" : index < activeStep ? "bg-indigo-400" : "bg-gray-300",
            )}
          />
          {index < steps.length - 1 && (
            <div className={cn("w-4 h-0.5", index < activeStep ? "bg-indigo-400" : "bg-gray-300")} />
          )}
        </div>
      ))}
    </div>
  )
}
