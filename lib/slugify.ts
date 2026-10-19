/**
 * Mirror of the server-side slugify in
 * `app/(admin)/admin/{products,categories}/actions.ts`.
 * Used by client components for live slug preview.
 */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Format a price stored in cents as EUR currency string. */
export function formatPriceFromCents(
  cents: number,
  currency: string | null | undefined,
  locale = "es-ES",
) {
  const value = (Number.isFinite(cents) ? cents : 0) / 100;
  // La tienda cotiza exclusivamente en euros: ignoramos cualquier valor
  // heredado (USD/COP) que pueda quedar en la base de datos.
  const safeCurrency = "EUR";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} €`;
  }
}
