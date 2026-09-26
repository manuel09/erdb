import { getTmdbLanguageBase, normalizeTmdbLanguageCode } from '@/lib/tmdbLanguage';

export type PosterTextPreference = 'default' | 'clean' | 'alternative';
export const getImageLanguageTag = (item: any) => {
  if (!item?.iso_639_1) return null;
  if (typeof item?.iso_3166_1 === 'string' && item.iso_3166_1.trim()) {
    return `${item.iso_639_1}-${item.iso_3166_1}`;
  }

  return item.iso_639_1;
};

const isTextlessImage = (item: any) =>
  normalizeTmdbLanguageCode(getImageLanguageTag(item)) === null;

export const pickByLanguageWithFallback = (
  items: any[] = [],
  preferredLang: string,
  fallbackLang: string,
  preferredPath?: string | null,
  options?: { preferNonTextless?: boolean }
) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  if (preferredPath) {
    const preferredPathItem = items.find((item: any) => item?.file_path === preferredPath);
    if (preferredPathItem) {
      return preferredPathItem;
    }
  }

  const findItemByLanguage = (language: string | null) => {
    if (!language) {
      return null;
    }

    const exactMatch = items.find((item: any) => normalizeTmdbLanguageCode(getImageLanguageTag(item)) === language);
    if (exactMatch) {
      return exactMatch;
    }

    const baseLanguage = getTmdbLanguageBase(language);
    if (!baseLanguage) {
      return null;
    }

    return items.find((item: any) => getTmdbLanguageBase(getImageLanguageTag(item)) === baseLanguage) || null;
  };

  const preferred = normalizeTmdbLanguageCode(preferredLang);
  const fallback = normalizeTmdbLanguageCode(fallbackLang);

  if (preferred) {
    const preferredItem = findItemByLanguage(preferred);
    if (preferredItem) return preferredItem;
  }

  if (fallback) {
    const fallbackItem = findItemByLanguage(fallback);
    if (fallbackItem) return fallbackItem;
  }

  if (options?.preferNonTextless) {
    const firstNonTextless = items.find((item: any) => !isTextlessImage(item));
    if (firstNonTextless) {
      return firstNonTextless;
    }
  }

  return items[0];
};

export const matchesImageLanguage = (item: any, language: string | null | undefined) => {
  const normalizedLanguage = normalizeTmdbLanguageCode(language);
  if (!normalizedLanguage) {
    return false;
  }

  const itemLanguage = normalizeTmdbLanguageCode(getImageLanguageTag(item));
  if (!itemLanguage) {
    return false;
  }

  return (
    itemLanguage === normalizedLanguage ||
    getTmdbLanguageBase(itemLanguage) === getTmdbLanguageBase(normalizedLanguage)
  );
};

export const isTextlessPosterSelection = (posters: any[] = [], selectedPoster?: any | null) => {
  if (!Array.isArray(posters) || posters.length === 0 || !selectedPoster?.file_path) return false;

  return posters.some(
    (poster: any) =>
      poster?.file_path === selectedPoster.file_path && isTextlessImage(poster)
  );
};

export const pickPosterByPreference = (
  posters: any[] = [],
  preference: PosterTextPreference,
  preferredLang: string,
  fallbackLang: string,
  originalPosterPath?: string | null
) => {
  if (!Array.isArray(posters) || posters.length === 0) {
    return originalPosterPath ? { file_path: originalPosterPath } : null;
  }

  const canonicalOriginalPath =
    originalPosterPath ||
    pickByLanguageWithFallback(posters, preferredLang, fallbackLang)?.file_path ||
    posters[0]?.file_path ||
    null;
  const originalPoster = canonicalOriginalPath
    ? posters.find((poster: any) => poster.file_path === canonicalOriginalPath)
    : null;
  const fallbackOriginal = originalPoster || (canonicalOriginalPath ? { file_path: canonicalOriginalPath } : posters[0]);
  const defaultPoster =
    pickByLanguageWithFallback(posters, preferredLang, fallbackLang, null, { preferNonTextless: true }) ||
    fallbackOriginal;
  const defaultPosterPath = defaultPoster?.file_path || canonicalOriginalPath;
  const cleanPoster =
    posters.find(isTextlessImage) ||
    pickByLanguageWithFallback(posters, preferredLang, fallbackLang, originalPosterPath) ||
    fallbackOriginal;
  const cleanPosterPath = cleanPoster?.file_path || canonicalOriginalPath;
  const alternativePosters = posters.filter(
    (poster: any) =>
      poster.file_path !== defaultPosterPath &&
      poster.file_path !== cleanPosterPath &&
      !isTextlessImage(poster)
  );
  const distinctPosterFallback = posters.find(
    (poster: any) => poster.file_path !== defaultPosterPath && poster.file_path !== cleanPosterPath
  );

  if (preference === 'clean') {
    return cleanPoster;
  }

  if (preference === 'default') {
    return defaultPoster;
  }

  return (
    pickByLanguageWithFallback(alternativePosters, preferredLang, '') ||
    pickByLanguageWithFallback(alternativePosters, fallbackLang, '') ||
    alternativePosters[0] ||
    distinctPosterFallback ||
    defaultPoster ||
    fallbackOriginal
  );
};

export const pickBackdropByPreference = (
  backdrops: any[] = [],
  preference: PosterTextPreference,
  preferredLang: string,
  fallbackLang: string,
  originalBackdropPath?: string | null
) => {
  if (!Array.isArray(backdrops) || backdrops.length === 0) {
    return originalBackdropPath ? { file_path: originalBackdropPath } : null;
  }

  const canonicalOriginalPath =
    originalBackdropPath ||
    pickByLanguageWithFallback(backdrops, preferredLang, fallbackLang)?.file_path ||
    backdrops[0]?.file_path ||
    null;
  const originalBackdrop = canonicalOriginalPath
    ? backdrops.find((backdrop: any) => backdrop.file_path === canonicalOriginalPath)
    : null;
  const fallbackOriginal =
    originalBackdrop || (canonicalOriginalPath ? { file_path: canonicalOriginalPath } : backdrops[0]);
  const defaultBackdrop =
    pickByLanguageWithFallback(backdrops, preferredLang, fallbackLang) ||
    fallbackOriginal;
  const defaultBackdropPath = defaultBackdrop?.file_path || canonicalOriginalPath;
  const cleanBackdrop =
    backdrops.find(isTextlessImage) ||
    pickByLanguageWithFallback(backdrops, preferredLang, fallbackLang, originalBackdropPath) ||
    fallbackOriginal;
  const cleanBackdropPath = cleanBackdrop?.file_path || canonicalOriginalPath;
  const alternativeBackdrops = backdrops.filter(
    (backdrop: any) =>
      backdrop.file_path !== defaultBackdropPath &&
      backdrop.file_path !== cleanBackdropPath &&
      !isTextlessImage(backdrop)
  );
  const distinctBackdropFallback = backdrops.find(
    (backdrop: any) => backdrop.file_path !== defaultBackdropPath && backdrop.file_path !== cleanBackdropPath
  );

  if (preference === 'clean') {
    return cleanBackdrop;
  }

  if (preference === 'default') {
    return defaultBackdrop;
  }

  return (
    pickByLanguageWithFallback(alternativeBackdrops, preferredLang, '') ||
    pickByLanguageWithFallback(alternativeBackdrops, fallbackLang, '') ||
    alternativeBackdrops[0] ||
    distinctBackdropFallback ||
    defaultBackdrop ||
    fallbackOriginal
  );
};


