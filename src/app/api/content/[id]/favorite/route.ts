import { NextResponse } from 'next/server';
import { toggleFavoriteEntity } from '@/modules/content/services/content-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await toggleFavoriteEntity(id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json({ error: error.message || 'Failed to toggle favorite' }, { status: 500 });
  }
}
