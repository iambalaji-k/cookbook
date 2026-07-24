import { db } from '@/core/db';
import { aiProviderSettings } from '@/core/db/schema';

export interface AIProviderConfig {
  provider: string;
  baseUrl: string;
  apiKey?: string | null;
  model: string;
  temperature?: string | number;
  promptVersion?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Gets currently active AI provider settings from database.
 */
export async function getActiveAIProviderConfig(): Promise<AIProviderConfig> {
  const config = await db.query.aiProviderSettings.findFirst();

  return {
    provider: config?.provider || 'openai',
    baseUrl: config?.baseUrl || 'https://api.openai.com/v1',
    apiKey: config?.apiKey || process.env.OPENAI_API_KEY || null,
    model: config?.model || 'gpt-4o-mini',
    temperature: config?.temperature || '0.2',
    promptVersion: config?.promptVersion || 'v1.0',
  };
}

/**
 * Executes a raw HTTP completion request to any OpenAI-compatible provider endpoint.
 */
export async function callOpenAICompatibleEndpoint(
  messages: ChatMessage[],
  configOverride?: Partial<AIProviderConfig>
): Promise<{ rawResponseText: string; tokenUsage: number }> {
  const baseConfig = await getActiveAIProviderConfig();
  const config: AIProviderConfig = { ...baseConfig, ...configOverride };

  const cleanBaseUrl = config.baseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBaseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const payload = {
    model: config.model,
    messages,
    temperature: Number(config.temperature) || 0.2,
    response_format: { type: 'json_object' }, // Supported by OpenAI, DeepSeek, OpenRouter, Groq, Ollama
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Fallback: if provider rejects response_format (e.g. older Ollama), retry without response_format
      const fallbackPayload = {
        model: config.model,
        messages,
        temperature: Number(config.temperature) || 0.2,
      };

      const fallbackRes = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(fallbackPayload),
      });

      if (!fallbackRes.ok) {
        const errorText = await fallbackRes.text();
        throw new Error(`AI Provider HTTP Error (${fallbackRes.status}): ${errorText}`);
      }

      const json = await fallbackRes.json();
      const rawText = json.choices?.[0]?.message?.content || '';
      const usage = json.usage?.total_tokens || 0;
      return { rawResponseText: rawText, tokenUsage: usage };
    }

    const json = await res.json();
    const rawText = json.choices?.[0]?.message?.content || '';
    const usage = json.usage?.total_tokens || 0;
    return { rawResponseText: rawText, tokenUsage: usage };
  } catch (error: any) {
    throw new Error(`AI Gateway Request Failed: ${error.message}`);
  }
}
