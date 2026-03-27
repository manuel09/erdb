export const THUMBNAIL_SIZE_OPTIONS = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
] as const;

export type ThumbnailSize = (typeof THUMBNAIL_SIZE_OPTIONS)[number]['id'];

export const DEFAULT_THUMBNAIL_SIZE: ThumbnailSize = 'medium';

const THUMBNAIL_SIZE_SET = new Set<ThumbnailSize>(
  THUMBNAIL_SIZE_OPTIONS.map((option) => option.id)
);

export const normalizeThumbnailSize = (value?: string | null): ThumbnailSize => {
  const normalized = (value || '').trim().toLowerCase();
  return THUMBNAIL_SIZE_SET.has(normalized as ThumbnailSize)
    ? (normalized as ThumbnailSize)
    : DEFAULT_THUMBNAIL_SIZE;
};
