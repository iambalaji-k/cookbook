import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { getRawImportById, deleteRawImport } from '@/modules/imports/services/import-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const record = await getRawImportById(id);

    if (!record) {
      return NextResponse.json(
        { status: 'error', message: 'Raw import record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 'ok', data: record });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
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
    await deleteRawImport(id);

    return NextResponse.json({ status: 'ok', message: 'Raw import deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}
