"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlay,
  FiPause,
  FiSquare,
  FiRefreshCw,
  FiZap,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiExternalLink,
  FiUploadCloud,
  FiSettings,
} from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import { BsRobot } from "react-icons/bs";
import { toast } from "react-toastify";
import { useAIAgent } from "@/hooks/useAIAgent";
import type { AgentProduct } from "@/hooks/useAIAgent";
import { getSchemaCategories, getSchemaSubcategories, saveProducts } from "@/api/products";
import { downloadImageAsFile, markAgentProductPosted } from "@/api/aiAgent";
import { getCookie } from "@/utils/cookies";

// ─── AliExpress Categories ────────────────────────────────────────────────────

const ALI_CATEGORIES = [
  { name: "Women's Clothing", url: "https://www.aliexpress.com/category/100003109/womens-clothing.html" },
  { name: "Men's Clothing", url: "https://www.aliexpress.com/category/100003070/mens-clothing.html" },
  { name: "Phones & Telecom", url: "https://www.aliexpress.com/category/509/phones-telecommunications.html" },
  { name: "Computer & Office", url: "https://www.aliexpress.com/category/7/computer-office.html" },
  { name: "Consumer Electronics", url: "https://www.aliexpress.com/category/44/consumer-electronics.html" },
  { name: "Jewelry & Accessories", url: "https://www.aliexpress.com/category/1509/jewelry-accessories.html" },
  { name: "Home & Garden", url: "https://www.aliexpress.com/category/15/home-garden.html" },
  { name: "Luggage & Bags", url: "https://www.aliexpress.com/category/1524/luggage-bags.html" },
  { name: "Shoes", url: "https://www.aliexpress.com/category/322/shoes.html" },
  { name: "Mother & Kids", url: "https://www.aliexpress.com/category/1501/mother-kids.html" },
  { name: "Sports & Entertainment", url: "https://www.aliexpress.com/category/18/sports-entertainment.html" },
  { name: "Beauty & Health", url: "https://www.aliexpress.com/category/66/beauty-health.html" },
  { name: "Watches", url: "https://www.aliexpress.com/category/1511/watches.html" },
  { name: "Toys & Hobbies", url: "https://www.aliexpress.com/category/26/toys-hobbies.html" },
  { name: "Automobiles & Motorcycles", url: "https://www.aliexpress.com/category/34/automobiles-motorcycles.html" },
  { name: "Home Improvement", url: "https://www.aliexpress.com/category/13/home-improvement.html" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeStr(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// ─── Post-to-Store Modal ──────────────────────────────────────────────────────

interface PostModalProps {
  product: AgentProduct;
  onClose: () => void;
  onSuccess: (productId: string) => void;
}

function PostToStoreModal({ product, onClose, onSuccess }: PostModalProps) {
  const [psCategories, setPsCategories] = useState<any[]>([]);
  const [psSubcategories, setPsSubcategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [posting, setPosting] = useState(false);
  const [imgStatus, setImgStatus] = useState<"idle" | "downloading" | "done">("idle");

  useEffect(() => {
    getSchemaCategories().then((r) => {
      if (!r.error && r.data) setPsCategories(r.data);
    });
  }, []);

  useEffect(() => {
    if (!selectedCat) { setPsSubcategories([]); setSelectedSub(""); return; }
    getSchemaSubcategories(selectedCat).then((r) => {
      if (!r.error && r.data) setPsSubcategories(r.data);
    });
  }, [selectedCat]);

  const handlePost = async () => {
    if (!selectedCat || !selectedSub) {
      toast.warning("Please select a category and subcategory.");
      return;
    }
    const token = getCookie("access_token");
    const vendorId = typeof window !== "undefined" ? localStorage.getItem("vendor_id") : null;
    if (!token || !vendorId) {
      toast.error("Authentication error. Please refresh and try again.");
      return;
    }

    setPosting(true);
    setImgStatus("downloading");

    // Download images through the agent proxy
    const imageFiles: File[] = [];
    for (let i = 0; i < Math.min(product.images.length, 5); i++) {
      const file = await downloadImageAsFile(
        product.images[i],
        `product-img-${i + 1}.jpg`
      );
      if (file) imageFiles.push(file);
    }
    setImgStatus("done");

    const payload = {
      name: product.name,
      unit_price: String(product.price),
      mrp: String(product.compareAtPrice || product.price),
      category: selectedCat,
      subcategory: selectedSub,
      brand_name: product.brand || "AliExpress",
      tags: product.category || "",
      meta_title: product.name.substring(0, 60),
      length: "",
      width: "",
      height: "",
      weight: "",
      quantity: "10",
      short_description: product.shortDescription || product.name,
      description: product.description || product.name,
      image: "",
      id: "",
    };

    const res = await saveProducts(token, vendorId, payload as any, [], imageFiles);

    if (!res || (res as any).error) {
      toast.error("Failed to post product to store. Please try again.");
      setPosting(false);
      return;
    }

    // Mark as posted in the agent's database
    await markAgentProductPosted(product._id);

    toast.success(`"${product.name}" posted to your store!`);
    onSuccess(product._id);
    setPosting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="premium-card w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-pink flex items-center justify-center shadow-glow-pink">
              <FiUploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white">Post to Your Store</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">Select a category to publish this product</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-hover transition-colors"
          >
            <FiX className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        {/* Product Preview */}
        <div className="p-6 border-b border-light-border dark:border-dark-border">
          <div className="flex items-start gap-4">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-surface-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-surface-100 dark:bg-dark-surface flex items-center justify-center flex-shrink-0">
                <FiPackage className="w-7 h-7 text-surface-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-surface-900 dark:text-white line-clamp-2 text-sm">{product.name}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{product.brand} · {product.category}</p>
              <p className="text-sm font-bold text-primary-500 mt-1">${product.price.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Pinksurfing Category <span className="text-primary-500">*</span>
            </label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="input-premium"
              disabled={posting}
            >
              <option value="">Select a category…</option>
              {psCategories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Subcategory <span className="text-primary-500">*</span>
            </label>
            <select
              value={selectedSub}
              onChange={(e) => setSelectedSub(e.target.value)}
              className="input-premium"
              disabled={posting || !selectedCat}
            >
              <option value="">Select a subcategory…</option>
              {psSubcategories.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {imgStatus === "downloading" && (
            <p className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-2">
              <svg className="w-3 h-3 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
              </svg>
              Downloading product images…
            </p>
          )}
          {imgStatus === "done" && (
            <p className="text-xs text-success flex items-center gap-1">
              <FiCheckCircle className="w-3 h-3" /> Images ready
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-50 dark:bg-dark-surface border-t border-light-border dark:border-dark-border">
          <button onClick={onClose} className="btn-ghost" disabled={posting}>
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={posting || !selectedCat || !selectedSub}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {posting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                </svg>
                Posting…
              </>
            ) : (
              <>
                <FiUploadCloud className="w-4 h-4" />
                Post to Store
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "posted", label: "Posted" },
  { key: "failed", label: "Failed" },
];

const stateColor: Record<string, string> = {
  idle: "text-surface-500",
  running: "text-accent-emerald",
  paused: "text-accent-amber",
  error: "text-danger",
};

const stateDot: Record<string, string> = {
  idle: "bg-surface-400",
  running: "bg-accent-emerald",
  paused: "bg-accent-amber",
  error: "bg-danger",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function AIAgentPage() {
  const {
    status,
    products,
    logs,
    categories,
    connected,
    wsConnected,
    loadProducts,
    startAgent,
    pauseAgent,
    resumeAgent,
    stopAgent,
    resetAgent,
    triggerFetch,
    saveConfig,
  } = useAIAgent();

  // Scrape controls
  const [scrapeQuery, setScrapeQuery] = useState("");
  const [scrapeMax, setScrapeMax] = useState(20);
  const [isScraping, setIsScraping] = useState(false);

  // Product queue filters
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  // Config editing
  const [configOpen, setConfigOpen] = useState(false);
  const [batchSize, setBatchSize] = useState(5);
  const [interval, setIntervalVal] = useState(30);

  // Post modal
  const [postTarget, setPostTarget] = useState<AgentProduct | null>(null);

  const state = status?.state || "idle";
  const stats = status?.stats;

  // Sync config values when status loads
  useEffect(() => {
    if (status?.config) {
      setBatchSize(status.config.batchSize ?? 5);
      setIntervalVal(status.config.postIntervalSeconds ?? 30);
    }
  }, [status?.config]);

  // Reload products when filters change
  useEffect(() => {
    loadProducts({
      status: activeTab === "all" ? undefined : activeTab,
      search: search || undefined,
      category: categoryFilter || undefined,
      page,
      limit: 15,
    });
  }, [activeTab, search, categoryFilter, page, loadProducts]);

  const handleScrape = async () => {
    const trimmed = scrapeQuery.trim();
    if (!trimmed) return;
    setIsScraping(true);
    const queries = trimmed.split(",").map((q) => q.trim()).filter(Boolean);

    // The fetch endpoint is long-running (browser may take minutes to respond).
    // Fire it and poll the product list every 5s so the user sees results arrive
    // in real time regardless of WebSocket state.
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    pollTimer = setInterval(() => {
      loadProducts({ page: 1, limit: 15 });
    }, 5000);

    try {
      await triggerFetch(queries, scrapeMax);
    } finally {
      if (pollTimer) clearInterval(pollTimer);
      setIsScraping(false);
      setScrapeQuery("");
      loadProducts({ page: 1, limit: 15 });
    }
  };

  const handleSaveConfig = async () => {
    await saveConfig({ batchSize, postIntervalSeconds: interval });
    setConfigOpen(false);
    toast.success("Agent configuration updated.");
  };

  const handlePostSuccess = (productId: string) => {
    // Refresh product list to reflect the new status
    loadProducts({
      status: activeTab === "all" ? undefined : activeTab,
      page,
      limit: 15,
    });
  };

  const statCards = [
    {
      label: "Total Products",
      value: stats?.totalProducts ?? 0,
      sub: `${stats?.pending ?? 0} in queue`,
      icon: FiPackage,
      gradient: "bg-gradient-pink",
    },
    {
      label: "Posted",
      value: stats?.posted ?? 0,
      sub: `${stats?.successRate ?? 0}% success rate`,
      icon: FiCheckCircle,
      gradient: "bg-gradient-to-br from-accent-emerald to-accent-teal",
    },
    {
      label: "Failed",
      value: stats?.failed ?? 0,
      sub: `${stats?.totalBatches ?? 0} batches processed`,
      icon: FiXCircle,
      gradient: "bg-gradient-to-br from-danger to-accent-amber",
    },
    {
      label: "Avg Speed",
      value: `${stats?.avgPostTime ?? 0}ms`,
      sub: stats?.lastPostAt
        ? `Last: ${timeStr(stats.lastPostAt)}`
        : "No posts yet",
      icon: FiZap,
      gradient: "bg-gradient-purple",
    },
  ];

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* ── Page Header ── */}
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-pink flex items-center justify-center shadow-glow-pink">
              <BsRobot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                AI Product Agent
                <HiOutlineSparkles className="w-5 h-5 text-primary-500" />
              </h1>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Scrape AliExpress products and post them to your store automatically
              </p>
            </div>
          </div>

          {/* Connection badges */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                connected
                  ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30"
                  : "bg-danger/10 text-danger border-danger/30"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-accent-emerald animate-pulse" : "bg-danger"}`} />
              {connected ? "Agent Online" : "Agent Offline"}
            </span>
            <span
              title={wsConnected ? "Real-time updates active" : "Live updates unavailable — polling every 4s instead"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                wsConnected
                  ? "bg-accent-blue/10 text-accent-blue border-accent-blue/30"
                  : "bg-accent-amber/10 text-accent-amber border-accent-amber/30"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-accent-blue animate-pulse" : "bg-accent-amber"}`} />
              {wsConnected ? "Live" : "Polling"}
            </span>
          </div>
        </motion.div>

        {/* ── Offline Banner ── */}
        {/* {!connected && (
          <motion.div variants={itemVariants}>
            <div className="premium-card p-5 border-l-4 border-danger flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                <FiXCircle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <p className="font-semibold text-surface-900 dark:text-white">Agent Server Offline</p>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                  Make sure the AI agent server is running:{" "}
                  <code className="px-1.5 py-0.5 bg-surface-100 dark:bg-dark-surface rounded text-xs">
                    npm run dev
                  </code>{" "}
                  inside <code className="px-1.5 py-0.5 bg-surface-100 dark:bg-dark-surface rounded text-xs">Ecom-AI-Agent-PS/agent/</code>
                </p>
              </div>
            </div>
          </motion.div>
        )} */}

        {/* ── Stats Cards ── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div key={card.label} className="premium-card p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${card.gradient} flex items-center justify-center flex-shrink-0`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{card.value}</p>
                <p className="text-xs text-surface-500 dark:text-surface-400">{card.label}</p>
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{card.sub}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Control + Activity Row ── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Agent Control Panel */}
          <div className="premium-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-light-border dark:border-dark-border">
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-2 font-semibold text-sm ${stateColor[state]}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${stateDot[state]} ${state === "running" ? "animate-pulse" : ""}`} />
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                </span>
              </div>
              <button
                onClick={() => setConfigOpen(!configOpen)}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-hover transition-colors"
                title="Configuration"
              >
                <FiSettings className={`w-4 h-4 ${configOpen ? "text-primary-500" : "text-surface-500"}`} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {state === "idle" && (
                  <button onClick={startAgent} className="btn-gradient flex items-center gap-2 px-4 py-2 text-sm">
                    <FiPlay className="w-4 h-4" /> Start Agent
                  </button>
                )}
                {state === "running" && (
                  <>
                    <button onClick={pauseAgent} className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-semibold bg-accent-amber/10 text-accent-amber border border-accent-amber/30 hover:bg-accent-amber/20 transition-colors">
                      <FiPause className="w-4 h-4" /> Pause
                    </button>
                    <button onClick={stopAgent} className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-semibold bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors">
                      <FiSquare className="w-4 h-4" /> Stop
                    </button>
                  </>
                )}
                {state === "paused" && (
                  <>
                    <button onClick={resumeAgent} className="btn-gradient flex items-center gap-2 px-4 py-2 text-sm">
                      <FiPlay className="w-4 h-4" /> Resume
                    </button>
                    <button onClick={stopAgent} className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-semibold bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors">
                      <FiSquare className="w-4 h-4" /> Stop
                    </button>
                  </>
                )}
                <button
                  onClick={resetAgent}
                  disabled={state === "running"}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-semibold bg-surface-100 text-surface-600 dark:bg-dark-surface dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FiRefreshCw className="w-4 h-4" /> Reset
                </button>
              </div>

              {/* Config Panel */}
              <AnimatePresence>
                {configOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 pb-1 space-y-3 border-t border-light-border dark:border-dark-border">
                      <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                        Configuration
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                            Batch Size
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={batchSize}
                            onChange={(e) => setBatchSize(Number(e.target.value))}
                            className="input-premium text-sm py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                            Interval (sec)
                          </label>
                          <input
                            type="number"
                            min={5}
                            max={300}
                            value={interval}
                            onChange={(e) => setIntervalVal(Number(e.target.value))}
                            className="input-premium text-sm py-2"
                          />
                        </div>
                      </div>
                      <button onClick={handleSaveConfig} className="btn-gradient w-full py-2 text-sm">
                        Save Configuration
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="premium-card overflow-hidden flex flex-col" style={{ maxHeight: 320 }}>
            <div className="flex items-center justify-between p-5 border-b border-light-border dark:border-dark-border flex-shrink-0">
              <h2 className="font-bold text-surface-900 dark:text-white flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-accent-emerald animate-pulse" : "bg-surface-400"}`} />
                Activity Feed
              </h2>
              <span className="badge badge-primary">{logs.length} entries</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-sm text-surface-400">No activity yet.</p>
                  <p className="text-xs text-surface-400 mt-1">Start the agent to see logs.</p>
                </div>
              ) : (
                logs.map((log, i) => {
                  const colMap: Record<string, string> = {
                    info: "bg-accent-blue",
                    success: "bg-accent-emerald",
                    warn: "bg-accent-amber",
                    error: "bg-danger",
                  };
                  const iconMap: Record<string, string> = {
                    info: "ℹ️",
                    success: "✅",
                    warn: "⚠️",
                    error: "❌",
                  };
                  return (
                    <div key={log.id || i} className="flex items-start gap-2 py-1.5 border-b border-light-border/50 dark:border-dark-border/50 last:border-0">
                      <span className="text-xs text-surface-400 w-16 flex-shrink-0 pt-0.5">{timeStr(log.timestamp)}</span>
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${colMap[log.level] || "bg-surface-400"}`} />
                      <span className="text-xs text-surface-700 dark:text-surface-300 leading-relaxed">
                        {iconMap[log.level] || ""} {log.message}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Product Queue ── */}
        <motion.div variants={itemVariants} className="premium-card overflow-hidden">
          <div className="p-5 border-b border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-surface-900 dark:text-white">Product Queue</h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">{products.total} products scraped</p>
              </div>
            </div>

            {/* Scrape controls */}
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value=""
                onChange={(e) => { if (e.target.value) setScrapeQuery(e.target.value); }}
                disabled={isScraping}
                className="input-premium text-sm py-2 flex-1 min-w-[180px] max-w-xs"
              >
                <option value="">Choose AliExpress category…</option>
                {ALI_CATEGORIES.map((c) => (
                  <option key={c.name} value={c.url}>{c.name}</option>
                ))}
              </select>

              <span className="text-xs text-surface-400 font-medium">OR</span>

              <input
                type="text"
                placeholder="Search keyword, e.g. laptop"
                value={scrapeQuery}
                onChange={(e) => setScrapeQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                disabled={isScraping}
                className="input-premium text-sm py-2 flex-1 min-w-[200px]"
              />

              <input
                type="number"
                min={1}
                max={100}
                value={scrapeMax}
                onChange={(e) => setScrapeMax(Number(e.target.value))}
                disabled={isScraping}
                title="Max items"
                className="input-premium text-sm py-2 w-20"
              />

              <button
                onClick={handleScrape}
                disabled={isScraping || !scrapeQuery.trim()}
                className="btn-gradient flex items-center gap-2 py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScraping ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                    </svg>
                    Scraping…
                  </>
                ) : (
                  <>
                    <FiSearch className="w-4 h-4" />
                    Fetch
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs + filters */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-light-border dark:border-dark-border flex-wrap gap-3">
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setActiveTab(t.key); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === t.key
                      ? "bg-gradient-pink text-white shadow-glow-pink"
                      : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-dark-hover"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="input-premium pl-8 text-xs py-2 w-44"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="input-premium text-xs py-2 w-40"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border">
                  {["Product", "SKU", "Category", "Price", "Status", "Action"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-surface-400 dark:text-surface-500">
                      <div className="flex flex-col items-center gap-2">
                        <FiPackage className="w-10 h-10 opacity-30" />
                        <p>No products found. Use the scraper above to fetch products from AliExpress.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.products.map((p, i) => (
                    <motion.tr
                      key={p._id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-light-border/50 dark:border-dark-border/50 last:border-0 hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors"
                    >
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover bg-surface-100 flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-surface-100 dark:bg-dark-surface flex items-center justify-center flex-shrink-0">
                              <FiPackage className="w-4 h-4 text-surface-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-surface-900 dark:text-white line-clamp-1 text-xs">{p.name}</p>
                            <p className="text-xs text-surface-500 dark:text-surface-400">{p.brand}</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3">
                        <code className="text-xs bg-surface-100 dark:bg-dark-surface px-2 py-0.5 rounded text-surface-600 dark:text-surface-400">
                          {p.sku}
                        </code>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="badge badge-primary text-xs">{p.category}</span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-semibold text-surface-900 dark:text-white">${p.price.toFixed(2)}</span>
                          {p.compareAtPrice > p.price && (
                            <span className="text-xs text-surface-400 line-through ml-1">${p.compareAtPrice.toFixed(2)}</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {p.status === "posted" ? (
                          <span className="badge badge-success">Posted</span>
                        ) : p.status === "failed" ? (
                          <span className="badge badge-danger">Failed</span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        {p.status !== "posted" ? (
                          <button
                            onClick={() => setPostTarget(p)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-pink text-white hover:opacity-90 transition-opacity shadow-glow-pink"
                          >
                            <FiUploadCloud className="w-3 h-3" />
                            Post
                          </button>
                        ) : (
                          p.sourceUrl && (
                            <a
                              href={p.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs text-accent-blue hover:underline"
                            >
                              <FiExternalLink className="w-3 h-3" />
                              Source
                            </a>
                          )
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {products.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-light-border dark:border-dark-border">
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Page {page} of {products.totalPages} · {products.total} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4 text-surface-600 dark:text-surface-400" />
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= products.totalPages}
                  className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight className="w-4 h-4 text-surface-600 dark:text-surface-400" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Post-to-Store Modal */}
      <AnimatePresence>
        {postTarget && (
          <PostToStoreModal
            product={postTarget}
            onClose={() => setPostTarget(null)}
            onSuccess={handlePostSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
}
