import { NextRequest, NextResponse } from 'next/server'
import { detectErrorType, ErrorType } from '@/utils/detectErrorType'
import { buildPrompt } from '@/utils/buildPrompt'

const API_KEY = process.env.OPENAI_API_KEY
const API_URL = 'https://api.z.ai/api/anthropic/v1/messages'

// Set to true to use mock responses for testing without API credits
const USE_MOCK = process.env.USE_MOCK === 'true'

interface FixSuggestion {
  title: string
  code?: string
}

interface ErrorAnalysis {
  explanation: string
  possibleCauses: string[]
  fixSuggestions: FixSuggestion[]
}

interface AIResponse {
  explanation: string
  causes: string[]
  fixes: string[]
}

const SYSTEM_PROMPT = `You are a senior software engineer.
You MUST return valid JSON only.
Do not include any explanation outside JSON.`

function parseAIResponse(text: string): AIResponse | null {
  try {
    // Try direct parse first
    return JSON.parse(text)
  } catch {
    // Find JSON bounds
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')

    if (start !== -1 && end !== -1 && start < end) {
      try {
        const jsonStr = text.slice(start, end + 1)
        return JSON.parse(jsonStr)
      } catch {
        return null
      }
    }
    return null
  }
}

function buildUserPrompt(error: string, type: ErrorType): string {
  return buildPrompt(error, type)
}

function createFallbackResponse(): ErrorAnalysis {
  return {
    explanation: 'Could not fully parse the error. The AI response was unclear.',
    possibleCauses: ['Unknown cause - AI response parsing failed'],
    fixSuggestions: [
      {
        title: 'Review the error manually',
        code: 'Check the error message for common patterns: undefined, null, type mismatches, or missing imports.'
      }
    ]
  }
}

function toFixSuggestions(fixes: string[]): FixSuggestion[] {
  return fixes.map(fix => {
    // Try to extract code block if present
    const codeMatch = fix.match(/```(\w+)?\n([\s\S]*?)```/)
    if (codeMatch) {
      const title = fix.replace(/```[\s\S]*?```/, '').trim() || 'Code fix'
      return { title, code: codeMatch[2].trim() }
    }
    return { title: fix }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { error } = body

    if (!error || typeof error !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: error is required' },
        { status: 400 }
      )
    }

    // Trim error to avoid excessive tokens
    const trimmedError = error.slice(0, 2000)

    // Detect error type
    const errorType = detectErrorType(trimmedError)
    console.log(`Detected error type: ${errorType}`)

    // Build prompts
    const userPrompt = buildUserPrompt(trimmedError, errorType)

    // Use mock mode for testing
    if (USE_MOCK) {
      console.log('Using mock response mode')
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockResult: ErrorAnalysis & { errorType: ErrorType } = {
        explanation: "This error occurs when you try to access a property or call a method on a value that is undefined or null.",
        possibleCauses: [
          "Variable not initialized or assigned a value",
          "API call failed and returned undefined",
          "Object property doesn't exist in the data structure"
        ],
        fixSuggestions: [
          {
            title: "Add optional chaining",
            code: `const name = user?.profile?.name`
          },
          {
            title: "Provide default values",
            code: `const name = user?.profile?.name ?? 'Anonymous'`
          },
          {
            title: "Validate before access",
            code: `if (user?.profile?.name) {\n  console.log(user.profile.name)\n}`
          }
        ],
        errorType,
      }
      return NextResponse.json(mockResult)
    }

    // Call GLM API
    if (!API_KEY) {
      console.error('OPENAI_API_KEY not set')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept-Language': 'en-US,en',
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GLM API error:', errorText)

      try {
        const errorData = JSON.parse(errorText)
        const errorMessage = errorData?.error?.message || errorData?.error || errorText
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        )
      } catch {
        return NextResponse.json(
          { error: errorText || 'Failed to analyze error' },
          { status: response.status }
        )
      }
    }

    const data = await response.json()
    console.log('Claude API response:', JSON.stringify(data, null, 2))

    // Handle Claude API response format
    let aiMessage = data.content?.[0]?.text

    if (!aiMessage) {
      console.error('No message in response, full data:', JSON.stringify(data))
      return NextResponse.json(createFallbackResponse())
    }

    // Parse AI response
    const parsed = parseAIResponse(aiMessage)

    if (!parsed || !parsed.explanation) {
      console.error('Failed to parse AI response:', aiMessage)
      return NextResponse.json(createFallbackResponse())
    }

    // Convert to expected format
    const result: ErrorAnalysis & { errorType: ErrorType } = {
      explanation: parsed.explanation,
      possibleCauses: parsed.causes?.slice(0, 3) || [],
      fixSuggestions: toFixSuggestions(parsed.fixes?.slice(0, 3) || []),
      errorType,
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in /api/explain:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
