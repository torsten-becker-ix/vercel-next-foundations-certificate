const formatters = new Map<string, Intl.NumberFormat>();

/** Formats an integer amount in minor units (cents) as a localized currency string. */
export function formatPrice(cents: number, currency: string): string {
  let formatter = formatters.get(currency);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat("en-US", { style: "currency", currency });
    formatters.set(currency, formatter);
  }
  return formatter.format(cents / 100);
}
