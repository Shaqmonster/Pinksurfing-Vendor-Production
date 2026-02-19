"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  FiMoreHorizontal,
  FiArrowRight,
  FiSearch,
  FiCopy,
  FiExternalLink
} from "react-icons/fi";
import ConfirmationModal from "../Modals/ConfirmDelete";
import { toast } from "react-toastify";
import { getCookie } from "@/utils/cookies";

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
    }
  }, []);

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

  const getProductUrl = (product: any) =>
    `https://pinksurfing.com/product/productDetail/${product.slug}?productId=${product.id}`;

  const copyToClipboard = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Product link copied!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const handleProductClick = (product: any) => {
    const url = getProductUrl(product);
    window.open(url, "_blank", "noopener,noreferrer");
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Product link opened & copied!"))
      .catch(() => {});
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
                  All Products
                </h2>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  {products?.length || 0} products in your inventory
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
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
                  <span className="hidden sm:inline">Add Product</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Table */}
          {filteredProducts?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 dark:bg-dark-surface">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Product
                    </th>
                    <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Category
                    </th>
                    <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Description
                    </th>
                    <th className="hidden xl:table-cell px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Product Link
                    </th>
                    <th className="hidden sm:table-cell px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Price
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
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
                        <td className="px-6 py-4">
                          <div
                            className="flex items-center gap-4 cursor-pointer group"
                            onClick={() => handleProductClick(product)}
                            title="Open product page & copy link"
                          >
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-100 dark:bg-dark-surface flex-shrink-0 group-hover:ring-2 group-hover:ring-primary-400 transition-all">
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
                            <div className="min-w-0">
                              <p className="font-medium text-surface-900 dark:text-white truncate max-w-[200px] group-hover:text-primary-500 transition-colors">
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
                        <td className="hidden md:table-cell px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-surface-900 dark:text-white">
                              {product?.category?.name || "—"}
                            </p>
                            {product?.subcategory?.name && (
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                {product.subcategory.name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4">
                          <p className="text-sm text-surface-600 dark:text-surface-400 max-w-xs line-clamp-2">
                            {truncateAndConvertToText(product.short_description)}
                          </p>
                        </td>
                        <td className="hidden xl:table-cell px-6 py-4 text-center">
                          <button
                            onClick={(e) => copyToClipboard(getProductUrl(product), e)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-dark-surface text-surface-600 dark:text-surface-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-500 transition-colors text-xs font-medium"
                            title="Copy product link"
                          >
                            <FiCopy className="w-3.5 h-3.5" />
                            Copy Link
                          </button>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 text-center">
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
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-success dark:text-success">
                            ${product.unit_price}
                          </span>
                        </td>
                        <td className="px-6 py-4">
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