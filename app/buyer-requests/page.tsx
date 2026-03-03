"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Tag,
  DollarSign,
  Calendar,
  Camera,
  BadgeCheck,
  Clock,
  Search,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  SlidersHorizontal,
  Filter,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} min${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function BuyerRequestsPage() {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchRequests = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;
    try {
      setLoading(true);
      const res = await getOpenRequests(token);
      setRequests(res.data.results ?? res.data ?? []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Derive unique categories from requests
  const categories = useMemo(() => {
    const names = requests.map((r) => r.category_name).filter(Boolean) as string[];
    return Array.from(new Set(names));
  }, [requests]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = requests.filter((r) => {
      if (categoryFilter !== "all" && r.category_name !== categoryFilter) return false;
      if (
        searchQuery &&
        !r.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });

    switch (sortBy) {
      case "budget-high":
        list = [...list].sort((a, b) => parseFloat(b.budget) - parseFloat(a.budget));
        break;
      case "budget-low":
        list = [...list].sort((a, b) => parseFloat(a.budget) - parseFloat(b.budget));
        break;
      case "fewest-bids":
        list = [...list].sort((a, b) => (a.bids?.length ?? 0) - (b.bids?.length ?? 0));
        break;
      case "newest":
      default:
        list = [...list].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return list;
  }, [requests, searchQuery, categoryFilter, sortBy]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Job <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">
            Browse open requests and send your offer
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-light-border dark:border-dark-border text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-dark-hover text-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all placeholder-surface-400"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-8 pr-8 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-700 dark:text-surface-300 text-sm outline-none focus:border-primary-400 transition-all appearance-none w-full sm:w-[160px]"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pl-8 pr-8 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-700 dark:text-surface-300 text-sm outline-none focus:border-primary-400 transition-all appearance-none w-full sm:w-[160px]"
          >
            <option value="newest">Newest First</option>
            <option value="budget-high">Highest Budget</option>
            <option value="budget-low">Lowest Budget</option>
            <option value="fewest-bids">Fewest Bids</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400 pointer-events-none" />
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {filtered.length} open request{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="premium-card text-center py-20">
          <Camera className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <p className="text-surface-500 dark:text-surface-400 text-base font-medium">
            {searchQuery || categoryFilter !== "all"
              ? "No requests match your filters."
              : "No open buyer requests right now."}
          </p>
          <p className="text-surface-400 dark:text-surface-500 text-sm mt-1">
            {searchQuery || categoryFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Check back soon \u2014 new requests from buyers appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((request, i) => (
            <RequestCard key={request.id} request={request} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function RequestCard({ request, index }: { request: BuyerRequest; index: number }) {
  const coverImage =
    request.image1 || request.image2 || request.image3 || request.image4;
  const photoCount = [request.image1, request.image2, request.image3, request.image4].filter(
    Boolean
  ).length;
  const bidCount = request.bids?.length ?? 0;
  const isVerifiedBuyer = !!(request.customer_first_name && request.customer_last_name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="premium-card hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 group"
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Photo thumbnail */}
        <div className="flex md:flex-col gap-2 flex-shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-surface-100 dark:bg-dark-hover border border-light-border dark:border-dark-border flex-shrink-0">
            {coverImage ? (
              <img
                src={coverImage}
                alt={request.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-surface-400" />
              </div>
            )}
          </div>
          {photoCount > 1 && (
            <span className="text-[10px] text-surface-400 font-mono self-end md:self-start">
              +{photoCount - 1} more
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-semibold text-surface-900 dark:text-white group-hover:text-primary-500 transition-colors leading-snug">
                {request.title}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {request.category_name && (
                  <span className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                    <Tag className="w-3 h-3 text-primary-500" />
                    {request.category_name}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                  <Clock className="w-3 h-3" />
                  {timeAgo(request.created_at)}
                </span>
                {request.deadline && (
                  <span className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                    <Calendar className="w-3 h-3" />
                    Due{" "}
                    {new Date(request.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description snippet */}
          <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2">
            {request.description}
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm font-semibold text-surface-900 dark:text-white">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">${request.budget}</span>
              </span>
              {isVerifiedBuyer && (
                <span className="flex items-center gap-1 text-xs text-primary-500">
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {bidCount} bid{bidCount !== 1 ? "s" : ""}
              </span>
              <Link
                href={`/buyer-requests/${request.id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-pink text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow-pink"
              >
                Send Offer
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
