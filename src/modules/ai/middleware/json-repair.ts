/**
 * JSON Repair & Normalizer Middleware
 * Cleans up markdown fences, trailing commas, unescaped newlines, and minor formatting errors
 * frequently produced by LLM providers (Ollama, DeepSeek, Groq, OpenAI).
 */
export function repairAndParseJSON<T = any>(rawText: string): T {
  let cleaned = rawText.trim();

  // 1. Remove markdown code fences if present (e.g. ```json ... ``` or ``` ...)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // 2. Extract first JSON object or array if surrounded by conversational filler
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  if (firstBrace !== -1 || firstBracket !== -1) {
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  // 3. Attempt direct parse
  try {
    return JSON.parse(cleaned);
  } catch (initialError) {
    // 4. Advanced sanitization: fix trailing commas in objects & arrays
    const sanitized = cleaned
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas before closing braces/brackets
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
        // Handle unescaped control characters in JSON strings
        if (match === '\n') return '\\n';
        if (match === '\r') return '\\r';
        if (match === '\t') return '\\t';
        return '';
      });

    try {
      return JSON.parse(sanitized);
    } catch (secondError) {
      throw new Error(`Failed to parse AI JSON response: ${(initialError as Error).message}`);
    }
  }
}
