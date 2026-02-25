"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaGavel } from "react-icons/fa";
import {
  FiClock,
  FiDollarSign,
  FiTag,
  FiMessageSquare,
  FiChevronRight,
  FiRefreshCw,
} from "react-icons/fi";
import { getOpenRequests } from "@/api/buyerRequests";
import { handleError } from "@/utils/toast";

interface BuyerRequest {
  id: string;
  title: string;
  description: string;
  budget: string;
  deadline: string | null;
  category_name: string | null;
  customer_first_name: string;
  customer_last_name: string;
  bids: any[];
  image1: string | null;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  created_at: string;
  status: string;
}

export default function BuyerRequestsPage() {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;
    try {
      setLoading(true);
      const res = await getOpenRequests(token);
      setRequests(res.data.results);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FaGavel className="text-primary-500 text-xl" />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
              Buyer Requests
            </h1>
          </div>
          <p className="text-surface-500 dark:text-surface-400 text-sm">
            Browse open requests from buyers and submit your best bid.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-light-border dark:border-dark-border text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-dark-hover text-sm transition-colors"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="premium-card text-center py-20">
          <FaGavel className="text-5xl text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <p className="text-surface-500 dark:text-surface-400 text-base font-medium">
            No open buyer requests right now.
          </p>
          <p className="text-surface-400 dark:text-surface-500 text-sm mt-1">
            Check back soon — new requests from buyers appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {requests.map((req, i) => (
            <RequestCard key={req.id} req={req} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function RequestCard({ req, index }: { req: BuyerRequest; index: number }) {
  const coverImage = req.image1 || req.image2 || req.image3 || req.image4;
  const bidCount = req.bids?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="premium-card flex flex-col gap-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
    >
      {/* Cover image */}
      {coverImage ? (
        <div className="w-full h-36 rounded-xl overflow-hidden bg-surface-100 dark:bg-dark-hover">
          <img
            src={coverImage}
            alt={req.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-36 rounded-xl bg-gradient-pink opacity-10 flex items-center justify-center">
          <FaGavel className="text-4xl text-primary-500 opacity-60" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 space-y-2">
        <h3 className="text-surface-900 dark:text-white font-semibold text-base leading-snug">
          {req.title}
        </h3>
        <p className="text-surface-500 dark:text-surface-400 text-sm line-clamp-2">
          {req.description}
        </p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
          <FiDollarSign className="text-emerald-500 shrink-0" />
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            ${req.budget}
          </span>
        </div>
        {req.deadline && (
          <div className="flex items-center gap-1.5 text-surface-500 dark:text-surface-400">
            <FiClock className="shrink-0 text-xs" />
            <span className="text-xs">
              {new Date(req.deadline).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-surface-500 dark:text-surface-400 col-span-2">
          <FiMessageSquare className="text-xs shrink-0" />
          <span className="text-xs">
            {bidCount} {bidCount === 1 ? "bid" : "bids"} so far
          </span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/buyer-requests/${req.id}`}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-pink text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow-pink"
      >
        View & Bid
        <FiChevronRight />
      </Link>
    </motion.div>
  );
}
