"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PayPalCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const merchantId = searchParams.get("merchantId")?.trim() || "";
    const vendorId = searchParams.get("vendorId")?.trim() || "";
    const permissionsGranted = (searchParams.get("permissionsGranted") || "").toLowerCase();

    const connected = Boolean(merchantId) && permissionsGranted === "true";
    const nextParams = new URLSearchParams({
      paypal_connected: connected ? "true" : "false",
      merchant_id: merchantId,
      vendor_id: vendorId,
      permissions_granted: permissionsGranted || "false",
    });

    router.replace(`/payments/paypal?${nextParams.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4">
      <p className="text-sm text-surface-500 dark:text-surface-400">
        Finishing PayPal setup...
      </p>
    </div>
  );
}
