"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { getKycStatus, launchKyc } from "@/api/kyc";
import { handleError } from "@/utils/toast";

const POLL_MS = 4000;

type Props = {
  accessToken: string;
  onVerified: () => void;
  children?: React.ReactNode;
  title?: string;
  description?: string;
};

/**
 * Blocks until SSO Didit KYC is approved. Redirects to auth.pinksurfing.com/kyc/.
 */
export default function DiditVerificationGate({
  accessToken,
  onVerified,
  children,
  title = "Verify your identity",
  description = "Complete a quick identity check to access your vendor dashboard. You only need to do this once.",
}: Props) {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState("not_started");
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  const checkStatus = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return false;
    }
    try {
      const res = await getKycStatus(accessToken);
      const data = res.data || {};
      setStatus(data.kyc_status || data.status || "not_started");
      if (data.kyc_verified || data.verified) {
        setVerified(true);
        onVerifiedRef.current();
        return true;
      }
      return false;
    } catch (err) {
      console.error("KYC status failed", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const ok = await checkStatus();
      if (ok) stopPolling();
    }, POLL_MS);
  }, [checkStatus]);

  useEffect(() => {
    checkStatus();
    return () => stopPolling();
  }, [checkStatus]);

  useEffect(() => {
    if (!accessToken || verified || loading) return;
    if (status === "not_started") return;
    startPolling();
    return () => stopPolling();
  }, [accessToken, verified, loading, status, startPolling]);

  const startVerification = async () => {
    if (!accessToken) return;
    setStarting(true);
    try {
      const isVerifyPage = window.location.pathname.includes("/identity/verify");
      const returnUrl = isVerifyPage
        ? window.location.href.split("#")[0]
        : `${window.location.origin}/identity/verify?returnUrl=${encodeURIComponent("/dashboard")}`;

      const res = await launchKyc(accessToken, returnUrl);
      const data = res.data || {};
      if (data.kyc_verified || data.verified) {
        setVerified(true);
        onVerifiedRef.current();
        return;
      }
      const kycUrl = data.kyc_url;
      if (!kycUrl) {
        handleError(
          data.detail || "Could not start verification. Please try again later."
        );
        return;
      }
      window.location.href = kycUrl;
    } catch (err: any) {
      handleError(
        err?.response?.data?.detail ||
          err?.response?.data?.return_url?.[0] ||
          "Could not start identity verification."
      );
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Checking verification…</p>
      </div>
    );
  }

  if (verified) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12 text-center">
      <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <p className="mb-6 text-xs capitalize text-gray-400">
        Status: {String(status).replace(/_/g, " ")}
      </p>
      <button
        type="button"
        onClick={startVerification}
        disabled={starting}
        className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {starting ? "Starting…" : "Start identity verification"}
      </button>
      <button
        type="button"
        onClick={checkStatus}
        className="mt-4 block w-full text-sm text-purple-600 hover:text-purple-500"
      >
        I completed verification — refresh
      </button>
    </div>
  );
}
