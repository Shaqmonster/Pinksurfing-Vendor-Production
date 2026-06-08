import axios from "axios";
import {
  getCookie,
  getAuthCookieDomain,
  getStoredAccessToken,
  isAccessTokenFresh,
  clearAuthStorage as clearVendorAuthStorage,
  clearSsoLoggedOutFlag,
  isSsoLoggedOutGlobally,
  markSsoLoggedOut,
} from "@/utils/cookies";

const AUTH_REFRESH_URL = "https://auth.pinksurfing.com/api/token/refresh/";
const AUTH_LOGOUT_URL = "https://auth.pinksurfing.com/api/logout/";
const ACCESS_SKEW_SECONDS = 60;
const SSO_EPOCH_COOKIE = "ps_sso_epoch";
/** SSO default: JWT_ACCESS_LIFETIME_MINUTES=15 (sso/settings.py). */
export const SSO_ACCESS_LIFETIME_MINUTES = 15;
/** Refresh this many seconds before JWT exp (proactive, not after expiry). */
export const REFRESH_BEFORE_EXPIRY_SECONDS = 120;
/** Safety poll — half of default access lifetime. */
export const TOKEN_REFRESH_FALLBACK_MS = 5 * 60 * 1000;
/** Never block app bootstrap on a stuck SSO refresh. */
export const AUTH_NETWORK_TIMEOUT_MS = 15_000;

let ensureSessionInflight: Promise<{ access: string; refresh?: string } | null> | null =
  null;
let refreshInflight: Promise<string> | null = null;

export function decodeJwt(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function isAccessTokenValid(
  token: string | null,
  skewSeconds = ACCESS_SKEW_SECONDS
): boolean {
  const payload = decodeJwt(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return false;
  return exp * 1000 > Date.now() + skewSeconds * 1000;
}

export function getAccessTokenExpiresAtMs(token: string | null): number | null {
  const payload = decodeJwt(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return null;
  return exp * 1000;
}

export function shouldRefreshAccessToken(
  token: string | null,
  bufferSeconds = REFRESH_BEFORE_EXPIRY_SECONDS
): boolean {
  if (!token) return true;
  const expiresAtMs = getAccessTokenExpiresAtMs(token);
  if (!expiresAtMs) return true;
  const refreshAtMs = expiresAtMs - bufferSeconds * 1000;
  return Date.now() >= refreshAtMs;
}

export function getMsUntilProactiveRefresh(
  token: string | null,
  bufferSeconds = REFRESH_BEFORE_EXPIRY_SECONDS
): number {
  const expiresAtMs = getAccessTokenExpiresAtMs(token);
  if (!expiresAtMs) return 0;
  const refreshAtMs = expiresAtMs - bufferSeconds * 1000;
  return Math.max(0, refreshAtMs - Date.now());
}

function writeCookie(name: string, value: string, maxAgeSeconds: number, domain?: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const encoded = encodeURIComponent(value || "");
  const domainPart = domain ? `; domain=${domain}` : "";
  document.cookie = `${name}=${encoded}; path=/${domainPart}; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function deleteAuthCookie(name: string, domain?: string) {
  writeCookie(name, "", 0, domain);
}

export function bumpSsoEpoch(): string | null {
  if (typeof document === "undefined") return null;
  const epoch = String(Date.now());
  const sharedDomain = getAuthCookieDomain();
  writeCookie(SSO_EPOCH_COOKIE, epoch, 60 * 60, undefined);
  if (sharedDomain) writeCookie(SSO_EPOCH_COOKIE, epoch, 60 * 60, sharedDomain);
  return epoch;
}

export function getSsoEpoch(): string | null {
  return getCookie(SSO_EPOCH_COOKIE);
}

export function getCachedAccessToken(): string | null {
  const stored = getStoredAccessToken();
  return stored && isAccessTokenValid(stored) ? stored : null;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("refresh_token") ||
    localStorage.getItem("refresh") ||
    getCookie("refresh_token") ||
    null
  );
}

export function persistAuthSession(
  access: string,
  refresh?: string,
  vendorId?: string | number | null,
  userId?: string | number | null
) {
  if (typeof window === "undefined" || !access) return;

  const prevAccess = localStorage.getItem("access_token");

  clearSsoLoggedOutFlag();
  localStorage.setItem("access_token", access);
  localStorage.setItem("access", access);
  if (refresh) {
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("refresh", refresh);
  }
  if (vendorId != null) localStorage.setItem("vendor_id", String(vendorId));

  const sharedDomain = getAuthCookieDomain();
  if (sharedDomain) {
    writeCookie("access_token", access, 60 * 60, sharedDomain);
    if (refresh) writeCookie("refresh_token", refresh, 7 * 24 * 60 * 60, sharedDomain);
    const cookieUserId = userId ?? vendorId;
    if (cookieUserId != null) {
      writeCookie("user_id", String(cookieUserId), 7 * 24 * 60 * 60, sharedDomain);
    }
  } else {
    writeCookie("access_token", access, 60 * 60, undefined);
    if (refresh) writeCookie("refresh_token", refresh, 7 * 24 * 60 * 60, undefined);
  }

  if (prevAccess !== access) bumpSsoEpoch();
}

/** Login, refresh, and logout must not run through the auth request interceptor. */
export function isSsoTokenMaintenanceUrl(url: string): boolean {
  if (!url) return false;
  const path = url.split("?")[0];
  return (
    path.includes("/api/token/refresh") ||
    path.includes("/api/logout") ||
    /\/api\/token\/?$/.test(path)
  );
}

export function hasRefreshCapability(): boolean {
  if (isSsoLoggedOutGlobally()) return false;
  if (getRefreshToken()) return true;
  // SSO refresh_token is HttpOnly — not readable here, but sent with credentials:include
  return Boolean(getStoredAccessToken());
}

/** Cookie-based refresh first, then Bearer body `{ refresh }` fallback. */
async function requestTokenRefresh(): Promise<{
  access: string;
  refresh?: string;
} | null> {
  const refreshConfig = {
    withCredentials: true,
    skipAuthRefresh: true,
    timeout: AUTH_NETWORK_TIMEOUT_MS,
  };
  try {
    const cookieResponse = await axios.post(
      AUTH_REFRESH_URL,
      {},
      refreshConfig
    );
    const access = cookieResponse.data?.access;
    if (access) {
      return {
        access: String(access),
        refresh: cookieResponse.data?.refresh as string | undefined,
      };
    }
  } catch {
    /* try body refresh */
  }

  const refresh = getRefreshToken();
  if (!refresh) return null;

  const bodyResponse = await axios.post(
    AUTH_REFRESH_URL,
    { refresh },
    refreshConfig
  );
  const access = bodyResponse.data?.access;
  if (!access) return null;
  return {
    access: String(access),
    refresh: (bodyResponse.data?.refresh as string | undefined) ?? refresh,
  };
}

export async function ensureSession(): Promise<{
  access: string;
  refresh?: string;
} | null> {
  if (typeof window === "undefined") return null;
  if (ensureSessionInflight) return ensureSessionInflight;

  ensureSessionInflight = (async () => {
    if (isSsoLoggedOutGlobally()) {
      clearVendorAuthStorage();
      return null;
    }

    const stored = getStoredAccessToken();
    if (stored && isAccessTokenFresh(stored)) {
      return { access: stored, refresh: getRefreshToken() ?? undefined };
    }

    if (!hasRefreshCapability()) {
      clearVendorAuthStorage();
      return null;
    }

    try {
      const refreshed = await requestTokenRefresh();
      if (!refreshed?.access) {
        clearVendorAuthStorage();
        return null;
      }
      persistAuthSession(refreshed.access, refreshed.refresh);
      return refreshed;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      console.error("SSO refresh failed:", status || error);
      clearVendorAuthStorage();
      return null;
    }
  })().finally(() => {
    ensureSessionInflight = null;
  });

  return ensureSessionInflight;
}

export async function reconcileSharedSession(): Promise<{
  access: string;
  refresh?: string;
} | null> {
  if (typeof window === "undefined") return null;
  if (isSsoLoggedOutGlobally()) {
    clearVendorAuthStorage();
    return null;
  }

  const token = getStoredAccessToken();
  if (token && isAccessTokenFresh(token)) {
    const refresh = getRefreshToken() ?? undefined;
    const prevAccess = localStorage.getItem("access_token");
    if (prevAccess !== token) {
      persistAuthSession(token, refresh);
    }
    return { access: token, refresh };
  }

  ensureSessionInflight = null;
  return ensureSession();
}

export function attachSharedSsoSync(onSync: () => void) {
  if (typeof window === "undefined") return () => {};

  let lastEpoch = getSsoEpoch();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const checkEpoch = () => {
    const epoch = getSsoEpoch();
    if (!epoch || epoch === lastEpoch) return;
    lastEpoch = epoch;
    onSync();
  };

  const scheduleEpochCheck = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(checkEpoch, 300);
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") scheduleEpochCheck();
  };

  window.addEventListener("visibilitychange", onVisible);

  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener("visibilitychange", onVisible);
  };
}

export async function refreshAccessToken(): Promise<string> {
  if (refreshInflight) return refreshInflight;

  refreshInflight = (async () => {
    const refreshed = await requestTokenRefresh();
    if (!refreshed?.access) {
      throw new Error("No access token in refresh response");
    }
    persistAuthSession(refreshed.access, refreshed.refresh);
    return refreshed.access;
  })().finally(() => {
    refreshInflight = null;
  });

  return refreshInflight;
}

/** Returns a valid access token, refreshing before JWT exp per SSO settings. */
export async function getOrRefreshAccessToken(): Promise<string | null> {
  if (isSsoLoggedOutGlobally()) return null;

  const stored = getStoredAccessToken();
  if (stored && !shouldRefreshAccessToken(stored)) {
    return isAccessTokenValid(stored) ? stored : null;
  }

  if (!hasRefreshCapability()) {
    return stored && isAccessTokenValid(stored) ? stored : null;
  }

  try {
    return await refreshAccessToken();
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    console.error("Token refresh failed:", status || error);
    if (stored && !isAccessTokenValid(stored)) {
      clearVendorAuthStorage();
    }
    return stored && isAccessTokenValid(stored) ? stored : null;
  }
}

/**
 * Schedules refresh from JWT `exp` (2 min before expiry) + 5 min safety poll.
 * Matches SSO JWT_ACCESS_LIFETIME_MINUTES=15 (sso/settings.py).
 */
export function startTokenRefreshScheduler(onRefreshed?: (access: string) => void) {
  if (typeof window === "undefined") return () => {};

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const scheduleNext = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const stored = getStoredAccessToken();
    const msUntil = stored
      ? getMsUntilProactiveRefresh(stored)
      : TOKEN_REFRESH_FALLBACK_MS;
    const delay = Math.min(Math.max(msUntil, 1_000), TOKEN_REFRESH_FALLBACK_MS);
    timeoutId = setTimeout(() => {
      void tick();
    }, delay);
  };

  const tick = async () => {
    if (isSsoLoggedOutGlobally()) return;

    const stored = getStoredAccessToken();
    if (!shouldRefreshAccessToken(stored)) {
      scheduleNext();
      return;
    }

    try {
      const access = await refreshAccessToken();
      onRefreshed?.(access);
    } catch {
      /* fallback poll or 401 handler will retry */
    }
    scheduleNext();
  };

  const intervalId = setInterval(() => {
    void tick();
  }, TOKEN_REFRESH_FALLBACK_MS);

  const onVisible = () => {
    if (document.visibilityState === "visible") void tick();
  };

  document.addEventListener("visibilitychange", onVisible);
  void tick();

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    clearInterval(intervalId);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export async function signOut(explicitToken?: string | null) {
  markSsoLoggedOut();
  const access = explicitToken ?? getCachedAccessToken();
  const refresh = getRefreshToken();
  try {
    await axios.post(
      AUTH_LOGOUT_URL,
      refresh ? { refresh } : {},
      {
        withCredentials: true,
        skipAuthRefresh: true,
        headers: access
          ? { Authorization: `Bearer ${access.replaceAll('"', "")}` }
          : {},
      }
    );
  } catch (error) {
    console.error("Auth logout failed (clearing client session anyway):", error);
  }
  clearVendorAuthStorage();
}

export { markSsoLoggedOut, isSsoLoggedOutGlobally, clearSsoLoggedOutFlag };
