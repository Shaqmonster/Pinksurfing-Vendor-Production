"use client";
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiExternalLink,
  FiUploadCloud,
  FiDollarSign,
} from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import { BsRobot } from "react-icons/bs";
import { toast } from "react-toastify";
import { useAIAgent } from "@/hooks/useAIAgent";
import type { AgentProduct } from "@/hooks/useAIAgent";
import { getSchemaCategories, getSchemaSubcategories, saveProducts } from "@/api/products";
import { downloadImageAsFile, markAgentProductPosted } from "@/api/aiAgent";
import { getCookie } from "@/utils/cookies";

// ─── Pinksurfing-mapped AliExpress categories ─────────────────────────────────
// Only show categories that exist on both platforms. Real-estate / business-for-sale
// and "Stay With Us" have no AliExpress equivalent and are omitted.
const PS_CATEGORIES = [
  { name: "Women's Clothing",   url: "https://www.aliexpress.com/category/100003109/womens-clothing.html" },
  { name: "Men's Clothing",     url: "https://www.aliexpress.com/category/100003070/mens-clothing.html" },
  { name: "Perfumes",           url: "https://www.aliexpress.com/wholesale?SearchText=perfume" },
  { name: "Electronics",        url: "https://www.aliexpress.com/category/44/consumer-electronics.html" },
  { name: "Cars & Trucks",      url: "https://www.aliexpress.com/category/34/automobiles-motorcycles.html" },
  { name: "Video Games",        url: "https://www.aliexpress.com/wholesale?SearchText=video+games+console" },
  { name: "Building Materials", url: "https://www.aliexpress.com/category/13/home-improvement.html" },
];

// ─── Post-to-Store Modal (portal-rendered so it's always centred on viewport) ─

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
  // Vendor can customise price; original AliExpress price shown as reference
  const [vendorPrice, setVendorPrice] = useState(String(product.price.toFixed(2)));
  const [posting, setPosting] = useState(false);
  const [imgStatus, setImgStatus] = useState<"idle" | "downloading" | "done">("idle");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
    const priceNum = parseFloat(vendorPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.warning("Please enter a valid price.");
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

    const imageFiles: File[] = [];
    for (let i = 0; i < Math.min(product.images.length, 5); i++) {
      const file = await downloadImageAsFile(product.images[i], `product-img-${i + 1}.jpg`);
      if (file) imageFiles.push(file);
    }
    setImgStatus("done");

    const payload = {
      name: product.name,
      unit_price: String(priceNum),
      mrp: String(product.compareAtPrice > product.price ? product.compareAtPrice.toFixed(2) : (priceNum * 1.3).toFixed(2)),
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

    await markAgentProductPosted(product._id);
    toast.success(`"${product.name}" posted to your store!`);
    onSuccess(product._id);
    setPosting(false);
    onClose();
  };

  if (!mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
              <p className="text-xs text-surface-500 dark:text-surface-400">Set your price and pick a category</p>
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
        <div className="p-5 border-b border-light-border dark:border-dark-border">
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
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-surface-900 dark:text-white line-clamp-2 text-sm">{product.name}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{product.brand} · {product.category}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-surface-400 dark:text-surface-500">AliExpress price:</span>
                <span className="text-sm font-bold text-accent-emerald">${product.price.toFixed(2)}</span>
                {product.compareAtPrice > product.price && (
                  <span className="text-xs text-surface-400 line-through">${product.compareAtPrice.toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Price + Category */}
        <div className="p-5 space-y-4">
          {/* Your listing price */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Your Listing Price <span className="text-primary-500">*</span>
              <span className="ml-2 text-xs text-surface-400 font-normal">
                (AliExpress: <strong className="text-accent-emerald">${product.price.toFixed(2)}</strong>)
              </span>
            </label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={vendorPrice}
                onChange={(e) => setVendorPrice(e.target.value)}
                disabled={posting}
                className="input-premium pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
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
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
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
            <p className="text-xs text-accent-emerald flex items-center gap-1">
              <FiCheckCircle className="w-3 h-3" /> Images ready
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 bg-surface-50 dark:bg-dark-surface border-t border-light-border dark:border-dark-border">
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

  return createPortal(modal, document.body);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "all",     label: "All" },
  { key: "pending", label: "Pending" },
  { key: "posted",  label: "Posted" },
  { key: "failed",  label: "Failed" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0 },
};

export default function AIAgentPage() {
  const {
    status,
    products,
    categories,
    connected,
    wsConnected,
    loadProducts,
    triggerFetch,
  } = useAIAgent();

  const [scrapeQuery, setScrapeQuery] = useState("");
  const [scrapeMax, setScrapeMax]     = useState(20);
  const [isScraping, setIsScraping]   = useState(false);

  const [activeTab, setActiveTab]         = useState("all");
  const [search, setSearch]               = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage]                   = useState(1);

  const [postTarget, setPostTarget] = useState<AgentProduct | null>(null);

  const stats = status?.stats;

  useEffect(() => {
    loadProducts({
      status:   activeTab === "all" ? undefined : activeTab,
      search:   search || undefined,
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

    let pollTimer: ReturnType<typeof setInterval> | null = null;
    pollTimer = setInterval(() => loadProducts({ page: 1, limit: 15 }), 5000);

    try {
      await triggerFetch(queries, scrapeMax);
    } finally {
      if (pollTimer) clearInterval(pollTimer);
      setIsScraping(false);
      setScrapeQuery("");
      loadProducts({ page: 1, limit: 15 });
    }
  };

  const handlePostSuccess = (productId: string) => {
    loadProducts({
      status:   activeTab === "all" ? undefined : activeTab,
      page,
      limit: 15,
    });
  };

  const statCards = [
    {
      label: "Total Products",
      value: stats?.totalProducts ?? 0,
      sub:   `${stats?.pending ?? 0} pending`,
      icon:  FiPackage,
      gradient: "bg-gradient-pink",
    },
    {
      label: "Posted",
      value: stats?.posted ?? 0,
      sub:   `${stats?.successRate ?? 0}% success rate`,
      icon:  FiCheckCircle,
      gradient: "bg-gradient-to-br from-accent-emerald to-accent-teal",
    },
    {
      label: "Failed",
      value: stats?.failed ?? 0,
      sub:   `${stats?.totalBatches ?? 0} batches run`,
      icon:  FiXCircle,
      gradient: "bg-gradient-to-br from-danger to-accent-amber",
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
                Scrape AliExpress products and post them to your Pinksurfing store
              </p>
            </div>
          </div>

          {/* Connection badges */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              connected
                ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30"
                : "bg-danger/10 text-danger border-danger/30"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-accent-emerald animate-pulse" : "bg-danger"}`} />
              {connected ? "Agent Online" : "Agent Offline"}
            </span>
            <span
              title={wsConnected ? "Real-time updates active" : "Polling every 4s"}
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

        {/* ── Stats ── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((card) => (
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

        {/* ── Product Queue ── */}
        <motion.div variants={itemVariants} className="premium-card overflow-hidden">
          {/* Scrape controls */}
          <div className="p-5 border-b border-light-border dark:border-dark-border space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-bold text-surface-900 dark:text-white">Product Queue</h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">{products.total} products scraped</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Pinksurfing-mapped category selector */}
              <select
                value=""
                onChange={(e) => { if (e.target.value) setScrapeQuery(e.target.value); }}
                disabled={isScraping}
                className="input-premium text-sm py-2 flex-1 min-w-[200px] max-w-xs"
              >
                <option value="">Select Pinksurfing category…</option>
                {PS_CATEGORIES.map((c) => (
                  <option key={c.name} value={c.url}>{c.name}</option>
                ))}
              </select>

              <span className="text-xs text-surface-400 font-medium">OR</span>

              <input
                type="text"
                placeholder="Custom keyword, e.g. wireless earbuds"
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
                title="Max items to fetch"
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

          {/* Tabs + search filters */}
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

          {/* Table — Status column removed; product row opens source URL */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border">
                  {["Product", "SKU", "Category", "Price", "Action"].map((h) => (
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
                    <td colSpan={5} className="px-4 py-12 text-center text-surface-400 dark:text-surface-500">
                      <div className="flex flex-col items-center gap-2">
                        <FiPackage className="w-10 h-10 opacity-30" />
                        <p>No products found. Use the scraper above to fetch products.</p>
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
                      {/* Product — clickable → opens source URL */}
                      <td className="px-4 py-3">
                        <a
                          href={p.sourceUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 group"
                          title={p.sourceUrl ? "Open on AliExpress" : "No source URL"}
                        >
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover bg-surface-100 flex-shrink-0 group-hover:ring-2 group-hover:ring-primary-400 transition-all"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-surface-100 dark:bg-dark-surface flex items-center justify-center flex-shrink-0">
                              <FiPackage className="w-4 h-4 text-surface-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-surface-900 dark:text-white line-clamp-1 text-xs group-hover:text-primary-500 transition-colors">
                              {p.name}
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs text-surface-400 group-hover:text-primary-400 transition-colors">
                              <FiExternalLink className="w-3 h-3" /> {p.brand}
                            </span>
                          </div>
                        </a>
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

                      {/* Price — AliExpress scraped price */}
                      <td className="px-4 py-3">
                        <div className="flex items-baseline gap-1">
                          <span className="font-semibold text-surface-900 dark:text-white">${p.price.toFixed(2)}</span>
                          {p.compareAtPrice > p.price && (
                            <span className="text-xs text-surface-400 line-through">${p.compareAtPrice.toFixed(2)}</span>
                          )}
                        </div>
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
                          <span className="badge badge-success text-xs">Posted</span>
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

      {/* Post-to-Store Modal — rendered via createPortal to document.body
          so it's always centred on the viewport regardless of scroll position */}
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
