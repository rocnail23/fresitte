/**
 * Pure helpers to read the free-form `sizes` CSV of a product.
 *
 * The admin types sizes by hand ("3-6M, 6-9", "3-6 y 6-9m", "4 años"), so
 * the same logical size can be written in several ways. These helpers reduce
 * every variant to a canonical key ("3-6") so a size is recognized no matter
 * how it was typed, and give the storefront a stable value for the URL.
 *
 * The module is intentionally free of server-only imports: it is used by the
 * server (page, actions), by the seed script and by client components.
 */

/** Unit suffixes that carry no identity for the size ("3-6 meses" → "3-6"). */
const UNIT_SUFFIXES = ["MESES", "MES", "AÑOS", "AÑO", "M"];

/** A bare number or a numeric range ("19", "3-6"). */
const NUMERIC_SIZE = /^\d+(-\d+)?$/;

/** Separator between two sizes written in the same token ("3-6 y 6-9"). */
const SIZE_LIST_SEPARATOR = /\s+y\s+|\s*&\s*/i;

/**
 * Canonical key of a size token: uppercase, without the unit suffix.
 *
 * "3-6M" → "3-6" · "4 años" → "4" · "Rn" → "RN" · "Única" → "ÚNICA".
 *
 * The bare "M" suffix means "meses" and is dropped the same way as "AÑOS":
 * "3-6M" is the same size as "3-6".
 */
export function normalizeSizeToken(raw: string): string {
  const upper = raw.trim().toUpperCase().replace(/\s+/g, " ");
  if (!upper) return "";

  for (const suffix of UNIT_SUFFIXES) {
    if (!upper.endsWith(suffix)) continue;
    const head = upper.slice(0, upper.length - suffix.length).trim();
    if (!head) continue;
    if (suffix === "M" && !NUMERIC_SIZE.test(head)) continue;
    return head;
  }

  return upper;
}

/**
 * Key used to match a label with the sizes written on the products.
 * "Talla 19" → "19" so the label matches the products that store "19".
 */
export function deriveSizeKey(label: string): string {
  const normalized = normalizeSizeToken(label);
  if (!normalized) return "";
  const withoutPrefix = normalized.replace(/^TALLA\s+/, "");
  return withoutPrefix || normalized;
}

/** Raw tokens of a `sizes` CSV, splitting the "3-6 y 6-9" style lists. */
export function splitSizeTokens(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,;\n]+/)
    .flatMap((chunk) => chunk.split(SIZE_LIST_SEPARATOR))
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

/** Canonical keys of a `sizes` CSV, without duplicates. */
export function sizeKeysFromCsv(value?: string | null): string[] {
  const keys = splitSizeTokens(value).map(normalizeSizeToken).filter(Boolean);
  return [...new Set(keys)];
}

/** Raw token → canonical key, keeping the text the admin typed. */
export function sizeEntriesFromCsv(
  value?: string | null,
): { key: string; label: string }[] {
  const seen = new Set<string>();
  const entries: { key: string; label: string }[] = [];

  for (const token of splitSizeTokens(value)) {
    const key = normalizeSizeToken(token);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    entries.push({ key, label: token });
  }

  return entries;
}

/**
 * Rewrites a `sizes` CSV replacing every token that resolves to `oldKey`
 * with `newLabel`. Used when a size is renamed in the registry so the
 * products keep pointing at the renamed size.
 *
 * Returns the original CSV when nothing matched.
 */
export function replaceSizeToken(
  csv: string | null | undefined,
  oldKey: string,
  newLabel: string,
): string | null {
  const tokens = splitSizeTokens(csv);
  if (!tokens.length) return null;

  let changed = false;
  const next = tokens.map((token) => {
    if (normalizeSizeToken(token) !== oldKey) return token;
    changed = true;
    return newLabel;
  });

  if (!changed) return csv ?? null;
  return next.join(", ");
}

/**
 * Default position of a size in the registry when it is registered for the
 * first time.
 *
 * The shop sells clothes for babies and shoes, so the natural progression
 * is: newborn → months → years → shoe sizes. The scores follow the
 * progression the catalog already uses (see the "0-3 meses", "3-6 meses",
 * "Talla 2-3" collections).
 *
 * The score is `group * 1000 + value`, so it can be sorted as a number.
 */
export function defaultSizeRank(rawToken: string): number {
  const token = rawToken.trim().toUpperCase();
  const key = normalizeSizeToken(token);
  if (!key) return Number.MAX_SAFE_INTEGER;

  // Newborn.
  if (key === "RN" || key === "ÚNICA") return 0;

  const range = /^(\d+)-(\d+)$/.exec(key);
  if (range) {
    const start = Number(range[1]);
    const end = Number(range[2]);
    // Consecutive numbers from 17 up are shoe sizes ("21-22").
    if (end === start + 1 && start >= 17) return 3 * 1000 + start;
    // Month ranges start on a multiple of 3 (0-3, 3-6, 6-9, 9-12, 12-18,
    // 18-24); the rest are ages in years ("2-3", "1-2 años").
    return start % 3 === 0 ? 1 * 1000 + start : 2 * 1000 + start;
  }

  const single = /^(\d+)$/.exec(key);
  if (single) {
    const value = Number(single[1]);
    // From 17 up they are shoe sizes; below that they are ages in years.
    return value >= 17 ? 3 * 1000 + value : 2 * 1000 + value;
  }

  // Anything else goes at the end of the age group.
  return 2 * 1000;
}

/**
 * Minimal shape of a registry entry needed to resolve labels and order.
 * `SizeRecord` (see `@/lib/sizes`) satisfies it.
 */
export interface SizeRegistryEntry {
  matchKey: string;
  name: string;
}

/** A size token with its canonical key and the label to display. */
export interface ResolvedSize {
  key: string;
  label: string;
}

/** Minimal shape of a product needed to read its sizes. */
export interface SizedProduct {
  sizes: string | null;
}

/**
 * Size options of a set of products, resolved against the registry and
 * ordered by it (see `resolveSizeEntries`).
 *
 * `fallbackLabel` is used for the products that have no sizes at all; its
 * canonical key is derived from the label itself.
 */
export function collectSizeFilters(
  products: SizedProduct[],
  registry: SizeRegistryEntry[],
  fallbackLabel = "Única",
): ResolvedSize[] {
  const fallbackKey = normalizeSizeToken(fallbackLabel) || fallbackLabel;
  const options = new Map<string, ResolvedSize>();

  for (const product of products) {
    const entries = sizeEntriesFromCsv(product.sizes);
    const tokens = entries.length
      ? entries
      : [{ key: fallbackKey, label: fallbackLabel }];
    for (const token of tokens) {
      if (!token.key || options.has(token.key)) continue;
      options.set(token.key, token);
    }
  }

  return resolveSizeEntries([...options.values()], registry);
}

/**
 * Resolves the label of every size token against the registry and orders
 * the result:
 *
 *   - sizes registered by the admin come first, in the order they set;
 *   - sizes that are not registered come last, in natural order.
 *
 * The label of a registered size is the name the admin chose, so the
 * storefront shows "3-6 meses" even when the products store "3-6M".
 */
export function resolveSizeEntries(
  entries: ResolvedSize[],
  registry: SizeRegistryEntry[],
): ResolvedSize[] {
  const registryByKey = new Map(
    registry.map((size) => [size.matchKey, size] as const),
  );
  const rank = new Map(
    registry.map((size, index) => [size.matchKey, index] as const),
  );

  const resolved = entries.map((entry) => ({
    key: entry.key,
    label: registryByKey.get(entry.key)?.name ?? entry.label,
  }));

  return resolved.sort((a, b) => {
    const aRank = rank.get(a.key);
    const bRank = rank.get(b.key);
    if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
    if (aRank !== undefined) return -1;
    if (bRank !== undefined) return 1;
    return a.label.localeCompare(b.label, "es", { numeric: true });
  });
}
