import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { db } from '@/core/db';
import { 
  contentEntities, 
  revisions, 
  rawImports, 
  aiDrafts, 
  aiProviderSettings 
} from '@/core/db/schema';
import { count } from 'drizzle-orm';

export async function GET() {
  const startTime = Date.now();

  try {
    const dbStatus = await initializeDatabase();

    const [cCount] = await db.select({ value: count() }).from(contentEntities);
    const [rCount] = await db.select({ value: count() }).from(revisions);
    const [iCount] = await db.select({ value: count() }).from(rawImports);
    const [dCount] = await db.select({ value: count() }).from(aiDrafts);

    const aiConfig = await db.query.aiProviderSettings.findFirst();

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'ok',
      system: 'Family Culinary Cookbook & AI Kitchen Assistant',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connection: process.env.TURSO_DATABASE_URL ? 'Turso Cloud LibSQL' : 'Local SQLite Fallback (file:local.db)',
        initialized: dbStatus.success,
        counts: {
          contentEntities: cCount?.value || 0,
          revisions: rCount?.value || 0,
          rawImports: iCount?.value || 0,
          aiDrafts: dCount?.value || 0,
        },
      },
      aiGateway: {
        provider: aiConfig?.provider || 'openai',
        model: aiConfig?.model || 'gpt-4o-mini',
        baseUrl: aiConfig?.baseUrl || 'https://api.openai.com/v1',
        configured: Boolean(aiConfig?.apiKey || process.env.OPENAI_API_KEY),
      },
      milestones: {
        milestone1_constitution_db: 'COMPLETED',
        milestone2_content_engine: 'COMPLETED',
        milestone3_raw_imports: 'COMPLETED',
        milestone4_ai_gateway: 'COMPLETED',
        milestone5_human_approval_drafts: 'COMPLETED',
        milestone6_fts5_search: 'COMPLETED',
        milestone7_pwa_cooking_mode: 'COMPLETED',
        milestone8_ocr_pipeline: 'COMPLETED',
        milestone9_hybrid_search: 'COMPLETED',
        milestone10_production_ready: 'COMPLETED',
      },
      diagnostics: {
        latencyMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
