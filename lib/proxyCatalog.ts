export type ProxyCatalogDescriptor = {
  key: string;
  type: string;
  id: string;
  name: string;
  extraKeys: string[];
  supportsSearch: boolean;
  searchRequired: boolean;
  discoverOnly: boolean;
  requiredExtraKeys: string[];
};

const SEARCH_VARIANT_SUFFIX = '__erdb_search__';

type NormalizedCatalogExtraEntry = {
  name: string;
  isRequired: boolean;
  options: string[];
};

const toTrimmedString = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const getCatalogExtraKeys = (catalog: Record<string, unknown>) => {
  const extraKeys = getCatalogExtraEntries(catalog).map((entry) => entry.name);

  return [...new Set(extraKeys)];
};

const normalizeCatalogExtraEntries = (entries: NormalizedCatalogExtraEntry[]) => {
  const merged = new Map<string, NormalizedCatalogExtraEntry>();

  for (const entry of entries) {
    const normalizedName = entry.name.trim();
    if (!normalizedName) {
      continue;
    }

    const current = merged.get(normalizedName);
    if (current) {
      current.isRequired = current.isRequired || entry.isRequired;
      current.options = [...new Set([...current.options, ...entry.options])];
      continue;
    }

    merged.set(normalizedName, {
      name: normalizedName,
      isRequired: entry.isRequired,
      options: [...new Set(entry.options)],
    });
  }

  return [...merged.values()];
};

const getCatalogExtraEntries = (catalog: Record<string, unknown>) => {
  const modernEntries = Array.isArray(catalog.extra) ? catalog.extra : [];
  const legacySupported = Array.isArray(catalog.extraSupported) ? catalog.extraSupported : [];
  const legacyRequired = new Set(
    (Array.isArray(catalog.extraRequired) ? catalog.extraRequired : [])
      .map((entry) => toTrimmedString(entry).toLowerCase())
      .filter(Boolean)
  );

  const entries: NormalizedCatalogExtraEntry[] = [];

  for (const entry of modernEntries) {
    if (typeof entry === 'string') {
      const normalized = entry.trim();
      if (normalized) {
        entries.push({ name: normalized, isRequired: false, options: [] });
      }
      continue;
    }

    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const typedEntry = entry as Record<string, unknown>;
    const normalized = toTrimmedString(typedEntry.name);
    if (!normalized) {
      continue;
    }

    entries.push({
      name: normalized,
      isRequired: typedEntry.isRequired === true,
      options: Array.isArray(typedEntry.options)
        ? typedEntry.options
            .map((option) => toTrimmedString(option))
            .filter(Boolean)
        : [],
    });
  }

  for (const entry of legacySupported) {
    const normalized = toTrimmedString(entry);
    if (!normalized) {
      continue;
    }

    entries.push({
      name: normalized,
      isRequired: legacyRequired.has(normalized.toLowerCase()),
      options: [],
    });
  }

  return normalizeCatalogExtraEntries(entries);
};

const getCatalogExtraObjects = (catalog: Record<string, unknown>) =>
  getCatalogExtraEntries(catalog).map((entry) => ({
    name: entry.name,
    isRequired: entry.isRequired,
    ...(entry.options.length > 0 ? { options: entry.options } : {}),
  }));

const setCatalogExtraObjects = (
  catalog: Record<string, unknown>,
  entries: Array<{ name: string; isRequired: boolean; options?: string[] }>
) => {
  const nextCatalog: Record<string, unknown> = { ...catalog };
  nextCatalog.extra = entries;
  delete nextCatalog.extraSupported;
  delete nextCatalog.extraRequired;
  return nextCatalog;
};

const setCatalogId = (catalog: Record<string, unknown>, id: string) => ({
  ...catalog,
  id,
});

export const normalizeProxyCatalogKeyList = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const keys = [...new Set(value.map((entry) => toTrimmedString(entry)).filter(Boolean))];
  return keys.length > 0 ? keys : undefined;
};

export const normalizeProxyCatalogBooleanOverrides = (value: unknown): Record<string, boolean> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, entryValue]) => [key.trim(), entryValue] as const)
    .filter(([key, entryValue]) => Boolean(key) && typeof entryValue === 'boolean');

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries) as Record<string, boolean>;
};

const removeSearchFromCatalog = (catalog: Record<string, unknown>) => {
  const nextCatalog: Record<string, unknown> = { ...catalog };

  if (Array.isArray(nextCatalog.extra)) {
    nextCatalog.extra = nextCatalog.extra.filter((entry) => {
      if (typeof entry === 'string') {
        return entry.trim().toLowerCase() !== 'search';
      }
      if (!entry || typeof entry !== 'object') {
        return true;
      }
      return toTrimmedString((entry as Record<string, unknown>).name).toLowerCase() !== 'search';
    });
  }

  if (Array.isArray(nextCatalog.extraSupported)) {
    nextCatalog.extraSupported = nextCatalog.extraSupported.filter(
      (entry) => toTrimmedString(entry).toLowerCase() !== 'search'
    );
  }

  if (Array.isArray(nextCatalog.extraRequired)) {
    nextCatalog.extraRequired = nextCatalog.extraRequired.filter(
      (entry) => toTrimmedString(entry).toLowerCase() !== 'search'
    );
  }

  return nextCatalog;
};

const setCatalogSearchRequired = (catalog: Record<string, unknown>, enabled: boolean) => {
  const currentSearchEntry = getCatalogExtraEntries(catalog).find(
    (entry) => entry.name.trim().toLowerCase() === 'search'
  );
  const nextEntries = getCatalogExtraObjects(catalog).filter(
    (entry) => entry.name.trim().toLowerCase() !== 'search'
  );

  if (enabled && currentSearchEntry) {
    nextEntries.push({
      name: 'search',
      isRequired: true,
      ...(currentSearchEntry.options.length > 0 ? { options: currentSearchEntry.options } : {}),
    });
  }

  return setCatalogExtraObjects(catalog, nextEntries);
};

export const buildProxySearchVariantCatalogId = (id: string) => `${id}${SEARCH_VARIANT_SUFFIX}`;

export const unwrapProxyCatalogVariantId = (id: string) =>
  id.endsWith(SEARCH_VARIANT_SUFFIX) ? id.slice(0, -SEARCH_VARIANT_SUFFIX.length) : id;

const applyCatalogNameOverride = (
  catalog: Record<string, unknown>,
  overrideName: string | undefined
) => {
  if (!overrideName) {
    return catalog;
  }

  return {
    ...catalog,
    name: overrideName,
  };
};

const setCatalogDiscoverOnly = (catalog: Record<string, unknown>, enabled: boolean) => {
  const nextEntries = getCatalogExtraObjects(catalog).filter(
    (entry) => entry.name.trim().toLowerCase() !== 'discover'
  );

  if (enabled) {
    nextEntries.push({
      name: 'discover',
      isRequired: true,
      options: ['Only'],
    });
  }

  return setCatalogExtraObjects(catalog, nextEntries);
};

const buildCatalogBaseKey = (catalog: Record<string, unknown>, index: number) => {
  const type = toTrimmedString(catalog.type).toLowerCase();
  const id = toTrimmedString(catalog.id).toLowerCase();
  const extraKeys = getCatalogExtraKeys(catalog).map((entry) => entry.toLowerCase());
  const parts = [type, id, ...extraKeys].filter(Boolean);
  return parts.length > 0 ? parts.join(':') : `catalog:${index + 1}`;
};

export const buildProxyCatalogDescriptors = (value: unknown): ProxyCatalogDescriptor[] => {
  if (!Array.isArray(value)) return [];

  const seenKeys = new Map<string, number>();

  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const catalog = entry as Record<string, unknown>;
    const type = toTrimmedString(catalog.type);
    const id = toTrimmedString(catalog.id);
    const name = toTrimmedString(catalog.name) || id || type || `Catalog ${index + 1}`;
    const extraKeys = getCatalogExtraKeys(catalog);
    const extraEntries = getCatalogExtraEntries(catalog);
    const searchEntry = extraEntries.find((entry) => entry.name.toLowerCase() === 'search');
    const discoverEntry = extraEntries.find((entry) => entry.name.toLowerCase() === 'discover');
    const requiredExtraKeys = extraEntries
      .filter((entry) => entry.isRequired)
      .map((entry) => entry.name.toLowerCase());
    const baseKey = buildCatalogBaseKey(catalog, index);
    const occurrence = (seenKeys.get(baseKey) || 0) + 1;
    seenKeys.set(baseKey, occurrence);

    return [
      {
        key: occurrence === 1 ? baseKey : `${baseKey}#${occurrence}`,
        type,
        id,
        name,
        extraKeys,
        supportsSearch: Boolean(searchEntry),
        searchRequired: Boolean(searchEntry?.isRequired),
        discoverOnly: Boolean(
          discoverEntry?.isRequired &&
            discoverEntry.options.some((option) => option.toLowerCase() === 'only')
        ),
        requiredExtraKeys,
      },
    ];
  });
};

export const normalizeProxyCatalogNameOverrides = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, entryValue]) => [key.trim(), toTrimmedString(entryValue)] as const)
    .filter(([key, entryValue]) => Boolean(key) && Boolean(entryValue));

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
};

export const applyProxyCatalogNameOverrides = (catalogsValue: unknown, overridesValue: unknown) => {
  if (!Array.isArray(catalogsValue)) {
    return catalogsValue;
  }

  const overrides = normalizeProxyCatalogNameOverrides(overridesValue);
  if (!overrides) {
    return catalogsValue;
  }

  const descriptors = buildProxyCatalogDescriptors(catalogsValue);

  return catalogsValue.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      return entry;
    }

    const catalogKey = descriptors[index]?.key;
    const overrideName = catalogKey ? overrides[catalogKey] : undefined;
    if (!overrideName) {
      return entry;
    }

    return {
      ...(entry as Record<string, unknown>),
      name: overrideName,
    };
  });
};

export const applyProxyCatalogOverrides = (
  catalogsValue: unknown,
  options?: {
    names?: unknown;
    hidden?: unknown;
    searchDisabled?: unknown;
    discoverOnly?: unknown;
  }
) => {
  if (!Array.isArray(catalogsValue)) {
    return catalogsValue;
  }

  const nameOverrides = normalizeProxyCatalogNameOverrides(options?.names);
  const hiddenCatalogs = new Set(normalizeProxyCatalogKeyList(options?.hidden) || []);
  const searchDisabledCatalogs = new Set(normalizeProxyCatalogKeyList(options?.searchDisabled) || []);
  const discoverOnlyCatalogs = normalizeProxyCatalogBooleanOverrides(options?.discoverOnly) || {};
  const descriptors = buildProxyCatalogDescriptors(catalogsValue);

  return catalogsValue.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const descriptor = descriptors[index];
    if (!descriptor) {
      return [entry];
    }

    let nextCatalog: Record<string, unknown> = { ...(entry as Record<string, unknown>) };

    if (searchDisabledCatalogs.has(descriptor.key) && descriptor.supportsSearch) {
      if (descriptor.searchRequired) {
        return [];
      }
      nextCatalog = removeSearchFromCatalog(nextCatalog);
    }

    const overrideName = nameOverrides?.[descriptor.key];
    const currentExtraEntries = getCatalogExtraEntries(nextCatalog);
    const currentSearchEntry = currentExtraEntries.find(
      (extraEntry) => extraEntry.name.toLowerCase() === 'search'
    );

    if (hiddenCatalogs.has(descriptor.key)) {
      const blockingRequiredExtras = currentExtraEntries
        .filter((extraEntry) => extraEntry.isRequired)
        .map((extraEntry) => extraEntry.name.toLowerCase())
        .filter((name) => name !== 'search' && name !== 'discover');

      if (currentSearchEntry && blockingRequiredExtras.length === 0) {
        nextCatalog = setCatalogDiscoverOnly(nextCatalog, false);
        nextCatalog = setCatalogSearchRequired(nextCatalog, true);
        return [applyCatalogNameOverride(nextCatalog, overrideName)];
      }

      if (!currentSearchEntry || blockingRequiredExtras.length > 0) {
        return [];
      }
    }

    const discoverOnlyOverride = discoverOnlyCatalogs[descriptor.key];
    const effectiveDiscoverOnly =
      typeof discoverOnlyOverride === 'boolean' ? discoverOnlyOverride : descriptor.discoverOnly;
    if (typeof discoverOnlyOverride === 'boolean' || descriptor.discoverOnly) {
      const effectiveRequiredExtras = currentExtraEntries
        .filter((extraEntry) => extraEntry.isRequired)
        .map((extraEntry) => extraEntry.name.toLowerCase())
        .filter((name) => name !== 'discover');

      if (!effectiveDiscoverOnly || effectiveRequiredExtras.length === 0) {
        if (effectiveDiscoverOnly && currentSearchEntry && !currentSearchEntry.isRequired) {
          const discoverCatalog = applyCatalogNameOverride(
            removeSearchFromCatalog(setCatalogDiscoverOnly(nextCatalog, true)),
            overrideName
          );
          const searchCatalog = applyCatalogNameOverride(
            setCatalogId(
              setCatalogSearchRequired(setCatalogDiscoverOnly(nextCatalog, false), true),
              buildProxySearchVariantCatalogId(String(nextCatalog.id || descriptor.id || 'catalog'))
            ),
            overrideName
          );
          return [discoverCatalog, searchCatalog];
        }

        nextCatalog = setCatalogDiscoverOnly(nextCatalog, effectiveDiscoverOnly);
      }
    }

    return [applyCatalogNameOverride(nextCatalog, overrideName)];
  });
};
