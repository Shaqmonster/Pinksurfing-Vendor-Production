"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getCategories, getSubcategories, saveProducts } from "@/api/products";
import { Product } from "@/types/product";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2 } from "@/components/common/Loader";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { handleError } from "@/utils/toast";
import { getCookie } from "@/utils/cookies";

// ============ ICONS ============
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

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

const SparklesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

// ============ STEP CONFIGURATION ============
const STEPS = [
  { id: 1, name: "Category", description: "Select product type", icon: GridIcon },
  { id: 2, name: "Details", description: "Basic information", icon: PackageIcon },
  { id: 3, name: "Attributes", description: "Product specifications", icon: TagIcon },
  { id: 4, name: "Media", description: "Upload images", icon: ImageIcon },
  { id: 5, name: "Review", description: "Final check", icon: SparklesIcon },
];

// ============ MAIN COMPONENT ============
const AddProducts = () => {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Category states
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState("");
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  
  // Attribute states
  const [allowedAttributes, setAllowedAttributes] = useState<any[]>([]);
  const [variantAttributes, setVariantAttributes] = useState<any[]>([]);
  const [nonVariantAttributes, setNonVariantAttributes] = useState<any[]>([]);
  
  // Product data
  const [productData, setProductData] = useState({
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
    image: "",
    id: ""
  });
  
  // Image states
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  // UI states
  const [hasDiscount, setHasDiscount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  
  const router = useRouter();
  
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    []
  );

  const formats = [
    "header", "bold", "italic", "underline", "strike", "blockquote",
    "list", "bullet", "indent", "link", "color", "clean"
  ];

  // Derived states
  const variantAllowedAttributes = useMemo(() => {
    return allowedAttributes.filter((attr: any) => attr.is_variant === true);
  }, [allowedAttributes]);

  const nonVariantAllowedAttributes = useMemo(() => {
    return allowedAttributes.filter((attr: any) => attr.is_variant === false);
  }, [allowedAttributes]);

  // Load categories on mount
  useEffect(() => {
    getCategories().then((data) => {
      setCategories(data);
    });
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      setSubcategoriesLoading(true);
      setSelectedSubcategory("");
      setSelectedSubcategoryName("");
      setAllowedAttributes([]);
      setVariantAttributes([]);
      setNonVariantAttributes([]);
      
      getSubcategories(selectedCategory)
        .then((data) => {
          setSubcategories(data.data);
          setSubcategoriesLoading(false);
        })
        .catch(() => {
          setSubcategoriesLoading(false);
        });
    }
  }, [selectedCategory]);

  // Handle category selection
  const handleCategorySelect = (cat: { slug: string; name: string }) => {
    setSelectedCategory(cat.slug);
    setSelectedCategoryName(cat.name);
    setProductData(prev => ({ ...prev, category: cat.slug }));
  };

  // Handle subcategory selection
  const handleSubcategorySelect = (subcat: any) => {
    console.log("=== SUBCATEGORY SELECTED ===");
    console.log("Full subcategory data:", subcat);
    console.log("Allowed attributes:", subcat.allowed_attributes);
    console.log("============================");
    
    setSelectedSubcategory(subcat.slug);
    setSelectedSubcategoryName(subcat.name);
    setProductData(prev => ({ ...prev, subcategory: subcat.slug }));
    
    if (subcat.allowed_attributes) {
      setAllowedAttributes(subcat.allowed_attributes);
      // Initialize variant attributes
      const variants = subcat.allowed_attributes.filter((a: any) => a.is_variant);
      setVariantAttributes(variants.map((v: any) => ({
        name: v.name,
        value: v.data_type === "boolean" ? false : "",
        data_type: v.data_type,
        options: v.options || [],
        additional_price: 0
      })));
      // Initialize non-variant attributes
      const nonVariants = subcat.allowed_attributes.filter((a: any) => !a.is_variant);
      setNonVariantAttributes(nonVariants.map((nv: any) => ({
        name: nv.name,
        value: nv.data_type === "boolean" ? false : "",
        data_type: nv.data_type,
        options: nv.options || [],
        additional_price: 0
      })));
    }
  };

  // Update product data
  const updateProductData = (key: string, value: string | number) => {
    setProductData(prev => ({ ...prev, [key]: value.toString() }));
  };

  // Image handling
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length + files.length > 4) {
        toast.error("Maximum 4 images allowed");
        return;
      }
      const imageFiles = droppedFiles.filter(f => f.type.startsWith("image/"));
      setFiles(prev => [...prev, ...imageFiles]);
    }
  }, [files]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length + files.length > 4) {
        toast.error("Maximum 4 images allowed");
        return;
      }
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Step navigation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedCategory && selectedSubcategory;
      case 2:
        return productData.name && productData.mrp && productData.quantity;
      case 3:
        return true; // Attributes are optional
      case 4:
        return files.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 5) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    } else if (!canProceed()) {
      toast.error("Please complete all required fields");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step);
    }
  };

  // Submit handler
  const handleSave = async () => {
    if (typeof window !== "undefined") {
      let token = getCookie("access_token");
      let vendor_id = localStorage.getItem("vendor_id");
      
      const { mrp, unit_price } = productData;
      const finalUnitPrice = hasDiscount ? unit_price : mrp;
      const updatedProductData = { ...productData, unit_price: finalUnitPrice };
      
      // Combine attributes
      const allAttributes = [
        ...nonVariantAttributes.filter(a => a.value !== "").map(a => ({
          name: a.name,
          value: String(a.value),
          additional_price: a.additional_price || 0
        })),
        ...variantAttributes.filter(a => a.value !== "").map(v => ({
          name: v.name,
          value: String(v.value),
          additional_price: v.additional_price || 0
        }))
      ];
      
      setLoading(true);
      try {
        const res: any = await saveProducts(
          token,
          vendor_id,
          updatedProductData as any,
          allAttributes,
          files
        );
        
        if (!res.error) {
          toast.success(res.data.Status || "Product added successfully!");
          router.push("/inventory/products");
        } else {
          handleError(res.data?.data?.Status || "Error adding product");
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  // Render input based on data type
  const renderAttributeInput = (attr: any, isVariant: boolean, index: number) => {
    const updateAttr = (value: any) => {
      if (isVariant) {
        setVariantAttributes(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], value };
          return updated;
        });
      } else {
        setNonVariantAttributes(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], value };
          return updated;
        });
      }
    };

    const inputClasses = "w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300";

    switch (attr.data_type) {
      case "number":
        return (
          <input
            type="number"
            value={attr.value}
            onChange={(e) => updateAttr(e.target.value)}
            placeholder={`Enter ${attr.name.toLowerCase()}`}
            className={inputClasses}
          />
        );
      
      case "boolean":
        return (
          <div className="flex items-center gap-4 h-[50px]">
            <button
              type="button"
              onClick={() => updateAttr(true)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                attr.value === true
                  ? "bg-gradient-pink text-white shadow-glow-pink"
                  : "bg-surface-100 dark:bg-dark-surface text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-dark-hover"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => updateAttr(false)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                attr.value === false
                  ? "bg-surface-600 text-white"
                  : "bg-surface-100 dark:bg-dark-surface text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-dark-hover"
              }`}
            >
              No
            </button>
          </div>
        );
      
      case "select":
        return (
          <select
            value={attr.value}
            onChange={(e) => updateAttr(e.target.value)}
            className={inputClasses}
          >
            <option value="">Select {attr.name}</option>
            {attr.options?.map((opt: string, i: number) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={attr.value}
            onChange={(e) => updateAttr(e.target.value)}
            placeholder={`Enter ${attr.name.toLowerCase()}`}
            className={inputClasses}
          />
        );
    }
  };

  // ============ STEP COMPONENTS ============
  
  // Step 1: Category Selection
  const renderCategoryStep = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Category Selection */}
      <div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
          Select Category
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat: { slug: string; name: string }, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                selectedCategory === cat.slug
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-glow-pink"
                  : "border-surface-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-primary-300 dark:hover:border-primary-500/50 hover:shadow-premium-sm"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                selectedCategory === cat.slug
                  ? "bg-gradient-pink text-white"
                  : "bg-surface-100 dark:bg-dark-surface text-surface-500 group-hover:bg-primary-100 group-hover:text-primary-500 dark:group-hover:bg-primary-500/20"
              }`}>
                <GridIcon />
              </div>
              <h4 className={`font-semibold transition-colors ${
                selectedCategory === cat.slug
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-surface-900 dark:text-white"
              }`}>
                {cat.name}
              </h4>
              {selectedCategory === cat.slug && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-pink rounded-full flex items-center justify-center text-white">
                  <CheckIcon />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory Selection */}
      {selectedCategory && (
        <div className="animate-slideUp">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
            Select Subcategory
          </h3>
          {subcategoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subcategories.map((subcat: any, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSubcategorySelect(subcat)}
                  className={`group p-5 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedSubcategory === subcat.slug
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10"
                      : "border-surface-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-primary-300 dark:hover:border-primary-500/50"
                  }`}
                >
                  <h4 className={`font-medium ${
                    selectedSubcategory === subcat.slug
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-surface-800 dark:text-surface-200"
                  }`}>
                    {subcat.name}
                  </h4>
                  {selectedSubcategory === subcat.slug && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs">
                      <CheckIcon />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Step 2: Basic Details
  const renderDetailsStep = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Product Title */}
          <div className="premium-card p-6">
            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">
              Product Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={productData.name}
              onChange={(e) => updateProductData("name", e.target.value)}
              placeholder="Enter a descriptive product title"
              className="input-premium"
              required
            />
          </div>

          {/* Brand Name */}
          <div className="premium-card p-6">
            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">
              Brand Name
            </label>
            <input
              type="text"
              value={productData.brand_name}
              onChange={(e) => updateProductData("brand_name", e.target.value)}
              placeholder="Enter brand name"
              className="input-premium"
            />
          </div>

          {/* Pricing */}
          <div className="premium-card p-6">
            <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-4">
              Pricing
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-surface-600 dark:text-surface-400 mb-2">
                  Price <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500">$</span>
                  <input
                    type="number"
                    value={productData.mrp}
                    onChange={(e) => updateProductData("mrp", e.target.value)}
                    placeholder="0.00"
                    className="input-premium pl-8"
                    required
                  />
                </div>
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  hasDiscount ? "bg-primary-500 border-primary-500" : "border-surface-300 dark:border-dark-border"
                }`}>
                  {hasDiscount && <CheckIcon />}
                </div>
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  This product has a discount
                </span>
                <input
                  type="checkbox"
                  checked={hasDiscount}
                  onChange={(e) => setHasDiscount(e.target.checked)}
                  className="sr-only"
                />
              </label>

              {hasDiscount && (
                <div className="animate-slideUp">
                  <label className="block text-sm text-surface-600 dark:text-surface-400 mb-2">
                    Discounted Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500">$</span>
                    <input
                      type="number"
                      value={productData.unit_price}
                      onChange={(e) => updateProductData("unit_price", e.target.value)}
                      placeholder="0.00"
                      className="input-premium pl-8"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="premium-card p-6">
            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">
              Stock Quantity <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              value={productData.quantity}
              onChange={(e) => updateProductData("quantity", e.target.value)}
              placeholder="Enter available quantity"
              className="input-premium"
              required
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Short Description */}
          <div className="premium-card p-6">
            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">
              Short Description <span className="text-danger">*</span>
            </label>
            <div className="rounded-xl overflow-hidden">
              <ReactQuill
                theme="snow"
                value={productData.short_description}
                formats={formats}
                onChange={(e: string) => {
                  if (e.length <= 255) {
                    setProductData(prev => ({ ...prev, short_description: e }));
                  }
                }}
                className="bg-white dark:bg-dark-input"
              />
            </div>
            <p className={`text-xs mt-2 ${
              productData.short_description.length >= 255 ? "text-danger" : "text-surface-500"
            }`}>
              {productData.short_description.length}/255 characters
            </p>
          </div>

          {/* Long Description */}
          <div className="premium-card p-6">
            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">
              Long Description
            </label>
            <div className="rounded-xl overflow-hidden">
              <ReactQuill
                theme="snow"
                value={productData.description}
                formats={formats}
                onChange={(val: string) => setProductData(prev => ({ ...prev, description: val }))}
                className="bg-white dark:bg-dark-input min-h-[150px]"
              />
            </div>
          </div>

          {/* Dimensions Toggle */}
          <div className="premium-card p-6">
            <button
              type="button"
              onClick={() => setShowDimensions(!showDimensions)}
              className="flex items-center justify-between w-full"
            >
              <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                Product Dimensions (Optional)
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 ${
                showDimensions ? "rotate-45" : ""
              } bg-surface-100 dark:bg-dark-surface`}>
                <PlusIcon />
              </div>
            </button>
            
            {showDimensions && (
              <div className="grid grid-cols-2 gap-4 mt-4 animate-slideUp">
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Length</label>
                  <input
                    type="number"
                    value={productData.length}
                    onChange={(e) => updateProductData("length", e.target.value)}
                    placeholder="0"
                    className="input-premium"
                  />
                </div>
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Width</label>
                  <input
                    type="number"
                    value={productData.width}
                    onChange={(e) => updateProductData("width", e.target.value)}
                    placeholder="0"
                    className="input-premium"
                  />
                </div>
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Height</label>
                  <input
                    type="number"
                    value={productData.height}
                    onChange={(e) => updateProductData("height", e.target.value)}
                    placeholder="0"
                    className="input-premium"
                  />
                </div>
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Weight</label>
                  <input
                    type="number"
                    value={productData.weight}
                    onChange={(e) => updateProductData("weight", e.target.value)}
                    placeholder="0"
                    className="input-premium"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Attributes
  const renderAttributesStep = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Variant Attributes */}
      {variantAttributes.length > 0 && (
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-pink flex items-center justify-center text-white">
              <SparklesIcon />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Product Variants</h3>
              <p className="text-sm text-surface-500">Configure variant-specific details</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {variantAttributes.map((attr, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                  {attr.name}
                </label>
                {renderAttributeInput(attr, true, index)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-Variant Attributes */}
      {nonVariantAttributes.length > 0 && (
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center text-white">
              <TagIcon />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Product Specifications</h3>
              <p className="text-sm text-surface-500">Additional product details</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nonVariantAttributes.map((attr, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                  {attr.name}
                </label>
                {renderAttributeInput(attr, false, index)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO Fields */}
      <div className="premium-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-blue flex items-center justify-center text-white">
            <TagIcon />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">SEO Settings</h3>
            <p className="text-sm text-surface-500">Optimize for search engines</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              SEO Title
            </label>
            <input
              type="text"
              value={productData.meta_title}
              onChange={(e) => updateProductData("meta_title", e.target.value)}
              placeholder="Meta title for search engines"
              className="input-premium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              SEO Tags
            </label>
            <input
              type="text"
              value={productData.tags}
              onChange={(e) => updateProductData("tags", e.target.value)}
              placeholder="Tags separated by commas"
              className="input-premium"
            />
          </div>
        </div>
      </div>

      {allowedAttributes.length === 0 && (
        <div className="premium-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-dark-surface mx-auto mb-4 flex items-center justify-center">
            <TagIcon />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
            No Specific Attributes Required
          </h3>
          <p className="text-surface-500">
            This category doesn't require any specific attributes. You can proceed to the next step.
          </p>
        </div>
      )}
    </div>
  );

  // Step 4: Media Upload
  const renderMediaStep = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="premium-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-pink flex items-center justify-center text-white">
            <ImageIcon />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Product Images</h3>
            <p className="text-sm text-surface-500">Upload up to 4 images (First image will be the cover)</p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
            dragActive
              ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10"
              : "border-surface-300 dark:border-dark-border hover:border-primary-400 dark:hover:border-primary-500/50"
          }`}
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
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              dragActive
                ? "bg-primary-500 text-white"
                : "bg-surface-100 dark:bg-dark-surface text-surface-400"
            }`}>
              <UploadIcon />
            </div>
            <p className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-1">
              Drag and drop images here
            </p>
            <p className="text-sm text-surface-500 mb-4">or click to browse</p>
            <p className="text-xs text-surface-400">
              PNG, JPG, GIF up to 10MB each (max 4 images)
            </p>
          </div>
        </div>

        {/* Image Previews */}
        {files.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-4">
              Uploaded Images ({files.length}/4)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-xl overflow-hidden bg-surface-100 dark:bg-dark-surface"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded-lg">
                      Cover
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-danger text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-danger-dark"
                  >
                    <TrashIcon />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs truncate">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Step 5: Review
  const renderReviewStep = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Summary Header */}
      <div className="premium-card p-6 bg-gradient-pink text-white">
        <h3 className="text-xl font-bold mb-2">Review Your Product</h3>
        <p className="text-white/80">Please check all details before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Info Summary */}
        <div className="premium-card p-6">
          <h4 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <PackageIcon /> Product Information
          </h4>
          <dl className="space-y-3">
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-dark-border">
              <dt className="text-surface-500">Category</dt>
              <dd className="font-medium text-surface-900 dark:text-white">{selectedCategoryName}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-dark-border">
              <dt className="text-surface-500">Subcategory</dt>
              <dd className="font-medium text-surface-900 dark:text-white">{selectedSubcategoryName}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-dark-border">
              <dt className="text-surface-500">Title</dt>
              <dd className="font-medium text-surface-900 dark:text-white">{productData.name}</dd>
            </div>
            {productData.brand_name && (
              <div className="flex justify-between py-2 border-b border-surface-100 dark:border-dark-border">
                <dt className="text-surface-500">Brand</dt>
                <dd className="font-medium text-surface-900 dark:text-white">{productData.brand_name}</dd>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-dark-border">
              <dt className="text-surface-500">Price</dt>
              <dd className="font-medium text-primary-500">
                ${hasDiscount ? productData.unit_price : productData.mrp}
                {hasDiscount && (
                  <span className="text-surface-400 line-through ml-2 text-sm">${productData.mrp}</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-surface-500">Stock</dt>
              <dd className="font-medium text-surface-900 dark:text-white">{productData.quantity} units</dd>
            </div>
          </dl>
        </div>

        {/* Images Summary */}
        <div className="premium-card p-6">
          <h4 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <ImageIcon /> Product Images
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {files.map((file, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Attributes Summary */}
        {(variantAttributes.length > 0 || nonVariantAttributes.length > 0) && (
          <div className="premium-card p-6 lg:col-span-2">
            <h4 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <TagIcon /> Product Attributes
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...variantAttributes, ...nonVariantAttributes]
                .filter(attr => attr.value !== "" && attr.value !== false)
                .map((attr, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-surface-50 dark:bg-dark-surface"
                  >
                    <p className="text-xs text-surface-500 mb-1">{attr.name}</p>
                    <p className="font-medium text-surface-900 dark:text-white">
                      {typeof attr.value === "boolean" ? (attr.value ? "Yes" : "No") : attr.value}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderCategoryStep();
      case 2: return renderDetailsStep();
      case 3: return renderAttributesStep();
      case 4: return renderMediaStep();
      case 5: return renderReviewStep();
      default: return null;
    }
  };

  // ============ MAIN RENDER ============
  if (loading) {
    return <Loader2 />;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-2">
          Add New Product
        </h1>
        <p className="text-surface-500">
          Create a new product listing for your store
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center min-w-max pb-4">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            
            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => goToStep(step.id)}
                  disabled={step.id > currentStep && !completedSteps.includes(step.id - 1)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isCurrent
                      ? "bg-gradient-pink text-white shadow-glow-pink"
                      : isCompleted
                      ? "bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400"
                      : "bg-surface-100 dark:bg-dark-surface text-surface-400 hover:bg-surface-200 dark:hover:bg-dark-hover"
                  } ${step.id > currentStep && !completedSteps.includes(step.id - 1) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isCurrent
                      ? "bg-white/20"
                      : isCompleted
                      ? "bg-primary-500 text-white"
                      : "bg-surface-200 dark:bg-dark-hover"
                  }`}>
                    {isCompleted ? <CheckIcon /> : <StepIcon />}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="font-semibold text-sm">{step.name}</p>
                    <p className={`text-xs ${isCurrent ? "text-white/70" : "text-surface-500"}`}>
                      {step.description}
                    </p>
                  </div>
                </button>
                
                {index < STEPS.length - 1 && (
                  <div className={`w-8 md:w-16 h-0.5 mx-2 transition-colors ${
                    completedSteps.includes(step.id)
                      ? "bg-primary-500"
                      : "bg-surface-200 dark:bg-dark-border"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl border-t border-surface-200 dark:border-dark-border p-4 md:p-6 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              currentStep === 1
                ? "opacity-50 cursor-not-allowed bg-surface-100 dark:bg-dark-surface text-surface-400"
                : "bg-surface-100 dark:bg-dark-surface text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-dark-hover"
            }`}
          >
            <ChevronLeftIcon />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step.id === currentStep
                    ? "bg-primary-500"
                    : completedSteps.includes(step.id)
                    ? "bg-primary-300"
                    : "bg-surface-300 dark:bg-dark-border"
                }`}
              />
            ))}
          </div>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                canProceed()
                  ? "bg-gradient-pink text-white shadow-glow-pink hover:opacity-90"
                  : "opacity-50 cursor-not-allowed bg-surface-300 text-surface-500"
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-gradient-pink text-white shadow-glow-pink hover:opacity-90 transition-all duration-300"
            >
              <SparklesIcon />
              <span>Publish Product</span>
            </button>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddProducts;
