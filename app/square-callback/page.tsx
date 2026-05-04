"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiLoader, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

export default function SquareCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");
  const vendorId = searchParams.get("vendorId");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // Short delay to show loading state, then resolve
    const timer = setTimeout(() => {
      setStatus(success ? "success" : "error");
    }, 800);
    return () => clearTimeout(timer);
  }, [success, error]);

  const errorMessages: Record<string, string> = {
    missing_code: "Square did not return an authorization code. Please try again.",
    missing_state: "Session state was lost during authorization. Please try again.",
    token_exchange_failed: "Failed to exchange the authorization code with Square. Ensure your Square app credentials are correct.",
    access_denied: "You declined to connect your Square account. You can try again from Store Settings.",
  };

  const friendlyError =
    error ? (errorMessages[error] ?? `Authorization failed (${error}). Please try again.`) : "An unknown error occurred.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0E0F13] p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <FiLoader className="w-14 h-14 text-purple-500 animate-spin" />
            <p className="text-surface-500 dark:text-surface-400 text-base font-medium">
              Finishing Square setup…
            </p>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <FiCheckCircle className="h-12 w-12 text-emerald-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Square Connected!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base mb-8 leading-relaxed">
              Your Square account has been linked successfully. Customers can now pay for your
              products and funds will be deposited directly into your Square account.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3.5 text-base font-semibold text-white hover:opacity-90 transition-opacity mb-3"
            >
              Back to Settings
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-3.5 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <FiAlertCircle className="h-12 w-12 text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base mb-8 leading-relaxed">
              {friendlyError}
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3.5 text-base font-semibold text-white hover:opacity-90 transition-opacity mb-3"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Settings & Retry
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
