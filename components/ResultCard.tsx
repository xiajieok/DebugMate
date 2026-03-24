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
}

export default function ResultCard({
  errorType,
  explanation,
  possibleCauses,
  fixSuggestions,
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
      <div className="bg-[#121821] border border-[#1F2A37] rounded-2xl p-6">
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
      <div className="bg-[#121821] border border-[#1F2A37] rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-3">Fix Suggestions</h3>
        <div className="space-y-6">
          {fixSuggestions.map((suggestion, index) => (
            <div key={index}>
              <h4 className="text-[#E5E7EB] font-medium mb-2">{suggestion.title}</h4>
              {suggestion.code && (
                <pre className="bg-[#0B0F14] border border-[#1F2A37] rounded-lg p-4 overflow-x-auto">
                  <code className="text-[#9CA3AF] text-sm font-mono">{suggestion.code}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
