"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getSchemaCategories, getSchemaSubcategories, getFormSchema, saveProducts } from "@/api/products";
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
  { id: 2, name: "Details", description: "Product information", icon: PackageIcon },
  { id: 3, name: "Review", description: "Final check", icon: SparklesIcon },
];

// Categories that don't require media upload (add category names here)
const CATEGORIES_WITHOUT_MEDIA = [
  "Business For Sale",
  // Add more category names here as needed
];

// Categories that don't require dimensions
const CATEGORIES_WITHOUT_DIMENSIONS = [
  "Business For Sale",
  // Add more category names here as needed
];

// Categories that don't require stock quantity
const CATEGORIES_WITHOUT_STOCK = [
  "Business For Sale",
  // Add more category names here as needed
];

// Categories that don't require brand name
const CATEGORIES_WITHOUT_BRAND = [
  "Business For Sale",
  // Add more category names here as needed
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

  // Check if current category should hide media upload
  const shouldHideMedia = useMemo(() => {
    return CATEGORIES_WITHOUT_MEDIA.some(
      (cat) => cat.toLowerCase() === selectedCategoryName.toLowerCase()
    );
  }, [selectedCategoryName]);

  // Check if current category should hide dimensions
  const shouldHideDimensions = useMemo(() => {
    return CATEGORIES_WITHOUT_DIMENSIONS.some(
      (cat) => cat.toLowerCase() === selectedCategoryName.toLowerCase()
    );
  }, [selectedCategoryName]);

  // Check if current category should hide stock
  const shouldHideStock = useMemo(() => {
    return CATEGORIES_WITHOUT_STOCK.some(
      (cat) => cat.toLowerCase() === selectedCategoryName.toLowerCase()
    );
  }, [selectedCategoryName]);

  // Check if current category should hide brand name
  const shouldHideBrand = useMemo(() => {
    return CATEGORIES_WITHOUT_BRAND.some(
      (cat) => cat.toLowerCase() === selectedCategoryName.toLowerCase()
    );
  }, [selectedCategoryName]);

  // Load categories on mount using schema API
  useEffect(() => {
    getSchemaCategories().then((result) => {
      if (!result.error && result.data) {
        console.log("Categories:", result.data);
        setCategories(result.data);
      }
    });
  }, []);

  // Load subcategories when category changes using schema API
  useEffect(() => {
    if (selectedCategory) {
      setSubcategoriesLoading(true);
      setSelectedSubcategory("");
      setSelectedSubcategoryName("");
      setAllowedAttributes([]);
      setVariantAttributes([]);
      setNonVariantAttributes([]);

      getSchemaSubcategories(selectedCategory)
        .then((result) => {
          if (!result.error && result.data) {
            setSubcategories(result.data);
          }
          setSubcategoriesLoading(false);
        })
        .catch(() => {
          setSubcategoriesLoading(false);
        });
    }
  }, [selectedCategory]);

  // Handle category selection (updated for schema API)
  const handleCategorySelect = (cat: { id: string; name: string }) => {
    setSelectedCategory(cat.id);
    console.log("Selected category:", cat);
    setSelectedCategoryName(cat.name);
    setProductData(prev => ({ ...prev, category: cat.id }));
  };

  // Handle subcategory selection (updated for schema API + fetch form schema)
  const handleSubcategorySelect = async (subcat: { id: string; name: string }) => {
    console.log("=== SUBCATEGORY SELECTED ===");
    console.log("Subcategory data:", subcat);

    setSelectedSubcategory(subcat.id);
    setSelectedSubcategoryName(subcat.name);
    setProductData(prev => ({ ...prev, subcategory: subcat.id }));

    // Fetch form schema for dynamic fields
    try {
      const schemaResult = await getFormSchema(selectedCategory, subcat.id);
      console.log("Form schema result:", schemaResult);

      if (!schemaResult.error && schemaResult.data) {
        const fields = schemaResult.data.fields || [];

        // Helper to get initial value based on field type
        const getInitialValue = (fieldType: string) => {
          switch (fieldType) {
            case "checkbox":
              return false;
            case "multi_select":
              return [];
            default:
              return "";
          }
        };

        // Map schema field types to our internal data_type
        const mapFieldType = (type: string) => {
          switch (type) {
            case "checkbox": return "bool";
            case "select": return "select";
            case "multi_select": return "multi_select";
            case "number": return "number";
            case "textarea": return "textarea";
            case "text": return "text";
            default: return "text";
          }
        };

        // Convert schema fields to attribute format
        // All fields from schema are treated as non-variant attributes
        const schemaAttributes = fields.map((field: any) => ({
          name: field.label || field.key,
          key: field.key,
          value: getInitialValue(field.type),
          data_type: mapFieldType(field.type),
          options: field.options || [],
          required: field.required || false,
          placeholder: field.placeholder || "",
          suffix: field.suffix || "",
          min: field.min,
          max: field.max,
          step: field.step,
          additional_price: 0
        }));

        setNonVariantAttributes(schemaAttributes);
        setAllowedAttributes(schemaAttributes);
        setVariantAttributes([]); // Schema API doesn't distinguish variants
      }
    } catch (error) {
      console.error("Error fetching form schema:", error);
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

  // Step navigation - Updated for 3 steps
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedCategory && selectedSubcategory;
      case 2:
        // Details step: requires name, mrp, and at least 1 image (unless category hides media)
        return productData.name && productData.mrp && (shouldHideMedia || files.length > 0);
      case 3:
        return true; // Review step
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 3) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    } else if (!canProceed()) {
      if (currentStep === 2 && !shouldHideMedia && files.length === 0) {
        toast.error("Please upload at least one image");
      } else {
        toast.error("Please complete all required fields");
      }
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

      // Clean product data - remove empty optional fields
      const cleanedProductData = { ...productData, unit_price: finalUnitPrice };

      // Remove quantity if empty (it's optional)
      if (cleanedProductData.quantity === "" || cleanedProductData.quantity === null || cleanedProductData.quantity === undefined) {
        delete (cleanedProductData as any).quantity;
      }

      // Helper to check if attribute has a value
      const hasValue = (a: any) => {
        if (Array.isArray(a.value)) return a.value.length > 0;
        if (typeof a.value === "boolean") return true;
        return a.value !== "";
      };

      // Helper to format attribute value
      const formatValue = (value: any) => {
        if (Array.isArray(value)) return value.join(", ");
        return String(value);
      };

      // Combine attributes
      const allAttributes = [
        ...nonVariantAttributes.filter(hasValue).map(a => ({
          name: a.name,
          value: formatValue(a.value),
          additional_price: a.additional_price || 0
        })),
        ...variantAttributes.filter(hasValue).map(v => ({
          name: v.name,
          value: formatValue(v.value),
          additional_price: v.additional_price || 0
        }))
      ];

      setLoading(true);
      console.log("=== SUBMITTING PRODUCT DATA ===", cleanedProductData, allAttributes, files);
      try {
        const res: any = await saveProducts(
          token,
          vendor_id,
          cleanedProductData as any,
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

    // Handle multi_select toggle
    const toggleMultiSelectOption = (option: string) => {
      const currentValues = Array.isArray(attr.value) ? attr.value : [];
      if (currentValues.includes(option)) {
        updateAttr(currentValues.filter((v: string) => v !== option));
      } else {
        updateAttr([...currentValues, option]);
      }
    };

    switch (attr.data_type) {
      case "number":
        return (
          <div className="relative">
            {attr.suffix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">{attr.suffix}</span>
            )}
            <input
              type="number"
              value={attr.value}
              onChange={(e) => updateAttr(e.target.value)}
              placeholder={attr.placeholder || `Enter ${attr.name.toLowerCase()}`}
              className={`${inputClasses} ${attr.suffix ? 'pl-7' : ''}`}
              min={attr.min}
              max={attr.max}
              step={attr.step}
            />
          </div>
        );

      case "textarea":
        return (
          <textarea
            value={attr.value}
            onChange={(e) => updateAttr(e.target.value)}
            placeholder={attr.placeholder || `Enter ${attr.name.toLowerCase()}`}
            className={`${inputClasses} min-h-[100px] resize-y`}
            rows={3}
          />
        );

      case "boolean":
      case "bool":
      case "checkbox":
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateAttr(!attr.value)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${attr.value
                ? "bg-gradient-to-r from-primary-500 to-pink-500"
                : "bg-surface-300 dark:bg-dark-border"
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${attr.value ? "translate-x-6" : "translate-x-1"
                  }`}
              />
            </button>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {attr.name}
            </span>
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

      case "multi_select":
        const selectedValues = Array.isArray(attr.value) ? attr.value : [];
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {attr.options?.map((opt: string, i: number) => {
                const isSelected = selectedValues.includes(opt);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleMultiSelectOption(opt)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border-2 ${isSelected
                      ? "bg-gradient-to-r from-primary-500 to-pink-500 text-white border-transparent shadow-md"
                      : "bg-surface-50 dark:bg-dark-input text-surface-700 dark:text-surface-300 border-surface-200 dark:border-dark-border hover:border-primary-400 dark:hover:border-primary-500"
                      }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {selectedValues.length > 0 && (
              <div className="text-xs text-surface-500">
                Selected: {selectedValues.join(", ")}
              </div>
            )}
          </div>
        );

      case "text":
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

  // Helper function to group attributes by data type
  const groupAttributesByType = (attributes: any[]) => {
    const groups: { [key: string]: { attr: any; index: number }[] } = {
      text: [],
      number: [],
      boolean: [],
      select: [],
      multi_select: [],
      textarea: [],
    };

    attributes.forEach((attr, index) => {
      const type = attr.data_type || "text";
      if (type === "bool" || type === "boolean" || type === "checkbox") {
        groups.boolean.push({ attr, index });
      } else if (groups[type]) {
        groups[type].push({ attr, index });
      } else {
        groups.text.push({ attr, index });
      }
    });

    return groups;
  };

  // Get label for attribute type section
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "text": return "Text Fields";
      case "number": return "Numeric Fields";
      case "boolean": return "Toggle Options";
      case "select": return "Dropdown Selections";
      case "multi_select": return "Multi-Select Options";
      default: return "Other Fields";
    }
  };

  // ============ STEP COMPONENTS ============

  // Step 1: Category Selection
  const renderCategoryStep = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Category Selection */}
      <div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-5">
          Select Category
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((cat: { id: string; name: string; description?: string }, index) => (
            <button
              key={cat.id || index}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-center overflow-hidden ${selectedCategory === cat.id
                ? "border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-500/10 dark:to-primary-500/5 shadow-glow-pink scale-[1.02]"
                : "border-surface-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-primary-300 dark:hover:border-primary-500/50 hover:shadow-premium-md hover:scale-[1.02]"
                }`}
            >
              {/* Background Gradient Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${selectedCategory === cat.id
                ? "from-primary-500/5 to-transparent opacity-100"
                : "from-primary-500/0 to-transparent opacity-0 group-hover:opacity-100"
                }`} />

              {/* Content */}
              <div className="relative z-10">
                <h4 className={`font-semibold text-sm transition-colors ${selectedCategory === cat.id
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-surface-900 dark:text-white group-hover:text-primary-500 dark:group-hover:text-primary-400"
                  }`}>
                  {cat.name}
                </h4>
              </div>

              {/* Selected Indicator */}
              {selectedCategory === cat.id && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-pink rounded-full flex items-center justify-center text-white shadow-lg animate-scaleIn">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Bottom Accent Line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-pink transition-all duration-300 ${selectedCategory === cat.id
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-50"
                }`} />
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory Selection */}
      {selectedCategory && (
        <div className="animate-slideUp">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-5">
            Select Subcategory
          </h3>
          {subcategoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {subcategories && subcategories.map((subcat: { id: string; name: string }, index) => (
                <button
                  key={subcat.id || index}
                  type="button"
                  onClick={() => handleSubcategorySelect(subcat)}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-center overflow-hidden ${selectedSubcategory === subcat.id
                    ? "border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-500/10 dark:to-primary-500/5 shadow-glow-pink"
                    : "border-surface-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-primary-300 dark:hover:border-primary-500/50 hover:shadow-premium-sm"
                    }`}
                >
                  {/* Background Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${selectedSubcategory === subcat.id
                    ? "from-primary-500/5 to-transparent opacity-100"
                    : "from-primary-500/0 to-transparent opacity-0 group-hover:opacity-100"
                    }`} />

                  {/* Content */}
                  <div className="relative z-10">
                    <h4 className={`font-medium text-sm transition-colors ${selectedSubcategory === subcat.id
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-surface-800 dark:text-surface-200 group-hover:text-primary-500 dark:group-hover:text-primary-400"
                      }`}>
                      {subcat.name}
                    </h4>
                  </div>

                  {/* Selected Indicator */}
                  {selectedSubcategory === subcat.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-md animate-scaleIn">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Bottom Accent */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-pink transition-all duration-300 ${selectedSubcategory === subcat.id
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-50"
                    }`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );


  // Step 3: Attributes
  // Render grouped attributes section
  const renderGroupedAttributes = (attributes: any[], isVariant: boolean, title: string, description: string, gradientClass: string, IconComponent: React.FC) => {
    if (attributes.length === 0) return null;

    const groups = groupAttributesByType(attributes);
    const typeOrder = ["text", "number", "select", "multi_select", "textarea", "boolean"];

    return (
      <div className="premium-card p-6">
        <div className="space-y-8">
          {typeOrder.map((type) => {
            const typeAttrs = groups[type];
            if (!typeAttrs || typeAttrs.length === 0) return null;

            return (
              <div key={type} className="space-y-4">
                {/* {<div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    {getTypeLabel(type)}
                  </span>
                  <div className="flex-1 h-px bg-surface-200 dark:bg-dark-border" />
                </div>} */}

                {/* Text and Number fields in 2-column grid */}
                {(type === "text" || type === "number") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {typeAttrs.map(({ attr, index }) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                          {attr.name}
                          {attr.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderAttributeInput(attr, isVariant, index)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Select fields in 2-column grid */}
                {type === "select" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {typeAttrs.map(({ attr, index }) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                          {attr.name}
                          {attr.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderAttributeInput(attr, isVariant, index)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Multi-select fields full width */}
                {type === "multi_select" && (
                  <div className="space-y-6">
                    {typeAttrs.map(({ attr, index }) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                          {attr.name}
                          {attr.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderAttributeInput(attr, isVariant, index)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Textarea fields - 2 column grid */}
                {type === "textarea" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {typeAttrs.map(({ attr, index }) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                          {attr.name}
                          {attr.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderAttributeInput(attr, isVariant, index)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Boolean fields in responsive flex wrap */}
                {type === "boolean" && (
                  <div className="flex flex-wrap gap-6">
                    {typeAttrs.map(({ attr, index }) => (
                      <div key={index}>
                        {renderAttributeInput(attr, isVariant, index)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAttributesStep = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Variant Attributes */}
      {renderGroupedAttributes(
        variantAttributes,
        true,
        "Product Variants",
        "Configure variant-specific details",
        "bg-gradient-pink",
        SparklesIcon
      )}

      {/* Non-Variant Attributes */}
      {renderGroupedAttributes(
        nonVariantAttributes,
        false,
        "Specifications",
        "Additional product details",
        "bg-gradient-purple",
        TagIcon
      )}

      {/* SEO Fields */}
      <div className="premium-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-blue flex items-center justify-center text-white">
            <TagIcon />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">SEO Settings(Optional)</h3>
            <p className="text-sm text-surface-500">This helps to rank your listing in search results</p>
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
        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${dragActive
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
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragActive
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
      <div className="premium-card p-6  text-white">
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
        {
          files.length > 0 && (
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
          )
        }

        {/* Attributes Summary */}
        {(variantAttributes.length > 0 || nonVariantAttributes.length > 0) && (
          <div className="premium-card p-6 lg:col-span-2">
            <h4 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <TagIcon /> Product Attributes
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...variantAttributes, ...nonVariantAttributes]
                .filter(attr => {
                  if (Array.isArray(attr.value)) return attr.value.length > 0;
                  return attr.value !== "" && attr.value !== false;
                })
                .map((attr, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-surface-50 dark:bg-dark-surface"
                  >
                    <p className="text-xs text-surface-500 mb-1">{attr.name}</p>
                    <p className="font-medium text-surface-900 dark:text-white">
                      {Array.isArray(attr.value)
                        ? attr.value.join(", ")
                        : typeof attr.value === "boolean"
                          ? (attr.value ? "Yes" : "No")
                          : attr.value}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render current step content - Updated for 3 steps
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderCategoryStep();
      case 2:
        // Combined step: Details + Attributes + Media - PREMIUM REDESIGNED LAYOUT
        return (
          <div className="animate-fadeIn">
            {/* Hero Section - Product Identity */}
            <div className="relative mb-8">
              {/* Gradient Background Accent */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-pink-500/5 to-purple-500/5 rounded-2xl" />

              <div className="relative premium-card p-6 md:p-8 border-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm">
                {/* Category Breadcrumb */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary-500/10 to-pink-500/10 border border-primary-200 dark:border-primary-500/20">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{selectedCategoryName}</span>
                  </span>
                  <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-surface-100 dark:bg-dark-surface border border-surface-200 dark:border-dark-border">
                    <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{selectedSubcategoryName}</span>
                  </span>
                </div>

                {/* Product Title - Hero Input */}
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-pink-500 rounded-full" />
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
                    Product Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={productData.name}
                    onChange={(e) => updateProductData("name", e.target.value)}
                    placeholder="Enter a product title..."
                    className="w-full px-0 py-3 text-xl md:text-2xl font-semibold bg-transparent border-0 border-b-2 border-surface-200 dark:border-dark-border text-surface-900 dark:text-white placeholder:text-surface-300 dark:placeholder:text-surface-600 focus:border-primary-500 focus:ring-0 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section - Modern Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Regular Price Card */}
              <div className="premium-card p-6 relative overflow-hidden group hover:shadow-premium transition-shadow duration-300">
                {/* Card Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500" />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/25">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-white">Regular Price</h4>
                      <p className="text-xs text-surface-500">Base price before any discounts</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-danger">Required</span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-surface-400">$</span>
                  <input
                    type="number"
                    value={productData.mrp}
                    onChange={(e) => updateProductData("mrp", e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-4 text-2xl font-bold rounded-xl bg-surface-50 dark:bg-dark-input border-2 border-surface-200 dark:border-dark-border text-surface-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Sale Price Card */}
              <div className={`premium-card p-6 relative overflow-hidden transition-all duration-500 ${hasDiscount ? 'ring-2 ring-primary-500 shadow-glow-pink' : 'opacity-75 hover:opacity-100'}`}>
                {/* Card Accent - Animated when active */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-pink-500 transition-opacity ${hasDiscount ? 'opacity-100' : 'opacity-30'}`} />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${hasDiscount ? 'bg-gradient-to-br from-primary-500 to-pink-500 shadow-pink-500/25' : 'bg-surface-400 shadow-surface-500/25'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-white">Sale Price</h4>
                      <p className="text-xs text-surface-500">Discounted price for buyers</p>
                    </div>
                  </div>

                  {/* Premium Toggle */}
                  <button
                    type="button"
                    onClick={() => setHasDiscount(!hasDiscount)}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${hasDiscount
                      ? "bg-gradient-to-r from-primary-500 to-pink-500"
                      : "bg-surface-300 dark:bg-dark-border"
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${hasDiscount ? "translate-x-8" : "translate-x-1"}`}
                    />
                  </button>
                </div>

                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold transition-colors ${hasDiscount ? 'text-primary-500' : 'text-surface-300'}`}>$</span>
                  <input
                    type="number"
                    value={productData.unit_price}
                    onChange={(e) => updateProductData("unit_price", e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-12 pr-4 py-4 text-2xl font-bold rounded-xl border-2 transition-all ${hasDiscount
                      ? 'bg-surface-50 dark:bg-dark-input border-primary-200 dark:border-primary-500/30 text-surface-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                      : 'bg-surface-100 dark:bg-dark-surface border-surface-200 dark:border-dark-border text-surface-400 cursor-not-allowed'
                      }`}
                    disabled={!hasDiscount}
                  />
                </div>

                {/* Discount Badge */}
                {hasDiscount && productData.mrp && productData.unit_price && Number(productData.mrp) > Number(productData.unit_price) && (
                  <div className="mt-4 flex items-center gap-2 animate-fadeIn">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-sm font-semibold">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {Math.round((1 - Number(productData.unit_price) / Number(productData.mrp)) * 100)}% OFF
                    </span>
                    <span className="text-xs text-surface-500">Customer saves ${(Number(productData.mrp) - Number(productData.unit_price)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Brand & Stock Row */}
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
                    <input
                      type="text"
                      value={productData.brand_name}
                      onChange={(e) => updateProductData("brand_name", e.target.value)}
                      placeholder="Enter brand name"
                      className="input-premium"
                    />
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
                    <input
                      type="number"
                      value={productData.quantity}
                      onChange={(e) => updateProductData("quantity", e.target.value)}
                      placeholder="Available units"
                      className="input-premium"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Description Section - Enhanced */}
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
                {/* Short Description */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      Short Description <span className="text-danger">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-surface-200 dark:bg-dark-border overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${productData.short_description.length > 200 ? 'bg-orange-500' : 'bg-primary-500'}`}
                          style={{ width: `${Math.min((productData.short_description.length / 255) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-400">{productData.short_description.length}/255</span>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border-2 border-surface-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-500/50 transition-colors">
                    <ReactQuill
                      theme="snow"
                      value={productData.short_description}
                      formats={formats}
                      onChange={(e: string) => {
                        if (e.length <= 255) {
                          setProductData(prev => ({ ...prev, short_description: e }));
                        }
                      }}
                      className="bg-white dark:bg-dark-input [&_.ql-container]:!min-h-[120px] [&_.ql-editor]:!min-h-[120px]"
                    />
                  </div>
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                    Detailed Description
                  </label>
                  <div className="rounded-xl overflow-hidden border-2 border-surface-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-500/50 transition-colors">
                    <ReactQuill
                      theme="snow"
                      value={productData.description}
                      formats={formats}
                      onChange={(val: string) => setProductData(prev => ({ ...prev, description: val }))}
                      className="bg-white dark:bg-dark-input [&_.ql-container]:!min-h-[120px] [&_.ql-editor]:!min-h-[120px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dimensions - Sleek Collapsible */}
            {!shouldHideDimensions && (
              <div className="premium-card overflow-hidden mb-6">
                <button
                  type="button"
                  onClick={() => setShowDimensions(!showDimensions)}
                  className="flex items-center justify-between w-full p-5 hover:bg-surface-50 dark:hover:bg-dark-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showDimensions ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/25' : 'bg-surface-100 dark:bg-dark-surface text-surface-500'}`}>
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
                  <div className="px-5 pb-5 pt-2 border-t border-surface-100 dark:border-dark-border animate-slideUp">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Length", key: "length", unit: "cm" },
                        { label: "Width", key: "width", unit: "cm" },
                        { label: "Height", key: "height", unit: "cm" },
                        { label: "Weight", key: "weight", unit: "kg" }
                      ].map(({ label, key, unit }) => (
                        <div key={key}>
                          <label className="text-xs font-medium text-surface-500 mb-2 block">{label}</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={(productData as any)[key]}
                              onChange={(e) => updateProductData(key as keyof typeof productData, e.target.value)}
                              placeholder="0"
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

            {/* Dynamic Attributes Section */}
            {(variantAttributes.length > 0 || nonVariantAttributes.length > 0) && (
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
                {renderAttributesStep()}
              </div>
            )}

            {/* Media Upload Section */}
            {!shouldHideMedia && (
              <div className="premium-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/25">
                    <ImageIcon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white">Product Images <span className="text-danger">*</span></h3>
                  </div>
                </div>
                {renderMediaStep()}
              </div>
            )}
          </div>
        );
      case 3: return renderReviewStep();
      default: return null;
    }
  };

  // ============ MAIN RENDER ============
  if (loading) {
    return <Loader2 />;
  }

  return (
    <div className="min-h-screen pb-20">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isCurrent
                    ? "bg-gradient-pink text-white shadow-glow-pink"
                    : isCompleted
                      ? "bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400"
                      : "bg-surface-100 dark:bg-dark-surface text-surface-400 hover:bg-surface-200 dark:hover:bg-dark-hover"
                    } ${step.id > currentStep && !completedSteps.includes(step.id - 1) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCurrent
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
                  <div className={`w-8 md:w-16 h-0.5 mx-2 transition-colors ${completedSteps.includes(step.id)
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
      <div className="fixed  left-0 right-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl border-t border-surface-200 dark:border-dark-border p-4 md:p-6 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${currentStep === 1
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
                className={`w-2 h-2 rounded-full transition-colors ${step.id === currentStep
                  ? "bg-primary-500"
                  : completedSteps.includes(step.id)
                    ? "bg-primary-300"
                    : "bg-surface-300 dark:bg-dark-border"
                  }`}
              />
            ))}
          </div>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${canProceed()
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
              <span>Publish</span>
            </button>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddProducts;
