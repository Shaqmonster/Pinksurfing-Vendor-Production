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

const TOTAL_STEPS = 8;

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
  /** Appended to `description` on submit (HTML fragment). */
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
  "Be honest about owner involvement — buyers will verify.",
  "Only apply Smart Tags that genuinely fit your business.",
  "Photos dramatically increase engagement. Add at least one clear image.",
  "Use the review step to confirm everything before publishing.",
  "You are almost ready — continue to the platform review screen.",
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
  const [creatorType, setCreatorType] = useState<"human_built" | "ai_built" | "hybrid">("human_built");
  const [industry, setIndustry] = useState("");
  const [saleType, setSaleType] = useState("");
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
  const [bfsCity, setBfsCity] = useState("");
  const [bfsZip, setBfsZip] = useState("");
  const [finRevenue, setFinRevenue] = useState("");
  const [finEbitda, setFinEbitda] = useState("");
  const [finSde, setFinSde] = useState("");
  const [finGrowth, setFinGrowth] = useState("");
  const [remoteFriendly, setRemoteFriendly] = useState(false);
  const [webOnly, setWebOnly] = useState(false);
  const [multiLoc, setMultiLoc] = useState(false);
  const [smartOn, setSmartOn] = useState<Record<string, boolean>>({});
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

  useEffect(() => {
    const c = cityAttr?.value;
    if (typeof c === "string" && c && !bfsCity) setBfsCity(c);
  }, [cityAttr, bfsCity]);

  useEffect(() => {
    const z = zipAttr?.value;
    if (typeof z === "string" && z && !bfsZip) setBfsZip(z);
  }, [zipAttr, bfsZip]);

  useEffect(() => {
    const ind = findAttr(nonVariantAttributes, "industry");
    if (ind?.value && typeof ind.value === "string" && !industry) setIndustry(ind.value);
  }, [nonVariantAttributes, industry]);

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

  const getDescriptionAppendixHtml = useCallback((): string => {
    const parts: string[] = [];
    if (finRevenue) parts.push(`Annual revenue (USD): ${finRevenue}`);
    if (finEbitda) parts.push(`EBITDA (USD): ${finEbitda}`);
    if (finSde) parts.push(`SDE (USD): ${finSde}`);
    if (finGrowth) parts.push(`Growth trend: ${finGrowth}`);
    if (saleType) parts.push(`Sale type: ${saleType}`);
    parts.push(`Creator type: ${creatorType}`);
    if (remoteFriendly) parts.push("Remote-friendly: Yes");
    if (webOnly) parts.push("Web/mobile only: Yes");
    if (multiLoc) parts.push("Multi-location: Yes");
    const tags = SMART_TAG_DEFS.filter((t) => smartOn[t.id]).map((t) => t.label);
    if (tags.length) parts.push(`Smart tags: ${tags.join(", ")}`);
    const ctry = countryAttr ? countryValue : countryFree;
    if (ctry) parts.push(`Country: ${ctry}`);
    if (!parts.length) return "";
    return `<p><strong>Business listing details</strong></p><p>${parts.map(escapeHtml).join("<br/>")}</p>`;
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
    countryAttr,
    countryValue,
    countryFree,
  ]);

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
    if (step === 4) {
      for (const { attr } of schemaAttributeRows) {
        if (!attr.required) continue;
        if (Array.isArray(attr.value)) {
          if (attr.value.length === 0) return false;
        } else if (attr.value === "" || attr.value === null || attr.value === undefined) return false;
      }
      return true;
    }
    if (step === 6) {
      return files.length > 0;
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
    for (let s = 0; s <= 6; s++) {
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
          "Details",
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
                    {INDUSTRY_OPTIONS.map((o) => (
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
                    <option>Asset sale</option>
                    <option>Stock sale</option>
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
              <div className="card-sub">Used for local buyer search.</div>
              <div className="field-row">
                <div className="field">
                  <label>
                    City <span className="req">*</span>
                  </label>
                  <input className="fi" value={bfsCity} onChange={(e) => setBfsCity(e.target.value)} placeholder="e.g. Dallas" />
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
                      placeholder="State / province / region"
                    />
                  )}
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>ZIP / postal code</label>
                  <input className="fi" value={bfsZip} onChange={(e) => setBfsZip(e.target.value)} maxLength={12} />
                </div>
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
                    <option>Declining</option>
                    <option>Flat</option>
                    <option>Moderate growth</option>
                    <option>High growth</option>
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
          </div>

          {/* Step 3 placeholder details — financial narrative merged in step 2; keep panel for flow */}
          <div className={"form-panel" + (bfsStep === 3 ? " active" : "")}>
            <div className="card">
              <div className="card-title">Highlights</div>
              <div className="card-sub">Anything else buyers should know up front is in your long description above.</div>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
                You can refine the long description in the previous step. Continue to map any remaining subcategory fields.
              </p>
            </div>
          </div>

          {/* Step 4 schema */}
          <div className={"form-panel" + (bfsStep === 4 ? " active" : "")}>{renderSchemaBlock()}</div>

          {/* Step 5 smart tags */}
          <div className={"form-panel" + (bfsStep === 5 ? " active" : "")}>
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

          {/* Step 6 media */}
          <div className={"form-panel" + (bfsStep === 6 ? " active" : "")}>
            <div className="card">
              <div className="card-title">
                Photos <span className="req">*</span>
              </div>
              <div className="card-sub">Up to 4 images (first image is the cover).</div>
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
                <div className="upload-title">Drag photos here or click to upload</div>
                <div className="upload-sub">
                  PNG, JPG up to 10MB each — <span className="upload-link">browse files</span>
                </div>
              </div>
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

          {/* Step 7 review */}
          <div className={"form-panel" + (bfsStep === 7 ? " active" : "")}>
            <div className="review-preview">
              <div className="review-photo">
                {files[0] ? <img src={photoPreviewUrls[0]} alt="" /> : "📷"}
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
              <h5>{completedSteps.size >= 6 ? "Looking great" : "Keep going"}</h5>
              <p>{BFS_TIPS[bfsStep]}</p>
            </div>
            <div className="completion-steps">
              {["Overview", "Location", "Price", "Details", "Fields", "Tags", "Photos", "Review"].map((label, i) => (
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
