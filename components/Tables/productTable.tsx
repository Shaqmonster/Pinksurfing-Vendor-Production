"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCategories,
  getProducts,
  getSubcategories,
  getVendorProfile,
} from "@/api/products";
import { Product } from "@/types/product";
import { deleteProduct } from "@/api/products";
import React from "react";
import Loader from "../common/Loader";
import Link from "next/link";
import { 
  FiEdit2, 
  FiTrash2, 
  FiPackage, 
  FiPlus, 
  FiSearch,
  FiCopy,
  FiExternalLink
} from "react-icons/fi";
import ConfirmationModal from "../Modals/ConfirmDelete";
import { toast } from "react-toastify";
import { getAccessToken } from "@/utils/cookies";
import { resolveVendorApiToken } from "@/utils/vendorAuth";
import {
  PendingListing,
  getPendingListings,
  removePendingListing,
  updatePendingListingState,
  isListingFeePayDisabled,
  listingFeePayButtonLabel,
} from "@/utils/pendingListings";
import { prepareListingFeePayment } from "@/utils/listingPayment";

const ProductsTable = (props: { Products?: Product[] }) => {
  const rowRef = useRef<any>(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [updateProductData, setUpdateProductData] = useState({});
  const [products, setProducts] = useState<any[]>(props.Products || []);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [payingListingId, setPayingListingId] = useState("");

  const loadPendingListings = useCallback(() => {
    setPendingListings(getPendingListings());
  }, []);

  const handleDelete = async (productId: string) => {
    if (typeof window !== "undefined") {
      const token = getAccessToken();
      const vendor_id: string | null = localStorage.getItem("vendor_id");

      if (!token || !vendor_id) {
        toast.error("Session expired. Please sign in again.");
        return;
      }

      try {
        const result = await deleteProduct(token, vendor_id, productId);

        if (result && typeof result === "object") {
          if (result.error) {
            toast.error(
              result.message ||
                result.data?.Status ||
                result.data?.detail ||
                "Failed to delete product"
            );
          } else {
            const updatedProducts = products.filter(
              (product) => product.id !== productId
            );
            setProducts(updatedProducts);
            toast.success("Product deleted successfully!");
            closeDeleteModal();
          }
        } else {
          console.error("Unexpected result format:", result);
        }
      } catch (error) {
        console.error("Error during product deletion:", error);
        toast.error("Failed to delete product");
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      getCategories().then((data) => {
        setCategories(data);
      });
      loadPendingListings();
    }
  }, [loadPendingListings]);

  useEffect(() => {
    if (!products || products.length === 0) return;

    let changed = false;
    const activeProductIds = new Set(
      products.filter((item: any) => item.is_active).map((item: any) => item.id)
    );
    pendingListings.forEach((pending) => {
      if (activeProductIds.has(pending.productId)) {
        removePendingListing(pending.productId);
        changed = true;
      }
    });

    if (changed) {
      loadPendingListings();
    }
  }, [products, pendingListings, loadPendingListings]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadInventory = async () => {
      setLoading(true);
      try {
        let token = await resolveVendorApiToken();

        if (!token) {
          toast.error("Session expired. Please sign in again.");
          setProducts([]);
          return;
        }

        let store_slug: string | null = null;
        const storeRaw = localStorage.getItem("store");
        if (storeRaw) {
          try {
            store_slug = JSON.parse(storeRaw)?.slug ?? null;
          } catch (e) {
            console.error("Error parsing store data", e);
          }
        }

        if (!store_slug) {
          const profile = await getVendorProfile(token);
          if (profile.data?.slug) {
            store_slug = profile.data.slug;
            localStorage.setItem("store", JSON.stringify(profile.data));
          }
        }

        const response: any = await getProducts(token, store_slug || "inventory");
        if (response?.status && response.status >= 400) {
          toast.error(
            response?.data?.detail ||
              response?.data?.error ||
              response?.data?.Status ||
              "Unable to load your listings."
          );
          setProducts([]);
          return;
        }

        setProducts(response.data?.Products || []);
      } catch (err) {
        console.error("Error loading vendor products", err);
        toast.error("Unable to load your listings.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void loadInventory();
  }, []);

  // Poll for product state changes while there are pending listings so the UI
  // can detect activation and remove Pay buttons automatically.
  useEffect(() => {
    if (pendingListings.length === 0) return;
    let cancelled = false;
    const token = getAccessToken();
    const storeRaw = typeof window !== "undefined" ? localStorage.getItem("store") : null;
    if (!token || !storeRaw) return;
    let intervalId: any = null;
    try {
      const storeObject = JSON.parse(storeRaw);
      const store_slug = storeObject.slug;
      if (!store_slug) return;

      const poll = async () => {
        try {
          const data: any = await getProducts(token, store_slug);
          if (cancelled) return;
          setProducts(data.data?.Products || []);
          // If any pending listing product id now present and active, the other effect will remove pending listing
        } catch (err) {
          console.error("Error polling products:", err);
        }
      };

      intervalId = setInterval(poll, 5000);
      // run one immediately
      poll();
    } catch (err) {
      console.error("Error starting product poll", err);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [pendingListings.length]);

  useMemo(() => {
    categories.forEach((category: any) => {
      getSubcategories(category?.slug).then((data) => {
        setSubcategories(data.data);
      });
    });
  }, [categories]);

  useEffect(() => {
    if (selectedCategory) {
      let filteredCategory = subcategories.filter(
        (i: { slug: string; name: string; category: string }) =>
          i.category === selectedCategory
      );
      setFilteredSubcategories(filteredCategory);
    }
  }, [selectedCategory, subcategories]);

  function truncateAndConvertToText(htmlString: any, maxLength = 60) {
    if (!htmlString) return "";
    let truncatedText = htmlString.substring(0, maxLength);
    let tempElement = document.createElement("div");
    tempElement.innerHTML = truncatedText;
    const text = tempElement.textContent || tempElement.innerText || "";
    return text.length >= maxLength ? text + "..." : text;
  }

  const openDeleteModal = (productId: any) => {
    setProductIdToDelete(productId);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setProductIdToDelete("");
  };

  const filteredProducts = products?.filter((product) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePayListingFee = async (listing: PendingListing) => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication error. Please sign in again.");
      return;
    }

    setPayingListingId(listing.productId);
    try {
      const result = await prepareListingFeePayment(
        token,
        listing.productId,
        listing.productName
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      loadPendingListings();
      window.location.href = result.paymentUrl;
    } finally {
      setPayingListingId("");
    }
  };

  const handlePayForProduct = async (product: any) => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication error. Please sign in again.");
      return;
    }

    setPayingListingId(product.id);
    try {
      const result = await prepareListingFeePayment(token, product.id, product.name);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      loadPendingListings();
      window.location.href = result.paymentUrl;
    } finally {
      setPayingListingId("");
    }
  };

  const storefrontBase =
    process.env.NEXT_PUBLIC_ENV === "production"
      ? "https://pinksurfing.com"
      : "https://dev.pinksurfing.com";

  const getProductUrl = (product: any) =>
    `${storefrontBase}/product/productDetail/${product.slug}?productId=${product.id}`;

  // Make clipboard async/await so the toast fires in the same tick as the
  // clipboard write completes — prevents stale toasts appearing on other pages.
  const copyToClipboard = async (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Product link copied!");
    } catch {
      // Fallback for browsers / contexts where clipboard API is unavailable
      try {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        toast.success("Product link copied!");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  const handleProductClick = async (product: any) => {
    if (!product.is_active) {
      toast.info("Pay the listing fee to activate this product first.");
      return;
    }
    const url = getProductUrl(product);
    window.open(url, "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard write may fail when focus moved to new tab — that's fine
    }
    // Show toast immediately after open, regardless of clipboard result
    toast.success("Product link opened & copied!");
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-light-border dark:border-dark-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                  All Listings
                </h2>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  {products?.length || 0} listings in your inventory
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border border-surface-200 dark:border-dark-border bg-surface-50 dark:bg-dark-input text-surface-900 dark:text-white placeholder:text-surface-400 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-full sm:w-48"
                  />
                </div>
                
                <Link
                  href="/inventory/add_products"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-pink text-white font-medium shadow-premium-sm hover:shadow-premium-md transition-all"
                >
                  <FiPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Listing</span>
                </Link>
              </div>
            </div>
          </div>


          {/* Mobile / tablet: cards */}
          {filteredProducts?.length > 0 ? (
            <>
              <div className="lg:hidden divide-y divide-surface-100 dark:divide-dark-border border-t border-surface-100 dark:border-dark-border">
                <AnimatePresence>
                  {filteredProducts.map((product: any, index: number) => (
                    <motion.div
                      key={`card-${product.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-4 space-y-3 ${!product.is_active ? "bg-surface-50/50 dark:bg-dark-surface/30" : "bg-white dark:bg-dark-card"}`}
                    >
                      {/* Top row: image + name + status badge */}
                      <div className="flex gap-3 items-start">
                        <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ${product.is_active ? "bg-surface-100 dark:bg-dark-surface" : "bg-surface-100 dark:bg-dark-surface opacity-70"}`}>
                          {product.image1 ? (
                            <img src={product.image1} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiPackage className="w-6 h-6 text-surface-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-surface-900 dark:text-white line-clamp-2 leading-snug">
                              {product.name}
                            </p>
                            {product.is_active ? (
                              <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                Live
                              </span>
                            ) : (
                              <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-surface-200 text-surface-500 dark:bg-dark-border dark:text-surface-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-surface-400 dark:bg-surface-500 inline-block" />
                                Draft
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                            {product?.category?.name || "—"}
                            {product?.subcategory?.name ? ` · ${product.subcategory.name}` : ""}
                          </p>
                        </div>
                      </div>

                      {product.short_description && (
                        <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2">
                          {truncateAndConvertToText(product.short_description)}
                        </p>
                      )}

                      {/* Bottom row: price + actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-surface-100 dark:border-dark-border">
                        <span className="text-base font-bold text-success dark:text-success">
                          ${product.unit_price}
                        </span>
                        <div className="flex items-center gap-2">
                          {product.is_active ? (
                            <button
                              type="button"
                              onClick={(e) => copyToClipboard(getProductUrl(product), e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-dark-surface text-surface-600 dark:text-surface-400 text-xs font-medium hover:bg-surface-200 dark:hover:bg-dark-hover transition-colors"
                            >
                              <FiCopy className="w-3.5 h-3.5" />
                              Copy link
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handlePayForProduct(product); }}
                              disabled={isListingFeePayDisabled(product.id, payingListingId)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isListingFeePayDisabled(product.id, payingListingId)
                                  ? "bg-surface-200 text-surface-400 cursor-not-allowed dark:bg-dark-border dark:text-surface-500"
                                  : "bg-gradient-pink text-white hover:opacity-90 shadow-sm"
                              }`}
                            >
                              {listingFeePayButtonLabel(product.id, payingListingId)}
                            </button>
                          )}
                          <Link
                            href={`/inventory/editProduct/${product.id}`}
                            className="p-2 rounded-lg bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/20 transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(product.id)}
                            className="p-2 rounded-lg bg-danger-light dark:bg-danger/20 text-danger hover:bg-danger/20 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Desktop: table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full table-fixed min-w-0">
                  <thead>
                    <tr className="bg-surface-50 dark:bg-dark-surface border-t border-surface-100 dark:border-dark-border">
                      <th className="px-5 xl:px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 w-[35%]">
                        Listing
                      </th>
                      <th className="px-5 xl:px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 w-[18%]">
                        Category
                      </th>
                      <th className="px-5 xl:px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 w-[20%]">
                        Status
                      </th>
                      <th className="px-5 xl:px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 w-[13%]">
                        Price
                      </th>
                      <th className="px-5 xl:px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 w-[14%]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-dark-border">
                    <AnimatePresence>
                      {filteredProducts.map((product: any, index: number) => (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          className={`group transition-colors ${
                            product.is_active
                              ? "hover:bg-surface-50 dark:hover:bg-dark-hover"
                              : "bg-surface-50/60 dark:bg-dark-surface/20 hover:bg-surface-100/60 dark:hover:bg-dark-surface/40"
                          }`}
                        >
                          {/* Listing */}
                          <td className="px-5 xl:px-6 py-4">
                            <div
                              className={`flex items-center gap-3 xl:gap-4 ${product.is_active ? "cursor-pointer" : "cursor-default"}`}
                              onClick={() => handleProductClick(product)}
                              title={product.is_active ? "Open product page & copy link" : undefined}
                            >
                              <div className={`w-11 h-11 xl:w-12 xl:h-12 rounded-xl overflow-hidden flex-shrink-0 bg-surface-100 dark:bg-dark-surface transition-all ${product.is_active ? "group-hover:ring-2 group-hover:ring-primary-400" : "opacity-60"}`}>
                                {product.image1 ? (
                                  <img src={product.image1} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FiPackage className="w-5 h-5 text-surface-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`font-semibold text-sm truncate transition-colors ${product.is_active ? "text-surface-900 dark:text-white group-hover:text-primary-500" : "text-surface-600 dark:text-surface-400"}`}>
                                  {product.name}
                                </p>
                                <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5 truncate">
                                  {product?.category?.name || "—"}
                                  {product?.subcategory?.name ? ` · ${product.subcategory.name}` : ""}
                                </p>
                                {product.is_active && (
                                  <span className="inline-flex items-center gap-1 text-xs text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                                    <FiExternalLink className="w-3 h-3" />
                                    Open & copy link
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-5 xl:px-6 py-4">
                            <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                              {truncateAndConvertToText(product.short_description) || "—"}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="px-5 xl:px-6 py-4">
                            {product.is_active ? (
                              <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                  Live
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => copyToClipboard(getProductUrl(product), e)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-100 dark:bg-dark-surface text-surface-500 dark:text-surface-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-500 transition-colors text-xs font-medium"
                                  title="Copy listing link"
                                >
                                  <FiCopy className="w-3 h-3" />
                                  Copy link
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-surface-200 text-surface-500 dark:bg-dark-border dark:text-surface-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-surface-400 dark:bg-surface-500 inline-block" />
                                  Draft
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handlePayForProduct(product); }}
                                  disabled={isListingFeePayDisabled(product.id, payingListingId)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    isListingFeePayDisabled(product.id, payingListingId)
                                      ? "bg-surface-200 text-surface-400 cursor-not-allowed dark:bg-dark-border dark:text-surface-500"
                                      : "bg-gradient-pink text-white hover:opacity-90 shadow-sm"
                                  }`}
                                >
                                  {listingFeePayButtonLabel(product.id, payingListingId, true)}
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Price */}
                          <td className="px-5 xl:px-6 py-4 text-right">
                            <span className="text-sm xl:text-base font-bold text-success dark:text-success whitespace-nowrap">
                              ${product.unit_price}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 xl:px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/inventory/editProduct/${product.id}`}
                                className="p-2 rounded-lg bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/20 dark:hover:bg-accent-blue/30 transition-colors"
                                title="Edit listing"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => openDeleteModal(product.id)}
                                className="p-2 rounded-lg bg-danger-light dark:bg-danger/20 text-danger hover:bg-danger/20 dark:hover:bg-danger/30 transition-colors"
                                title="Delete listing"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-100 dark:bg-dark-surface flex items-center justify-center">
                <FiPackage className="w-10 h-10 text-surface-400 dark:text-surface-500" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                {searchQuery ? "No products found" : "No products yet"}
              </h3>
              <p className="text-surface-500 dark:text-surface-400 mb-6 max-w-sm mx-auto">
                {searchQuery
                  ? "Try adjusting your search to find what you're looking for."
                  : "Start by adding your first product to your inventory."}
              </p>
              {!searchQuery && (
                <Link
                  href="/inventory/add_products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-pink text-white font-semibold shadow-premium-sm hover:shadow-premium-md transition-all"
                >
                  <FiPlus className="w-5 h-5" />
                  Add Your First Product
                </Link>
              )}
            </div>
          )}

          <ConfirmationModal
            isOpen={isModalOpen}
            onClose={closeDeleteModal}
            onConfirm={() => handleDelete(productIdToDelete)}
          />
        </div>
      )}
    </>
  );
};

export default ProductsTable;