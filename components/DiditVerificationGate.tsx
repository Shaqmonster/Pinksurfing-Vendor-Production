"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { DiditSdk } from "@didit-protocol/sdk-web";
import { createIdentitySession, getIdentityStatus } from "@/api/identity";
import { handleError } from "@/utils/toast";

const POLL_MS = 4000;

type Props = {
  context?: "vendor" | "gig_seller";
  accessToken: string;
  onVerified: () => void;
  children?: React.ReactNode;
  title?: string;
  description?: string;
};

export default function DiditVerificationGate({
  context = "vendor",
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

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/identity/verify?context=${context}&returnUrl=${encodeURIComponent(
          "/dashboard"
        )}`
      : "/identity/verify";

  const checkStatus = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return false;
    }
    try {
      const res = await getIdentityStatus(accessToken, context);
      const data = res.data || {};
      setStatus(data.status || "not_started");
      if (data.verified) {
        setVerified(true);
        onVerified();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Identity status failed", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [accessToken, context, onVerified]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    checkStatus();
    return () => stopPolling();
  }, [checkStatus]);

  const startVerification = async () => {
    if (!accessToken) return;
    setStarting(true);
    try {
      const res = await createIdentitySession(accessToken, context, callbackUrl);
      const data = res.data || {};
      if (data.verified) {
        setVerified(true);
        onVerified();
        return;
      }
      const url = data.verification_url;
      if (!url) {
        handleError("Could not start verification.");
        return;
      }
      pollRef.current = setInterval(async () => {
        const ok = await checkStatus();
        if (ok) stopPolling();
      }, POLL_MS);
      DiditSdk.shared.startVerification({ url });
    } catch (err: any) {
      handleError(
        err?.response?.data?.detail || "Could not start identity verification."
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
