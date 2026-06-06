import { getAccessToken } from "@/utils/cookies";
import { ensureSession } from "@/utils/ssoSession";

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

/** Token for vendor API calls — stored session with SSO refresh fallback. */
export async function resolveVendorApiToken(): Promise<string | null> {
  const stored = normalizeBearerToken(getAccessToken());
  if (stored) return stored;
  const session = await ensureSession();
  return normalizeBearerToken(session?.access ?? getAccessToken());
}

export function getVendorId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vendor_id");
}
