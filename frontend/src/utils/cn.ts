/**
 * Simple utility to join class names conditionally.
 * Implementation matching the one used in BlogArticle.tsx
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
