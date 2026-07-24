import { NextResponse } from 'next/server';
import { z } from 'zod';
import { initializeDatabase } from '@/core/db/init-db';
import { executeAIGatewayPipeline } from '@/modules/ai/gateway';

const testSchema = z.object({
  status: z.literal('ok'),
  greeting: z.string(),
  capabilityTest: z.boolean(),
});

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json().catch(() => ({}));

    // Perform live AI Gateway execution test
    const result = await executeAIGatewayPipeline({
      systemPrompt: 'You are testing the AI Gateway pipeline for a family cookbook app. Respond strictly with JSON matching the schema.',
      userPrompt: 'Return a test JSON payload with status: "ok", a short greeting, and capabilityTest: true.',
      schema: testSchema,
      configOverride: body.configOverride,
      maxRetries: 1,
    });

    return NextResponse.json({
      status: 'ok',
      message: 'AI Provider connection test passed successfully!',
      testResult: result.data,
      audit: result.audit,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: `AI Connection Test Failed: ${error.message}`,
      },
      { status: 400 }
    );
  }
}
