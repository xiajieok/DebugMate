import { NextRequest, NextResponse } from 'next/server'
import { detectErrorType, ErrorType } from '@/utils/detectErrorType'
import { buildPrompt } from '@/utils/buildPrompt'

const API_KEY = process.env.OPENAI_API_KEY
const API_URL = 'https://api.z.ai/api/anthropic/v1/messages'

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

function toFixSuggestions(fixes: string[]): FixSuggestion[] {
  return fixes.map(fix => {
    const codeMatch = fix.match(/```(\w+)?\n([\s\S]*?)```/)
    if (codeMatch) {
      const title = fix.replace(/```[\s\S]*?```/, '').trim() || 'Code fix'
      return { title, code: codeMatch[2].trim() }
    }
    return { title: fix }
  })
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

async function* streamMockResponse() {
  const mockResult = {
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
    ]
  }

  // Stream explanation character by character
  for (const char of mockResult.explanation) {
    yield { type: 'explanation', data: char }
    await new Promise(resolve => setTimeout(resolve, 20))
  }

  // Stream causes
  for (let i = 0; i < mockResult.possibleCauses.length; i++) {
    yield { type: 'cause', data: mockResult.possibleCauses[i], index: i }
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Stream fixes
  for (let i = 0; i < mockResult.fixSuggestions.length; i++) {
    yield { type: 'fix', data: mockResult.fixSuggestions[i], index: i }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
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

    const trimmedError = error.slice(0, 2000)
    const errorType = detectErrorType(trimmedError)
    const userPrompt = buildUserPrompt(trimmedError, errorType)

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = ''

          if (USE_MOCK) {
            // Stream mock response
            for await (const chunk of streamMockResponse()) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
            }
          } else {
            if (!API_KEY) {
              throw new Error('API key not configured')
            }

            // First, check if streaming is supported
            console.log('Attempting streaming request...')

            let streamingSupported = false
            let aiMessage = ''

            try {
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
                  stream: true,
                  system: SYSTEM_PROMPT,
                  messages: [
                    { role: 'user', content: userPrompt }
                  ],
                }),
              })

              if (response.ok) {
                streamingSupported = true
                const reader = response.body?.getReader()
                if (reader) {
                  const decoder = new TextDecoder()
                  let buffer = ''

                  while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                      if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') continue

                        try {
                          const event = JSON.parse(data)
                          if (event.type === 'content_block_delta' && event.delta?.text) {
                            const text = event.delta.text
                            fullResponse += text
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'explanation', data: text })}\n\n`))
                          }
                        } catch {
                          // Skip invalid JSON
                        }
                      }
                    }
                  }
                }
              }
            } catch (streamError) {
              console.log('Streaming failed, falling back to non-streaming:', streamError)
            }

            // If streaming failed or wasn't supported, use non-streaming
            if (!streamingSupported) {
              console.log('Using non-streaming request...')

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
                throw new Error(errorText || 'Failed to analyze error')
              }

              const data = await response.json()
              aiMessage = data.content?.[0]?.text || ''

              if (!aiMessage) {
                throw new Error('No message in response')
              }

              fullResponse = aiMessage

              // Stream the explanation as if it were streaming
              for (const char of fullResponse) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'explanation', data: char })}\n\n`))
              }
            }

            // Parse the full response and send structured data
            const parsed = parseAIResponse(fullResponse)

            if (parsed) {
              // Send the full explanation
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'full-explanation', data: parsed.explanation })}\n\n`))

              // Send causes
              for (let i = 0; i < (parsed.causes?.length || 0); i++) {
                const cause = parsed.causes![i]
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'cause', data: cause, index: i })}\n\n`))
              }

              // Send fixes
              for (let i = 0; i < (parsed.fixes?.length || 0); i++) {
                const fix = parsed.fixes![i]
                const fixSuggestion = toFixSuggestions([fix])[0]
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'fix', data: fixSuggestion, index: i })}\n\n`))
              }
            } else {
              // Use fallback response
              const fallback = createFallbackResponse()
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'full-explanation', data: fallback.explanation })}\n\n`))
              for (let i = 0; i < fallback.possibleCauses.length; i++) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'cause', data: fallback.possibleCauses[i], index: i })}\n\n`))
              }
              for (let i = 0; i < fallback.fixSuggestions.length; i++) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'fix', data: fallback.fixSuggestions[i], index: i })}\n\n`))
              }
            }
          }

          // Send completion signal
          controller.enqueue(encoder.encode(`data: {"type":"done","errorType":"${errorType}"}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Error in stream:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Something went wrong' })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in /api/explain:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
