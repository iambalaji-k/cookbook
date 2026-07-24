export interface AIExecutionAudit {
  provider: string;
  model: string;
  promptVersion: string;
  latencyMs: number;
  tokenUsage: number;
  confidence: number; // 0 to 100
  parsedSuccessfully: boolean;
}

/**
 * Estimates token count from text payload (approx 4 chars per token).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Generates confidence metric based on schema validation, retries, and formatting.
 */
export function calculateConfidenceScore(
  schemaValid: boolean,
  retryCount: number,
  requiredFieldsPresentRatio: number = 1.0
): number {
  let score = 100;

  if (!schemaValid) {
    score -= 40;
  }

  // Deduct 15 points per retry needed
  score -= retryCount * 15;

  // Scale based on required fields present
  score = Math.round(score * Math.max(0.5, requiredFieldsPresentRatio));

  return Math.max(0, Math.min(100, score));
}
