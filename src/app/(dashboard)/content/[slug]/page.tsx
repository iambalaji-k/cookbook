import { notFound } from 'next/navigation';
import { initializeDatabase } from '@/core/db/init-db';
import { getContentEntityBySlug } from '@/modules/content/services/content-service';
import { ContentViewer } from '@/modules/content/components/ContentViewer';

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

  return <ContentViewer entity={entity as any} />;
}
