'use client'

import { useState } from 'react'
import InputBox from '@/components/InputBox'
import ResultCard from '@/components/ResultCard'
import { ErrorType } from '@/utils/detectErrorType'

interface FixSuggestion {
  title: string
  code?: string
}

interface ErrorAnalysis {
  explanation: string
  possibleCauses: string[]
  fixSuggestions: FixSuggestion[]
}

interface APIError {
  error: string
}

export default function Home() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorType, setErrorType] = useState<ErrorType | null>(null)
  const [result, setResult] = useState<ErrorAnalysis | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!error.trim()) return

    setLoading(true)
    setResult(null)
    setErrorType(null)
    setApiError(null)

    try {
      // Call API endpoint
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error }),
      })

      if (!response.ok) {
        const errorData: APIError = await response.json()
        throw new Error(errorData.error || 'Failed to analyze error')
      }

      const analysis: ErrorAnalysis = await response.json()

      // Set error type from response (or detect locally)
      const detectedType: ErrorType = (analysis as any).errorType || 'General JavaScript'
      setErrorType(detectedType)
      setResult(analysis)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setApiError(message)
      console.error('Error analyzing:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0B0F14]/80 backdrop-blur-sm border-b border-[#1F2A37]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">DebugMate</h1>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-semibold mb-4">
            Fix your error in seconds
          </h2>
          <p className="text-[#9CA3AF] text-lg">
            Paste your error message and get a clear explanation instantly.
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-8">
          <InputBox value={error} onChange={setError} onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#6366F1] border-t-transparent mb-4" />
            <p className="text-[#9CA3AF]">Analyzing your error...</p>
          </div>
        )}

        {/* API Error */}
        {apiError && !loading && (
          <div className="text-center py-12">
            <p className="text-red-400">{apiError}</p>
          </div>
        )}

        {/* Result Section */}
        {result && !loading && errorType && (
          <ResultCard
            errorType={errorType}
            explanation={result.explanation}
            possibleCauses={result.possibleCauses}
            fixSuggestions={result.fixSuggestions}
          />
        )}
      </main>
    </div>
  )
}
