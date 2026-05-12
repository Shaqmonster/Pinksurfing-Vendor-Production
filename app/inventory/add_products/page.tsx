"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  getSchemaCategories,
  getSchemaSubcategories,
  getFormSchema,
  saveProducts,
  createSquareListingPaymentLink,
} from "@/api/products";
import { Product } from "@/types/product";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2 } from "@/components/common/Loader";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { handleError } from "@/utils/toast";
import { getCookie } from "@/utils/cookies";
import {
  SHORT_DESCRIPTION_MAX_PLAIN,
  truncateUnicodePlain,
  plainToQuillShortDescriptionHtml,
} from "@/utils/shortDescription";
import {
  PendingListing,
  getPendingListings,
  upsertPendingListing,
  updatePendingListingState,
} from "@/utils/pendingListings";
import { isBusinessForSaleCategory } from "@/components/inventory/businessForSaleCategory";
import {
  BusinessForSaleListingWizard,
  type BusinessForSaleListingWizardHandle,
} from "@/components/inventory/BusinessForSaleListingWizard";

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

// ============ SEARCHABLE SELECT ============
function SearchableSelect({
  label,
  value,
  options,
  loading,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string, label: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find(o => o.value === value);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300"
      >
        <span className={selected ? "text-surface-900 dark:text-surface-50" : "text-surface-400 dark:text-surface-500"}>
          {loading ? "Loading…" : (selected?.label ?? placeholder ?? `Select ${label}`)}
        </span>
        <svg className={`w-4 h-4 text-surface-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border shadow-2xl max-h-60 flex flex-col overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-light-border dark:border-dark-border flex-shrink-0">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${label}…`}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border focus:outline-none focus:border-primary-500 text-surface-900 dark:text-white"
              />
            </div>
          </div>
          <ul className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-surface-400 text-center">No results found</li>
            ) : filtered.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors ${opt.value === value ? "text-primary-500 font-bold bg-primary-50 dark:bg-primary-500/10" : "text-surface-900 dark:text-white"}`}
                  onClick={() => { onChange(opt.value, opt.label); setOpen(false); }}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Subcategory schema fields already collected in BusinessForSaleListingWizard — hide from Attributes step. */
function bfsSchemaAttrSupersededByWizard(attr: any): boolean {
  const k = String(attr.key ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
  const n = String(attr.name ?? "").toLowerCase().trim();

  const km = (frag: string) => k === frag || k.includes(`_${frag}`) || k.includes(`${frag}_`) || k.includes(frag);
  const nm = (frag: string) => n === frag || n.includes(frag);

  if (km("country") || n === "country") return true;
  if (km("state") || km("province") || nm("state / province") || nm("state/province")) return true;
  if (km("city") || n === "city") return true;
  if (km("zip") || km("postal") || km("postcode") || nm("zip code") || nm("postal code")) return true;
  if (km("industry") || nm("industry")) return true;

  if (km("short_description") || nm("short description") || nm("brief description") || (n === "summary" && !nm("order"))) return true;
  if (k === "name" || k === "title" || nm("listing title") || nm("business name") || nm("business title")) return true;

  if (nm("meta description")) return false;
  if (k === "description" || k === "long_description" || k === "product_description") return true;
  if (/^(full description|long description|product description|listing description)$/.test(n)) return true;

  if (["mrp", "unit_price", "asking_price", "list_price", "regular_price"].includes(k)) return true;
  if (nm("asking price") || nm("list price") || nm("regular price")) return true;
  if ((nm("sale price") || k === "sale_price") && !nm("business")) return true;

  if (km("annual_revenue") || km("gross_revenue") || (km("revenue") && !km("recurring"))) return true;
  if (nm("annual revenue") || nm("gross revenue") || (nm("revenue") && !nm("recurring"))) return true;
  if (km("ebitda") || nm("ebitda")) return true;
  if (km("sde") || nm("seller") && nm("discretionary")) return true;
  if ((km("growth") && km("trend")) || nm("growth trend")) return true;

  if (nm("sale type") || nm("type of sale") || nm("transaction type")) return true;
  if (km("creator") || km("built_by") || nm("who built")) return true;
  if (km("remote_friendly") || km("web_only") || km("multi_loc") || km("multi_location")) return true;
  if (nm("remote-friendly") || (nm("web") && nm("mobile") && nm("only")) || nm("multi-location")) return true;

  if (["meta_title", "tags", "product_tags", "keywords", "seo_title"].includes(k)) return true;
  if (nm("seo title") || nm("meta title") || (nm("tags") && !nm("hashtag"))) return true;

  return false;
}

// ============ STEP CONFIGURATION ============
const STEPS = [
  { id: 1, name: "Category", description: "Select product type", icon: GridIcon },
  { id: 2, name: "Details", description: "Product information", icon: PackageIcon },
  { id: 3, name: "Review", description: "Final check", icon: SparklesIcon },
];

// Categories that don't require media upload (add category names here)
const CATEGORIES_WITHOUT_MEDIA = [
  "Stay With Us",
  // Add more category names here as needed
];

// Categories that don't require dimensions
const CATEGORIES_WITHOUT_DIMENSIONS = [
  "Business For Sale",
  "Commercial Real Estate",
  "Residential Real Estate",
  "Stay With Us",
  "Building Materials",
  // Add more category names here as needed
];

// Categories that don't require stock quantity
const CATEGORIES_WITHOUT_STOCK = [
  "Business For Sale",
  "Cars & Trucks",
  "Commercial Real Estate",
  "Residential Real Estate",
  "Stay With Us",
  "Building Materials",
  // Add more category names here as needed
];

// Categories that don't require brand name
const CATEGORIES_WITHOUT_BRAND = [
  "Business For Sale",
   "Cars & Trucks",
   "Commercial Real Estate",
   "Residential Real Estate",
   "Stay With Us",
   "Building Materials",
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

  // Address data states
  const [allCountries, setAllCountries] = useState<{ name: string; code: string }[]>([]);
  const [allStates, setAllStates] = useState<{ name: string; code: string }[]>([]);
  const [selectedCountryName, setSelectedCountryName] = useState("");
  const [loadingStates, setLoadingStates] = useState(false);

  // Load all countries once
  useEffect(() => {
    const { Country } = require('country-state-city');
    const countries = Country.getAllCountries().map((c: any) => ({
      name: c.name,
      code: c.isoCode,
    }));
    setAllCountries(countries);
  }, []);

  // Load states when selectedCountryName changes
  useEffect(() => {
    if (!selectedCountryName) { setAllStates([]); return; }
    
    const { Country, State } = require('country-state-city');
    // Find the country code by name
    const countries = Country.getAllCountries();
    const country = countries.find((c: any) => c.name === selectedCountryName);
    
    if (country) {
      const states = State.getStatesOfCountry(country.isoCode).map((s: any) => ({
        name: s.name,
        code: s.isoCode,
      }));
      setAllStates(states);
    } else {
      setAllStates([]);
    }
  }, [selectedCountryName]);

  // Sync selectedCountryName if Country attribute exists (for pre-loading drafts)
  useEffect(() => {
    const allAttrs = [...variantAttributes, ...nonVariantAttributes];
    const countryAttr = allAttrs.find(a => a.name?.toLowerCase() === "country");
    if (countryAttr?.value && countryAttr.value !== selectedCountryName) {
      setSelectedCountryName(countryAttr.value);
    }
  }, [variantAttributes, nonVariantAttributes, selectedCountryName]);

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
    deal_active_until: "",
    id: ""
  });

  // Image states
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // UI states
  const [hasDiscount, setHasDiscount] = useState(false);
  // Plain-text character count for the short description field (tracks paste too)
  const [shortDescPlainLen, setShortDescPlainLen] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [createdListing, setCreatedListing] = useState<PendingListing | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

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

  const bfsWizardRef = useRef<BusinessForSaleListingWizardHandle>(null);
  const isBusinessForSale = useMemo(
    () => isBusinessForSaleCategory(selectedCategoryName),
    [selectedCategoryName]
  );
  const businessForSaleSchemaRows = useMemo(() => {
    if (!isBusinessForSale) return [];
    return nonVariantAttributes
      .map((attr: any, index: number) => ({ attr, index }))
      .filter(({ attr }) => !bfsSchemaAttrSupersededByWizard(attr));
  }, [isBusinessForSale, nonVariantAttributes]);

  // Load categories on mount using schema API
  useEffect(() => {
    getSchemaCategories().then((result) => {
      if (!result.error && result.data) {
        console.log("Categories:", result.data);
        setCategories(result.data);
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pendingListings = getPendingListings().sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );

    if (!createdListing && pendingListings.length > 0) {
      setCreatedListing(pendingListings[0]);
    }
  }, [createdListing]);

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

        // Location field keys that should always use dynamic country-state-city dropdowns
        const LOCATION_KEYS = ["country", "state", "city", "zip_code", "zip", "postal_code"];

        // Convert schema fields to attribute format
        // All fields from schema are treated as non-variant attributes
        const schemaAttributes = fields.map((field: any) => {
          const fieldKey = (field.key || "").toLowerCase();
          const isLocationField = LOCATION_KEYS.includes(fieldKey);

          return {
            name: field.label || field.key,
            key: field.key,
            value: getInitialValue(isLocationField ? "text" : field.type),
            // Override data_type for location fields so they always render correctly
            data_type: isLocationField ? "location" : mapFieldType(field.type),
            options: field.options || [],
            required: field.required || false,
            placeholder: field.placeholder || "",
            suffix: field.suffix || "",
            min: field.min,
            max: field.max,
            step: field.step,
            additional_price: 0
          };
        });

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
        if (isBusinessForSale) return false;
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
      const descBase = cleanedProductData.description || "";
      if (isBusinessForSale && bfsWizardRef.current) {
        const ap = bfsWizardRef.current.getDescriptionAppendixHtml();
        (cleanedProductData as any).description = ap ? `${descBase}${ap}` : descBase;
      }

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
          const listingStatus = res?.data?.listing_status;
          const createdProductId = res?.data?.product_id;

          if (listingStatus === "PENDING_PAYMENT" && createdProductId) {
            const listing: PendingListing = {
              productId: createdProductId,
              productName: cleanedProductData.name,
              listingStatus: "PENDING_PAYMENT",
              listingFeeAmount: String(res?.data?.listing_fee_amount || "1.00"),
              listingFeeCurrency: String(res?.data?.listing_fee_currency || "USD"),
              squareListingFeeEndpoint: res?.data?.square_listing_fee_endpoint,
              state: "PENDING_PAYMENT",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            upsertPendingListing(listing);
            setCreatedListing(listing);
            toast.success("Product created in pending state. Pay listing fee to publish.");
          } else {
            toast.success(res.data.Status || "Product added successfully!");
            router.push("/inventory/products");
          }
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

  const handlePayListingFee = async () => {
    if (!createdListing) return;

    const token = getCookie("access_token");
    if (!token) {
      toast.error("Authentication error. Please sign in again.");
      return;
    }

    setPaymentLoading(true);
    try {
      const result = await createSquareListingPaymentLink(token, createdListing.productId);

      if (result.error) {
          const details = result.data?.hint || result.data?.details || result.message || "Could not create payment link, try again.";
        if (result.status === 403) {
          toast.error(`Not allowed for this product. ${details}`);
          } else if (result.status === 401) {
          toast.error(`Square platform credentials need attention. ${details}`);
        } else if (result.status === 502) {
          toast.error(`Payments temporarily unavailable. ${details}`);
        } else if (result.status === 400) {
          toast.error(details);
        } else {
          toast.error(details);
        }
        return;
      }

      updatePendingListingState(createdListing.productId, "PAYMENT_REDIRECTED");
      setCreatedListing((prev) =>
        prev
          ? {
              ...prev,
              state: "PAYMENT_REDIRECTED",
              updatedAt: new Date().toISOString(),
            }
          : prev
      );

      const paymentUrl = result.data?.payment_link;
      if (!paymentUrl) {
        toast.error("Could not create payment link, try again.");
        return;
      }

      window.location.href = paymentUrl;
    } finally {
      setPaymentLoading(false);
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

    // Special handling for Country and State searchable dropdowns
    const attrName = (attr.name || "").toLowerCase();
    const attrKey = (attr.key || "").toLowerCase();
    const isCountryField = attrName === "country" || attrKey === "country" || attrKey.includes("country");
    const isStateField = attrName === "state" || attrKey === "state" || attrName.includes("state") || attrKey.includes("state");

    if (isCountryField) {
      return (
        <SearchableSelect
          label="Country"
          value={attr.value}
          options={allCountries.map(c => ({ label: c.name, value: c.name }))}
          placeholder="Select country"
          onChange={(val, name) => {
            updateAttr(val);
            setSelectedCountryName(name);
          }}
        />
      );
    }

    if (isStateField) {
      return (
        <SearchableSelect
          label="State / Province"
          value={attr.value}
          options={allStates.map(s => ({ label: s.name, value: s.name }))}
          placeholder={selectedCountryName ? "Select state" : "Select a country first"}
          loading={loadingStates}
          disabled={!selectedCountryName && !attr.value}
          onChange={(val) => updateAttr(val)}
        />
      );
    }

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
              min={attr.min !== undefined && attr.min >= 0 ? attr.min : 0}
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
          <SearchableSelect
            label={attr.name}
            value={attr.value}
            options={attr.options?.map((opt: string) => ({ label: opt, value: opt })) || []}
            placeholder={`Select ${attr.name}`}
            onChange={(val) => updateAttr(val)}
          />
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
      location: [],
      text: [],
      number: [],
      boolean: [],
      select: [],
      multi_select: [],
      textarea: [],
    };

    attributes.forEach((attr, index) => {
      const name = (attr.name || "").toLowerCase();
      const key = (attr.key || "").toLowerCase();
      const type = attr.data_type || "text";

      // Primary check: data_type was explicitly set to "location" at mapping time
      // Fallback: name/key-based detection for edge cases
      const isLocation = type === "location" ||
        name === "country" || key === "country" ||
        name === "state" || key === "state" ||
        name === "city" || key === "city" ||
        key === "zip_code" || name.includes("zip") || key.includes("zip");

      if (isLocation) {
        groups.location.push({ attr, index });
      } else if (type === "bool" || type === "boolean" || type === "checkbox") {
        groups.boolean.push({ attr, index });
      } else if (groups[type]) {
        groups[type].push({ attr, index });
      } else {
        groups.text.push({ attr, index });
      }
    });

    // Sort location group: Country → State → City → ZIP
    const getLocationPriority = (attr: any) => {
      const n = (attr.name || "").toLowerCase();
      const k = (attr.key || "").toLowerCase();
      if (n === "country" || k === "country") return 0;
      if (n === "state" || k === "state") return 1;
      if (n === "city" || k === "city") return 2;
      return 3; // zip/postal
    };
    groups.location.sort((a, b) => getLocationPriority(a.attr) - getLocationPriority(b.attr));

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
    const typeOrder = ["location", "text", "number", "select", "multi_select", "textarea", "boolean"];

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

                {/* Location, Text and Number fields in 2-column grid */}
                {(type === "location" || type === "text" || type === "number") && (
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
            This category doesn&apos;t require any specific attributes. You can proceed to the next step.
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
              <TagIcon /> Specifications
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
        if (isBusinessForSale && selectedSubcategory) {
          return (
            <BusinessForSaleListingWizard
              key={selectedSubcategory}
              ref={bfsWizardRef}
              selectedCategoryName={selectedCategoryName}
              selectedSubcategoryName={selectedSubcategoryName}
              productData={productData}
              setProductData={setProductData}
              hasDiscount={hasDiscount}
              setHasDiscount={setHasDiscount}
              nonVariantAttributes={nonVariantAttributes}
              setNonVariantAttributes={setNonVariantAttributes}
              files={files}
              setFiles={setFiles}
              allCountries={allCountries}
              allStates={allStates}
              selectedCountryName={selectedCountryName}
              setSelectedCountryName={setSelectedCountryName}
              loadingStates={loadingStates}
              setShortDescPlainLen={setShortDescPlainLen}
              SearchableSelect={SearchableSelect}
              renderAttributeInput={renderAttributeInput}
              schemaAttributeRows={businessForSaleSchemaRows}
              onBackToCategoryStep={() => setCurrentStep(1)}
              onContinueToVendorReview={() => {
                if (!bfsWizardRef.current?.canGoToVendorReview()) {
                  toast.error("Please complete all required sections in the business listing wizard.");
                  return;
                }
                setCompletedSteps((prev) => (prev.includes(2) ? prev : [...prev, 2]));
                setCurrentStep(3);
              }}
            />
          );
        }
        // Combined step: Details + Attributes + Media - PREMIUM REDESIGNED LAYOUT
        return (
          <div className="animate-fadeIn">
            {/* Hero Section - Product Identity */}
            <div className="relative mb-8">
              {/* Gradient Background Accent */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-pink-500/5 to-purple-500/5 rounded-2xl" />

              <div className="relative premium-card p-6 md:p-8 border-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm">
                {/* Category Breadcrumb */}
                {/* Category & Subcategory Breadcrumbs - Enhanced */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <div className="group flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500/10 to-pink-500/10 border border-primary-500/20 shadow-sm hover:shadow-glow-pink/10 transition-all duration-500">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse shadow-[0_0_8px_rgba(232,35,122,0.6)]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary-400">{selectedCategoryName}</span>
                  </div>
                  <svg className="w-4 h-4 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="px-4 py-2 rounded-full bg-surface-800/50 border border-surface-700/50">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-surface-400">{selectedSubcategoryName}</span>
                  </div>
                </div>

                {/* Product Title - HERO INPUT */}
                <div className="relative group px-0 py-6 transition-all duration-500">
                  <div className="relative flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 text-sm font-black uppercase tracking-[0.2em] text-primary-500 transition-all duration-500">
                        <div className="w-7 h-7 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                          <span className="text-[11px] font-black">T</span>
                        </div>
                        Listing Title <span className="text-white/20 ml-1 text-xs">*</span>
                      </label>
                      <span className={`text-[10px] font-bold tracking-widest transition-all duration-500 ${productData.name.length > 0 ? "text-primary-400" : "text-surface-600 opacity-0"}`}>
                        {productData.name.length} / 100
                      </span>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="text"
                        value={productData.name}
                        onChange={(e) => updateProductData("name", e.target.value)}
                        placeholder="What are you listing today?"
                        className="w-full bg-transparent border-none p-0 text-4xl md:text-5xl font-black text-white placeholder:text-surface-700 placeholder:not-italic focus:ring-0 transition-all selection:bg-primary-500/40 tracking-tight"
                        required
                      />
                      
                      {/* Interactive Bottom Accent */}
                      <div className="absolute -bottom-2 left-0 right-0 h-px bg-surface-800/50 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-pink-500 to-purple-500 translate-x-[-100%] group-focus-within:translate-x-0 transition-transform duration-700 ease-out" />
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-surface-500 font-medium tracking-wide opacity-0 group-focus-within:opacity-100 transition-opacity duration-700">
                      Pro-tip: Catchy titles with clear keywords sell 40% faster.
                    </p>
                  </div>
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
                    min={0}
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
                    min={0}
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
                      min={0}
                      className="input-premium"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Deal Active Until (Real Estate Specific) */}
            {(selectedCategoryName.toLowerCase().includes("real estate")) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="premium-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Deal Active Until</label>
                  </div>
                  <input
                    type="date"
                    value={productData.deal_active_until ? productData.deal_active_until.split('T')[0] : ''}
                    onChange={(e) => updateProductData("deal_active_until", e.target.value)}
                    className="input-premium"
                  />
                  <p className="text-xs text-surface-500 mt-2">After this date, the deal will be automatically closed.</p>
                </div>
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
                  <h3 className="font-semibold text-surface-900 dark:text-white">Description</h3>
                  <p className="text-xs text-surface-500">Help customers understand the listing</p>
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
                          className={`h-full rounded-full transition-all ${shortDescPlainLen > 200 ? 'bg-orange-500' : 'bg-primary-500'}`}
                          style={{ width: `${Math.min((shortDescPlainLen / SHORT_DESCRIPTION_MAX_PLAIN) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs ${shortDescPlainLen >= SHORT_DESCRIPTION_MAX_PLAIN ? 'text-orange-500 font-semibold' : 'text-surface-400'}`}>
                        {shortDescPlainLen}/{SHORT_DESCRIPTION_MAX_PLAIN}
                      </span>
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

                        if (len <= SHORT_DESCRIPTION_MAX_PLAIN) {
                          setShortDescPlainLen(len);
                          setProductData((prev) => ({ ...prev, short_description: content }));
                          return;
                        }
                        const truncated = truncateUnicodePlain(plain, SHORT_DESCRIPTION_MAX_PLAIN);
                        setShortDescPlainLen(SHORT_DESCRIPTION_MAX_PLAIN);
                        setProductData((prev) => ({
                          ...prev,
                          short_description: plainToQuillShortDescriptionHtml(truncated),
                        }));
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

            {/* Dynamic Attributes Section */}
            {(variantAttributes.length > 0 || nonVariantAttributes.length > 0) && (
              <div className="premium-card p-6 md:p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
                    <TagIcon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white">Product Attributes</h3>
                    <p className="text-xs text-surface-500">Specific details for this listing</p>
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
                    <h3 className="font-semibold text-surface-900 dark:text-white">Images <span className="text-danger">*</span></h3>
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
      {createdListing && (
        <div className="mb-6 premium-card p-5 border border-warning/30 bg-warning/10 dark:bg-warning/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-surface-900 dark:text-white">Listing created</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-warning/20 text-warning-dark dark:text-warning">
                  Pending payment
                </span>
                <span className="text-sm text-surface-600 dark:text-surface-300">
                  Pay {Number(createdListing.listingFeeAmount).toString()} {createdListing.listingFeeCurrency} to publish.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePayListingFee}
              disabled={paymentLoading}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${paymentLoading
                ? "bg-surface-300 text-surface-500 cursor-not-allowed"
                : "bg-gradient-pink text-white shadow-glow-pink hover:opacity-90"
                }`}
            >
              {paymentLoading ? "Preparing checkout..." : `Pay ${Number(createdListing.listingFeeAmount).toString()} ${createdListing.listingFeeCurrency} to publish`}
            </button>
          </div>
        </div>
      )}

      {/* Progress Steps — hide while Business for Sale wizard is open (it has its own progress UI) */}
      {!(currentStep === 2 && isBusinessForSale) && (
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
                    <p className="font-semibold text-sm">
                      {isBusinessForSale && step.id === 2 ? "Listing" : step.name}
                    </p>
                    <p className={`text-xs ${isCurrent ? "text-white/70" : "text-surface-500"}`}>
                      {isBusinessForSale && step.id === 2
                        ? "Business profile, pricing & photos"
                        : step.description}
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
      )}

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons — hidden on Business for Sale step 2 (wizard has its own bar) */}
      {!(currentStep === 2 && isBusinessForSale) && (
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
              disabled={Boolean(createdListing)}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${createdListing
                ? "bg-surface-300 text-surface-500 cursor-not-allowed"
                : "bg-gradient-pink text-white shadow-glow-pink hover:opacity-90"
                }`}
            >
              <SparklesIcon />
              <span>{createdListing ? "Listing Created" : "Create Listing"}</span>
            </button>
          )}
        </div>
      </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddProducts;
