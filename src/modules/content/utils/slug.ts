/**
 * Pure utility function to generate a URL-safe slug from a title string.
 * Has no server or database dependencies and is safe to use in Client Components.
 */
export function generateSlug(title: string): string {
  const cleanTitle = (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'recipe';
  const shortId = Math.random().toString(36).substring(2, 7);
  return `${cleanTitle}-${shortId}`;
}
