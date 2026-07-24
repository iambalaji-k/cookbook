import { NextResponse } from 'next/server';
import { db } from '@/core/db';
import { systemSettings } from '@/core/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const settings = await db.query.systemSettings.findFirst();
    return NextResponse.json(settings || { unitSystem: 'metric', pwaEnabled: true, searchMode: 'fts5' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { unitSystem, pwaEnabled, searchMode, defaultLanguage } = body;

    const now = new Date().toISOString();
    const existing = await db.query.systemSettings.findFirst();

    const payload: Record<string, any> = { updatedAt: now };
    if (unitSystem) payload.unitSystem = unitSystem;
    if (pwaEnabled !== undefined) payload.pwaEnabled = pwaEnabled;
    if (searchMode) payload.searchMode = searchMode;
    if (defaultLanguage) payload.defaultLanguage = defaultLanguage;

    if (existing) {
      await db
        .update(systemSettings)
        .set(payload)
        .where(eq(systemSettings.id, existing.id));
    } else {
      await db.insert(systemSettings).values({
        id: 'system',
        unitSystem: unitSystem || 'metric',
        pwaEnabled: pwaEnabled ?? true,
        defaultLanguage: defaultLanguage || 'en',
        searchMode: searchMode || 'fts5',
        updatedAt: now,
      });
    }

    const updated = await db.query.systemSettings.findFirst();
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Error updating system settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to update system settings' }, { status: 500 });
  }
}
