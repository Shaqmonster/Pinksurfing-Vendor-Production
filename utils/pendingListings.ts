export type ListingFlowState =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PAYMENT_REDIRECTED"
  | "AWAITING_WEBHOOK"
  | "LIVE"
  | "PAYMENT_FAILED";

export interface PendingListing {
  productId: string;
  productName?: string;
  listingStatus: "PENDING_PAYMENT";
  listingFeeAmount: string;
  listingFeeCurrency: string;
  squareListingFeeEndpoint?: string;
  state: ListingFlowState;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "vendor_pending_listings";

function nowIso(): string {
  return new Date().toISOString();
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getPendingListings(): PendingListing[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.productId === "string");
  } catch {
    return [];
  }
}

function savePendingListings(items: PendingListing[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function upsertPendingListing(listing: Omit<PendingListing, "updatedAt">): PendingListing[] {
  const current = getPendingListings();
  const next: PendingListing = {
    ...listing,
    updatedAt: nowIso(),
  };

  const idx = current.findIndex((item) => item.productId === listing.productId);
  if (idx === -1) {
    savePendingListings([next, ...current]);
    return [next, ...current];
  }

  const merged: PendingListing = {
    ...current[idx],
    ...next,
  };
  const clone = [...current];
  clone[idx] = merged;
  savePendingListings(clone);
  return clone;
}

export function updatePendingListingState(
  productId: string,
  state: ListingFlowState
): PendingListing[] {
  const current = getPendingListings();
  const next = current.map((item) =>
    item.productId === productId
      ? {
          ...item,
          state,
          updatedAt: nowIso(),
        }
      : item
  );
  savePendingListings(next);
  return next;
}

export function removePendingListing(productId: string): PendingListing[] {
  const next = getPendingListings().filter((item) => item.productId !== productId);
  savePendingListings(next);
  return next;
}

export function getPendingListing(productId: string): PendingListing | undefined {
  return getPendingListings().find((item) => item.productId === productId);
}

// How long we trust a "payment submitted, waiting for Square webhook" state before letting the
// vendor try again. Square usually confirms within seconds; past this window the state is stale.
const AWAITING_WEBHOOK_WINDOW_MS = 5 * 60 * 1000;

function isAwaitingWebhookFresh(pending: PendingListing): boolean {
  if (pending.state !== "AWAITING_WEBHOOK") return false;
  const updated = Date.parse(pending.updatedAt);
  if (Number.isNaN(updated)) return false;
  return Date.now() - updated < AWAITING_WEBHOOK_WINDOW_MS;
}

/**
 * Pay is disabled only while a payment link is being created, or for a short window after
 * Square sent the vendor back with a submitted payment. A vendor who left the Square page
 * (PAYMENT_REDIRECTED) can always click again to get a fresh link.
 */
export function isListingFeePayDisabled(
  productId: string,
  payingListingId: string
): boolean {
  if (payingListingId === productId) return true;
  const pending = getPendingListing(productId);
  if (!pending) return false;
  return isAwaitingWebhookFresh(pending);
}

export function listingFeePayButtonLabel(
  productId: string,
  payingListingId: string,
  withArrow = false
): string {
  if (payingListingId === productId) return "Preparing…";
  const pending = getPendingListing(productId);
  if (pending && isAwaitingWebhookFresh(pending)) return "Confirming payment…";
  const label =
    pending?.state === "PAYMENT_REDIRECTED"
      ? "Continue to payment"
      : pending?.state === "AWAITING_WEBHOOK" || pending?.state === "PAYMENT_FAILED"
        ? "Retry payment"
        : "Publish listing";
  return withArrow ? `${label} →` : label;
}
