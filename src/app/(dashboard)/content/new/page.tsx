import { ContentForm } from '@/modules/content/components/ContentForm';

export default function NewContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Create New Content Entity
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Add a new recipe, technique, sauce, spice blend, ingredient guide, or kitchen tip.
        </p>
      </div>

      <ContentForm />
    </div>
  );
}
