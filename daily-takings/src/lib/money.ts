// Locale-aware currency formatting. A single place so inputs, totals, variance
// and summaries all agree. Multi-currency is out of scope for v1 — each org has
// one currency stored on the organization row.

const DEFAULT_LOCALE = "en-NZ";

export function formatMoney(
  amount: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
): string {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "NZD",
    }).format(value);
  } catch {
    // Unknown currency code — fall back to a plain fixed-decimal string.
    return `${(currency || "").toUpperCase()} ${value.toFixed(2)}`.trim();
  }
}

// Parse free-text currency input ("1,234.50", "$40", "") into a number. Returns
// 0 for empty/invalid so totals never become NaN.
export function parseMoney(input: string | number | null | undefined): number {
  if (typeof input === "number") return Number.isFinite(input) ? input : 0;
  if (!input) return 0;
  const cleaned = input.replace(/[^0-9.-]/g, "");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

// Round to cents to avoid floating-point drift in totals.
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

// A currency's smallest-unit label, used sparingly in the UI.
export function currencySymbol(
  currency: string,
  locale: string = DEFAULT_LOCALE,
): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "NZD",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? "$";
  } catch {
    return "$";
  }
}
