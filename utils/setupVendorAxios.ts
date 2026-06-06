import axios from "axios";
import { getAccessToken } from "@/utils/cookies";
import { normalizeBearerToken } from "@/utils/vendorAuth";

let installed = false;

function isMarketplaceApiUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (base && url.startsWith(base)) return true;
  if (url.includes("ecommerceapi.pinksurfing.com")) return true;
  return false;
}

function resolveRequestUrl(config: { url?: string; baseURL?: string }): string {
  const url = String(config.url || "");
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(config.baseURL || "");
  if (!base) return url;
  return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

/** Attach vendor Bearer token on marketplace API requests when missing. */
export function setupVendorAxios() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  axios.interceptors.request.use((config) => {
    const url = resolveRequestUrl(config);
    if (!isMarketplaceApiUrl(url)) return config;

    const existing = config.headers?.Authorization ?? config.headers?.authorization;
    if (existing) return config;

    const token = normalizeBearerToken(getAccessToken());
    if (!token) return config;

    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

setupVendorAxios();
