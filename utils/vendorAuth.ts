import { getAccessToken } from "@/utils/cookies";
import { getOrRefreshAccessToken } from "@/utils/ssoSession";

/** Strip quotes/whitespace from a bearer token string. */
export function normalizeBearerToken(
  token: string | null | undefined
): string | null {
  if (!token) return null;
  const t = token.replaceAll('"', "").trim();
  return t || null;
}

/** Sync auth headers for marketplace API calls (localStorage + cookies). */
export function vendorAuthHeaders(
  token?: string | null
): Record<string, string> | null {
  const bearer = normalizeBearerToken(token ?? getAccessToken());
  if (!bearer) return null;
  return { Authorization: `Bearer ${bearer}` };
}

/** Token for vendor API calls — refreshes proactively when near expiry. */
export async function resolveVendorApiToken(): Promise<string | null> {
  return normalizeBearerToken(await getOrRefreshAccessToken());
}

export function getVendorId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vendor_id");
}
