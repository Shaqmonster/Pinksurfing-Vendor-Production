"use client";
import React, { useState } from "react";
import { getDotsPayoutLink } from "@/api/account";
import { getCookie } from "@/utils/cookies";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FiExternalLink, FiShield, FiDollarSign, FiCheckCircle } from "react-icons/fi";

const PayoutSetupPage = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const token = getCookie("access_token");
      if (!token) {
        toast.error("Please log in to continue.");
        return;
      }

      const response = await getDotsPayoutLink(token);
      const url = response?.link;

      if (!url) {
        toast.error("Could not generate payout setup link. Please try again.");
        return;
      }

      window.open(url, "_blank");
      toast.success("Payout setup page opened in a new tab.");
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to generate payout link.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[70vh] px-4"
    >
      <div className="premium-card p-8 md:p-12 max-w-lg w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-pink flex items-center justify-center shadow-premium-sm">
          <FiDollarSign className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-3">
          Set Up Your Payouts
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mb-8 leading-relaxed">
          Connect your bank account or PayPal to start receiving payments for
          your sales. You&apos;ll be redirected to our secure payment partner to
          complete the setup.
        </p>

        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-start gap-3">
            <FiShield className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            <p className="text-sm text-surface-600 dark:text-surface-300">
              Your financial information is securely handled by our payment partner
            </p>
          </div>
          <div className="flex items-start gap-3">
            <FiCheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            <p className="text-sm text-surface-600 dark:text-surface-300">
              Supports bank accounts (ACH) and PayPal
            </p>
          </div>
          <div className="flex items-start gap-3">
            <FiDollarSign className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            <p className="text-sm text-surface-600 dark:text-surface-300">
              Earnings are automatically paid out after a 14-day holding period
            </p>
          </div>
        </div>

        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-pink text-white font-semibold text-lg shadow-premium-sm hover:shadow-premium-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Set Up Payout Method
              <FiExternalLink className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default PayoutSetupPage;
  