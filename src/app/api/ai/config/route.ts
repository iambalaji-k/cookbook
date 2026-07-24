import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { db } from '@/core/db';
import { aiProviderSettings } from '@/core/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    await initializeDatabase();
    const config = await db.query.aiProviderSettings.findFirst();

    return NextResponse.json({
      status: 'ok',
      data: {
        provider: config?.provider || 'openai',
        baseUrl: config?.baseUrl || 'https://api.openai.com/v1',
        apiKey: config?.apiKey ? '••••••••' : '',
        model: config?.model || 'gpt-4o-mini',
        temperature: config?.temperature || '0.2',
        promptVersion: config?.promptVersion || 'v1.0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const now = new Date().toISOString();

    const existing = await db.query.aiProviderSettings.findFirst();

    if (existing) {
      await db
        .update(aiProviderSettings)
        .set({
          provider: body.provider || 'openai',
          baseUrl: body.baseUrl || 'https://api.openai.com/v1',
          ...(body.apiKey !== undefined && body.apiKey !== '••••••••' ? { apiKey: body.apiKey } : {}),
          model: body.model || 'gpt-4o-mini',
          temperature: String(body.temperature || '0.2'),
          promptVersion: body.promptVersion || 'v1.0',
          updatedAt: now,
        })
        .where(eq(aiProviderSettings.id, 'default'));
    } else {
      await db.insert(aiProviderSettings).values({
        id: 'default',
        provider: body.provider || 'openai',
        baseUrl: body.baseUrl || 'https://api.openai.com/v1',
        apiKey: body.apiKey || null,
        model: body.model || 'gpt-4o-mini',
        temperature: String(body.temperature || '0.2'),
        promptVersion: body.promptVersion || 'v1.0',
        updatedAt: now,
      });
    }

    const updated = await db.query.aiProviderSettings.findFirst();

    return NextResponse.json({
      status: 'ok',
      message: 'AI Provider settings saved successfully',
      data: {
        provider: updated?.provider,
        baseUrl: updated?.baseUrl,
        model: updated?.model,
        temperature: updated?.temperature,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 400 }
    );
  }
}
