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
