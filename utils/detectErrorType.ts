export type ErrorType = 'Next.js' | 'JavaScript' | 'Node.js' | 'General JavaScript'

export function detectErrorType(error: string): ErrorType {
  if (error.toLowerCase().includes('next.js')) {
    return 'Next.js'
  }

  if (error.includes('Module not found')) {
    return 'Node.js'
  }

  if (error.includes('TypeError') || error.includes('undefined') || error.includes('null')) {
    return 'JavaScript'
  }

  return 'General JavaScript'
}
