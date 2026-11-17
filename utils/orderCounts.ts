/**
 * One rule for counting a vendor's orders, so the profile and the Orders page agree.
 * `/vendor/all-orders/` returns one row per order line, including PENDING lines from checkouts
 * that were never paid. Only lines past PENDING are real (paid) orders.
 */
export type OrderLine = { order_status?: string | null };

export function paidOrderLines<T extends OrderLine>(lines: unknown): T[] {
  if (!Array.isArray(lines)) return [];
  return (lines as T[]).filter((line) => line?.order_status && line.order_status !== "PENDING");
}
