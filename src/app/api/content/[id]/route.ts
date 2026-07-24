import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { 
  getContentEntityById, 
  updateContentEntity, 
  deleteContentEntity 
} from '@/modules/content/services/content-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const entity = await getContentEntityById(id);

    if (!entity) {
      return NextResponse.json(
        { status: 'error', message: 'Entity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 'ok', data: entity });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const body = await request.json();
    const updated = await updateContentEntity(id, body);

    return NextResponse.json({ status: 'ok', data: updated });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    await deleteContentEntity(id);

    return NextResponse.json({ status: 'ok', message: 'Entity deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}
