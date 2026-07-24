import { z } from 'zod';
import { callOpenAICompatibleEndpoint, getActiveAIProviderConfig, type AIProviderConfig, type ChatMessage } from './adapter';
import { repairAndParseJSON } from './middleware/json-repair';
import { estimateTokens, calculateConfidenceScore, type AIExecutionAudit } from './middleware/audit-logger';

export interface AIGatewayRequest<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodSchema<T>;
  configOverride?: Partial<AIProviderConfig>;
  maxRetries?: number;
}

export interface AIGatewayResult<T> {
  data: T;
  rawText: string;
  audit: AIExecutionAudit;
}

/**
 * Executes the complete AI Gateway Pipeline:
 * Provider Adapter -> JSON Repair & Normalizer -> Zod Schema Validation -> Audit & Metrics Logger
 */
export async function executeAIGatewayPipeline<T>(
  request: AIGatewayRequest<T>
): Promise<AIGatewayResult<T>> {
  const startTime = Date.now();
  const config = { ...(await getActiveAIProviderConfig()), ...request.configOverride };
  const maxRetries = request.maxRetries ?? 2;

  let attempt = 0;
  let lastError: Error | null = null;
  let rawText = '';
  let tokenUsage = 0;

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `${request.systemPrompt}\n\nCRITICAL: You MUST reply with a strictly valid JSON object matching the requested schema. Do not include introductory text, conversational chatter, or markdown fences outside the JSON string.`,
    },
    { role: 'user', content: request.userPrompt },
  ];

  while (attempt <= maxRetries) {
    try {
      const response = await callOpenAICompatibleEndpoint(messages, config);
      rawText = response.rawResponseText;
      tokenUsage = response.tokenUsage || (estimateTokens(request.systemPrompt + request.userPrompt) + estimateTokens(rawText));

      // Middleware 1: Repair & parse JSON string
      const parsedJSON = repairAndParseJSON(rawText);

      // Middleware 2: Validate against Zod schema
      const validatedData = request.schema.parse(parsedJSON);
      const latencyMs = Date.now() - startTime;

      const confidence = calculateConfidenceScore(true, attempt);

      return {
        data: validatedData,
        rawText,
        audit: {
          provider: config.provider,
          model: config.model,
          promptVersion: config.promptVersion || 'v1.0',
          latencyMs,
          tokenUsage,
          confidence,
          parsedSuccessfully: true,
        },
      };
    } catch (err: any) {
      lastError = err;
      attempt++;
      if (attempt <= maxRetries) {
        // Append error correction context to prompt for retry
        messages.push({
          role: 'user',
          content: `Your previous response failed validation with error: "${err.message}". Please re-generate the entire JSON object strictly following the JSON format rules.`,
        });
      }
    }
  }

  throw new Error(`AI Gateway Pipeline failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`);
}
