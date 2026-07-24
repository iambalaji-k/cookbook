import { notFound } from 'next/navigation';
import { initializeDatabase } from '@/core/db/init-db';
import { getContentEntityBySlug } from '@/modules/content/services/content-service';
import { KitchenCookView } from '@/modules/content/components/KitchenCookView';

export const revalidate = 0;

export default async function CookingModePage({
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

  return <KitchenCookView entity={entity as any} />;
}
