"use client"

import type React from "react"
import { useEffect, useRef, useState, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface SectionRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  threshold?: number
}

export const SectionReveal = forwardRef<HTMLDivElement, SectionRevealProps>(
  ({ children, className, delay = 0, threshold = 0.1 }, forwardedRef) => {
    const [isVisible, setIsVisible] = useState(false)
    const internalRef = useRef<HTMLDivElement>(null)

    // Use forwarded ref if provided, otherwise use internal ref
    const ref = forwardedRef || internalRef

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true)
            }, delay)
            observer.unobserve(entry.target)
          }
        },
        { threshold },
      )

      const currentRef = typeof ref === "function" ? null : ref?.current
      if (currentRef) {
        observer.observe(currentRef)
      }

      return () => {
        if (currentRef) {
          observer.unobserve(currentRef)
        }
      }
    }, [delay, threshold, ref])

    return (
      <div
        ref={ref}
        className={cn(
          "transition-all duration-700 ease-in-out",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          className,
        )}
      >
        {children}
      </div>
    )
  },
)

SectionReveal.displayName = "SectionReveal"
