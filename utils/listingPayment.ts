import { createSquareListingPaymentLink } from "@/api/products";
import {
  PendingListing,
  updatePendingListingState,
  upsertPendingListing,
} from "@/utils/pendingListings";

export type ListingPaymentRedirectResult =
  | { ok: true; paymentUrl: string }
  | { ok: false; message: string; status?: number };

/** Create Square link and return URL (caller redirects). Updates local pending-listing state. */
export async function prepareListingFeePayment(
  token: string,
  productId: string,
  productName?: string
): Promise<ListingPaymentRedirectResult> {
  const result = await createSquareListingPaymentLink(token, productId);

  if (result.error) {
    const errorMsg =
      result.data?.hint ||
      result.data?.details ||
      result.message ||
      "Could not create payment link";
    return { ok: false, message: errorMsg, status: result.status };
  }

  const paymentUrl = result.data?.payment_link;
  if (!paymentUrl) {
    return { ok: false, message: "Could not create payment link, try again." };
  }

  const listing: Omit<PendingListing, "updatedAt"> = {
    productId,
    productName,
    listingStatus: "PENDING_PAYMENT",
    listingFeeAmount: String(result.data?.amount || "1.00"),
    listingFeeCurrency: String(result.data?.currency || "USD"),
    state: "PAYMENT_REDIRECTED",
    createdAt: new Date().toISOString(),
  };
  upsertPendingListing(listing);
  updatePendingListingState(productId, "PAYMENT_REDIRECTED");

  return { ok: true, paymentUrl };
}
