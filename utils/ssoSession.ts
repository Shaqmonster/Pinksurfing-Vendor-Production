import axios from "axios";
import {
  getCookie,
  getAuthCookieDomain,
  getAccessToken,
  clearAuthStorage as clearVendorAuthStorage,
  clearSsoLoggedOutFlag,
  isSsoLoggedOutGlobally,
  markSsoLoggedOut,
} from "@/utils/cookies";

const AUTH_REFRESH_URL = "https://auth.pinksurfing.com/api/token/refresh/";
const AUTH_LOGOUT_URL = "https://auth.pinksurfing.com/api/logout/";
const ACCESS_SKEW_SECONDS = 60;
const SSO_EPOCH_COOKIE = "ps_sso_epoch";

let ensureSessionInflight: Promise<{ access: string; refresh?: string } | null> | null =
  null;

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
  if (typeof window === "undefined") return null;
  const candidates = [
    localStorage.getItem("access_token"),
    localStorage.getItem("access"),
  ].filter(Boolean) as string[];
  for (const raw of candidates) {
    const token = raw.replaceAll('"', "");
    if (isAccessTokenValid(token)) return token;
  }
  return null;
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

async function refreshFromSsoCookies() {
  const response = await axios.post(AUTH_REFRESH_URL, {}, { withCredentials: true });
  const access = response.data?.access;
  if (!access) return null;
  return { access: String(access), refresh: response.data?.refresh as string | undefined };
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

    const cached = getAccessToken();
    if (cached) {
      return { access: cached, refresh: getRefreshToken() ?? undefined };
    }

    try {
      const refreshed = await refreshFromSsoCookies();
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

  const token = getAccessToken();
  if (token) {
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
