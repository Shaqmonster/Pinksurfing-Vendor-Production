"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiUpload } from "react-icons/fi";
import { Country, State } from "country-state-city";
import AuthLayout from "@/components/auth/AuthLayout";
import Loader from "@/components/common/Loader";
import { MyContext } from "@/app/providers/context";
import { createVendorFromSSO } from "@/api/account";
import { identityVerifyPath } from "@/api/identity";
import {
  authBtnPrimary,
  authBtnSecondary,
  authInputClass,
  authLabelClass,
  authLinkClass,
} from "@/components/auth/authTheme";
import { toast } from "react-toastify";
import { handleError, handleSuccess } from "@/utils/toast";
import {
  clearVendorOnboardDraft,
  emptyVendorOnboardDraft,
  loadVendorOnboardDraft,
  saveVendorOnboardDraft,
  VendorOnboardDraft,
} from "@/utils/vendorOnboardingDraft";

const TOTAL_STEPS = 6;

const STEP_TITLES = [
  "Your account",
  "Your store",
  "Store images",
  "Address",
  "Location",
  "Finish up",
];

export default function RegisterAsVendor() {
  const router = useRouter();
  const { setIsLoggedIn, setAuthpage } = useContext(MyContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [draft, setDraft] = useState<VendorOnboardDraft>(emptyVendorOnboardDraft());
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [shopImage, setShopImage] = useState<File | null>(null);
  const [countries, setCountries] = useState<ReturnType<typeof Country.getAllCountries>>([]);
  const [states, setStates] = useState<ReturnType<typeof State.getStatesOfCountry>>([]);

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (!draft.country) {
      setStates([]);
      return;
    }
    setStates(State.getStatesOfCountry(draft.country));
  }, [draft.country]);

  const postalHint = useMemo(() => getPostalHint(draft.country), [draft.country]);
  const phoneHint = useMemo(() => getPhoneHint(draft.country), [draft.country]);

  useEffect(() => {
    const saved = loadVendorOnboardDraft();
    const storedCustomer = localStorage.getItem("customer");
    let fromCustomer: Partial<VendorOnboardDraft> = {};
    if (storedCustomer) {
      try {
        fromCustomer = JSON.parse(storedCustomer);
      } catch {
        /* ignore */
      }
    }
    const merged = {
      ...emptyVendorOnboardDraft(),
      ...fromCustomer,
      ...saved,
      token: fromCustomer.token || saved?.token || "",
      phone_number: normalizePhone(
        saved?.phone_number ?? fromCustomer.phone_number
      ),
    };
    setDraft(merged);
    setStep(Math.min(Math.max(merged.step || 1, 1), TOTAL_STEPS));
  }, []);

  const updateDraft = (patch: Partial<VendorOnboardDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const persistStep = (nextStep: number, patch?: Partial<VendorOnboardDraft>) => {
    const updated = { ...draft, ...patch, step: nextStep };
    setDraft(updated);
    saveVendorOnboardDraft(updated);
    setStep(nextStep);
  };

  const validateStep = (): string | null => {
    switch (step) {
      case 1:
        if (!draft.first_name.trim() || !draft.email.trim()) {
          return "Account details are missing. Please sign in again.";
        }
        return null;
      case 2:
        if (!draft.company_name.trim()) return "Store name is required.";
        if (!draft.bio.trim()) return "Please add a short bio for your store.";
        if (!draft.phone_number.trim()) return "Phone number is required.";
        return null;
      case 3:
        return null;
      case 4:
        if (!draft.street1.trim()) return "Street address is required.";
        if (!draft.city.trim()) return "City is required.";
        return null;
      case 5:
        if (!draft.state.trim()) return "State is required.";
        if (!draft.country.trim()) return "Country is required.";
        if (!draft.zip_code.trim()) return "Zip code is required.";
        return null;
      case 6:
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    setErrorMessage("");
    const err = validateStep();
    if (err) {
      setErrorMessage(err);
      handleError(err);
      return;
    }
    if (step < TOTAL_STEPS) {
      persistStep(step + 1);
    }
  };

  const handleBack = () => {
    setErrorMessage("");
    if (step > 1) {
      persistStep(step - 1);
    } else {
      setAuthpage("vendor-welcome");
    }
  };

  const handleFile = (
    file: File | undefined,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    maxMb = 4
  ) => {
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      handleError(`File must be under ${maxMb}MB.`);
      return;
    }
    setter(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const err = validateStep();
    if (err) {
      setErrorMessage(err);
      handleError(err);
      return;
    }

    setLoading(true);
    const payload = {
      ...draft,
      profile_pic: profilePic,
      shop_image: shopImage,
    };
    const response = await createVendorFromSSO(payload);
    setLoading(false);

    if (response?.token) {
      clearVendorOnboardDraft();
      handleSuccess("Your vendor store is ready!");
      if (response.address_warning) {
        toast.warn(response.address_warning, { position: "top-right", autoClose: 6000 });
      }
      localStorage.setItem("access", response.token);
      localStorage.setItem("vendor_id", response.vendor_id);
      setIsLoggedIn(true);
      if (response.kyc_required) {
        router.push(identityVerifyPath("vendor", "/dashboard"));
      } else {
        router.push("/dashboard");
      }
      return;
    }

    const message =
      response?.data?.error ||
      response?.data?.message ||
      response?.message ||
      "Registration failed. Please try again.";
    setErrorMessage(message);
    handleError(message);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <AuthLayout
      wide
      title="Set up your vendor store"
      subtitle={`Step ${step} of ${TOTAL_STEPS} — ${STEP_TITLES[step - 1]}`}
      footer={
        step === 1 ? (
          <>
            Changed your mind?{" "}
            <button
              type="button"
              onClick={() => setAuthpage("vendor-welcome")}
              className={authLinkClass}
            >
              Go back
            </button>
          </>
        ) : undefined
      }
    >
      <div className="mb-6">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step
                  ? "bg-violet-600"
                  : "bg-slate-200 dark:bg-dark-border"
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={step === TOTAL_STEPS ? handleSubmit : (e) => e.preventDefault()}>
        {step === 1 && (
          <div className="space-y-4">
            <Field label="First name">
              <input
                className={`${authInputClass} bg-slate-100 dark:bg-dark-surface`}
                value={draft.first_name}
                readOnly
              />
            </Field>
            <Field label="Last name">
              <input
                className={`${authInputClass} bg-slate-100 dark:bg-dark-surface`}
                value={draft.last_name}
                readOnly
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={`${authInputClass} bg-slate-100 dark:bg-dark-surface`}
                value={draft.email}
                readOnly
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Field label="Store name" required>
              <input
                className={authInputClass}
                placeholder="Your store name"
                value={draft.company_name}
                onChange={(e) => updateDraft({ company_name: e.target.value })}
              />
            </Field>
            <Field label="Bio" required>
              <textarea
                className={`${authInputClass} min-h-[100px] resize-y`}
                placeholder="Tell buyers about your store"
                value={draft.bio}
                onChange={(e) => updateDraft({ bio: e.target.value })}
              />
            </Field>
            <Field label="Phone number" required>
              <input
                type="tel"
                className={authInputClass}
                placeholder={phoneHint}
                value={draft.phone_number ?? ""}
                onChange={(e) => updateDraft({ phone_number: e.target.value })}
                autoComplete="tel"
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <UploadBox
              label="Profile picture"
              file={profilePic}
              onPick={(f) => handleFile(f, setProfilePic)}
              onClear={() => setProfilePic(null)}
            />
            <UploadBox
              label="Store image"
              file={shopImage}
              onPick={(f) => handleFile(f, setShopImage)}
              onClear={() => setShopImage(null)}
            />
            <p className="text-xs text-slate-500 dark:text-surface-400">
              Optional — you can add these later from your profile.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Field label="Street address" required>
              <input
                className={authInputClass}
                placeholder="Street line 1"
                value={draft.street1}
                onChange={(e) => updateDraft({ street1: e.target.value })}
              />
            </Field>
            <Field label="Street line 2">
              <input
                className={authInputClass}
                placeholder="Apt, suite, etc. (optional)"
                value={draft.street2}
                onChange={(e) => updateDraft({ street2: e.target.value })}
              />
            </Field>
            <Field label="City" required>
              <input
                className={authInputClass}
                placeholder="City"
                value={draft.city}
                onChange={(e) => updateDraft({ city: e.target.value })}
              />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <Field label="Country" required>
              <select
                className={authInputClass}
                value={draft.country}
                onChange={(e) => {
                  const countryCode = e.target.value;
                  updateDraft({ country: countryCode, state: "" });
                }}
              >
                <option value="">Select your country</option>
                {countries.map((country) => (
                  <option key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="State / province" required>
              <select
                className={authInputClass}
                value={draft.state}
                disabled={!draft.country || states.length === 0}
                onChange={(e) => updateDraft({ state: e.target.value })}
              >
                <option value="">
                  {!draft.country
                    ? "Select country first"
                    : states.length
                      ? "Select your state / province"
                      : "Enter state code manually below"}
                </option>
                {states.map((state) => (
                  <option key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </option>
                ))}
              </select>
              {draft.country && states.length === 0 ? (
                <input
                  className={`${authInputClass} mt-2`}
                  placeholder="State / province code"
                  value={draft.state}
                  onChange={(e) => updateDraft({ state: e.target.value })}
                />
              ) : null}
            </Field>
            <Field label="Postal code" required>
              <input
                className={authInputClass}
                placeholder={postalHint}
                value={draft.zip_code}
                onChange={(e) => updateDraft({ zip_code: e.target.value })}
              />
            </Field>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <Field label="Website">
              <input
                type="url"
                className={authInputClass}
                placeholder="https:// (optional)"
                value={draft.website}
                onChange={(e) => updateDraft({ website: e.target.value })}
              />
            </Field>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-dark-border dark:bg-dark-surface dark:text-surface-300">
              <p className="font-semibold text-slate-800 dark:text-white mb-2">
                Review
              </p>
              <ul className="space-y-1">
                <li>
                  <span className="text-slate-500">Store:</span> {draft.company_name}
                </li>
                <li>
                  <span className="text-slate-500">Email:</span> {draft.email}
                </li>
                <li>
                  <span className="text-slate-500">Location:</span>{" "}
                  {[draft.city, draft.state, draft.country].filter(Boolean).join(", ")}
                </li>
              </ul>
            </div>
          </div>
        )}

        {errorMessage ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        ) : null}

        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
          <button type="button" onClick={handleBack} className={authBtnSecondary}>
            {step === 1 ? "Back" : "Previous"}
          </button>
          {step < TOTAL_STEPS ? (
            <button type="button" onClick={handleNext} className={authBtnPrimary}>
              Next
            </button>
          ) : (
            <button type="submit" className={authBtnPrimary}>
              Create vendor store
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={authLabelClass}>
        {label}
        {required ? <span className="text-violet-500 ml-0.5">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function normalizePhone(value: unknown): string {
  if (value == null || value === "null" || value === "undefined") return "";
  return String(value).trim();
}

function getPostalHint(country: string): string {
  switch (country) {
    case "IN":
      return "6-digit PIN code (e.g. 400001)";
    case "TR":
      return "5-digit postal code";
    case "BD":
      return "4-digit postal code";
    case "US":
      return "ZIP code (e.g. 94102)";
    default:
      return "Postal / zip code";
  }
}

function getPhoneHint(country: string): string {
  switch (country) {
    case "IN":
      return "+91 98765 43210";
    case "TR":
      return "+90 532 123 4567";
    case "BD":
      return "+880 1712 345678";
    case "US":
      return "+1 415 555 1234";
    default:
      return "Include country code, e.g. +91...";
  }
}

function UploadBox({
  label,
  file,
  onPick,
  onClear,
}: {
  label: string;
  file: File | null;
  onPick: (f: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className={authLabelClass}>{label}</label>
      <div className="relative rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-dark-border dark:bg-dark-surface">
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        {file ? (
          <div className="space-y-2">
            <img
              src={URL.createObjectURL(file)}
              alt=""
              className="mx-auto h-20 w-20 rounded-lg object-cover"
            />
            <p className="text-sm text-slate-600 truncate">{file.name}</p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClear();
              }}
              className="text-sm text-violet-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <FiUpload className="h-8 w-8 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Click to upload</span>
            <span className="text-xs">PNG, JPG or GIF — max 4MB</span>
          </div>
        )}
      </div>
    </div>
  );
}
