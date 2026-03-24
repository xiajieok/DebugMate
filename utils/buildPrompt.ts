import { ErrorType } from './detectErrorType'

export function buildPrompt(error: string, type: ErrorType): string {
  return `You are a senior ${type} engineer.

Explain the following error clearly and concisely.

Error:
${error}

Return in this format:

1. Explanation (1 sentence, simple English)
2. Possible causes (max 3, specific)
3. Fix suggestions (max 3, actionable, include code if helpful)

Avoid generic advice.
Be direct.`
}
