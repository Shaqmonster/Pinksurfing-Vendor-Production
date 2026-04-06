"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2 } from "@/components/common/Loader";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { getCookie } from "@/utils/cookies";
import { getSingleProduct, updateProducts } from "@/api/products";

// ============ ICONS (same as add_products) ============
const PackageIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const ImageIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const TagIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);
const UploadIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);
const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

// Categories that don't require certain fields (same logic as add_products)
const CATEGORIES_WITHOUT_MEDIA = ["Stay With Us"];
const CATEGORIES_WITHOUT_DIMENSIONS = ["Business For Sale","Commercial Real Estate","Residential Real Estate","Stay With Us","Building Materials"];
const CATEGORIES_WITHOUT_STOCK = ["Business For Sale","Cars & Trucks","Commercial Real Estate","Residential Real Estate","Stay With Us","Building Materials"];
const CATEGORIES_WITHOUT_BRAND = ["Business For Sale","Cars & Trucks","Commercial Real Estate","Residential Real Estate","Stay With Us","Building Materials"];

// ============ MAIN COMPONENT ============
const EditProduct = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [shortDescPlainLen, setShortDescPlainLen] = useState(0);

  // Product data
  const [productData, setProductData] = useState({
    id: "",
    name: "",
    unit_price: "",
    mrp: "",
    category: "",
    subcategory: "",
    brand_name: "",
    tags: "",
    meta_title: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    quantity: "",
    short_description: "",
    description: "",
  });

  // Category info for display
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");

  // Discount toggle
  const [hasDiscount, setHasDiscount] = useState(false);

  // Attributes
  const [attributes, setAttributes] = useState<any[]>([]);

  // Existing images (URL strings from the server)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // New images uploaded by user
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    []
  );

  const formats = [
    "header", "bold", "italic", "underline", "strike", "blockquote",
    "list", "bullet", "indent", "link", "color", "clean",
  ];

  // Derived
  const shouldHideMedia = CATEGORIES_WITHOUT_MEDIA.some(
    (c) => c.toLowerCase() === categoryName.toLowerCase()
  );
  const shouldHideDimensions = CATEGORIES_WITHOUT_DIMENSIONS.some(
    (c) => c.toLowerCase() === categoryName.toLowerCase()
  );
  const shouldHideStock = CATEGORIES_WITHOUT_STOCK.some(
    (c) => c.toLowerCase() === categoryName.toLowerCase()
  );
  const shouldHideBrand = CATEGORIES_WITHOUT_BRAND.some(
    (c) => c.toLowerCase() === categoryName.toLowerCase()
  );

  // ---- Fetch existing product ----
  useEffect(() => {
    if (!productId) return;
    const token = getCookie("access_token");
    if (!token) {
      router.push("/auth/signin");
      return;
    }

    getSingleProduct(token, productId).then((res: any) => {
      if (res.error || !res.data) {
        toast.error("Failed to load product.");
        setLoading(false);
        return;
      }
      const p = res.data;

      setProductData({
        id: p.id || productId,
        name: p.name || "",
        mrp: p.mrp ? String(p.mrp) : "",
        unit_price: p.unit_price ? String(p.unit_price) : "",
        category: p.category?.id || "",
        subcategory: p.subcategory?.id || "",
        brand_name: p.brand_name || "",
        tags: p.tags || "",
        meta_title: p.meta_title || "",
        length: p.length ? String(p.length) : "",
        width: p.width ? String(p.width) : "",
        height: p.height ? String(p.height) : "",
        weight: p.weight ? String(p.weight) : "",
        quantity: p.quantity !== undefined && p.quantity !== null ? String(p.quantity) : "",
        short_description: p.short_description || "",
        description: p.description || "",
      });

      setCategoryName(p.category?.name || "");
      setSubcategoryName(p.subcategory?.name || "");

      // Detect discount
      if (
        p.unit_price &&
        p.mrp &&
        parseFloat(p.unit_price) < parseFloat(p.mrp)
      ) {
        setHasDiscount(true);
      }

      // Existing attributes
      if (Array.isArray(p.attributes)) {
        setAttributes(
          p.attributes.map((a: any) => ({
            name: a.name,
            value: a.value || "",
            additional_price: a.additional_price || 0,
            data_type: "text",
          }))
        );
      }

      // Existing images (image1..image4)
      const imgs = [p.image1, p.image2, p.image3, p.image4]
        .filter(Boolean)
        .map((img: string) => {
          // If the image is a relative path, prefix with the API base URL
          if (img && !img.startsWith("http")) {
            return `${process.env.NEXT_PUBLIC_BASE_URL?.replace("/api", "") || ""}${img}`;
          }
          return img;
        });
      setExistingImages(imgs);

      // Show dimensions if any are set
      if (p.length || p.width || p.height || p.weight) {
        setShowDimensions(true);
      }

      setLoading(false);
    });
  }, [productId, router]);

  const updateProductData = (key: string, value: string) => {
    setProductData((prev) => ({ ...prev, [key]: value }));
  };

  // ---- Image handling ----
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const dropped = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      const totalSlots = existingImages.length + newFiles.length;
      if (totalSlots + dropped.length > 4) {
        toast.error("Maximum 4 images allowed");
        return;
      }
      setNewFiles((prev) => [...prev, ...dropped]);
    },
    [existingImages.length, newFiles.length]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).filter((f) =>
      f.type.startsWith("image/")
    );
    const totalSlots = existingImages.length + newFiles.length;
    if (totalSlots + selected.length > 4) {
      toast.error("Maximum 4 images allowed");
      return;
    }
    setNewFiles((prev) => [...prev, ...selected]);
  };

  const removeExistingImage = (idx: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeNewFile = (idx: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---- Attribute update ----
  const updateAttribute = (index: number, value: string) => {
    setAttributes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  };

  // ---- Save / submit ----
  const handleSave = async () => {
    if (!productData.name.trim()) {
      toast.error("Product title is required.");
      return;
    }
    if (!productData.mrp) {
      toast.error("Regular price is required.");
      return;
    }

    const token = getCookie("access_token");
    const vendor_id = localStorage.getItem("vendor_id");
    if (!token || !vendor_id) {
      toast.error("Session expired. Please log in again.");
      router.push("/auth/signin");
      return;
    }

    const finalUnitPrice = hasDiscount ? productData.unit_price : productData.mrp;

    const payload: any = {
      ...productData,
      unit_price: finalUnitPrice,
    };

    // Remove blank optional fields
    if (!payload.quantity && payload.quantity !== 0) delete payload.quantity;

    // Attributes
    payload.attributes = attributes.filter((a) => a.value !== "").map((a) => ({
      name: a.name,
      value: String(a.value),
      additional_price: a.additional_price || 0,
    }));

    setSaving(true);
    try {
      const res: any = await updateProducts(token, vendor_id, payload, newFiles);
      if (res && !res.error) {
        toast.success("Product updated successfully!");
        router.push("/inventory/products");
      } else {
        toast.error(res?.data?.data?.Status || res?.message || "Failed to update product.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // ============ RENDER ============
  if (loading) return <Loader2 />;

  const inputClasses =
    "w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300";

  return (
    <div className="min-h-screen pb-28">
      {/* ---- Page Header ---- */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-100 dark:bg-dark-surface text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-dark-hover transition-colors font-medium text-sm"
          >
            <BackIcon />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
              Edit Product
            </h1>
            {productData.name && (
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 truncate max-w-xs">
                {productData.name}
              </p>
            )}
          </div>
        </div>

        {/* Category breadcrumb */}
        {categoryName && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary-500/10 to-pink-500/10 border border-primary-200 dark:border-primary-500/20">
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{categoryName}</span>
            </span>
            {subcategoryName && (
              <>
                <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-surface-100 dark:bg-dark-surface border border-surface-200 dark:border-dark-border">
                  <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{subcategoryName}</span>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ---- Product Title (hero input) ---- */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-pink-500/5 to-purple-500/5 rounded-2xl" />
        <div className="relative premium-card p-6 md:p-8 border-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm">
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-pink-500 rounded-full" />
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
              Product Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={productData.name}
              onChange={(e) => updateProductData("name", e.target.value)}
              placeholder="Enter product title…"
              className="w-full px-0 py-3 text-xl md:text-2xl font-semibold bg-transparent border-0 border-b-2 border-surface-200 dark:border-dark-border text-surface-900 dark:text-white placeholder:text-surface-300 dark:placeholder:text-surface-600 focus:border-primary-500 focus:ring-0 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ---- Pricing ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Regular Price */}
        <div className="premium-card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/25">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white">Regular Price</h4>
              <p className="text-xs text-surface-500">Base price (required)</p>
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-surface-400">$</span>
            <input
              type="number"
              value={productData.mrp}
              onChange={(e) => updateProductData("mrp", e.target.value)}
              placeholder="0.00"
              min={0}
              className="w-full pl-12 pr-4 py-4 text-2xl font-bold rounded-xl bg-surface-50 dark:bg-dark-input border-2 border-surface-200 dark:border-dark-border text-surface-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            />
          </div>
        </div>

        {/* Sale Price */}
        <div className={`premium-card p-6 relative overflow-hidden transition-all duration-500 ${hasDiscount ? "ring-2 ring-primary-500 shadow-glow-pink" : "opacity-75 hover:opacity-100"}`}>
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-pink-500 transition-opacity ${hasDiscount ? "opacity-100" : "opacity-30"}`} />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${hasDiscount ? "bg-gradient-to-br from-primary-500 to-pink-500 shadow-pink-500/25" : "bg-surface-400 shadow-surface-500/25"}`}>
                <TagIcon />
              </div>
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-white">Sale Price</h4>
                <p className="text-xs text-surface-500">Discounted price</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHasDiscount(!hasDiscount)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${hasDiscount ? "bg-gradient-to-r from-primary-500 to-pink-500" : "bg-surface-300 dark:bg-dark-border"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${hasDiscount ? "translate-x-8" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold transition-colors ${hasDiscount ? "text-primary-500" : "text-surface-300"}`}>$</span>
            <input
              type="number"
              value={productData.unit_price}
              onChange={(e) => updateProductData("unit_price", e.target.value)}
              placeholder="0.00"
              min={0}
              disabled={!hasDiscount}
              className={`w-full pl-12 pr-4 py-4 text-2xl font-bold rounded-xl border-2 transition-all ${hasDiscount ? "bg-surface-50 dark:bg-dark-input border-primary-200 dark:border-primary-500/30 text-surface-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" : "bg-surface-100 dark:bg-dark-surface border-surface-200 dark:border-dark-border text-surface-400 cursor-not-allowed"}`}
            />
          </div>
          {hasDiscount && productData.mrp && productData.unit_price && Number(productData.mrp) > Number(productData.unit_price) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-sm font-semibold">
                {Math.round((1 - Number(productData.unit_price) / Number(productData.mrp)) * 100)}% OFF
              </span>
              <span className="text-xs text-surface-500">
                Customer saves ${(Number(productData.mrp) - Number(productData.unit_price)).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ---- Brand & Stock ---- */}
      {(!shouldHideBrand || !shouldHideStock) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {!shouldHideBrand && (
            <div className="premium-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Brand Name</label>
              </div>
              <input type="text" value={productData.brand_name} onChange={(e) => updateProductData("brand_name", e.target.value)} placeholder="Enter brand name" className="input-premium" />
            </div>
          )}
          {!shouldHideStock && (
            <div className="premium-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Stock Quantity</label>
              </div>
              <input type="number" value={productData.quantity} onChange={(e) => updateProductData("quantity", e.target.value)} placeholder="Available units" min={0} className="input-premium" />
            </div>
          )}
        </div>
      )}

      {/* ---- Descriptions ---- */}
      <div className="premium-card p-6 md:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Product Description</h3>
            <p className="text-xs text-surface-500">Help customers understand your product</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Short description */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Short Description
              </label>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-surface-200 dark:bg-dark-border overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${shortDescPlainLen > 200 ? "bg-orange-500" : "bg-primary-500"}`} style={{ width: `${Math.min((shortDescPlainLen / 255) * 100, 100)}%` }} />
                </div>
                <span className={`text-xs ${shortDescPlainLen >= 255 ? "text-orange-500 font-semibold" : "text-surface-400"}`}>{shortDescPlainLen}/255</span>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border-2 border-surface-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-500/50 transition-colors">
              <ReactQuill
                theme="snow"
                value={productData.short_description}
                formats={formats}
                onChange={(content: string, _delta: any, _source: any, editor: any) => {
                  const raw = editor.getText() as string;
                  const plain = raw.endsWith("\n") ? raw.slice(0, -1) : raw;
                  const len = plain.length;
                  setShortDescPlainLen(Math.min(len, 255));
                  if (len <= 255) {
                    setProductData((prev) => ({ ...prev, short_description: content }));
                  }
                }}
                className="bg-white dark:bg-dark-input [&_.ql-container]:!min-h-[120px] [&_.ql-editor]:!min-h-[120px]"
              />
            </div>
          </div>
          {/* Detailed description */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
              Detailed Description
            </label>
            <div className="rounded-xl overflow-hidden border-2 border-surface-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-500/50 transition-colors">
              <ReactQuill
                theme="snow"
                value={productData.description}
                formats={formats}
                onChange={(val: string) => setProductData((prev) => ({ ...prev, description: val }))}
                className="bg-white dark:bg-dark-input [&_.ql-container]:!min-h-[120px] [&_.ql-editor]:!min-h-[120px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---- Dimensions (collapsible) ---- */}
      {!shouldHideDimensions && (
        <div className="premium-card overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setShowDimensions(!showDimensions)}
            className="flex items-center justify-between w-full p-5 hover:bg-surface-50 dark:hover:bg-dark-surface/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showDimensions ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/25" : "bg-surface-100 dark:bg-dark-surface text-surface-500"}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-surface-900 dark:text-white">Product Dimensions</h4>
                <p className="text-xs text-surface-500">Size and weight specifications</p>
              </div>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium text-surface-400 bg-surface-100 dark:bg-dark-surface rounded">Optional</span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-surface-100 dark:bg-dark-surface transition-transform duration-300 ${showDimensions ? "rotate-180" : ""}`}>
              <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {showDimensions && (
            <div className="px-5 pb-5 pt-2 border-t border-surface-100 dark:border-dark-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Length", key: "length", unit: "cm" },
                  { label: "Width", key: "width", unit: "cm" },
                  { label: "Height", key: "height", unit: "cm" },
                  { label: "Weight", key: "weight", unit: "kg" },
                ].map(({ label, key, unit }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-surface-500 mb-2 block">{label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={(productData as any)[key]}
                        onChange={(e) => updateProductData(key, e.target.value)}
                        placeholder="0"
                        min={0}
                        className="input-premium pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- Attributes (editable if any exist) ---- */}
      {attributes.length > 0 && (
        <div className="premium-card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
              <TagIcon />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Product Attributes</h3>
              <p className="text-xs text-surface-500">Specific details for this product type</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {attributes.map((attr, idx) => (
              <div key={idx} className="space-y-2">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                  {attr.name}
                </label>
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => updateAttribute(idx, e.target.value)}
                  placeholder={`Enter ${attr.name.toLowerCase()}`}
                  className={inputClasses}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Images ---- */}
      {!shouldHideMedia && (
        <div className="premium-card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/25">
              <ImageIcon />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Product Images</h3>
              <p className="text-xs text-surface-500">
                {existingImages.length + newFiles.length}/4 images
              </p>
            </div>
          </div>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
                Current Images
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {existingImages.map((src, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-surface-100 dark:bg-dark-surface">
                    <img src={src} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded-lg">Cover</div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-2 right-2 w-8 h-8 bg-danger text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-danger-dark"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload new images */}
          {existingImages.length + newFiles.length < 4 && (
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${dragActive ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10" : "border-surface-300 dark:border-dark-border hover:border-primary-400 dark:hover:border-primary-500/50"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragActive ? "bg-primary-500 text-white" : "bg-surface-100 dark:bg-dark-surface text-surface-400"}`}>
                  <UploadIcon />
                </div>
                <p className="text-base font-medium text-surface-700 dark:text-surface-200 mb-1">
                  {existingImages.length > 0 ? "Add more images" : "Drag and drop images here"}
                </p>
                <p className="text-sm text-surface-500 mb-2">or click to browse</p>
                <p className="text-xs text-surface-400">
                  PNG, JPG, GIF up to 10MB each · {4 - existingImages.length - newFiles.length} slot{(4 - existingImages.length - newFiles.length) !== 1 ? "s" : ""} remaining
                </p>
              </div>
            </div>
          )}

          {/* New file previews */}
          {newFiles.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
                New Images to Upload ({newFiles.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {newFiles.map((file, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-surface-100 dark:bg-dark-surface border-2 border-dashed border-primary-300">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-accent-blue text-white text-xs font-medium rounded-lg">New</div>
                    <button
                      type="button"
                      onClick={() => removeNewFile(idx)}
                      className="absolute top-2 right-2 w-8 h-8 bg-danger text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- SEO ---- */}
      <div className="premium-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-blue flex items-center justify-center text-white">
            <TagIcon />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">SEO Settings <span className="text-xs font-normal text-surface-400">(Optional)</span></h3>
            <p className="text-xs text-surface-500">Improve your listing in search results</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">SEO Title</label>
            <input type="text" value={productData.meta_title} onChange={(e) => updateProductData("meta_title", e.target.value)} placeholder="Meta title for search engines" className="input-premium" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Tags</label>
            <input type="text" value={productData.tags} onChange={(e) => updateProductData("tags", e.target.value)} placeholder="Tags separated by commas" className="input-premium" />
          </div>
        </div>
      </div>

      {/* ---- Fixed bottom save bar ---- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl border-t border-surface-200 dark:border-dark-border p-4 md:p-6 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-surface-100 dark:bg-dark-surface text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-dark-hover transition-all duration-300"
          >
            <BackIcon />
            <span className="hidden sm:inline">Discard Changes</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !productData.name || !productData.mrp}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${saving || !productData.name || !productData.mrp ? "opacity-50 cursor-not-allowed bg-surface-300 text-surface-500" : "bg-gradient-pink text-white shadow-glow-pink hover:opacity-90"}`}
          >
            {saving ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <SaveIcon />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
