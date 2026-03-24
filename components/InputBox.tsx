interface InputBoxProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
}

export default function InputBox({ value, onChange, onSubmit, loading }: InputBoxProps) {
  return (
    <div className="bg-[#121821] border border-[#1F2A37] rounded-2xl p-6">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste your error here...

TypeError: Cannot read property 'map' of undefined`}
        className="w-full h-40 bg-transparent text-[#E5E7EB] placeholder-[#4B5563] resize-none outline-none font-mono text-sm"
      />
      <button
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        className="mt-4 w-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:bg-[#1F2A37] disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
      >
        {loading ? 'Analyzing...' : 'Explain Error'}
      </button>
    </div>
  )
}
