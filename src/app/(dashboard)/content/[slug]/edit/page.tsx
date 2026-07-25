import { notFound } from 'next/navigation';
import { getContentEntityBySlug } from '@/modules/content/services/content-service';
import { ContentForm } from '@/modules/content/components/ContentForm';

export const revalidate = 0;

export default async function ContentEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = await getContentEntityBySlug(slug);

  if (!entity) {
    notFound();
  }

  const mappedInitialData = {
    ...entity,
    tags: entity.tags?.map((t: { tagName: string }) => t.tagName) ?? [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Edit Content Entity
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Modifying <span className="text-orange-400 font-semibold">{entity.title}</span> will create an immutable snapshot in <code className="text-amber-300">revisions</code> before updating.
        </p>
      </div>

      <ContentForm initialData={mappedInitialData as any} isEditing />
    </div>
  );
}
