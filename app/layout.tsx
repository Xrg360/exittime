import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HRMS Time Calculator | Calculate Your Exit Time",
  description: "Upload your HRMS portal screenshot and automatically calculate your work hours and exit time using AI",
  keywords: "HRMS, time tracking, work hours calculator, exit time calculator, Keka, attendance tracker",
  authors: [{ name: "HRMS Time Calculator" }],
  openGraph: {
    title: "HRMS Time Calculator | Calculate Your Exit Time",
    description:
      "Upload your HRMS portal screenshot and automatically calculate your work hours and exit time using AI",
    type: "website",
    locale: "en_US",
    url: "https://exit.xrg.systems",
  },
  twitter: {
    card: "summary_large_image",
    title: "HRMS Time Calculator | Calculate Your Exit Time",
    description:
      "Upload your HRMS portal screenshot and automatically calculate your work hours and exit time using AI",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#4f46e5",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
