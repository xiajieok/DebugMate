import { ErrorType } from './detectErrorType'

export function buildPrompt(error: string, type: ErrorType): string {
  return `You are a senior ${type} engineer.

Explain the following error clearly and concisely.
Do NOT give textbook definitions.

Explain the error like you're helping a junior developer debug quickly.

Be practical, not theoretical.

If possible, infer the likely real-world cause instead of giving generic explanations.

Error:
${error}

Return JSON in this exact format:
{
  "explanation": "string (1 sentence)",
  "causes": ["string", "string", "string"],
  "fixes": ["string", "string", "string"]
}

Rules:
* Max 3 causes
* Max 3 fixes
* Be specific
* No generic advice
* Return valid JSON only`
}
