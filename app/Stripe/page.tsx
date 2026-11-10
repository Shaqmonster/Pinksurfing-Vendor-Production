"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getOnboardingUrl } from "@/api/account";
import { handleError, handleSuccess } from "@/utils/toast";
import AuthLayout from "@/components/auth/AuthLayout";
import { authBtnPrimary, authBtnSecondary, authLinkClass } from "@/components/auth/authTheme";
import { FiCheckCircle, FiExternalLink } from "react-icons/fi";

/**
 * Legacy Stripe Connect onboarding handoff.
 * API contract unchanged — UI only. Square Connect lives under Store Settings.
 */
const StripePage = () => {
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access");
      if (!token) {
        handleError("Please sign in again to continue payout setup.");
        return;
      }

      const response = await getOnboardingUrl(token);
      const url = response?.url;

      if (!url) {
        handleError("Onboarding link was not available. Try again or finish later in Store Settings.");
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
      setOpened(true);
      handleSuccess("Opened Stripe onboarding in a new tab.");
    } catch (error) {
      console.error("Error:", error);
      handleError("Could not start Stripe onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set up payouts"
      subtitle="Connect Stripe so you can receive funds from sales. You can also connect Square later in Store Settings."
      footer={
        <p>
          Prefer to do this later?{" "}
          <Link href="/dashboard" className={authLinkClass}>
            Go to dashboard
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        <ul className="space-y-3 text-sm text-slate-600 dark:text-surface-400">
          <li className="flex items-start gap-3">
            <FiCheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" aria-hidden />
            <span>Takes a few minutes — business and bank details are collected by Stripe.</span>
          </li>
          <li className="flex items-start gap-3">
            <FiCheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" aria-hidden />
            <span>Square Connect (customer card payments) is managed separately under Store Settings.</span>
          </li>
        </ul>

        <button
          type="button"
          className={authBtnPrimary}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? "Opening…" : opened ? "Reopen Stripe onboarding" : "Start Stripe onboarding"}
          {!loading && <FiExternalLink className="inline ml-2 w-4 h-4 align-text-bottom" aria-hidden />}
        </button>

        <Link href="/settings" className={`${authBtnSecondary} inline-flex items-center justify-center`}>
          Open Store Settings
        </Link>

        {opened ? (
          <p className="text-xs text-surface-500 dark:text-surface-400 text-center">
            After you finish in the Stripe tab, return here and continue to your dashboard.
          </p>
        ) : null}
      </div>
    </AuthLayout>
  );
};

export default StripePage;
