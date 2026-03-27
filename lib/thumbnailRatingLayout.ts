export const THUMBNAIL_RATING_LAYOUT_OPTIONS = [
  { id: 'center', label: 'Center' },
  { id: 'center-top', label: 'Center Top' },
  { id: 'center-bottom', label: 'Center Bottom' },
  { id: 'center-vertical', label: 'Center Vertical' },
  { id: 'center-top-vertical', label: 'Center Top Vertical' },
  { id: 'center-bottom-vertical', label: 'Center Bottom Vertical' },
  { id: 'left', label: 'Left' },
  { id: 'left-top', label: 'Left Top' },
  { id: 'left-bottom', label: 'Left Bottom' },
  { id: 'left-vertical', label: 'Left Vertical' },
  { id: 'left-top-vertical', label: 'Left Top Vertical' },
  { id: 'left-bottom-vertical', label: 'Left Bottom Vertical' },
  { id: 'right', label: 'Right' },
  { id: 'right-top', label: 'Right Top' },
  { id: 'right-bottom', label: 'Right Bottom' },
  { id: 'right-vertical', label: 'Right Vertical' },
  { id: 'right-top-vertical', label: 'Right Top Vertical' },
  { id: 'right-bottom-vertical', label: 'Right Bottom Vertical' },
] as const;

export type ThumbnailRatingLayout = (typeof THUMBNAIL_RATING_LAYOUT_OPTIONS)[number]['id'];

export const DEFAULT_THUMBNAIL_RATING_LAYOUT: ThumbnailRatingLayout = 'center';

const THUMBNAIL_RATING_LAYOUT_SET = new Set<ThumbnailRatingLayout>(
  THUMBNAIL_RATING_LAYOUT_OPTIONS.map((option) => option.id)
);

export const normalizeThumbnailRatingLayout = (value?: string | null): ThumbnailRatingLayout => {
  const normalized = (value || '').trim().toLowerCase();
  return THUMBNAIL_RATING_LAYOUT_SET.has(normalized as ThumbnailRatingLayout)
    ? (normalized as ThumbnailRatingLayout)
    : DEFAULT_THUMBNAIL_RATING_LAYOUT;
};

export const isVerticalThumbnailRatingLayout = (layout: ThumbnailRatingLayout) =>
  layout.endsWith('-vertical');
