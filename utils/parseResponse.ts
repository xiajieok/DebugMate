export function extractJSON(text: string): object | null {
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
