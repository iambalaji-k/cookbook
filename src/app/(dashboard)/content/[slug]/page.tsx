import { notFound } from 'next/navigation';
import { initializeDatabase } from '@/core/db/init-db';
import { getContentEntityBySlug } from '@/modules/content/services/content-service';
import { ContentViewer } from '@/modules/content/components/ContentViewer';
import { db } from '@/core/db';

export const revalidate = 0;

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await initializeDatabase();
  const { slug } = await params;
  const entity = await getContentEntityBySlug(slug);

  if (!entity) {
    notFound();
  }

  // Fetch system settings for default unit system preference
  let defaultUnitSystem: 'metric' | 'imperial' = 'metric';
  try {
    const sysSettings = await db.query.systemSettings.findFirst();
    if (sysSettings?.unitSystem) {
      defaultUnitSystem = sysSettings.unitSystem;
    }
  } catch (e) {
    console.error(e);
  }

  return <ContentViewer entity={entity as any} initialUnitSystem={defaultUnitSystem} />;
}
