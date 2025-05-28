"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ScrollToSectionProps {
  targetId: string
  className?: string
  children?: React.ReactNode
}

export function ScrollToSection({ targetId, className, children }: ScrollToSectionProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        // Hide button when target is visible
        setIsVisible(rect.top > window.innerHeight)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener("scroll", handleScroll)
  }, [targetId])

  const scrollToTarget = () => {
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  if (!isVisible) return null

  return (
    <Button
      onClick={scrollToTarget}
      variant="outline"
      size="sm"
      className={`animate-bounce flex items-center gap-2 ${className}`}
    >
      {children || "Continue"}
      <ArrowDown className="h-4 w-4" />
    </Button>
  )
}
