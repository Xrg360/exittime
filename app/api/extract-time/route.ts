import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const prompt = `
    Analyze this HRMS (Human Resource Management System) portal screenshot and extract all time tracking information.

    Please identify and extract:
    1. All clock-in and clock-out time pairs
    2. Whether the person is currently working (look for "MISSING" or incomplete entries)
    3. The last clock-in time if currently working

    Return the data in this exact JSON format:
    {
      "timeEntries": [
        {
          "clockIn": "9:02:55 AM",
          "clockOut": "9:06:21 AM"
        }
      ],
      "isCurrentlyWorking": true/false,
      "lastClockIn": "4:03:30 PM" (if currently working),
      "analysis": "Brief description of what you found"
    }

    Look for patterns like:
    - Time entries with checkmarks (✓) followed by times
    - Arrow symbols (→) connecting in/out times
    - "MISSING" indicating incomplete entries
    - Time formats like "HH:MM:SS AM/PM" or "HH:MM AM/PM"

    Be very careful to extract exact times as shown in the image.
    `

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API Error:", errorText)
      return NextResponse.json({ error: `Gemini API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return NextResponse.json({ error: "Invalid response from Gemini API" }, { status: 500 })
    }

    const textResponse = data.candidates[0].content.parts[0].text

    try {
      // Try to parse JSON from the response
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const extractedData = JSON.parse(jsonMatch[0])
        return NextResponse.json(extractedData)
      } else {
        // If no JSON found, return the raw text for debugging
        return NextResponse.json({
          timeEntries: [],
          isCurrentlyWorking: false,
          analysis: textResponse,
          error: "Could not parse structured data from AI response",
        })
      }
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError)
      return NextResponse.json({
        timeEntries: [],
        isCurrentlyWorking: false,
        analysis: textResponse,
        error: "Failed to parse AI response as JSON",
      })
    }
  } catch (error) {
    console.error("API Route Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
