"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  SHORT_DESCRIPTION_MAX_PLAIN,
  truncateUnicodePlain,
  plainToQuillShortDescriptionHtml,
} from "@/utils/shortDescription";
import "./business-for-sale-wizard.css";

const TOTAL_STEPS = 7;

const INDUSTRY_OPTIONS = [
  "",
  "SaaS / Tech",
  "Healthcare",
  "E-commerce",
  "Retail",
  "Food & Beverage",
  "Manufacturing",
  "Logistics",
  "Professional Services",
  "Media / Content",
  "Real Estate Holding Co",
  "Franchise",
  "Other",
];

const SMART_TAG_DEFS: { id: string; icon: string; label: string; sub: string }[] = [
  { id: "absentee", icon: "🏖️", label: "Absentee-Run", sub: "Minimal owner involvement" },
  { id: "sba", icon: "🏦", label: "SBA Pre-Qualified", sub: "Likely eligible for financing" },
  { id: "recurring", icon: "🔄", label: "Recurring Revenue", sub: "Subscriptions or contracts" },
  { id: "b2b", icon: "🏢", label: "B2B", sub: "Primarily business customers" },
  { id: "b2c", icon: "🛍️", label: "B2C", sub: "Consumer-facing" },
  { id: "ip", icon: "©️", label: "IP / Assets Included", sub: "Trademarks, patents, code" },
];

/** Must stay in sync with `growth_trend` options in docker-pinksurfing-prod/filter.json (business-for-sale). */
const GROWTH_TREND_OPTIONS = [
  "",
  "Declining",
  "Flat",
  "Moderate growth",
  "High growth",
  "Up",
  "Neutral",
  "Down",
  "Any trend",
] as const;

function setAttrByMatchers(
  attrs: any[],
  matchers: { keys?: string[]; names?: string[] },
  value: string | boolean | string[]
): any[] {
  const keys = (matchers.keys || []).map((k) => k.toLowerCase());
  const names = (matchers.names || []).map((k) => k.toLowerCase());
  return attrs.map((a) => {
    const ak = (a.key || "").toLowerCase();
    const an = (a.name || "").toLowerCase();
    const keyHit = keys.some((k) => ak === k || ak.includes(k));
    const nameHit = names.some((n) => an === n || an.includes(n));
    if (keyHit || nameHit) {
      return { ...a, value };
    }
    return a;
  });
}

/** Match `field.key` only (avoids e.g. `annual_revenue` when updating `revenue`). */
function setAttrValueForSchemaKey(
  attrs: any[],
  schemaKey: string,
  value: string | boolean | string[]
): any[] {
  const k = schemaKey.toLowerCase();
  return attrs.map((a) => ((a.key || "").toLowerCase() === k ? { ...a, value } : a));
}

function findAttr(attrs: any[], ...candidates: string[]): any | undefined {
  const c = candidates.map((x) => x.toLowerCase());
  return attrs.find((a) => {
    const ak = (a.key || "").toLowerCase();
    const an = (a.name || "").toLowerCase();
    return c.some((t) => ak === t || ak.includes(t) || an === t || an.includes(t));
  });
}

export type BusinessForSaleListingWizardHandle = {
  /** True when internal wizard is on the review panel and required fields pass. */
  canGoToVendorReview: () => boolean;
  getStep: () => number;
  /** Reserved for optional HTML merged into `description` on submit; BFS details live on `attributes`. */
  getDescriptionAppendixHtml: () => string;
};

type Props = {
  selectedCategoryName: string;
  selectedSubcategoryName: string;
  productData: {
    name: string;
    unit_price: string;
    mrp: string;
    short_description: string;
    description: string;
    meta_title: string;
    tags: string;
  };
  setProductData: React.Dispatch<React.SetStateAction<any>>;
  hasDiscount: boolean;
  setHasDiscount: (v: boolean) => void;
  nonVariantAttributes: any[];
  setNonVariantAttributes: React.Dispatch<React.SetStateAction<any[]>>;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  /** Existing image URLs from the server (edit mode only) */
  existingImages?: string[];
  onRemoveExistingImage?: (index: number) => void;
  allCountries: { name: string; code: string }[];
  allStates: { name: string; code: string }[];
  selectedCountryName: string;
  setSelectedCountryName: (n: string) => void;
  loadingStates: boolean;
  setShortDescPlainLen: (n: number) => void;
  SearchableSelect: React.FC<any>;
  renderAttributeInput: (attr: any, isVariant: boolean, index: number) => React.ReactNode;
  /** Subcategory schema fields shown in the wizard (each row keeps the parent attribute index). */
  schemaAttributeRows: { attr: any; index: number }[];
  onBackToCategoryStep: () => void;
  onContinueToVendorReview: () => void;
};

const BFS_TIPS = [
  "A specific title with key metrics gets more clicks. Include revenue, margin, or industry.",
  "Businesses with a city and state get more inquiries from local and regional buyers.",
  "Listings with financial fields completed receive more serious buyer inquiries.",
  "Fill in any remaining subcategory fields — they help buyers filter and compare listings.",
  "Only apply Smart Tags that genuinely fit your business.",
  "Photos dramatically increase engagement. Add at least one clear image.",
  "Use the review step to confirm everything before continuing to the platform review screen.",
];

export const BusinessForSaleListingWizard = forwardRef<
  BusinessForSaleListingWizardHandle,
  Props
>(function BusinessForSaleListingWizard(props, ref) {
  const {
    selectedCategoryName,
    selectedSubcategoryName,
    productData,
    setProductData,
    hasDiscount,
    setHasDiscount,
    nonVariantAttributes,
    setNonVariantAttributes,
    files,
    setFiles,
    existingImages = [],
    onRemoveExistingImage,
    allCountries,
    allStates,
    selectedCountryName,
    setSelectedCountryName,
    loadingStates,
    setShortDescPlainLen,
    SearchableSelect,
    renderAttributeInput,
    schemaAttributeRows,
    onBackToCategoryStep,
    onContinueToVendorReview,
  } = props;

  const [bfsStep, setBfsStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => new Set());
  const [creatorType, setCreatorType] = useState<"human_built" | "ai_built" | "hybrid">(() => {
    const a = findAttr(nonVariantAttributes, "creator_type");
    const v = a?.value != null ? String(a.value).trim() : "";
    return (v === "ai_built" || v === "hybrid") ? v : "human_built";
  });
  const [industry, setIndustry] = useState("");
  const [saleType, setSaleType] = useState(() => {
    const a = findAttr(nonVariantAttributes, "sale_type");
    return a?.value != null ? String(a.value).trim() : "";
  });
  const [overviewPlain, setOverviewPlain] = useState(() => {
    const html = productData.short_description || "";
    if (!html) return "";
    const d = typeof document !== "undefined" ? document.createElement("div") : null;
    if (d) {
      d.innerHTML = html;
      return d.textContent || "";
    }
    return html.replace(/<[^>]+>/g, " ").trim();
  });
  const [bfsCity, setBfsCity] = useState(() => {
    const a = findAttr(nonVariantAttributes, "city");
    return (typeof a?.value === "string" ? a.value : "") || "";
  });
  const [bfsZip, setBfsZip] = useState(() => {
    const a = findAttr(nonVariantAttributes, "zip", "zip_code", "postal");
    return (typeof a?.value === "string" ? a.value : "") || "";
  });
  const [finRevenue, setFinRevenue] = useState(() => {
    const a = findAttr(nonVariantAttributes, "revenue", "annual_revenue");
    return a?.value != null ? String(a.value).trim() : "";
  });
  const [finEbitda, setFinEbitda] = useState(() => {
    const a = findAttr(nonVariantAttributes, "ebitda");
    return a?.value != null ? String(a.value).trim() : "";
  });
  const [finSde, setFinSde] = useState(() => {
    const a = findAttr(nonVariantAttributes, "sde");
    return a?.value != null ? String(a.value).trim() : "";
  });
  const [finGrowth, setFinGrowth] = useState(() => {
    const a = findAttr(nonVariantAttributes, "growth_trend", "growth");
    return a?.value != null ? String(a.value).trim() : "";
  });
  const [remoteFriendly, setRemoteFriendly] = useState(() => {
    const a = findAttr(nonVariantAttributes, "remote_friendly");
    return a?.value === true || a?.value === "true";
  });
  const [webOnly, setWebOnly] = useState(() => {
    const a = findAttr(nonVariantAttributes, "web_mobile_only", "web_only");
    return a?.value === true || a?.value === "true";
  });
  const [multiLoc, setMultiLoc] = useState(() => {
    const a = findAttr(nonVariantAttributes, "multi_location");
    return a?.value === true || a?.value === "true";
  });
  const [smartOn, setSmartOn] = useState<Record<string, boolean>>(() => {
    const a = findAttr(nonVariantAttributes, "smart_tags");
    if (!a?.value) return {};
    const saved: string[] = Array.isArray(a.value)
      ? a.value
      : String(a.value).split(",").map((s: string) => s.trim()).filter(Boolean);
    const result: Record<string, boolean> = {};
    SMART_TAG_DEFS.forEach((t) => {
      if (saved.some((s) => s.toLowerCase() === t.label.toLowerCase())) result[t.id] = true;
    });
    return result;
  });
  const [dragActive, setDragActive] = useState(false);
  const [draftHint, setDraftHint] = useState("");
  const [mainDescription, setMainDescription] = useState(() => {
    const d = productData.description || "";
    const marker = "<p><strong>Business listing details";
    const i = d.indexOf(marker);
    return i >= 0 ? d.slice(0, i).trim() : d.trim();
  });
  const [countryFree, setCountryFree] = useState(() => selectedCountryName || "");
  const [stateFree, setStateFree] = useState("");

  useEffect(() => {
    const id = "bfs-wizard-fonts";
    if (typeof document !== "undefined" && !document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const countryAttr = useMemo(() => findAttr(nonVariantAttributes, "country"), [nonVariantAttributes]);
  const stateAttr = useMemo(() => findAttr(nonVariantAttributes, "state", "province", "region"), [nonVariantAttributes]);
  const cityAttr = useMemo(() => findAttr(nonVariantAttributes, "city"), [nonVariantAttributes]);
  const zipAttr = useMemo(() => findAttr(nonVariantAttributes, "zip", "zip_code", "postal"), [nonVariantAttributes]);

  const countryValue = (countryAttr?.value as string) || "";
  const stateValue = (stateAttr?.value as string) || "";


  /** Schema industry wins; otherwise default Industry to the selected subcategory (wizard remounts on subcategory change via parent `key`). */
  useEffect(() => {
    const ind = findAttr(nonVariantAttributes, "industry");
    const iv = ind?.value != null ? String(ind.value).trim() : "";
    if (iv) {
      setIndustry(iv);
      return;
    }
    const sub = (selectedSubcategoryName || "").trim();
    if (!sub) {
      setIndustry("");
      return;
    }
    const match = INDUSTRY_OPTIONS.find((o) => o && o.toLowerCase() === sub.toLowerCase()) || "";
    setIndustry(match || sub);
  }, [nonVariantAttributes, selectedSubcategoryName]);

  const industrySelectOptions = useMemo(() => {
    const base = INDUSTRY_OPTIONS.filter((o): o is string => Boolean(o));
    const seen = new Set(base.map((x) => x.toLowerCase()));
    const extra: string[] = [];
    const sub = (selectedSubcategoryName || "").trim();
    if (sub && !seen.has(sub.toLowerCase())) {
      extra.push(sub);
      seen.add(sub.toLowerCase());
    }
    if (industry && !seen.has(industry.toLowerCase())) {
      extra.push(industry);
    }
    return ["", ...base, ...extra];
  }, [selectedSubcategoryName, industry]);

  const updateOverviewShort = useCallback(
    (plain: string) => {
      let next = plain;
      if (next.length > SHORT_DESCRIPTION_MAX_PLAIN) {
        next = truncateUnicodePlain(next, SHORT_DESCRIPTION_MAX_PLAIN);
      }
      setOverviewPlain(next);
      setShortDescPlainLen(next.length);
      const html = next ? plainToQuillShortDescriptionHtml(next) : "";
      setProductData((prev: any) => ({ ...prev, short_description: html }));
    },
    [setProductData, setShortDescPlainLen]
  );

  const syncLocationToAttrs = useCallback(() => {
    setNonVariantAttributes((prev) => {
      let next = prev;
      if (bfsCity) next = setAttrByMatchers(next, { keys: ["city"], names: ["city"] }, bfsCity);
      if (bfsZip) next = setAttrByMatchers(next, { keys: ["zip", "zip_code", "postal"], names: ["zip", "postal"] }, bfsZip);
      return next;
    });
  }, [bfsCity, bfsZip, setNonVariantAttributes]);

  useEffect(() => {
    syncLocationToAttrs();
  }, [syncLocationToAttrs]);

  useEffect(() => {
    if (!industry) return;
    setNonVariantAttributes((prev) =>
      setAttrByMatchers(prev, { keys: ["industry"], names: ["industry"] }, industry)
    );
  }, [industry, setNonVariantAttributes]);

  useEffect(() => {
    setProductData((prev: any) => ({ ...prev, description: mainDescription }));
  }, [mainDescription, setProductData]);

  useEffect(() => {
    if (!stateAttr && stateFree) {
      setNonVariantAttributes((prev) =>
        setAttrByMatchers(prev, { keys: ["state", "province", "region"], names: ["state", "province", "region"] }, stateFree)
      );
    }
  }, [stateAttr, stateFree, setNonVariantAttributes]);

  useEffect(() => {
    if (!countryAttr && countryFree) {
      setSelectedCountryName(countryFree);
    }
  }, [countryAttr, countryFree, setSelectedCountryName]);

  /** Persist BFS-only fields as `Product.attributes` (schema in filter.json); avoid duplicating in HTML. */
  useEffect(() => {
    setNonVariantAttributes((prev) => {
      if (!prev.length) return prev;
      let next = prev;
      next = setAttrValueForSchemaKey(next, "revenue", finRevenue || "");
      next = setAttrValueForSchemaKey(next, "ebitda", finEbitda || "");
      next = setAttrValueForSchemaKey(next, "sde", finSde || "");
      next = setAttrValueForSchemaKey(next, "growth_trend", finGrowth || "");
      next = setAttrValueForSchemaKey(next, "sale_type", saleType || "");
      next = setAttrValueForSchemaKey(next, "creator_type", creatorType || "");
      next = setAttrValueForSchemaKey(next, "remote_friendly", remoteFriendly);
      next = setAttrValueForSchemaKey(next, "web_mobile_only", webOnly);
      next = setAttrValueForSchemaKey(next, "multi_location", multiLoc);
      const tagLabels = SMART_TAG_DEFS.filter((t) => smartOn[t.id]).map((t) => t.label);
      next = setAttrValueForSchemaKey(next, "smart_tags", tagLabels);
      return next;
    });
  }, [
    finRevenue,
    finEbitda,
    finSde,
    finGrowth,
    saleType,
    creatorType,
    remoteFriendly,
    webOnly,
    multiLoc,
    smartOn,
    setNonVariantAttributes,
  ]);

  const getDescriptionAppendixHtml = useCallback((): string => {
    return "";
  }, []);

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!productData.name.trim()) return false;
      if (!industry) return false;
      if (!overviewPlain.trim()) return false;
      return true;
    }
    if (step === 1) {
      if (!bfsCity.trim()) return false;
      const st = stateAttr ? stateValue : stateFree;
      if (!st) return false;
      const c = countryAttr ? countryValue : countryFree;
      if (!c) return false;
      return true;
    }
    if (step === 2) {
      return Boolean(productData.mrp);
    }
    if (step === 3) {
      for (const { attr } of schemaAttributeRows) {
        if (!attr.required) continue;
        if (Array.isArray(attr.value)) {
          if (attr.value.length === 0) return false;
        } else if (attr.value === "" || attr.value === null || attr.value === undefined) return false;
      }
      return true;
    }
    if (step === 5) {
      return files.length > 0 || existingImages.length > 0;
    }
    return true;
  };

  const goTo = (step: number) => {
    if (step < 0 || step >= TOTAL_STEPS) return;
    setBfsStep(step);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextStep = () => {
    if (!validateStep(bfsStep)) return;
    setCompletedSteps((prev) => new Set(prev).add(bfsStep));
    goTo(bfsStep + 1);
  };

  const prevStep = () => {
    if (bfsStep === 0) {
      onBackToCategoryStep();
      return;
    }
    goTo(bfsStep - 1);
  };

  const canGoToVendorReview = useCallback(() => {
    for (let s = 0; s < TOTAL_STEPS - 1; s++) {
      if (!validateStep(s)) return false;
    }
    return true;
  }, [
    productData.name,
    productData.mrp,
    industry,
    overviewPlain,
    bfsCity,
    stateValue,
    stateFree,
    stateAttr,
    countryValue,
    countryFree,
    countryAttr,
    files.length,
    schemaAttributeRows,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      canGoToVendorReview,
      getStep: () => bfsStep,
      getDescriptionAppendixHtml: () => getDescriptionAppendixHtml(),
    }),
    [canGoToVendorReview, bfsStep, getDescriptionAppendixHtml]
  );

  const progClass = (i: number) => {
    let c = "prog-step";
    if (i === bfsStep) c += " active";
    else if (completedSteps.has(i) && i !== bfsStep) c += " done";
    return c;
  };

  const photoPreviewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photoPreviewUrls]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (!e.dataTransfer.files?.length) return;
    const add = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => {
      const n = [...prev, ...add].slice(0, 4);
      return n;
    });
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const add = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...add].slice(0, 4));
  };

  const removePhoto = (i: number) => {
    setFiles((prev) => prev.filter((_, j) => j !== i));
  };

  const saveDraftHint = () => {
    setDraftHint("Saving…");
    setTimeout(() => {
      setDraftHint("Draft saved locally");
      setTimeout(() => setDraftHint(""), 2500);
    }, 400);
  };

  const renderSchemaBlock = () => {
    if (schemaAttributeRows.length === 0) {
      return (
        <div className="card">
          <div className="card-title">Additional attributes</div>
          <div className="card-sub">No extra fields are required for this subcategory.</div>
        </div>
      );
    }
    return (
      <div className="card">
        <div className="card-title">Subcategory fields</div>
        <div className="card-sub">Required or optional attributes from your selected subcategory.</div>
        <div style={{ marginTop: 16 }}>
          {schemaAttributeRows.map(({ attr, index }) => (
            <div className="field" key={`${attr.key || attr.name}-${index}`}>
              <label>
                {attr.name}
                {attr.required ? <span className="req"> *</span> : null}
              </label>
              {renderAttributeInput(attr, false, index)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const reviewMetrics = () => {
    const price = parseFloat(productData.mrp) || 0;
    const rev = parseFloat(finRevenue) || 0;
    const eb = parseFloat(finEbitda) || 0;
    const fmt = (n: number) => {
      if (!n) return "—";
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
      if (n >= 1000) return `$${Math.round(n / 1000)}K`;
      return `$${n.toLocaleString()}`;
    };
    return { price, rev, eb, fmt };
  };

  const { price, rev, eb, fmt } = reviewMetrics();

  return (
    <div className="bfs-wizard-root bfs-wizard--embedded">
      {/* Single title row — flows with vendor layout (no duplicate app nav / breadcrumbs) */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">
            Business listing
          </h2>
          <p className="mt-1 text-sm text-body dark:text-bodydark">
            {selectedCategoryName}
            <span className="mx-1.5 text-bodydark2">·</span>
            {selectedSubcategoryName}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:pt-0.5">
          {draftHint ? (
            <span className="text-xs text-body dark:text-bodydark">{draftHint}</span>
          ) : null}
          <button
            type="button"
            onClick={saveDraftHint}
            className="rounded-lg border border-stroke bg-gray px-3 py-1.5 text-sm font-medium text-black hover:bg-opacity-80 dark:border-strokedark dark:bg-meta-4 dark:text-bodydark1 dark:hover:border-bodydark2"
          >
            Save draft
          </button>
        </div>
      </div>

      <div className="bfs-embed-progress mb-6 overflow-x-auto rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-dark-card dark:shadow-none">
      <div className="progress-bar-wrap">
        {[
          "Overview",
          "Location",
          "Financials",
          "Attributes",
          "Smart tags",
          "Media",
          "Review",
        ].map((label, i) => (
          <div key={label} className={progClass(i)} data-step={i} onClick={() => goTo(i)} role="button" tabIndex={0}>
            <div className="prog-num">
              <span>{i + 1}</span>
            </div>
            {label}
          </div>
        ))}
      </div>
      </div>

      <div className="form-layout">
        <div>
          {/* Step 0 */}
          <div className={"form-panel" + (bfsStep === 0 ? " active" : "")}>
            <div className="card">
              <div className="card-title">Business overview</div>
              <div className="card-sub">Start with the basics. This is the first thing buyers will see.</div>
              <div className="field">
                <label>
                  Business title <span className="req">*</span>
                </label>
                <input
                  className="fi"
                  value={productData.name}
                  onChange={(e) => setProductData((p: any) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Profitable SaaS — $1.2M revenue"
                  maxLength={120}
                />
              </div>
              <div className="field">
                <label>
                  Short summary <span className="req">*</span>
                </label>
                <textarea
                  className="fta"
                  style={{ minHeight: 120 }}
                  value={overviewPlain}
                  onChange={(e) => updateOverviewShort(e.target.value)}
                  placeholder="What the business does, customers, and why it is a strong acquisition…"
                />
              </div>
              <hr className="card-divider" />
              <div className="field-row">
                <div className="field">
                  <label>
                    Industry <span className="req">*</span>
                  </label>
                  <select className="fs" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                    {industrySelectOptions.map((o) => (
                      <option key={o || "empty"} value={o}>
                        {o || "Select industry…"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Sale type</label>
                  <select className="fs" value={saleType} onChange={(e) => setSaleType(e.target.value)}>
                    <option value="">Select…</option>
                    <option>Asset Sale</option>
                    <option>Stock Sale</option>
                    <option>Merger</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <hr className="card-divider" />
              <div className="card-title" style={{ fontSize: 13, marginBottom: 4 }}>
                Who built this business?
              </div>
              <div className="creator-grid">
                {(
                  [
                    ["human_built", "👤", "Human-built", "I built and operated this"],
                    ["ai_built", "🤖", "AI-built", "An AI agent generated core assets"],
                    ["hybrid", "👤🤖", "Hybrid", "AI-built, human-operated"],
                  ] as const
                ).map(([id, emoji, label, desc]) => (
                  <div
                    key={id}
                    className={"creator-opt" + (creatorType === id ? " on" : "")}
                    onClick={() => setCreatorType(id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="creator-emoji">{emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div className="creator-label">{label}</div>
                      <div className="creator-desc">{desc}</div>
                    </div>
                    <div className="creator-tick" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 1 Location */}
          <div className={"form-panel" + (bfsStep === 1 ? " active" : "")}>
            <div className="card">
              <div className="card-title">Business location</div>
              <div className="card-sub">Used for local buyer search. Choose country first to load states.</div>
              <div className="field-row">
                <div className="field">
                  <label>
                    Country <span className="req">*</span>
                  </label>
                  {countryAttr ? (
                    <SearchableSelect
                      label="Country"
                      value={countryValue}
                      options={allCountries.map((c) => ({ label: c.name, value: c.name }))}
                      placeholder="Select country"
                      onChange={(val: string, name: string) => {
                        setSelectedCountryName(name);
                        setNonVariantAttributes((prev) => {
                          const idx = prev.indexOf(countryAttr);
                          if (idx < 0) return prev;
                          const cp = [...prev];
                          cp[idx] = { ...cp[idx], value: val };
                          return cp;
                        });
                      }}
                    />
                  ) : (
                    <SearchableSelect
                      label="Country"
                      value={countryFree}
                      options={allCountries.map((c) => ({ label: c.name, value: c.name }))}
                      placeholder="Select country"
                      onChange={(_val: string, name: string) => {
                        setCountryFree(name);
                        setSelectedCountryName(name);
                      }}
                    />
                  )}
                </div>
                <div className="field">
                  <label>
                    State / province <span className="req">*</span>
                  </label>
                  {stateAttr ? (
                    <SearchableSelect
                      label="State / Province"
                      value={stateValue}
                      options={allStates.map((s) => ({ label: s.name, value: s.name }))}
                      placeholder={selectedCountryName ? "Select state" : "Select a country first"}
                      disabled={!selectedCountryName && !stateValue}
                      onChange={(val: string) => {
                        setNonVariantAttributes((prev) => {
                          const idx = prev.indexOf(stateAttr);
                          if (idx < 0) return prev;
                          const cp = [...prev];
                          cp[idx] = { ...cp[idx], value: val };
                          return cp;
                        });
                      }}
                    />
                  ) : (
                    <input
                      className="fi"
                      value={stateFree}
                      onChange={(e) => setStateFree(e.target.value)}
                      placeholder={selectedCountryName ? "State / province / region" : "Select a country first"}
                      disabled={!selectedCountryName}
                    />
                  )}
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>
                    City <span className="req">*</span>
                  </label>
                  <input className="fi" value={bfsCity} onChange={(e) => setBfsCity(e.target.value)} placeholder="e.g. Dallas" />
                </div>
                <div className="field">
                  <label>ZIP / postal code</label>
                  <input className="fi" value={bfsZip} onChange={(e) => setBfsZip(e.target.value)} maxLength={12} />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Location attributes</div>
              <div
                className={"bool-row" + (remoteFriendly ? " on" : "")}
                onClick={() => setRemoteFriendly((v) => !v)}
                role="button"
                tabIndex={0}
              >
                <div className="bool-row-left">
                  <div className="bool-row-label">Remote-friendly</div>
                  <div className="bool-row-sub">Can be operated fully or partially remote</div>
                </div>
                <div className="toggle-switch" />
              </div>
              <div
                className={"bool-row" + (webOnly ? " on" : "")}
                onClick={() => setWebOnly((v) => !v)}
                role="button"
                tabIndex={0}
              >
                <div className="bool-row-left">
                  <div className="bool-row-label">Web / mobile only</div>
                  <div className="bool-row-sub">No physical location required</div>
                </div>
                <div className="toggle-switch" />
              </div>
              <div
                className={"bool-row" + (multiLoc ? " on" : "")}
                onClick={() => setMultiLoc((v) => !v)}
                role="button"
                tabIndex={0}
              >
                <div className="bool-row-left">
                  <div className="bool-row-label">Multi-location</div>
                  <div className="bool-row-sub">Operates from 2+ physical sites</div>
                </div>
                <div className="toggle-switch" />
              </div>
            </div>
          </div>

          {/* Step 2 Financials */}
          <div className={"form-panel" + (bfsStep === 2 ? " active" : "")}>
            <div className="card">
              <div className="card-title">Pricing</div>
              <div className="card-sub">Asking price is required. Sale price is optional if you run a discount.</div>
              <div className="field-row">
                <div className="field">
                  <label>
                    Asking price (USD) <span className="req">*</span>
                  </label>
                  <div className="input-affix">
                    <span className="input-prefix">$</span>
                    <input
                      className="fi has-prefix"
                      type="number"
                      min={0}
                      value={productData.mrp}
                      onChange={(e) => setProductData((p: any) => ({ ...p, mrp: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label>Sale price</label>
                    <button
                      type="button"
                      className={"bool-row " + (hasDiscount ? "on" : "")}
                      style={{ padding: "4px 10px", marginBottom: 0 }}
                      onClick={() => setHasDiscount(!hasDiscount)}
                    >
                      <span style={{ fontSize: 12 }}>{hasDiscount ? "On" : "Off"}</span>
                    </button>
                  </div>
                  <div className="input-affix">
                    <span className="input-prefix">$</span>
                    <input
                      className="fi has-prefix"
                      type="number"
                      min={0}
                      disabled={!hasDiscount}
                      value={productData.unit_price}
                      onChange={(e) => setProductData((p: any) => ({ ...p, unit_price: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <hr className="card-divider" />
              <div className="field-row">
                <div className="field">
                  <label>Annual revenue (USD)</label>
                  <input className="fi" type="number" min={0} value={finRevenue} onChange={(e) => setFinRevenue(e.target.value)} />
                </div>
                <div className="field">
                  <label>EBITDA (USD)</label>
                  <input className="fi" type="number" min={0} value={finEbitda} onChange={(e) => setFinEbitda(e.target.value)} />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>SDE (USD)</label>
                  <input className="fi" type="number" min={0} value={finSde} onChange={(e) => setFinSde(e.target.value)} />
                </div>
                <div className="field">
                  <label>Growth trend</label>
                  <select className="fs" value={finGrowth} onChange={(e) => setFinGrowth(e.target.value)}>
                    <option value="">Select…</option>
                    {GROWTH_TREND_OPTIONS.filter(Boolean).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Long description</div>
              <textarea
                className="fta"
                style={{ minHeight: 140 }}
                value={mainDescription}
                onChange={(e) => setMainDescription(e.target.value)}
                placeholder="Full narrative for buyers (financial history, operations, transition, etc.)"
              />
            </div>

            {/* Financial Privacy (NDA) */}
            <div className="card">
              <div className="card-title">🔒 Financial Privacy (NDA)</div>
              <div className="card-sub">Choose which financial data buyers must sign an NDA to see. Leave both off to show everything publicly. Small businesses can safely ignore this.</div>
              <div
                className={"bool-row" + (productData.nda_lock_ebitda ? " on" : "")}
                onClick={() => setProductData((p: any) => ({ ...p, nda_lock_ebitda: !p.nda_lock_ebitda }))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setProductData((p: any) => ({ ...p, nda_lock_ebitda: !p.nda_lock_ebitda })); }}
              >
                <div className="bool-row-left">
                  <div className="bool-row-label">Lock SDE / EBITDA behind NDA</div>
                  <div className="bool-row-sub">The SDE / EBITDA figure will be hidden from buyers until they sign the NDA.</div>
                </div>
                <div className="toggle-switch" />
              </div>
              <div
                className={"bool-row" + (productData.nda_lock_full_financials ? " on" : "")}
                onClick={() => setProductData((p: any) => ({ ...p, nda_lock_full_financials: !p.nda_lock_full_financials }))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setProductData((p: any) => ({ ...p, nda_lock_full_financials: !p.nda_lock_full_financials })); }}
              >
                <div className="bool-row-left">
                  <div className="bool-row-label">Lock full financials behind NDA</div>
                  <div className="bool-row-sub">Revenue breakdown, P&amp;L tables, and tax returns are hidden until a buyer signs the NDA.</div>
                </div>
                <div className="toggle-switch" />
              </div>

              {/* Document checklist — shown when at least one NDA lock is on */}
              {(productData.nda_lock_ebitda || productData.nda_lock_full_financials) && (() => {
                const NDA_DOC_OPTIONS = [
                  { id: "pl_statement",        label: "P&L Statement (3 years)",          icon: "📈" },
                  { id: "tax_returns",          label: "Tax Returns (3 years)",             icon: "🧾" },
                  { id: "revenue_breakdown",    label: "Revenue Breakdown",                 icon: "💰" },
                  { id: "cim",                  label: "CIM / Info Memorandum",             icon: "📊" },
                  { id: "bank_statements",      label: "Bank Statements",                   icon: "🏦" },
                  { id: "lease_agreement",      label: "Lease Agreement",                   icon: "📋" },
                  { id: "franchise_agreement",  label: "Franchise / Operating Agreement",   icon: "🤝" },
                  { id: "asset_list",           label: "Asset List / Equipment List",       icon: "🏭" },
                ];
                const selectedDocs: string[] = (productData.nda_available_docs || "")
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean);
                const toggleDoc = (docId: string) => {
                  const next = selectedDocs.includes(docId)
                    ? selectedDocs.filter((d: string) => d !== docId)
                    : [...selectedDocs, docId];
                  setProductData((p: any) => ({ ...p, nda_available_docs: next.join(",") }));
                };
                return (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border, #2a2a33)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2, #b0b0c0)", marginBottom: 4 }}>
                      📂 What documents do you have available behind the NDA?
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3, #66667a)", marginBottom: 12 }}>
                      Buyers will see these listed when they are asked to sign the NDA. Tick everything you will share after they sign.
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {NDA_DOC_OPTIONS.map((opt) => {
                        const checked = selectedDocs.includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 10px",
                              borderRadius: 6,
                              border: `1.5px solid ${checked ? "rgba(240,49,138,.45)" : "var(--border, #2a2a33)"}`,
                              background: checked ? "rgba(240,49,138,.08)" : "var(--surface-2, #1c1c22)",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: checked ? 600 : 400,
                              color: checked ? "var(--text, #f0f0f4)" : "var(--text-2, #b0b0c0)",
                              transition: "all .15s",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDoc(opt.id)}
                              style={{ accentColor: "#f0318a", width: 14, height: 14, flexShrink: 0 }}
                            />
                            <span>{opt.icon} {opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Step 3 schema */}
          <div className={"form-panel" + (bfsStep === 3 ? " active" : "")}>{renderSchemaBlock()}</div>

          {/* Step 4 smart tags */}
          <div className={"form-panel" + (bfsStep === 4 ? " active" : "")}>
            <div className="card">
              <div className="card-title">Smart tags</div>
              <div className="card-sub">Select tags that honestly describe the listing.</div>
              <div className="smart-cards">
                {SMART_TAG_DEFS.map((t) => (
                  <div
                    key={t.id}
                    className={"smart-card" + (smartOn[t.id] ? " on" : "")}
                    onClick={() => setSmartOn((prev) => ({ ...prev, [t.id]: !prev[t.id] }))}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="smart-card-icon">{t.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="smart-card-label">{t.label}</div>
                      <div className="smart-card-sub">{t.sub}</div>
                    </div>
                    <div className="smart-tick" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 5 media */}
          <div className={"form-panel" + (bfsStep === 5 ? " active" : "")}>
            <div className="card">
              <div className="card-title">
                Photos <span className="req">*</span>
              </div>
              <div className="card-sub">Up to 4 images (first image is the cover).</div>

              {/* Existing images (edit mode) */}
              {existingImages.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2, #888)", marginBottom: 8 }}>
                    Current images — hover to remove
                  </div>
                  <div className="photo-grid">
                    {existingImages.map((src, i) => (
                      <div className="photo-thumb" key={`existing-${i}`} style={{ position: "relative" }}>
                        <img src={src} alt={`Existing ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                        {i === 0 && (
                          <span style={{ position: "absolute", top: 4, left: 4, background: "#f0318a", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                            Cover
                          </span>
                        )}
                        {onRemoveExistingImage && (
                          <button type="button" className="photo-remove" onClick={() => onRemoveExistingImage(i)}>
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload zone — only show if slots remain */}
              {(existingImages.length + files.length) < 4 && (
              <div
                className={"photo-upload-zone" + (dragActive ? " drag" : "")}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => document.getElementById("bfs-photo-input")?.click()}
                role="button"
                tabIndex={0}
              >
                <input
                  id="bfs-photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}
                  onChange={onFile}
                />
                <div className="upload-icon">📷</div>
                <div className="upload-title">{existingImages.length > 0 ? "Upload additional or replacement photos" : "Drag photos here or click to upload"}</div>
                <div className="upload-sub">
                  PNG, JPG up to 10MB each — <span className="upload-link">browse files</span>
                </div>
              </div>
              )}
              {files.length > 0 && (
                <div className="photo-grid" style={{ marginTop: 14 }}>
                  {files.map((f, i) => (
                    <div className="photo-thumb" key={`${f.name}-${i}`}>
                      <img src={photoPreviewUrls[i]} alt="" />
                      <button type="button" className="photo-remove" onClick={() => removePhoto(i)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-title">SEO (optional)</div>
              <div className="field-row">
                <div className="field">
                  <label>SEO title</label>
                  <input
                    className="fi"
                    value={productData.meta_title}
                    onChange={(e) => setProductData((p: any) => ({ ...p, meta_title: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label>SEO tags</label>
                  <input
                    className="fi"
                    value={productData.tags}
                    onChange={(e) => setProductData((p: any) => ({ ...p, tags: e.target.value }))}
                    placeholder="Comma-separated"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 6 review */}
          <div className={"form-panel" + (bfsStep === 6 ? " active" : "")}>
            <div className="review-preview">
              <div className="review-photo">
                {files[0] ? (
                  <img src={photoPreviewUrls[0]} alt="" />
                ) : existingImages[0] ? (
                  <img src={existingImages[0]} alt="" />
                ) : "📷"}
              </div>
              <div className="review-body">
                <div className="review-badges">
                  {industry ? <span className="rbadge">{industry}</span> : null}
                  <span className="rbadge">{selectedSubcategoryName}</span>
                </div>
                <div className="review-asking">{fmt(price)}</div>
                <div className="review-title">{productData.name || "—"}</div>
                <div className="review-loc">
                  {bfsCity && (stateAttr ? stateValue : stateFree)
                    ? `📍 ${bfsCity}, ${stateAttr ? stateValue : stateFree}`
                    : "📍 Location incomplete"}
                </div>
                <div className="review-metrics">
                  <div>
                    <div className="rev-met-v">{fmt(rev)}</div>
                    <div className="rev-met-k">Revenue</div>
                  </div>
                  <div>
                    <div className="rev-met-v">{fmt(eb)}</div>
                    <div className="rev-met-k">EBITDA</div>
                  </div>
                  <div>
                    <div className="rev-met-v">{price && eb ? `${(price / eb).toFixed(1)}x` : "—"}</div>
                    <div className="rev-met-k">Multiple</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="form-sidebar">
          <div className="sidebar-card">
            <h4>Progress</h4>
            <div className="completion-text">
              <h5>{completedSteps.size >= 5 ? "Looking great" : "Keep going"}</h5>
              <p>{BFS_TIPS[bfsStep]}</p>
            </div>
            <div className="completion-steps">
              {["Overview", "Location", "Financials", "Fields", "Tags", "Photos", "Review"].map((label, i) => (
                <div
                  key={label}
                  className={"comp-step" + (completedSteps.has(i) ? " done" : "") + (i === bfsStep ? " active" : "")}
                >
                  <div className="comp-dot" />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div className="tip-card">
            <h4>Tip</h4>
            <p>{BFS_TIPS[bfsStep]}</p>
          </div>
        </aside>
      </div>

      <div className="form-bottom-nav">
        <div className="bnav-left">
          <button type="button" className="btn-prev" onClick={prevStep}>
            ← Previous
          </button>
          <span className="bnav-step">
            Step <strong>{bfsStep + 1}</strong> / {TOTAL_STEPS}
          </span>
        </div>
        {bfsStep < TOTAL_STEPS - 1 ? (
          <button type="button" className="btn-next" onClick={nextStep}>
            Continue →
          </button>
        ) : (
          <button
            type="button"
            className="btn-publish"
            onClick={() => {
              if (!canGoToVendorReview()) return;
              onContinueToVendorReview();
            }}
            disabled={!canGoToVendorReview()}
          >
            Continue to review →
          </button>
        )}
      </div>
    </div>
  );
});
