"use client";

import { useEffect, useState } from "react";
import { getVendorProfile } from "@/lib/api/products";
import { resolveVendorApiToken } from "@/utils/vendorAuth";

// Fixed fee charged by the backend (payments/views.py square_create_listing_fee).
export const LISTING_FEE_LABEL = "$1.00";

export type ListingFeeStatus = {
  loading: boolean;
  /** ISO date until which the fee is waived (tax number on file), or null. */
  exemptUntil: string | null;
};

export function isFeeWaived(status: ListingFeeStatus): boolean {
  if (!status.exemptUntil) return false;
  const until = Date.parse(status.exemptUntil);
  return !Number.isNaN(until) && until > Date.now();
}

/** Reads the vendor's listing-fee exemption so the fee can be shown before "Create Listing". */
export function useListingFeeStatus(): ListingFeeStatus {
  const [status, setStatus] = useState<ListingFeeStatus>({ loading: true, exemptUntil: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await resolveVendorApiToken();
        const { data, error } = await getVendorProfile(token);
        if (cancelled) return;
        setStatus({
          loading: false,
          exemptUntil: !error && data?.listing_fee_exempt_until ? data.listing_fee_exempt_until : null,
        });
      } catch {
        if (!cancelled) setStatus({ loading: false, exemptUntil: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

export default function ListingFeeNotice({ status }: { status: ListingFeeStatus }) {
  if (status.loading) return null;

  if (isFeeWaived(status)) {
    const until = new Date(status.exemptUntil as string).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return (
      <div className="mt-6 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-surface-700 dark:text-surface-200">
        <p className="font-semibold">No listing fee</p>
        <p className="mt-1">
          Your listing fee is waived until {until} because a tax number is on file. Your listing goes
          live right after you click Create Listing.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-primary-300/40 bg-primary-50 dark:bg-primary-500/10 p-4 text-sm text-surface-700 dark:text-surface-200">
      <p className="font-semibold">Listing fee: {LISTING_FEE_LABEL}, one time</p>
      <p className="mt-1">
        After you click Create Listing you go to a secure Square checkout to pay it (coupon codes can be
        entered there). Your listing goes live once it is paid, and you can also pay later from your
        Products list.
      </p>
      <p className="mt-1 text-surface-500 dark:text-surface-400">
        Add a tax number in{" "}
        <a href="/settings" className="underline hover:text-primary-500">
          Settings
        </a>{" "}
        to waive the fee for 180 days.
      </p>
    </div>
  );
}
