"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { filterListingCategories } from "@/constants/listingCategories";
import {
  getSchemaCategories,
  getSchemaSubcategories,
  getFormSchema,
  saveProducts,
  getSingleProduct,
  updateProducts,
} from "@/api/products";
import { Product } from "@/types/product";
import { useParams, useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
// @ts-ignore
import "react-toastify/dist/ReactToastify.css";
import { Loader2 } from "@/components/common/Loader";
import dynamic from "next/dynamic";
// @ts-ignore
import "react-quill/dist/quill.snow.css";
import { handleError } from "@/utils/toast";
import { resolveVendorApiToken } from "@/utils/vendorAuth";
import { updatePendingListingState } from "@/utils/pendingListings";
import {
  SHORT_DESCRIPTION_MAX_PLAIN,
  truncateUnicodePlain,
  plainToQuillShortDescriptionHtml,
  plainTextLengthFromHtml,
} from "@/utils/shortDescription";
import { isBusinessForSaleCategory } from "@/components/inventory/businessForSaleCategory";
import {
  BusinessForSaleListingWizard,
  type BusinessForSaleListingWizardHandle,
} from "@/components/inventory/BusinessForSaleListingWizard";
import { ProductNdaDocumentsSection } from "@/components/inventory/ProductNdaDocumentsSection";
import { prepareListingFeePayment } from "@/utils/listingPayment";

// ============ ICONS (identical to add_products) ============
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

const CATEGORIES_WITHOUT_MEDIA = ["Stay With Us"];
const CATEGORIES_WITHOUT_DIMENSIONS = ["Business For Sale","Commercial Real Estate","Residential Real Estate","Stay With Us","Building Materials"];
const CATEGORIES_WITHOUT_STOCK = ["Business For Sale","Cars & Trucks","Commercial Real Estate","Residential Real Estate","Stay With Us","Building Materials"];
const CATEGORIES_WITHOUT_BRAND = ["Business For Sale","Cars & Trucks","Commercial Real Estate","Residential Real Estate","Stay With Us","Building Materials"];

// ============ SEARCHABLE SELECT ============
function SearchableSelect({
  label, value, options, loading, placeholder, disabled, onChange,
}: {
  label: string; value: string; options: { label: string; value: string }[];
  loading?: boolean; placeholder?: string; disabled?: boolean;
  onChange: (value: string, label: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(o => o.value === value);
  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} className="relative w-full">
      <button type="button" disabled={disabled} onClick={() => { setOpen(o => !o); setSearch(""); }}
        className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300">
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
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${label}…`}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border focus:outline-none focus:border-primary-500 text-surface-900 dark:text-white" />
          </div>
          <ul className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-surface-400 text-center">No results found</li>
            ) : filtered.map(opt => (
              <li key={opt.value}>
                <button type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors ${opt.value === value ? "text-primary-500 font-bold bg-primary-50 dark:bg-primary-500/10" : "text-surface-900 dark:text-white"}`}
                  onClick={() => { onChange(opt.value, opt.label); setOpen(false); }}>
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

/** Schema fields the wizard already collects — hide from the generic attributes block. */
function bfsSchemaAttrSupersededByWizard(attr: any): boolean {
  const k = String(attr.key ?? "").toLowerCase().trim().replace(/[\s-]+/g, "_");
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
  if (km("revenue") || km("ebitda") || km("sde") || km("growth_trend") || nm("annual revenue") || nm("growth trend")) return true;
  return false;
}

// ============ MAIN COMPONENT ============
const EditProduct = () => {
  const params = useParams();
  const productId = params?.id as string;
  const router = useRouter();

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

  // Product data (includes id for update)
  const [productData, setProductData] = useState({
    name: "", unit_price: "", mrp: "", category: "", subcategory: "",
    brand_name: "", tags: "", meta_title: "", length: "", width: "",
    height: "", weight: "", quantity: "", short_description: "", description: "",
    image: "", id: productId || "",
    nda_lock_ebitda: false,
    nda_lock_full_financials: false,
    nda_available_docs: "",
  });

  // Image states
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]); // URLs from server
  const [dragActive, setDragActive] = useState(false);

  // UI states
  const [hasDiscount, setHasDiscount] = useState(false);
  const [shortDescPlainLen, setShortDescPlainLen] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [productActive, setProductActive] = useState<boolean | null>(null);
  const [showDimensions, setShowDimensions] = useState(false);

  /** Skip one subcategory reload when hydrating edit form (avoids clearing pre-selected subcategory). */
  const skipSubcategoryEffectRef = useRef(false);
  const bfsWizardRef = useRef<BusinessForSaleListingWizardHandle>(null);

  // Location data for the BFS wizard
  const [allCountries, setAllCountries] = useState<{ name: string; code: string }[]>([]);
  const [allStates, setAllStates] = useState<{ name: string; code: string }[]>([]);
  const [selectedCountryName, setSelectedCountryName] = useState("");
  const [loadingStates, setLoadingStates] = useState(false);

  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    []
  );
  const formats = ["header","bold","italic","underline","strike","blockquote","list","bullet","indent","link","color","clean"];

  // Derived
  const variantAllowedAttributes = useMemo(() => allowedAttributes.filter((a: any) => a.is_variant === true), [allowedAttributes]);
  const nonVariantAllowedAttributes = useMemo(() => allowedAttributes.filter((a: any) => a.is_variant === false), [allowedAttributes]);
  const shouldHideMedia = useMemo(() => CATEGORIES_WITHOUT_MEDIA.some((c) => c.toLowerCase() === selectedCategoryName.toLowerCase()), [selectedCategoryName]);
  const shouldHideDimensions = useMemo(() => CATEGORIES_WITHOUT_DIMENSIONS.some((c) => c.toLowerCase() === selectedCategoryName.toLowerCase()), [selectedCategoryName]);
  const shouldHideStock = useMemo(() => CATEGORIES_WITHOUT_STOCK.some((c) => c.toLowerCase() === selectedCategoryName.toLowerCase()), [selectedCategoryName]);
  const shouldHideBrand = useMemo(() => CATEGORIES_WITHOUT_BRAND.some((c) => c.toLowerCase() === selectedCategoryName.toLowerCase()), [selectedCategoryName]);
  const isBusinessForSale = useMemo(() => isBusinessForSaleCategory(selectedCategoryName), [selectedCategoryName]);
  const isRealEstate = useMemo(() => selectedCategoryName.trim().toLowerCase().includes("real estate"), [selectedCategoryName]);
  const showNdaSection = isBusinessForSale || isRealEstate;
  const businessForSaleSchemaRows = useMemo(() => {
    if (!isBusinessForSale) return [];
    return nonVariantAttributes
      .map((attr: any, index: number) => ({ attr, index }))
      .filter(({ attr }) => !bfsSchemaAttrSupersededByWizard(attr));
  }, [isBusinessForSale, nonVariantAttributes]);

  // Total image count (existing + new uploads)
  const totalImages = existingImages.length + files.length;

  // ============================================================
  // LOAD EXISTING PRODUCT AND PRE-POPULATE
  // ============================================================
  useEffect(() => {
    if (!productId) {
      setInitialLoading(false);
      return;
    }
    (async () => {
      const token = await resolveVendorApiToken();
      if (!token) {
        toast.error("Session expired. Please sign in again.");
        setInitialLoading(false);
        return;
      }

      try {
        const res: any = await getSingleProduct(token, productId);
        if (res.error || !res.data) {
          toast.error("Failed to load product data.");
          setInitialLoading(false);
          return;
        }
        // Backend wraps the product in { "Products": {...} }
        const p = res.data?.Products ?? res.data;
        console.log("prod",p)
        // Pre-fill basic product fields
        setProductData({
          name: p.name || "",
          mrp: p.mrp ? String(p.mrp) : "",
          unit_price: p.unit_price ? String(p.unit_price) : "",
          // Backend update_product expects category/subcategory slugs, not DB UUIDs.
          category: p.category?.slug || "",
          subcategory: p.subcategory?.slug || "",
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
          nda_lock_ebitda: Boolean(p.nda_lock_ebitda),
          nda_lock_full_financials: Boolean(p.nda_lock_full_financials),
          nda_available_docs: p.nda_available_docs || "",
          image: "",
          id: p.id || productId,
        });
        setProductActive(Boolean(p.is_active));
        setShortDescPlainLen(
          Math.min(plainTextLengthFromHtml(p.short_description || ""), SHORT_DESCRIPTION_MAX_PLAIN)
        );

        // Detect discount
        if (p.unit_price && p.mrp && parseFloat(p.unit_price) < parseFloat(p.mrp)) {
          setHasDiscount(true);
        }

        // Show dimensions if any are set
        if (p.length || p.width || p.height || p.weight) setShowDimensions(true);

        // Existing images: image1..image4
        const BASE_URL_ROOT = process.env.NEXT_PUBLIC_BASE_URL?.replace("/api", "") ?? "";
        const imgs = [p.image1, p.image2, p.image3, p.image4]
          .filter(Boolean)
          .map((img: string) => (img.startsWith("http") ? img : `${BASE_URL_ROOT}${img}`));
        setExistingImages(imgs);

        // Load categories (needed for Step 1 display)
        const catResult = await getSchemaCategories();
        if (!catResult.error && catResult.data) setCategories(filterListingCategories(catResult.data));

        // Pre-select category (schema APIs use filter.json ids = slugs, not DB UUIDs)
        const cat = p.category;
        const categorySchemaId = cat?.slug || cat?.id;
        if (categorySchemaId) {
          skipSubcategoryEffectRef.current = true;
          setSelectedCategory(categorySchemaId);
          setSelectedCategoryName(cat.name || "");
          setProductData((prev) => ({ ...prev, category: cat.slug || prev.category }));

          // Load subcategories for this category
          setSubcategoriesLoading(true);
          const subcatResult = await getSchemaSubcategories(categorySchemaId);
          if (!subcatResult.error && subcatResult.data) setSubcategories(subcatResult.data);
          setSubcategoriesLoading(false);

          // Pre-select subcategory
          const subcat = p.subcategory;
          const subcategorySchemaId = subcat?.slug || subcat?.id;
          if (subcategorySchemaId) {
            setSelectedSubcategory(subcategorySchemaId);
            setSelectedSubcategoryName(subcat.name || "");
            setProductData((prev) => ({ ...prev, subcategory: subcat.slug || prev.subcategory }));

            // Load schema and prefill attributes with existing values
            await loadSchemaAndPrefillAttributes(
              categorySchemaId,
              subcategorySchemaId,
              p.attributes || []
            );
          }
        }

        // Jump straight to Step 2 with Step 1 marked complete
        setCompletedSteps([1]);
        setCurrentStep(2);
      } catch (err) {
        console.error("Error loading product:", err);
        toast.error("Unexpected error loading product.");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [productId]);

  /** Load form schema for a category+subcategory and prefill attribute values
   *  from the existing product attributes array. */
  const loadSchemaAndPrefillAttributes = async (
    categoryId: string,
    subcategoryId: string,
    existingAttrs: { name: string; value: string; additional_price?: number }[]
  ) => {
    try {
      const schemaResult = await getFormSchema(categoryId, subcategoryId);
      if (!schemaResult.error && schemaResult.data) {
        const fields = schemaResult.data.fields || [];

        // Build lookup: attribute name (lowercase) → value
        const existingMap = new Map<string, string>();
        existingAttrs.forEach((a) => {
          if (a.name) existingMap.set(a.name.toLowerCase(), a.value ?? "");
        });

        const resolveExistingVal = (field: any): string | undefined => {
          const label = (field.label || "").toLowerCase();
          const key = (field.key || "").toLowerCase();
          const keyAsLabel = key.replace(/_/g, " ");
          if (label && existingMap.has(label)) return existingMap.get(label);
          if (keyAsLabel && existingMap.has(keyAsLabel)) return existingMap.get(keyAsLabel);
          if (key && existingMap.has(key)) return existingMap.get(key);
          return undefined;
        };

        const mapFieldType = (type: string) => {
          switch (type) {
            case "checkbox": return "bool";
            case "select": return "select";
            case "multi_select": return "multi_select";
            case "number": return "number";
            case "textarea": return "textarea";
            default: return "text";
          }
        };

        const getPrefilledValue = (fieldType: string, existingVal: string | undefined) => {
          if (existingVal !== undefined && existingVal !== "") {
            if (fieldType === "bool") return existingVal === "true" || existingVal === "True" || existingVal === "1";
            if (fieldType === "multi_select") {
              return existingVal.split(",").map((v) => v.trim()).filter(Boolean);
            }
            return existingVal;
          }
          // Default empty values
          if (fieldType === "bool") return false;
          if (fieldType === "multi_select") return [];
          return "";
        };

        const schemaAttributes = fields
          .map((field: any) => {
          const existingVal = resolveExistingVal(field);
          const mappedType = mapFieldType(field.type);

          return {
            name: field.label || field.key,
            key: field.key,
            value: getPrefilledValue(mappedType, existingVal),
            data_type: mappedType,
            options: field.options || [],
            required: field.required || false,
            placeholder: field.placeholder || "",
            suffix: field.suffix || "",
            min: field.min,
            max: field.max,
            step: field.step,
            section: field.section || "core",
            additional_price: 0,
          };
        })
          .sort((a: any, b: any) => {
            const rank = (attr: any) => {
              if (attr.key === "product_type") return 0;
              if (attr.section === "advanced_specs") return 2;
              return 1;
            };
            return rank(a) - rank(b);
          });

        setNonVariantAttributes(schemaAttributes);
        setAllowedAttributes(schemaAttributes);
        setVariantAttributes([]);
      }
    } catch (err) {
      console.error("Schema load error:", err);
    }
  };

  // Load categories on mount (also needed for add flow — but edit already handles this above)
  useEffect(() => {
    if (productId) return; // edit handles separately
    getSchemaCategories().then((result) => {
      if (!result.error && result.data) setCategories(filterListingCategories(result.data));
    });
  }, [productId]);

  // Load subcategories when category changes (add flow, or edit after user changes category)
  useEffect(() => {
    if (!selectedCategory) return;
    if (skipSubcategoryEffectRef.current) {
      skipSubcategoryEffectRef.current = false;
      return;
    }
    setSubcategoriesLoading(true);
    setSelectedSubcategory("");
    setSelectedSubcategoryName("");
    setAllowedAttributes([]);
    setVariantAttributes([]);
    setNonVariantAttributes([]);

    getSchemaSubcategories(selectedCategory)
      .then((result) => {
        if (!result.error && result.data) setSubcategories(result.data);
        setSubcategoriesLoading(false);
      })
      .catch(() => setSubcategoriesLoading(false));
  }, [selectedCategory]);

  // ============================================================
  // CATEGORY & SUBCATEGORY HANDLERS
  // ============================================================
  const handleCategorySelect = (cat: { id: string; name: string }) => {
    setSelectedCategory(cat.id);
    setSelectedCategoryName(cat.name);
    setProductData((prev) => ({ ...prev, category: cat.id }));
  };

  const handleSubcategorySelect = async (subcat: { id: string; name: string }) => {
    setSelectedSubcategory(subcat.id);
    setSelectedSubcategoryName(subcat.name);
    setProductData((prev) => ({ ...prev, subcategory: subcat.id }));

    try {
      const schemaResult = await getFormSchema(selectedCategory, subcat.id);
      if (!schemaResult.error && schemaResult.data) {
        const fields = schemaResult.data.fields || [];
        const getInitialValue = (fieldType: string) => {
          switch (fieldType) {
            case "checkbox": return false;
            case "multi_select": return [];
            default: return "";
          }
        };
        const mapFieldType = (type: string) => {
          switch (type) {
            case "checkbox": return "bool";
            case "select": return "select";
            case "multi_select": return "multi_select";
            case "number": return "number";
            case "textarea": return "textarea";
            default: return "text";
          }
        };
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
          additional_price: 0,
        }));
        setNonVariantAttributes(schemaAttributes);
        setAllowedAttributes(schemaAttributes);
        setVariantAttributes([]);
      }
    } catch (err) {
      console.error("Schema load error:", err);
    }
  };

  const updateProductData = (key: string, value: string | number) => {
    setProductData((prev) => ({ ...prev, [key]: value.toString() }));
  };

  // ============================================================
  // IMAGE HANDLERS
  // ============================================================
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const dropped = Array.from(e.dataTransfer.files);
        if (dropped.length + totalImages > 4) { toast.error("Maximum 4 images allowed"); return; }
        const imageFiles = dropped.filter((f) => f.type.startsWith("image/"));
        setFiles((prev) => [...prev, ...imageFiles]);
      }
    },
    [totalImages]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (selected.length + totalImages > 4) { toast.error("Maximum 4 images allowed"); return; }
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const removeExistingImage = (index: number) => setExistingImages((prev) => prev.filter((_, i) => i !== index));

  // Load countries once (for the BFS wizard location step)
  useEffect(() => {
    const { Country } = require("country-state-city");
    setAllCountries(Country.getAllCountries().map((c: any) => ({ name: c.name, code: c.isoCode })));
  }, []);

  // Load states when selected country changes
  useEffect(() => {
    if (!selectedCountryName) { setAllStates([]); return; }
    setLoadingStates(true);
    const { Country, State } = require("country-state-city");
    const country = Country.getAllCountries().find((c: any) => c.name === selectedCountryName);
    if (country) {
      setAllStates(State.getStatesOfCountry(country.isoCode).map((s: any) => ({ name: s.name, code: s.isoCode })));
    } else {
      setAllStates([]);
    }
    setLoadingStates(false);
  }, [selectedCountryName]);

  // Pre-seed selectedCountryName from attributes when editing a BFS product
  useEffect(() => {
    const allAttrs = [...variantAttributes, ...nonVariantAttributes];
    const countryAttr = allAttrs.find((a: any) => a.name?.toLowerCase() === "country");
    if (countryAttr?.value && countryAttr.value !== selectedCountryName) {
      setSelectedCountryName(countryAttr.value);
    }
  }, [variantAttributes, nonVariantAttributes, selectedCountryName]);

  // ============================================================
  // STEP NAVIGATION
  // ============================================================
  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedCategory && selectedSubcategory;
      case 2:
        if (isBusinessForSale) return false; // wizard handles its own navigation
        // Images required unless category hides them OR existing images are present
        const hasImages = shouldHideMedia || files.length > 0 || existingImages.length > 0;
        return productData.name && productData.mrp && hasImages;
      case 3: return true;
      default: return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 3) {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep((prev) => prev + 1);
    } else if (!canProceed()) {
      if (currentStep === 2 && !shouldHideMedia && files.length === 0 && existingImages.length === 0) {
        toast.error("Please upload at least one image");
      } else {
        toast.error("Please complete all required fields");
      }
    }
  };

  const prevStep = () => { if (currentStep > 1) setCurrentStep((prev) => prev - 1); };

  const goToStep = (step: number) => {
    if (step <= currentStep || completedSteps.includes(step - 1)) setCurrentStep(step);
  };

  // ============================================================
  // SAVE HANDLER — calls updateProducts (edit) or saveProducts (add)
  // ============================================================
  const handleSave = async () => {
    if (typeof window === "undefined") return;

    const token = await resolveVendorApiToken();
    if (!token) {
      toast.error("Session expired. Please sign in again.");
      return;
    }
    const vendor_id = localStorage.getItem("vendor_id");

    const { mrp, unit_price } = productData;
    const finalUnitPrice = hasDiscount ? unit_price : mrp;
    const cleanedProductData: any = { ...productData, unit_price: finalUnitPrice };

    // Append BFS wizard's structured description appendix (financial summary, tags, etc.)
    if (isBusinessForSale && bfsWizardRef.current) {
      const ap = bfsWizardRef.current.getDescriptionAppendixHtml();
      const descBase = cleanedProductData.description || "";
      cleanedProductData.description = ap ? `${descBase}${ap}` : descBase;
    }

    if (cleanedProductData.quantity === "" || cleanedProductData.quantity === null || cleanedProductData.quantity === undefined) {
      delete cleanedProductData.quantity;
    }

    const hasValue = (a: any) => {
      if (Array.isArray(a.value)) return a.value.length > 0;
      if (typeof a.value === "boolean") return true;
      return a.value !== "";
    };
    const formatValue = (value: any) => {
      if (Array.isArray(value)) return value.join(", ");
      return String(value);
    };
    const allAttributes = [
      ...nonVariantAttributes.filter(hasValue).map((a) => ({ name: a.name, value: formatValue(a.value), additional_price: a.additional_price || 0 })),
      ...variantAttributes.filter(hasValue).map((v) => ({ name: v.name, value: formatValue(v.value), additional_price: v.additional_price || 0 })),
    ];

    setLoading(true);
    try {
      // ---- EDIT ----
      const payload = { ...cleanedProductData, id: productId, attributes: allAttributes };
      const res: any = await updateProducts(token, vendor_id, payload, files);
      if (!res || res.error) {
        handleError(res?.data?.data?.Status || res?.message || "Error updating product");
      } else {
        toast.success(res.data?.Status || "Product updated successfully!");
        router.push("/inventory/products");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePayForCurrentProduct = async () => {
    const token = await resolveVendorApiToken();
    if (!token) {
      toast.error("Authentication error. Please sign in again.");
      return;
    }
    if (!productData.id) {
      toast.error("Product id missing");
      return;
    }

    try {
      // show lightweight loading
      setLoading(true);
      const result = await prepareListingFeePayment(
        token,
        productData.id,
        productData.name
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      window.location.href = result.paymentUrl;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ATTRIBUTE INPUT RENDERER (identical to add_products)
  // ============================================================
  const renderAttributeInput = (attr: any, isVariant: boolean, index: number) => {
    const updateAttr = (value: any) => {
      if (isVariant) {
        setVariantAttributes((prev) => { const u = [...prev]; u[index] = { ...u[index], value }; return u; });
      } else {
        setNonVariantAttributes((prev) => { const u = [...prev]; u[index] = { ...u[index], value }; return u; });
      }
    };

    const inputClasses = "w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300";

    const toggleMultiSelectOption = (option: string) => {
      const cur = Array.isArray(attr.value) ? attr.value : [];
      updateAttr(cur.includes(option) ? cur.filter((v: string) => v !== option) : [...cur, option]);
    };

    switch (attr.data_type) {
      case "number":
        return (
          <div className="relative">
            {attr.suffix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">{attr.suffix}</span>}
            <input type="number" value={attr.value} onChange={(e) => updateAttr(e.target.value)} placeholder={attr.placeholder || `Enter ${attr.name.toLowerCase()}`} className={`${inputClasses} ${attr.suffix ? "pl-7" : ""}`} min={attr.min !== undefined && attr.min >= 0 ? attr.min : 0} max={attr.max} step={attr.step} />
          </div>
        );
      case "textarea":
        return <textarea value={attr.value} onChange={(e) => updateAttr(e.target.value)} placeholder={attr.placeholder || `Enter ${attr.name.toLowerCase()}`} className={`${inputClasses} min-h-[100px] resize-y`} rows={3} />;
      case "boolean": case "bool": case "checkbox":
        return (
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => updateAttr(!attr.value)} className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${attr.value ? "bg-gradient-to-r from-primary-500 to-pink-500" : "bg-surface-300 dark:bg-dark-border"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${attr.value ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{attr.name}</span>
          </div>
        );
      case "select":
        return (
          <select value={attr.value} onChange={(e) => updateAttr(e.target.value)} className={inputClasses}>
            <option value="">Select {attr.name}</option>
            {attr.options?.map((opt: string, i: number) => <option key={i} value={opt}>{opt}</option>)}
          </select>
        );
      case "multi_select": {
        const selectedValues = Array.isArray(attr.value) ? attr.value : [];
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {attr.options?.map((opt: string, i: number) => {
                const isSelected = selectedValues.includes(opt);
                return (
                  <button key={i} type="button" onClick={() => toggleMultiSelectOption(opt)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border-2 ${isSelected ? "bg-gradient-to-r from-primary-500 to-pink-500 text-white border-transparent shadow-md" : "bg-surface-50 dark:bg-dark-input text-surface-700 dark:text-surface-300 border-surface-200 dark:border-dark-border hover:border-primary-400"}`}>{opt}</button>
                );
              })}
            </div>
            {selectedValues.length > 0 && <div className="text-xs text-surface-500">Selected: {selectedValues.join(", ")}</div>}
          </div>
        );
      }
      default:
        return <input type="text" value={attr.value} onChange={(e) => updateAttr(e.target.value)} placeholder={`Enter ${attr.name.toLowerCase()}`} className={inputClasses} />;
    }
  };

  const groupAttributesByType = (attributes: any[]) => {
    const groups: { [key: string]: { attr: any; index: number }[] } = { text: [], number: [], boolean: [], select: [], multi_select: [], textarea: [] };
    attributes.forEach((attr, index) => {
      const type = attr.data_type || "text";
      if (type === "bool" || type === "boolean" || type === "checkbox") groups.boolean.push({ attr, index });
      else if (groups[type]) groups[type].push({ attr, index });
      else groups.text.push({ attr, index });
    });
    return groups;
  };

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
                {(type === "text" || type === "number") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {typeAttrs.map(({ attr, index }) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">{attr.name}{attr.required && <span className="text-red-500 ml-1">*</span>}</label>
                        {renderAttributeInput(attr, isVariant, index)}
                      </div>
                    ))}
                  </div>
                )}
                {type === "select" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {typeAttrs.map(({ attr, index }) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">{attr.name}{attr.required && <span className="text-red-500 ml-1">*</span>}</label>
                        {renderAttributeInput(attr, isVariant, index)}
                      </div>
                    ))}
                  </div>
                )}
                {type === "multi_select" && (
                  <div className="space-y-6">
                    {typeAttrs.map(({ attr, index }) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">{attr.name}{attr.required && <span className="text-red-500 ml-1">*</span>}</label>
                        {renderAttributeInput(attr, isVariant, index)}
                      </div>
                    ))}
                  </div>
                )}
                {type === "textarea" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {typeAttrs.map(({ attr, index }) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">{attr.name}{attr.required && <span className="text-red-500 ml-1">*</span>}</label>
                        {renderAttributeInput(attr, isVariant, index)}
                      </div>
                    ))}
                  </div>
                )}
                {type === "boolean" && (
                  <div className="flex flex-wrap gap-6">
                    {typeAttrs.map(({ attr, index }) => <div key={index}>{renderAttributeInput(attr, isVariant, index)}</div>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================================
  // STEP RENDERERS
  // ============================================================

  // Step 1: Category Selection
  const renderCategoryStep = () => (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-5">Select Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((cat: { id: string; name: string }, index) => (
            <button key={cat.id || index} type="button" onClick={() => handleCategorySelect(cat)}
              className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-center overflow-hidden ${selectedCategory === cat.id ? "border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-500/10 dark:to-primary-500/5 shadow-glow-pink scale-[1.02]" : "border-surface-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-primary-300 dark:hover:border-primary-500/50 hover:shadow-premium-md hover:scale-[1.02]"}`}>
              <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${selectedCategory === cat.id ? "from-primary-500/5 to-transparent opacity-100" : "from-primary-500/0 to-transparent opacity-0 group-hover:opacity-100"}`} />
              <div className="relative z-10">
                <h4 className={`font-semibold text-sm transition-colors ${selectedCategory === cat.id ? "text-primary-600 dark:text-primary-400" : "text-surface-900 dark:text-white group-hover:text-primary-500"}`}>{cat.name}</h4>
              </div>
              {selectedCategory === cat.id && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-pink rounded-full flex items-center justify-center text-white shadow-lg animate-scaleIn">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-pink transition-all duration-300 ${selectedCategory === cat.id ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`} />
            </button>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <div className="animate-slideUp">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-5">Select Subcategory</h3>
          {subcategoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {subcategories.map((subcat: { id: string; name: string }, index) => (
                <button key={subcat.id || index} type="button" onClick={() => handleSubcategorySelect(subcat)}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-center overflow-hidden ${selectedSubcategory === subcat.id ? "border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-500/10 dark:to-primary-500/5 shadow-glow-pink" : "border-surface-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-primary-300 dark:hover:border-primary-500/50 hover:shadow-premium-sm"}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${selectedSubcategory === subcat.id ? "from-primary-500/5 to-transparent opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                  <div className="relative z-10">
                    <h4 className={`font-medium text-sm transition-colors ${selectedSubcategory === subcat.id ? "text-primary-600 dark:text-primary-400" : "text-surface-800 dark:text-surface-200 group-hover:text-primary-500"}`}>{subcat.name}</h4>
                  </div>
                  {selectedSubcategory === subcat.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-md animate-scaleIn">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-pink transition-all duration-300 ${selectedSubcategory === subcat.id ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Attributes step content
  const renderAttributesStep = () => (
    <div className="space-y-8 animate-fadeIn">
      {renderGroupedAttributes(variantAttributes, true, "Product Variants", "Configure variant-specific details", "bg-gradient-pink", SparklesIcon)}
      {renderGroupedAttributes(nonVariantAttributes, false, "Specifications", "Additional product details", "bg-gradient-purple", TagIcon)}
      <div className="premium-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-blue flex items-center justify-center text-white"><TagIcon /></div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">SEO Settings (Optional)</h3>
            <p className="text-sm text-surface-500">Helps rank your listing in search results</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">SEO Title</label>
            <input type="text" value={productData.meta_title} onChange={(e) => updateProductData("meta_title", e.target.value)} placeholder="Meta title for search engines" className="input-premium" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">SEO Tags</label>
            <input type="text" value={productData.tags} onChange={(e) => updateProductData("tags", e.target.value)} placeholder="Tags separated by commas" className="input-premium" />
          </div>
        </div>
      </div>
      {allowedAttributes.length === 0 && (
        <div className="premium-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-dark-surface mx-auto mb-4 flex items-center justify-center"><TagIcon /></div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">No Specific Attributes Required</h3>
          <p className="text-surface-500">This category doesn&apos;t require any specific attributes.</p>
        </div>
      )}
    </div>
  );

  // Media step — shows EXISTING images + upload zone for new ones
  const renderMediaStep = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="premium-card p-6">
        {/* Existing images from the server */}
        {existingImages.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-4 flex items-center gap-2">
              Current Images ({existingImages.length})
              <span className="text-xs text-surface-400">— click × to remove, or upload new images below to replace</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {existingImages.map((src, index) => (
                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-surface-100 dark:bg-dark-surface border-2 border-surface-200 dark:border-dark-border">
                  <img src={src} alt={`Existing ${index + 1}`} className="w-full h-full object-cover" />
                  {index === 0 && <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded-lg">Cover</div>}
                  <button type="button" onClick={() => removeExistingImage(index)} className="absolute top-2 right-2 w-8 h-8 bg-danger text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-danger-dark">
                    <TrashIcon />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs">Image {index + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload zone for new images */}
        {totalImages < 4 && (
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${dragActive ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10" : "border-surface-300 dark:border-dark-border hover:border-primary-400 dark:hover:border-primary-500/50"}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <input type="file" accept="image/*" multiple onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragActive ? "bg-primary-500 text-white" : "bg-surface-100 dark:bg-dark-surface text-surface-400"}`}>
                <UploadIcon />
              </div>
              <p className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-1">
                {existingImages.length > 0 ? "Upload replacement images" : "Drag and drop images here"}
              </p>
              <p className="text-sm text-surface-500 mb-4">or click to browse</p>
              <p className="text-xs text-surface-400">PNG, JPG, GIF up to 10MB each · {4 - totalImages} slot{4 - totalImages !== 1 ? "s" : ""} remaining</p>
            </div>
          </div>
        )}

        {/* New file previews */}
        {files.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-4">New Images to Upload ({files.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-surface-100 dark:bg-dark-surface border-2 border-dashed border-primary-400">
                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-accent-blue text-white text-xs font-medium rounded-lg">New</div>
                  <button type="button" onClick={() => removeFile(index)} className="absolute top-2 right-2 w-8 h-8 bg-danger text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-danger-dark">
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

  // Review step
  const renderReviewStep = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="premium-card p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Review Your Changes</h3>
        <p className="text-white/80">Please check all details before updating</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card p-6">
          <h4 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2"><PackageIcon /> Product Information</h4>
          <dl className="space-y-3">
            {[
              ["Category", selectedCategoryName],
              ["Subcategory", selectedSubcategoryName],
              ["Title", productData.name],
              ...(productData.brand_name ? [["Brand", productData.brand_name]] : []),
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2 border-b border-surface-100 dark:border-dark-border">
                <dt className="text-surface-500">{label}</dt>
                <dd className="font-medium text-surface-900 dark:text-white text-right max-w-[200px] truncate">{val}</dd>
              </div>
            ))}
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-dark-border">
              <dt className="text-surface-500">Price</dt>
              <dd className="font-medium text-primary-500">
                ${hasDiscount ? productData.unit_price : productData.mrp}
                {hasDiscount && <span className="text-surface-400 line-through ml-2 text-sm">${productData.mrp}</span>}
              </dd>
            </div>
            {productData.quantity && (
              <div className="flex justify-between py-2">
                <dt className="text-surface-500">Stock</dt>
                <dd className="font-medium text-surface-900 dark:text-white">{productData.quantity} units</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Images summary */}
        {(existingImages.length > 0 || files.length > 0) && (
          <div className="premium-card p-6">
            <h4 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2"><ImageIcon /> Product Images</h4>
            <div className="grid grid-cols-4 gap-2">
              {existingImages.map((src, i) => (
                <div key={`ex-${i}`} className="aspect-square rounded-lg overflow-hidden">
                  <img src={src} alt={`Existing ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              {files.map((file, i) => (
                <div key={`new-${i}`} className="aspect-square rounded-lg overflow-hidden border-2 border-dashed border-primary-400">
                  <img src={URL.createObjectURL(file)} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attributes summary */}
        {(variantAttributes.length > 0 || nonVariantAttributes.length > 0) && (
          <div className="premium-card p-6 lg:col-span-2">
            <h4 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2"><TagIcon /> Product Attributes</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...variantAttributes, ...nonVariantAttributes]
                .filter((attr) => { if (Array.isArray(attr.value)) return attr.value.length > 0; return attr.value !== "" && attr.value !== false; })
                .map((attr, index) => (
                  <div key={index} className="p-3 rounded-xl bg-surface-50 dark:bg-dark-surface">
                    <p className="text-xs text-surface-500 mb-1">{attr.name}</p>
                    <p className="font-medium text-surface-900 dark:text-white">
                      {Array.isArray(attr.value) ? attr.value.join(", ") : typeof attr.value === "boolean" ? (attr.value ? "Yes" : "No") : attr.value}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Step 2: Details (combined form — identical layout to add_products)
  const renderDetailsStep = () => (
    <div className="animate-fadeIn">
      {/* Hero title */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-pink-500/5 to-purple-500/5 rounded-2xl" />
        <div className="relative premium-card p-6 md:p-8 border-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary-500/10 to-pink-500/10 border border-primary-200 dark:border-primary-500/20">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{selectedCategoryName}</span>
            </span>
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-surface-100 dark:bg-dark-surface border border-surface-200 dark:border-dark-border">
              <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{selectedSubcategoryName}</span>
            </span>
          </div>
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-pink-500 rounded-full" />
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">Product Title <span className="text-danger">*</span></label>
            <input type="text" value={productData.name} onChange={(e) => updateProductData("name", e.target.value)} placeholder="Enter a product title..." className="w-full px-0 py-3 text-xl md:text-2xl font-semibold bg-transparent border-0 border-b-2 border-surface-200 dark:border-dark-border text-surface-900 dark:text-white placeholder:text-surface-300 dark:placeholder:text-surface-600 focus:border-primary-500 focus:ring-0 transition-colors" required />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Regular Price */}
        <div className="premium-card p-6 relative overflow-hidden group hover:shadow-premium transition-shadow duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/25">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div><h4 className="font-semibold text-surface-900 dark:text-white">Regular Price</h4><p className="text-xs text-surface-500">Base price before any discounts</p></div>
            </div>
            <span className="text-xs font-medium text-danger">Required</span>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-surface-400">$</span>
            <input type="number" value={productData.mrp} onChange={(e) => updateProductData("mrp", e.target.value)} placeholder="0.00" min={0} className="w-full pl-12 pr-4 py-4 text-2xl font-bold rounded-xl bg-surface-50 dark:bg-dark-input border-2 border-surface-200 dark:border-dark-border text-surface-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" required />
          </div>
        </div>

        {/* Sale Price */}
        <div className={`premium-card p-6 relative overflow-hidden transition-all duration-500 ${hasDiscount ? "ring-2 ring-primary-500 shadow-glow-pink" : "opacity-75 hover:opacity-100"}`}>
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-pink-500 transition-opacity ${hasDiscount ? "opacity-100" : "opacity-30"}`} />
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${hasDiscount ? "bg-gradient-to-br from-primary-500 to-pink-500 shadow-pink-500/25" : "bg-surface-400 shadow-surface-500/25"}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              </div>
              <div><h4 className="font-semibold text-surface-900 dark:text-white">Sale Price</h4><p className="text-xs text-surface-500">Discounted price for buyers</p></div>
            </div>
            <button type="button" onClick={() => setHasDiscount(!hasDiscount)} className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${hasDiscount ? "bg-gradient-to-r from-primary-500 to-pink-500" : "bg-surface-300 dark:bg-dark-border"}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${hasDiscount ? "translate-x-8" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold transition-colors ${hasDiscount ? "text-primary-500" : "text-surface-300"}`}>$</span>
            <input type="number" value={productData.unit_price} onChange={(e) => updateProductData("unit_price", e.target.value)} placeholder="0.00" min={0} disabled={!hasDiscount} className={`w-full pl-12 pr-4 py-4 text-2xl font-bold rounded-xl border-2 transition-all ${hasDiscount ? "bg-surface-50 dark:bg-dark-input border-primary-200 dark:border-primary-500/30 text-surface-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" : "bg-surface-100 dark:bg-dark-surface border-surface-200 dark:border-dark-border text-surface-400 cursor-not-allowed"}`} />
          </div>
          {hasDiscount && productData.mrp && productData.unit_price && Number(productData.mrp) > Number(productData.unit_price) && (
            <div className="mt-4 flex items-center gap-2 animate-fadeIn">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-sm font-semibold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                {Math.round((1 - Number(productData.unit_price) / Number(productData.mrp)) * 100)}% OFF
              </span>
              <span className="text-xs text-surface-500">Customer saves ${(Number(productData.mrp) - Number(productData.unit_price)).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Brand & Stock */}
      {(!shouldHideBrand || !shouldHideStock) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {!shouldHideBrand && (
            <div className="premium-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
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
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Stock Quantity</label>
              </div>
              <input type="number" value={productData.quantity} onChange={(e) => updateProductData("quantity", e.target.value)} placeholder="Available units" min={0} className="input-premium" />
            </div>
          )}
        </div>
      )}

      {/* Descriptions */}
      <div className="premium-card p-6 md:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Product Description</h3>
            <p className="text-xs text-surface-500">Help customers understand your product</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Short Description <span className="text-danger">*</span></label>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-surface-200 dark:bg-dark-border overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${shortDescPlainLen > 200 ? "bg-orange-500" : "bg-primary-500"}`} style={{ width: `${Math.min((shortDescPlainLen / SHORT_DESCRIPTION_MAX_PLAIN) * 100, 100)}%` }} />
                </div>
                <span className={`text-xs ${shortDescPlainLen >= SHORT_DESCRIPTION_MAX_PLAIN ? "text-orange-500 font-semibold" : "text-surface-400"}`}>{shortDescPlainLen}/{SHORT_DESCRIPTION_MAX_PLAIN}</span>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border-2 border-surface-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-500/50 transition-colors">
              <ReactQuill theme="snow" value={productData.short_description} formats={formats}
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
                className="bg-white dark:bg-dark-input [&_.ql-container]:!min-h-[120px] [&_.ql-editor]:!min-h-[120px]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Detailed Description</label>
            <div className="rounded-xl overflow-hidden border-2 border-surface-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-500/50 transition-colors">
              <ReactQuill theme="snow" value={productData.description} formats={formats}
                onChange={(val: string) => setProductData((prev) => ({ ...prev, description: val }))}
                className="bg-white dark:bg-dark-input [&_.ql-container]:!min-h-[120px] [&_.ql-editor]:!min-h-[120px]" />
            </div>
          </div>
        </div>
      </div>

      {/* NDA Financial Privacy — shown for Business for Sale and Real Estate only */}
      {showNdaSection && (
        <div className="rounded-xl border border-surface-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 mb-6">
          <div className="text-sm font-bold text-surface-900 dark:text-white mb-1">🔒 Financial Privacy (NDA)</div>
          <div className="text-xs text-surface-500 mb-3">Choose which financial data buyers must sign an NDA to see. Leave both off to show everything publicly.</div>

          {/* EBITDA toggle */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg border-[1.5px] cursor-pointer mb-2 transition-all select-none ${
              productData.nda_lock_ebitda
                ? "border-pink-500 bg-pink-50 dark:bg-pink-500/10"
                : "border-surface-200 dark:border-dark-border bg-surface-50 dark:bg-dark-surface hover:border-pink-400"
            }`}
            onClick={() => setProductData(prev => ({ ...prev, nda_lock_ebitda: !prev.nda_lock_ebitda }))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setProductData(prev => ({ ...prev, nda_lock_ebitda: !prev.nda_lock_ebitda })); }}
          >
            <div className="flex flex-col gap-0.5 pr-4">
              <span className={`text-[13px] font-semibold ${productData.nda_lock_ebitda ? "text-pink-600 dark:text-pink-400" : "text-surface-900 dark:text-white"}`}>
                Lock SDE / EBITDA behind NDA
              </span>
              <span className="text-[11px] text-surface-500">The SDE / EBITDA figure will be hidden until a buyer signs the NDA.</span>
            </div>
            <div className={`w-9 h-5 rounded-full flex-shrink-0 relative transition-colors ${productData.nda_lock_ebitda ? "bg-pink-500" : "bg-surface-300 dark:bg-dark-border"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${productData.nda_lock_ebitda ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </div>
          </div>

          {/* Full financials toggle */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg border-[1.5px] cursor-pointer transition-all select-none ${
              productData.nda_lock_full_financials
                ? "border-pink-500 bg-pink-50 dark:bg-pink-500/10"
                : "border-surface-200 dark:border-dark-border bg-surface-50 dark:bg-dark-surface hover:border-pink-400"
            }`}
            onClick={() => setProductData(prev => ({ ...prev, nda_lock_full_financials: !prev.nda_lock_full_financials }))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setProductData(prev => ({ ...prev, nda_lock_full_financials: !prev.nda_lock_full_financials })); }}
          >
            <div className="flex flex-col gap-0.5 pr-4">
              <span className={`text-[13px] font-semibold ${productData.nda_lock_full_financials ? "text-pink-600 dark:text-pink-400" : "text-surface-900 dark:text-white"}`}>
                Lock full financials behind NDA
              </span>
              <span className="text-[11px] text-surface-500">Revenue breakdown, P&amp;L tables, and tax returns are hidden until a buyer signs the NDA.</span>
            </div>
            <div className={`w-9 h-5 rounded-full flex-shrink-0 relative transition-colors ${productData.nda_lock_full_financials ? "bg-pink-500" : "bg-surface-300 dark:bg-dark-border"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${productData.nda_lock_full_financials ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </div>
          </div>
          {(productData.nda_lock_ebitda || productData.nda_lock_full_financials) && productId && (
            <ProductNdaDocumentsSection
              productId={productId}
              ndaLocksEnabled={
                !!(productData.nda_lock_ebitda || productData.nda_lock_full_financials)
              }
              variant="panel"
            />
          )}
        </div>
      )}

      {/* Dimensions */}
      {!shouldHideDimensions && (
        <div className="premium-card overflow-hidden mb-6">
          <button type="button" onClick={() => setShowDimensions(!showDimensions)} className="flex items-center justify-between w-full p-5 hover:bg-surface-50 dark:hover:bg-dark-surface/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showDimensions ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/25" : "bg-surface-100 dark:bg-dark-surface text-surface-500"}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-surface-900 dark:text-white">Product Dimensions</h4>
                <p className="text-xs text-surface-500">Size and weight specifications</p>
              </div>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium text-surface-400 bg-surface-100 dark:bg-dark-surface rounded">Optional</span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-surface-100 dark:bg-dark-surface transition-transform duration-300 ${showDimensions ? "rotate-180" : ""}`}>
              <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          {showDimensions && (
            <div className="px-5 pb-5 pt-2 border-t border-surface-100 dark:border-dark-border animate-slideUp">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ label: "Length", key: "length", unit: "cm" }, { label: "Width", key: "width", unit: "cm" }, { label: "Height", key: "height", unit: "cm" }, { label: "Weight", key: "weight", unit: "kg" }].map(({ label, key, unit }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-surface-500 mb-2 block">{label}</label>
                    <div className="relative">
                      <input type="number" value={(productData as any)[key]} onChange={(e) => updateProductData(key, e.target.value)} placeholder="0" min={0} className="input-premium pr-10" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attributes */}
      {(variantAttributes.length > 0 || nonVariantAttributes.length > 0) && (
        <div className="premium-card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25"><TagIcon /></div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Product Attributes</h3>
              <p className="text-xs text-surface-500">Specific details for this product type</p>
            </div>
          </div>
          {renderAttributesStep()}
        </div>
      )}

      {/* Media */}
      {!shouldHideMedia && (
        <div className="premium-card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/25"><ImageIcon /></div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Product Images <span className="text-danger">*</span></h3>
              <p className="text-xs text-surface-500">Keep existing or upload new images</p>
            </div>
          </div>
          {renderMediaStep()}
        </div>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderCategoryStep();
      case 2:
        if (isBusinessForSale && selectedSubcategory) {
          return (
            <BusinessForSaleListingWizard
              key={selectedSubcategory}
              ref={bfsWizardRef}
              listingProductId={productId}
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
              existingImages={existingImages}
              onRemoveExistingImage={(i) => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))}
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
                  toast.error("Please complete all required sections before continuing.");
                  return;
                }
                setCompletedSteps((prev) => (prev.includes(2) ? prev : [...prev, 2]));
                setCurrentStep(3);
              }}
            />
          );
        }
        return renderDetailsStep();
      case 3: return renderReviewStep();
      default: return null;
    }
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  if (initialLoading) return <Loader2 />;
  if (loading) return <Loader2 />;

  return (
    <div className="min-h-screen pb-20">
      {/* Page title banner */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 dark:bg-dark-surface text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-dark-hover transition-colors text-sm font-medium"
        >
          <ChevronLeftIcon />
          Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Edit Product</h1>
          {productData.name && (
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 truncate max-w-xs">{productData.name}</p>
          )}
        </div>
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isCurrent ? "bg-gradient-pink text-white shadow-glow-pink" : isCompleted ? "bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400" : "bg-surface-100 dark:bg-dark-surface text-surface-400 hover:bg-surface-200 dark:hover:bg-dark-hover"} ${step.id > currentStep && !completedSteps.includes(step.id - 1) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCurrent ? "bg-white/20" : isCompleted ? "bg-primary-500 text-white" : "bg-surface-200 dark:bg-dark-hover"}`}>
                    {isCompleted ? <CheckIcon /> : <StepIcon />}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="font-semibold text-sm">{isBusinessForSale && step.id === 2 ? "Listing" : step.name}</p>
                    <p className={`text-xs ${isCurrent ? "text-white/70" : "text-surface-500"}`}>{isBusinessForSale && step.id === 2 ? "Business details" : step.description}</p>
                  </div>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 md:w-16 h-0.5 mx-2 transition-colors ${completedSteps.includes(step.id) ? "bg-primary-500" : "bg-surface-200 dark:bg-dark-border"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">{renderStepContent()}</div>

      {/* Navigation Buttons — hidden when BFS wizard is active (wizard has its own nav) */}
      {!(currentStep === 2 && isBusinessForSale) && (
      <div className="fixed left-0 right-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl border-t border-surface-200 dark:border-dark-border p-4 md:p-6 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${currentStep === 1 ? "opacity-50 cursor-not-allowed bg-surface-100 dark:bg-dark-surface text-surface-400" : "bg-surface-100 dark:bg-dark-surface text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-dark-hover"}`}
          >
            <ChevronLeftIcon />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {STEPS.map((step) => (
              <div key={step.id} className={`w-2 h-2 rounded-full transition-colors ${step.id === currentStep ? "bg-primary-500" : completedSteps.includes(step.id) ? "bg-primary-300" : "bg-surface-300 dark:bg-dark-border"}`} />
            ))}
          </div>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${canProceed() ? "bg-gradient-pink text-white shadow-glow-pink hover:opacity-90" : "opacity-50 cursor-not-allowed bg-surface-300 text-surface-500"}`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {!productActive && (
                <button
                  type="button"
                  onClick={handlePayForCurrentProduct}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${productActive === false ? "bg-gradient-pink text-white" : "opacity-50 bg-surface-300 text-surface-500 cursor-not-allowed"}`}
                >
                  <span>Pay to activate</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-gradient-pink text-white shadow-glow-pink hover:opacity-90 transition-all duration-300"
              >
                <SparklesIcon />
                <span>Update Product</span>
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default EditProduct;
