"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createSquareListingPaymentLink,
  getCategories,
  getProducts,
  getSubcategories,
} from "@/api/products";
import { Product } from "@/types/product";
import { redirect } from "next/navigation";
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
import { getCookie } from "@/utils/cookies";
import {
  PendingListing,
  getPendingListings,
  removePendingListing,
  updatePendingListingState,
} from "@/utils/pendingListings";

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
      const token: string | null = getCookie("access_token");
      const vendor_id: string | null = localStorage.getItem("vendor_id");

      if (!token || !vendor_id) {
        redirect("/");
        return;
      }

      try {
        const result = await deleteProduct(token, vendor_id, productId);

        if (result && typeof result === "object") {
          if ("error" in result && "message" in result) {
            toast.error(result.message);
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
    const activeProductIds = new Set(products.map((item: any) => item.id));
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

  useMemo(() => {
    if (typeof window !== "undefined") {
      const token: string | null = getCookie("access_token");
      const store: string | null = localStorage.getItem("store");

      if (store) {
        const storeObject = JSON.parse(store);
        const store_slug = storeObject.slug;
        if (token && store_slug) {
          setLoading(true);
          getProducts(token, store_slug).then((data) => {
            setProducts(data.data?.Products || []);
            setLoading(false);
          });
        }
      }
    }
  }, []);

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
    const token = getCookie("access_token");
    if (!token) {
      toast.error("Authentication error. Please sign in again.");
      return;
    }

    setPayingListingId(listing.productId);
    try {
      const result = await createSquareListingPaymentLink(token, listing.productId);

      if (result.error) {
        if (result.status === 403) {
          toast.error("Not allowed for this product.");
        } else if (result.status === 502) {
          toast.error("Payments temporarily unavailable.");
        } else if (result.status === 400) {
          toast.error("Could not create payment link, try again.");
        } else {
          toast.error(result.message || "Could not create payment link, try again.");
        }
        return;
      }

      updatePendingListingState(listing.productId, "PAYMENT_REDIRECTED");
      loadPendingListings();

      const paymentUrl = result.data?.payment_link;
      if (!paymentUrl) {
        toast.error("Could not create payment link, try again.");
        return;
      }

      window.location.href = paymentUrl;
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

          {pendingListings.length > 0 && (
            <div className="p-6 border-b border-light-border dark:border-dark-border bg-warning/5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-surface-900 dark:text-white">Pending Listings</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    These listings are not public until payment is confirmed.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-warning/20 text-warning-dark dark:text-warning">
                  {pendingListings.length}
                </span>
              </div>

              <div className="space-y-3">
                {pendingListings.map((listing) => (
                  <div
                    key={listing.productId}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl bg-white dark:bg-dark-card border border-surface-200 dark:border-dark-border"
                  >
                    <div>
                      <p className="font-medium text-surface-900 dark:text-white">
                        {listing.productName || `Product ${listing.productId.slice(0, 8)}...`}
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-warning/20 text-warning-dark dark:text-warning">
                          Pending payment
                        </span>
                        <span className="text-xs text-surface-500 dark:text-surface-400">
                          {listing.state === "AWAITING_WEBHOOK"
                            ? "Payment submitted, waiting for confirmation"
                            : `Pay ${Number(listing.listingFeeAmount).toString()} ${listing.listingFeeCurrency} to publish`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePayListingFee(listing)}
                        disabled={listing.state === "AWAITING_WEBHOOK" || payingListingId === listing.productId}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${listing.state === "AWAITING_WEBHOOK" || payingListingId === listing.productId
                          ? "bg-surface-300 text-surface-500 cursor-not-allowed"
                          : "bg-gradient-pink text-white hover:opacity-90"
                          }`}
                      >
                        {payingListingId === listing.productId
                          ? "Preparing checkout..."
                          : `Pay ${Number(listing.listingFeeAmount).toString()} ${listing.listingFeeCurrency}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile / tablet: cards (no horizontal scroll) */}
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
                      className="p-4 space-y-3 bg-white dark:bg-dark-card"
                    >
                      <div
                        className="flex gap-3 cursor-pointer group"
                        onClick={() => handleProductClick(product)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleProductClick(product);
                          }
                        }}
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-100 dark:bg-dark-surface flex-shrink-0">
                          {product.image1 ? (
                            <img
                              src={product.image1}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiPackage className="w-6 h-6 text-surface-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-surface-900 dark:text-white line-clamp-2 group-hover:text-primary-500">
                            {product.name}
                          </p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 font-mono">
                            ID: {product.id?.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-0.5">
                            Category
                          </p>
                          <p className="font-medium text-surface-900 dark:text-white">
                            {product?.category?.name || "—"}
                          </p>
                          {product?.subcategory?.name && (
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                              {product.subcategory.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-0.5">
                            Stock
                          </p>
                          <span
                            className={`inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-full text-sm font-semibold ${
                              product.quantity > 10
                                ? "bg-success-light text-success-dark dark:bg-success/20 dark:text-success"
                                : product.quantity > 0
                                ? "bg-warning-light text-warning-dark dark:bg-warning/20 dark:text-warning"
                                : "bg-danger-light text-danger-dark dark:bg-danger/20 dark:text-danger"
                            }`}
                          >
                            {product.quantity}
                          </span>
                        </div>
                      </div>
                      {product.short_description && (
                        <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                          {truncateAndConvertToText(product.short_description)}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-100 dark:border-dark-border">
                        <span className="text-lg font-bold text-success dark:text-success">
                          ${product.unit_price}
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(getProductUrl(product), e)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-dark-surface text-surface-600 dark:text-surface-400 text-xs font-medium"
                          >
                            <FiCopy className="w-3.5 h-3.5" />
                            Copy link
                          </button>
                          <Link
                            href={`/inventory/editProduct/${product.id}`}
                            className="p-2 rounded-lg bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(product.id)}
                            className="p-2 rounded-lg bg-danger-light dark:bg-danger/20 text-danger"
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
                  <tr className="bg-surface-50 dark:bg-dark-surface">
                    <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 w-[28%]">
                      Listing
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 w-[14%]">
                      Category
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 w-[18%]">
                      Description
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 w-[12%]">
                        Listing Link
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 w-[8%]">
                      Stock
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 w-[10%]">
                      Price
                    </th>
                    <th className="px-4 xl:px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 w-[10%]">
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
                        className="hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors"
                      >
                        <td className="px-4 xl:px-6 py-4 align-top">
                          <div
                            className="flex items-center gap-3 xl:gap-4 cursor-pointer group"
                            onClick={() => handleProductClick(product)}
                            title="Open product page & copy link"
                          >
                            <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-xl overflow-hidden bg-surface-100 dark:bg-dark-surface flex-shrink-0 group-hover:ring-2 group-hover:ring-primary-400 transition-all">
                              {product.image1 ? (
                                <img
                                  src={product.image1}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FiPackage className="w-6 h-6 text-surface-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-surface-900 dark:text-white truncate group-hover:text-primary-500 transition-colors">
                                {product.name}
                              </p>
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                ID: {product.id?.slice(0, 8)}...
                              </p>
                              <span className="inline-flex items-center gap-1 text-xs text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                                <FiExternalLink className="w-3 h-3" />
                                Open & copy link
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 xl:px-6 py-4 align-top">
                          <div>
                            <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                              {product?.category?.name || "—"}
                            </p>
                            {product?.subcategory?.name && (
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
                                {product.subcategory.name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 xl:px-6 py-4 align-top">
                          <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 break-words">
                            {truncateAndConvertToText(product.short_description)}
                          </p>
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-center align-top">
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(getProductUrl(product), e)}
                            className="inline-flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-dark-surface text-surface-600 dark:text-surface-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-500 transition-colors text-xs font-medium"
                            title="Copy product link"
                          >
                            <FiCopy className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden xl:inline">Copy Link</span>
                          </button>
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-center align-top">
                          <span
                            className={`inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-full text-sm font-semibold ${
                              product.quantity > 10
                                ? "bg-success-light text-success-dark dark:bg-success/20 dark:text-success"
                                : product.quantity > 0
                                ? "bg-warning-light text-warning-dark dark:bg-warning/20 dark:text-warning"
                                : "bg-danger-light text-danger-dark dark:bg-danger/20 dark:text-danger"
                            }`}
                          >
                            {product.quantity}
                          </span>
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-center align-top">
                          <span className="text-base xl:text-lg font-bold text-success dark:text-success whitespace-nowrap">
                            ${product.unit_price}
                          </span>
                        </td>
                        <td className="px-4 xl:px-6 py-4 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/inventory/editProduct/${product.id}`}
                              className="p-2 rounded-lg bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/20 dark:hover:bg-accent-blue/30 transition-colors"
                              title="Edit Product"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => openDeleteModal(product.id)}
                              className="p-2 rounded-lg bg-danger-light dark:bg-danger/20 text-danger hover:bg-danger/20 dark:hover:bg-danger/30 transition-colors"
                              title="Delete Product"
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