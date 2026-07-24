import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "";

/** Hosted page origin (strip trailing /api). */
function ecommerceOrigin(): string {
  return BASE_URL.replace(/\/api\/?$/, "") || "https://ecommerceapi.pinksurfing.com";
}

export type SquareHubStatus = {
  connected: boolean;
  merchantId?: string | null;
  locationId?: string | null;
  currency?: string | null;
  oauthEnv?: string | null;
};

/** KYC-style: open hosted Connect page — no connect-session API from the browser. */
export function buildSquareConnectPageUrl(
  token: string,
  product: "vendor" | "paychat" | "gighub" = "vendor"
): string {
  const qs = new URLSearchParams({
    product,
    access_token: token.replaceAll('"', ""),
  });
  return `${ecommerceOrigin()}/integrations/square/connect/?${qs.toString()}`;
}

export function openSquareConnectPage(
  token: string,
  product: "vendor" | "paychat" | "gighub" = "vendor"
): Window | null {
  return window.open(
    buildSquareConnectPageUrl(token, product),
    "ps-square-connect",
    "width=560,height=720"
  );
}

/** GET status via ecommerce API (Vendor dashboard already uses this origin). */
export async function getSquareStatus(token: string): Promise<SquareHubStatus> {
  const response = await axios.get(`${BASE_URL}/integrations/square/status/`, {
    headers: {
      Authorization: `Bearer ${token.replaceAll('"', "")}`,
    },
  });
  return response.data;
}

/** @deprecated Prefer openSquareConnectPage */
export async function mintSquareConnectSession(
  token: string,
  product: "vendor" | "paychat" | "gighub" = "vendor"
): Promise<{ url: string; expiresAt?: string }> {
  return { url: buildSquareConnectPageUrl(token, product), expiresAt: "" };
}

/** @deprecated */
export async function getSquareOnboardingUrl(token: string, _vendorId?: string) {
  return { action_url: buildSquareConnectPageUrl(token, "vendor") };
}

export async function pollSquareConnected(
  token: string,
  opts?: { intervalMs?: number; timeoutMs?: number }
): Promise<SquareHubStatus> {
  const intervalMs = opts?.intervalMs ?? 2000;
  const timeoutMs = opts?.timeoutMs ?? 5 * 60 * 1000;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const status = await getSquareStatus(token);
    if (status.connected) return status;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Timed out waiting for Square connection");
}
