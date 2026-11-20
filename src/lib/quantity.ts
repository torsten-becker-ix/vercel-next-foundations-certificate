/** Upper bound for a single cart line, enforced on both client and server. */
export const MAX_QUANTITY = 99;

/** The most a shopper may select given live stock (never above MAX_QUANTITY). */
export function maxSelectable(stock: number): number {
  return Math.max(0, Math.min(Math.floor(stock), MAX_QUANTITY));
}

/** Clamps a requested quantity into 1..max. Always returns at least 1. */
export function clampQuantity(value: number, max: number): number {
  const upper = Math.max(1, Math.floor(max));
  if (Number.isNaN(value)) {
    return 1;
  }
  return Math.min(Math.max(Math.trunc(value), 1), upper);
}
