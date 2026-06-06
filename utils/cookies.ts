/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(";");

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const raw = c.substring(nameEQ.length, c.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
}

/** Raw session token from storage/cookies (may be expired — use isAccessTokenFresh to refresh). */
export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  for (const key of ["access_token", "access"] as const) {
    const raw = localStorage.getItem(key);
    if (raw) {
      const token = raw.replaceAll('"', "");
      if (token) return token;
    }
  }
  const fromCookie = getCookie("access_token");
  return fromCookie ? fromCookie.replaceAll('"', "") : null;
}

/** True when JWT exp is still in the future (60s skew). */
export function isAccessTokenFresh(token: string | null): boolean {
  if (!token) return false;
  try {
    const part = token.split(".")[1];
    if (!part) return false;
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return (
      typeof payload.exp === "number" && payload.exp * 1000 > Date.now() + 60_000
    );
  } catch {
    return false;
  }
}

/** Token for API calls — returns stored session even if near expiry (server/refresh handles invalid). */
export function getAccessToken(): string | null {
  return getStoredAccessToken();
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromCookie = getCookie("refresh_token");
  if (fromCookie) return fromCookie.replaceAll('"', "");
  const fromStorage = localStorage.getItem("refresh");
  if (fromStorage) return fromStorage.replaceAll('"', "");
  return null;
}

export function getAuthCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return undefined;
  if (host.endsWith(".pinksurfing.com") || host === "pinksurfing.com") {
    return ".pinksurfing.com";
  }
  return undefined;
}

const SSO_LOGOUT_COOKIE = "ps_sso_logged_out";
const SSO_EPOCH_COOKIE = "ps_sso_epoch";

function writeEpochCookie(name: string, value: string, maxAgeSeconds: number, domain?: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const encoded = encodeURIComponent(value || "");
  const domainPart = domain ? `; domain=${domain}` : "";
  document.cookie = `${name}=${encoded}; path=/${domainPart}; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function markSsoLoggedOut(): void {
  if (typeof window === "undefined") return;
  if (isSsoLoggedOutGlobally()) return;
  const domain = getAuthCookieDomain();
  setCookie(SSO_LOGOUT_COOKIE, "1", 1 / 24);
  if (domain) setCookie(SSO_LOGOUT_COOKIE, "1", 1 / 24, domain);
  const epoch = String(Date.now());
  writeEpochCookie(SSO_EPOCH_COOKIE, epoch, 60 * 60, undefined);
  if (domain) writeEpochCookie(SSO_EPOCH_COOKIE, epoch, 60 * 60, domain);
}

/** @deprecated */
export const markVendorLoggedOut = markSsoLoggedOut;

export function clearSsoLoggedOutFlag(): void {
  if (typeof document === "undefined") return;
  deleteCookie(SSO_LOGOUT_COOKIE);
  const domain = getAuthCookieDomain();
  if (domain) deleteCookie(SSO_LOGOUT_COOKIE, domain);
}

export function isSsoLoggedOutGlobally(): boolean {
  return getCookie(SSO_LOGOUT_COOKIE) === "1";
}

/** @deprecated Use clearSsoLoggedOutFlag on login via persistAuthSession */
export function clearVendorLogoutGuard(): void {
  clearSsoLoggedOutFlag();
}

export function clearAuthStorage(): void {
  if (typeof window === "undefined") return;
  const keys = [
    "access",
    "access_token",
    "refresh",
    "refresh_token",
    "vendor_id",
    "store",
    "vendorAccess",
    "user.vendorAccess",
    "user_id",
  ];
  keys.forEach((k) => localStorage.removeItem(k));
  const domain = getAuthCookieDomain();
  deleteCookie("access_token", domain);
  deleteCookie("refresh_token", domain);
  deleteCookie("user_id", domain);
  deleteCookie("access_token");
  deleteCookie("refresh_token");
  deleteCookie("user_id");
  deleteCookie(SSO_LOGOUT_COOKIE);
  if (domain) deleteCookie(SSO_LOGOUT_COOKIE, domain);
}

/**
 * Set a cookie with subdomain support
 */
export function setCookie(name: string, value: string, days: number = 7, domain?: string): void {
  if (typeof document === "undefined") return;

  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }

  const domainString = domain ? `; domain=${domain}` : "";
  const secure =
    window.location.protocol === "https:" ? "; Secure" : "";
  const encoded = encodeURIComponent(value || "");
  document.cookie =
    name +
    "=" +
    encoded +
    expires +
    "; path=/" +
    domainString +
    "; SameSite=Lax" +
    secure;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, domain?: string): void {
  if (typeof document === "undefined") return;

  const domainString = domain ? `; domain=${domain}` : "";
  const secure =
    window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    name +
    "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC" +
    domainString +
    "; SameSite=Lax" +
    secure;
}

/**
 * Get all auth-related cookies
 */
export function getAuthCookies() {
  return {
    access_token: getCookie('access_token'),
    refresh_token: getCookie('refresh_token'),
    user_id: getCookie('user_id'),
  };
}
