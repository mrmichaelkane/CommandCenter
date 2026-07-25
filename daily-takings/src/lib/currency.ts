// Supported currency codes for v1 (single currency per org). Kept out of the
// "use server" action module, which may only export async functions.
export const SUPPORTED_CURRENCIES = [
  "NZD", "AUD", "USD", "GBP", "EUR", "CAD", "SGD", "HKD", "JPY", "ZAR",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}
