import { ErrorType } from '@/utils/detectErrorType'

interface FixSuggestion {
  title: string
  code?: string
}

interface ResultCardProps {
  errorType: ErrorType
  explanation: string
  possibleCauses: string[]
  fixSuggestions: FixSuggestion[]
  onFeedback?: (type: 'up' | 'down') => void
  feedbackSubmitted?: boolean
}

export default function ResultCard({
  errorType,
  explanation,
  possibleCauses,
  fixSuggestions,
  onFeedback,
  feedbackSubmitted = false,
}: ResultCardProps) {
  return (
    <div className="space-y-6">
      {/* Detected Type Label */}
      <div className="text-sm text-[#6366F1]">Detected: {errorType}</div>

      {/* Explanation Card */}
      <div className="bg-[#121821] border border-[#1F2A37] rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-3">Explanation</h3>
        <p className="text-[#9CA3AF] leading-relaxed">{explanation}</p>
      </div>

      {/* Possible Causes Card */}
      <div className="bg-[#121821] border border-[#1F2A3727] rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-3">Possible Causes</h3>
        <ul className="space-y-2">
          {possibleCauses.map((cause, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-[#6366F1] mt-1">•</span>
              <span className="text-[#9CA3AF]">{cause}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Fix Suggestions Card */}
      <div className="bg-[#121821] border border-[#1F2A3727] rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-3">Fix Suggestions</h3>
        <div className="space-y-6">
          {fixSuggestions.map((suggestion, index) => (
            <div key={index}>
              <h4 className="text-[#E5E7EB] font-medium mb-2">{suggestion.title}</h4>
              {suggestion.code && (
                <pre className="bg-[#0B0F14] border border-[#1F2A3727] rounded-lg p-4 overflow-x-auto">
                  <code className="text-[#9CA3AF] text-sm font-mono">{suggestion.code}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Section */}
      {onFeedback && !feedbackSubmitted && (
        <div className="text-center pt-4">
          <p className="text-[#9CA3AF] mb-3">Was this helpful?</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onFeedback('up')}
              className="flex items-center gap-2 px-4 py-2 bg-[#121821] border border-[#1F2A3727] rounded-lg hover:bg-[#1F2A3727] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={feedbackSubmitted}
            >
              <span className="text-xl">👍</span>
              <span className="text-[#E5E7EB]">Yes</span>
            </button>
            <button
              onClick={() => onFeedback('down')}
              className="flex items-center gap-2 px-4 py-2 bg-[#121821] border border-[#1F2A3727] rounded-lg hover:bg-[#1F2A3727] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={feedbackSubmitted}
            >
              <span className="text-xl">👎</span>
              <span className="text-[#E5E7EB]">No</span>
            </button>
          </div>
        </div>
      )}

      {/* Feedback Submitted Message */}
      {feedbackSubmitted && (
        <div className="text-center pt-4">
          <p className="text-[#6366F1]">Thanks for your feedback!</p>
        </div>
      )}
    </div>
  )
}
