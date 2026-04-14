"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { getCookie } from "@/utils/cookies";
import { getVendorProfile } from "@/api/products";
import { getPayPalErrorMessage, postPayPalOnboardingLink } from "@/api/paypal";
import { FaPaypal } from "react-icons/fa";
import { FiCheckCircle, FiExternalLink, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";

export default function PayPalOnboardingPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [paypalMerchantId, setPaypalMerchantId] = useState<string | null | undefined>(undefined);
  const [storeName, setStoreName] = useState("");
  const handledPayPalReturn = useRef(false);

  const callbackConnected = searchParams.get("paypal_connected") === "true";
  const callbackMerchantId = searchParams.get("merchant_id")?.trim() || null;
  const callbackVendorId = searchParams.get("vendor_id")?.trim() || null;
  const callbackPermissionsGranted = (searchParams.get("permissions_granted") || "").toLowerCase();

  const loadProfile = useCallback(async () => {
    const token = getCookie("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    const res = await getVendorProfile(token);
    if (res.error || !res.data) {
      setLoading(false);
      toast.error("Could not load vendor profile.");
      return;
    }
    const d = res.data as Record<string, unknown>;
    setVendorId(String(d.id ?? ""));
    setPaypalMerchantId(
      d.paypal_merchant_id != null && String(d.paypal_merchant_id).trim() !== ""
        ? String(d.paypal_merchant_id)
        : null
    );
    setStoreName(String(d.store_name ?? ""));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /** Return from PayPal — toast and refetch profile (short delay for DB write). */
  useEffect(() => {
    if (handledPayPalReturn.current) return;
    const p = searchParams.get("paypal_connected");
    if (p == null) return;
    handledPayPalReturn.current = true;

    if (p === "true") {
      toast.success("PayPal connected. You can receive payouts from customer checkouts.");
    } else {
      toast.error("PayPal setup was not completed. Please try connecting again.");
    }
    const token = getCookie("access_token");
    const t = setTimeout(() => {
      if (token) void loadProfile();
    }, 1200);
    return () => clearTimeout(t);
  }, [loadProfile, searchParams]);

  const handleConnect = async () => {
    const token = getCookie("access_token");
    if (!token || !vendorId) {
      toast.error("Please sign in again.");
      return;
    }
    setConnecting(true);
    try {
      const data = await postPayPalOnboardingLink(token, vendorId);
      if (data.action_url) {
        window.location.href = data.action_url;
        return;
      }
      toast.error(data.error || "Could not start PayPal onboarding.");
    } catch (err) {
      toast.error(getPayPalErrorMessage(err));
    } finally {
      setConnecting(false);
    }
  };

  const merchantIdToDisplay =
    paypalMerchantId != null && paypalMerchantId !== ""
      ? paypalMerchantId
      : callbackConnected
        ? callbackMerchantId
        : null;

  const connected = merchantIdToDisplay != null && merchantIdToDisplay !== "";

  return (
    <div className="min-h-[calc(100vh-120px)] px-4 py-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-premium-lg overflow-hidden"
      >
        <div className="p-6 sm:p-8 border-b border-light-border dark:border-dark-border bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/15 dark:to-indigo-500/15">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0070ba] flex items-center justify-center text-white shadow-lg">
              <FaPaypal className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-white">PayPal onboarding</h1>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                Connect PayPal so customers can pay for your products and funds can reach your account.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {loading ? (
            <p className="text-surface-500 dark:text-surface-400 text-sm">Loading…</p>
          ) : (
            <>
              {storeName && (
                <p className="text-sm text-surface-600 dark:text-surface-300">
                  Store: <span className="font-semibold">{storeName}</span>
                </p>
              )}

              {connected ? (
                <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                  <FiCheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">PayPal connected</p>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                      Merchant ID:{" "}
                      <code className="text-xs bg-surface-100 dark:bg-dark-hover px-1.5 py-0.5 rounded">
                        {merchantIdToDisplay}
                      </code>
                    </p>
                    {(callbackConnected || callbackVendorId || callbackPermissionsGranted) && (
                      <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs text-surface-700 dark:text-surface-300 space-y-1">
                        <p>
                          Callback status: <span className="font-semibold">Success</span>
                        </p>
                        {(callbackVendorId || vendorId) && (
                          <p>
                            Vendor ID: <span className="font-mono">{callbackVendorId || vendorId}</span>
                          </p>
                        )}
                        <p>
                          Permissions granted: <span className="font-semibold">{callbackPermissionsGranted === "true" ? "Yes" : "No"}</span>
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-surface-500 mt-2">
                      You can update your PayPal account settings anytime on{" "}
                      <a
                        href="https://www.paypal.com/businessmanage/account/aboutBusiness"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 hover:underline"
                      >
                        paypal.com <FiExternalLink className="w-3 h-3" />
                      </a>
                      .
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/25 p-4">
                  <FiAlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-white">Action required</p>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                      Until you connect PayPal, customers may see an error at checkout for your products. Use the
                      button below to sign in to PayPal and grant Pinksurfing permission to process payments on
                      your behalf.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {!connected && (
                  <button
                    type="button"
                    disabled={connecting || !vendorId}
                    onClick={handleConnect}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#0070ba] hover:bg-[#005ea6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaPaypal className="w-5 h-5" />
                    {connecting ? "Opening PayPal…" : "Connect PayPal"}
                  </button>
                )}
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium border border-light-border dark:border-dark-border text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors"
                >
                  Back to dashboard
                </Link>
              </div>

              <p className="text-xs text-surface-400 dark:text-surface-500 leading-relaxed">
                After you finish on PayPal, you&apos;ll be redirected back here automatically. Sandbox and live
                environments use the same steps; ensure your PayPal developer app matches the platform environment.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
