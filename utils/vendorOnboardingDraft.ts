import { getCookie, setCookie } from "@/utils/cookies";

export const VENDOR_ONBOARD_DRAFT_COOKIE = "ps_vendor_onboard_draft";

export type VendorOnboardDraft = {
  first_name: string;
  last_name: string;
  bio: string;
  company_name: string;
  email: string;
  phone_number: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  website: string;
  country: string;
  zip_code: string;
  token: string;
  step: number;
};

export const emptyVendorOnboardDraft = (): VendorOnboardDraft => ({
  first_name: "",
  last_name: "",
  bio: "",
  company_name: "",
  email: "",
  phone_number: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  website: "",
  country: "",
  zip_code: "",
  token: "",
  step: 1,
});

export function loadVendorOnboardDraft(): VendorOnboardDraft | null {
  if (typeof document === "undefined") return null;
  const raw = getCookie(VENDOR_ONBOARD_DRAFT_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as VendorOnboardDraft;
    return { ...emptyVendorOnboardDraft(), ...parsed };
  } catch {
    return null;
  }
}

export function saveVendorOnboardDraft(draft: VendorOnboardDraft) {
  if (typeof document === "undefined") return;
  const { step, ...rest } = draft;
  setCookie(
    VENDOR_ONBOARD_DRAFT_COOKIE,
    JSON.stringify({ ...rest, step }),
    7
  );
}

export function clearVendorOnboardDraft() {
  if (typeof document === "undefined") return;
  setCookie(VENDOR_ONBOARD_DRAFT_COOKIE, "", -1);
}
