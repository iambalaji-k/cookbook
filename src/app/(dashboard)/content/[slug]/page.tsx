import { notFound } from 'next/navigation';
import { getContentEntityBySlug } from '@/modules/content/services/content-service';
import { ContentViewer } from '@/modules/content/components/ContentViewer';
import { db } from '@/core/db';
import { contentEntities } from '@/core/db/schema';

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const rows = await db.select({ slug: contentEntities.slug }).from(contentEntities);
  return rows.map((r) => ({ slug: r.slug }));
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [entity, sysSettings] = await Promise.all([
    getContentEntityBySlug(slug),
    db.query.systemSettings.findFirst().catch(() => undefined),
  ]);

  if (!entity) {
    notFound();
  }

  const defaultUnitSystem: 'metric' | 'imperial' = sysSettings?.unitSystem || 'metric';

  return <ContentViewer entity={entity as any} initialUnitSystem={defaultUnitSystem} />;
}
