"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaGavel, FaStore } from "react-icons/fa";
import {
  FiArrowLeft,
  FiDollarSign,
  FiClock,
  FiTag,
  FiUser,
  FiImage,
  FiSend,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";
import { getOpenRequestDetail, createBid, getMyBids, deleteBid } from "@/api/buyerRequests";
import { handleError, handleSuccess } from "@/utils/toast";

interface VendorBid {
  id: string;
  bid_amount: string;
  delivery_time_days: number;
  proposal: string;
  status: string;
  vendor_store_name: string;
  vendor_email: string;
  image1: string | null;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  created_at: string;
}

interface BuyerRequest {
  id: string;
  title: string;
  description: string;
  budget: string;
  deadline: string | null;
  category_name: string | null;
  customer_first_name: string;
  customer_last_name: string;
  status: string;
  bids: VendorBid[];
  image1: string | null;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  created_at: string;
}

const BID_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  SHORTLISTED: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id as string;

  const [request, setRequest] = useState<BuyerRequest | null>(null);
  const [myBid, setMyBid] = useState<VendorBid | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Bid form state
  const [bidAmount, setBidAmount] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [proposal, setProposal] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("access") ?? "" : "";

  useEffect(() => {
    if (!requestId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [reqRes, bidsRes] = await Promise.all([
          getOpenRequestDetail(token, requestId),
          getMyBids(token),
        ]);
        setRequest(reqRes.data.results);
        // Check if vendor already has a bid on this request
        const existing = bidsRes.data.find(
          (b: VendorBid & { request: string }) => b.request === requestId
        );
        if (existing) {
          setMyBid(existing);
          setBidAmount(existing.bid_amount);
          setDeliveryDays(String(existing.delivery_time_days));
          setProposal(existing.proposal);
        }
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [requestId]);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 4 - images.length;
    const toAdd = files.slice(0, remaining);
    setImages((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidAmount || !deliveryDays || !proposal.trim()) {
      handleError("Please fill in all required fields.");
      return;
    }
    try {
      setSubmitting(true);
      await createBid(
        token,
        {
          request_id: requestId,
          bid_amount: bidAmount,
          delivery_time_days: deliveryDays,
          proposal: proposal.trim(),
        },
        images
      );
      handleSuccess("Your bid has been submitted successfully!");
      router.push("/buyer-requests");
    } catch (err: any) {
      handleError(err?.response?.data?.detail ?? err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBid = async () => {
    if (!myBid) return;
    if (!confirm("Withdraw your bid? This cannot be undone.")) return;
    try {
      setDeleting(true);
      await deleteBid(token, myBid.id);
      handleSuccess("Bid withdrawn.");
      setMyBid(null);
      setBidAmount("");
      setDeliveryDays("");
      setProposal("");
    } catch (err) {
      handleError(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-8 h-8 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="premium-card text-center py-20">
        <p className="text-surface-500 dark:text-surface-400">Request not found.</p>
        <Link href="/buyer-requests" className="mt-4 text-primary-500 text-sm hover:underline block">
          Back to Buyer Requests
        </Link>
      </div>
    );
  }

  const reqImages = [request.image1, request.image2, request.image3, request.image4].filter(Boolean) as string[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-3xl"
    >
      {/* Back link */}
      <Link
        href="/buyer-requests"
        className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors"
      >
        <FiArrowLeft />
        Back to Buyer Requests
      </Link>

      {/* Request details card */}
      <div className="premium-card space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {request.category_name && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 bg-primary-500/10 px-2.5 py-0.5 rounded-full mb-2">
                <FiTag className="text-[10px]" />
                {request.category_name}
              </span>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white leading-snug">
              {request.title}
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-surface-500 dark:text-surface-400 text-sm">
              <FiUser className="text-xs" />
              <span>
                {request.customer_first_name} {request.customer_last_name}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-surface-400 dark:text-surface-500">Budget</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${request.budget}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1.5">
            Description
          </p>
          <p className="text-surface-700 dark:text-surface-300 text-sm leading-relaxed whitespace-pre-wrap">
            {request.description}
          </p>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm">
          {request.deadline && (
            <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
              <FiClock className="text-primary-500" />
              <span>
                Deadline:{" "}
                {new Date(request.deadline).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
            <FaGavel className="text-primary-500 text-xs" />
            <span>{request.bids?.length ?? 0} bids submitted</span>
          </div>
        </div>

        {/* Images */}
        {reqImages.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2">
              Reference Images
            </p>
            <div className="flex flex-wrap gap-3">
              {reqImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`ref-${i}`}
                  className="w-20 h-20 rounded-xl object-cover border border-light-border dark:border-dark-border"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Existing bid status or new bid form */}
      {myBid ? (
        <div className="premium-card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 text-lg" />
              <h2 className="text-surface-900 dark:text-white font-semibold text-base">
                Your Bid
              </h2>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                BID_STATUS_STYLES[myBid.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {myBid.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-50 dark:bg-dark-hover rounded-xl p-3">
              <p className="text-xs text-surface-400 dark:text-surface-500">Bid Amount</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ${myBid.bid_amount}
              </p>
            </div>
            <div className="bg-surface-50 dark:bg-dark-hover rounded-xl p-3">
              <p className="text-xs text-surface-400 dark:text-surface-500">Delivery</p>
              <p className="text-base font-semibold text-surface-800 dark:text-white">
                {myBid.delivery_time_days} days
              </p>
            </div>
          </div>

          <div className="bg-surface-50 dark:bg-dark-hover rounded-xl p-4">
            <p className="text-xs text-surface-400 dark:text-surface-500 mb-1">Proposal</p>
            <p className="text-surface-700 dark:text-surface-300 text-sm leading-relaxed">
              {myBid.proposal}
            </p>
          </div>

          {myBid.status === "ACCEPTED" && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 text-sm font-medium">
              <FiCheckCircle className="text-lg shrink-0" />
              Congratulations! Your bid was accepted. The buyer will complete
              checkout to proceed.
            </div>
          )}

          {myBid.status === "PENDING" && (
            <button
              onClick={handleDeleteBid}
              disabled={deleting}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
            >
              <FiX />
              {deleting ? "Withdrawing…" : "Withdraw Bid"}
            </button>
          )}
        </div>
      ) : (
        <div className="premium-card space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <FaGavel className="text-primary-500 text-base" />
            <h2 className="text-surface-900 dark:text-white font-bold text-lg">
              Submit Your Bid
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bid Amount & Delivery Days */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                  Bid Amount (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                  Delivery Days <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="number"
                    min="1"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                    placeholder="e.g. 7"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Proposal */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                Your Proposal <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                placeholder="Explain how you will fulfil this request, your approach, materials, past experience, etc."
                className="w-full px-4 py-3 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all resize-none"
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                Supporting Images{" "}
                <span className="text-surface-400 font-normal">(up to 4)</span>
              </label>
              <div className="flex flex-wrap gap-3">
                <AnimatePresence>
                  {imagePreviews.map((src, i) => (
                    <motion.div
                      key={src}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-light-border dark:border-dark-border group"
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX className="text-white text-xs" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {images.length < 4 && (
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-light-border dark:border-dark-border flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-dark-hover transition-all">
                    <FiImage className="text-surface-400 text-lg" />
                    <span className="text-surface-400 text-[10px]">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageAdd}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-pink text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-glow-pink"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting Bid…
                </>
              ) : (
                <>
                  <FiSend />
                  Submit Bid
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* All bids (read-only context for the vendor) */}
      {request.bids?.length > 0 && (
        <div className="premium-card space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            All Bids on This Request ({request.bids.length})
          </p>
          {request.bids.map((bid) => (
            <div
              key={bid.id}
              className="flex items-center justify-between gap-3 p-3 bg-surface-50 dark:bg-dark-hover rounded-xl text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FaStore className="text-primary-400 shrink-0" />
                <span className="text-surface-700 dark:text-surface-300 truncate">
                  {bid.vendor_store_name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ${bid.bid_amount}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    BID_STATUS_STYLES[bid.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {bid.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
