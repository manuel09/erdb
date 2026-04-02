export type SupportedLanguage = {
  code: string;
  label: string;
  flag: string;
};

export type TmdbConfigurationLanguage = {
  iso_639_1?: string | null;
  english_name?: string | null;
  name?: string | null;
};

const LANGUAGE_ICON = '\uD83C\uDF10';

const toLanguageLabel = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed || null;
};

const toTitleCaseLabel = (value: string, locale?: string | null) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const [firstChar, ...restChars] = [...trimmed];
  return `${firstChar.toLocaleUpperCase(locale || undefined)}${restChars.join('')}`;
};

export const normalizeTmdbLanguageCode = (value?: string | null) => {
  if (!value) return null;

  const trimmed = value.trim().replace(/_/g, '-');
  if (!trimmed) return null;

  const [languagePart, ...rest] = trimmed.split('-').filter(Boolean);
  if (!languagePart) return null;

  const normalizedLanguage = languagePart.toLowerCase();
  if (rest.length === 0) {
    return normalizedLanguage;
  }

  const normalizedRest = rest.map((part) => {
    if (/^\d+$/.test(part)) return part;
    if (part.length === 2) return part.toUpperCase();
    return part.toLowerCase();
  });

  return [normalizedLanguage, ...normalizedRest].join('-');
};

export const getTmdbLanguageBase = (value?: string | null) => {
  const normalized = normalizeTmdbLanguageCode(value);
  if (!normalized) return null;
  return normalized.split('-')[0] || null;
};

const getTmdbLanguageRegion = (value?: string | null) => {
  const normalized = normalizeTmdbLanguageCode(value);
  if (!normalized) return null;

  const parts = normalized.split('-').slice(1);
  return (
    parts.find((part) => /^[A-Z]{2}$/.test(part) || /^\d{3}$/.test(part)) ||
    null
  );
};

const getRegionDisplayName = (regionCode: string, localeCandidates: Array<string | null>) => {
  const locales = [...new Set(localeCandidates.filter((locale): locale is string => Boolean(locale)))];

  for (const locale of locales) {
    try {
      const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
      const name = displayNames.of(regionCode);
      if (name && name !== regionCode) {
        return name;
      }
    } catch {
      // Ignore unsupported locale/display name combinations and keep trying fallbacks.
    }
  }

  return null;
};

export const buildSupportedLanguageList = (options?: {
  languages?: TmdbConfigurationLanguage[];
  primaryTranslations?: string[];
}) => {
  const baseLabels = new Map<string, string>();

  for (const language of options?.languages || []) {
    const baseCode = getTmdbLanguageBase(language.iso_639_1);
    if (!baseCode) {
      continue;
    }

    const preferredLabel =
      toLanguageLabel(language.name) ||
      toLanguageLabel(language.english_name) ||
      baseCode;
    baseLabels.set(baseCode, preferredLabel);
  }

  const supportedLanguages = new Map<string, SupportedLanguage>();
  const normalizedCodes = [
    ...(options?.languages || []).map((language) => language.iso_639_1 || ''),
    ...(options?.primaryTranslations || []),
  ]
    .map((code) => normalizeTmdbLanguageCode(code))
    .filter((code): code is string => Boolean(code));

  const basesWithRegionalVariants = new Set(
    normalizedCodes
      .filter((code) => code.includes('-'))
      .map((code) => getTmdbLanguageBase(code))
      .filter((code): code is string => Boolean(code))
  );

  for (const normalizedCode of normalizedCodes) {
    const baseCode = getTmdbLanguageBase(normalizedCode);
    if (!baseCode) {
      continue;
    }

    if (!normalizedCode.includes('-') && basesWithRegionalVariants.has(baseCode)) {
      continue;
    }

    const baseLabel = toTitleCaseLabel(baseLabels.get(baseCode) || normalizedCode, baseCode);
    const regionCode = getTmdbLanguageRegion(normalizedCode);
    const regionLabel = regionCode
      ? getRegionDisplayName(regionCode, [normalizedCode, baseCode, 'en'])
      : null;

    supportedLanguages.set(normalizedCode, {
      code: normalizedCode,
      label: regionLabel ? `${baseLabel} (${regionLabel})` : baseLabel,
      flag: LANGUAGE_ICON,
    });
  }

  return [...supportedLanguages.values()].sort(
    (left, right) =>
      left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }) ||
      left.code.localeCompare(right.code, undefined, { sensitivity: 'base' })
  );
};

export const buildIncludeImageLanguage = (preferredLang: string, fallbackLang: string) => {
  const values = [
    normalizeTmdbLanguageCode(preferredLang),
    getTmdbLanguageBase(preferredLang),
    normalizeTmdbLanguageCode(fallbackLang),
    getTmdbLanguageBase(fallbackLang),
    'null',
  ].filter(Boolean) as string[];

  return [...new Set(values)].join(',');
};
