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

/** Access token: cookie first, then localStorage (cookies often missing on vendor host). */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromCookie = getCookie("access_token");
  if (fromCookie) return fromCookie.replaceAll('"', "");
  const fromStorage =
    localStorage.getItem("access") ?? localStorage.getItem("access_token");
  if (fromStorage) return fromStorage.replaceAll('"', "");
  return null;
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

const LOGOUT_GUARD_KEY = "ps_sso_logout_at";
const SSO_LOGOUT_COOKIE = "ps_sso_logged_out";

export function markSsoLoggedOut(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LOGOUT_GUARD_KEY, String(Date.now()));
  setCookie(SSO_LOGOUT_COOKIE, "1", 1 / 24); // ~1 hour
  const domain = getAuthCookieDomain();
  if (domain) setCookie(SSO_LOGOUT_COOKIE, "1", 1 / 24, domain);
}

/** @deprecated */
export const markVendorLoggedOut = markSsoLoggedOut;

export function clearSsoLoggedOutFlag(): void {
  if (typeof window === "undefined") return;
  deleteCookie(SSO_LOGOUT_COOKIE);
  const domain = getAuthCookieDomain();
  if (domain) deleteCookie(SSO_LOGOUT_COOKIE, domain);
}

export function isSsoLoggedOutGlobally(): boolean {
  return getCookie(SSO_LOGOUT_COOKIE) === "1";
}

/** Skip SSO cookie bootstrap briefly after explicit logout (same tab). */
export function shouldSkipSsoBootstrap(): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(LOGOUT_GUARD_KEY);
  if (!raw) return false;
  const elapsed = Date.now() - Number(raw);
  if (elapsed > 5 * 60 * 1000) {
    sessionStorage.removeItem(LOGOUT_GUARD_KEY);
    return false;
  }
  return true;
}

export function clearVendorLogoutGuard(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LOGOUT_GUARD_KEY);
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
