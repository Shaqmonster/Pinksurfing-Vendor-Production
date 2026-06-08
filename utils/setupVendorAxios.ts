import axios from "axios";
import { normalizeBearerToken } from "@/utils/vendorAuth";
import {
  getOrRefreshAccessToken,
  isSsoTokenMaintenanceUrl,
  refreshAccessToken,
} from "@/utils/ssoSession";

let installed = false;

function isMarketplaceApiUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (base && url.startsWith(base)) return true;
  if (url.includes("ecommerceapi.pinksurfing.com")) return true;
  if (url.includes("auth.pinksurfing.com")) return true;
  return false;
}

function resolveRequestUrl(config: { url?: string; baseURL?: string }): string {
  const url = String(config.url || "");
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(config.baseURL || "");
  if (!base) return url;
  return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

/** Attach vendor Bearer token on marketplace API requests; refresh on expiry / 401. */
export function setupVendorAxios() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  axios.interceptors.request.use(async (config) => {
    if ((config as { skipAuthRefresh?: boolean }).skipAuthRefresh) return config;

    const url = resolveRequestUrl(config);
    if (isSsoTokenMaintenanceUrl(url)) return config;
    if (!isMarketplaceApiUrl(url)) return config;

    const token = normalizeBearerToken(await getOrRefreshAccessToken());
    if (!token) return config;

    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as
        | (typeof error.config & { _retry?: boolean })
        | undefined;
      const status = error?.response?.status;

      if (!originalRequest || status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      const url = resolveRequestUrl(originalRequest);
      if (!isMarketplaceApiUrl(url)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const newAccess = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return axios(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }
  );
}

setupVendorAxios();
