import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");

export type SquareHubStatus = {
  connected: boolean;
  merchantId?: string | null;
  locationId?: string | null;
  currency?: string | null;
  oauthEnv?: string | null;
};

/** GET /api/integrations/square/status/ */
export async function getSquareStatus(token: string): Promise<SquareHubStatus> {
  const response = await axios.get(`${BASE_URL}/integrations/square/status/`, {
    headers: {
      Authorization: `Bearer ${token.replaceAll('"', "")}`,
    },
  });
  return response.data;
}

/** POST /api/integrations/square/connect-session/ → one-time connect URL */
export async function mintSquareConnectSession(
  token: string,
  product: "vendor" | "paychat" | "gighub" = "vendor"
): Promise<{ url: string; expiresAt?: string }> {
  const response = await axios.post(
    `${BASE_URL}/integrations/square/connect-session/`,
    { product },
    {
      headers: {
        Authorization: `Bearer ${token.replaceAll('"', "")}`,
      },
    }
  );
  return response.data;
}

/** @deprecated Use mintSquareConnectSession + popup */
export async function getSquareOnboardingUrl(token: string, _vendorId?: string) {
  try {
    const data = await mintSquareConnectSession(token, "vendor");
    return { action_url: data.url, url: data.url };
  } catch (error) {
    console.error("Error fetching Square onboarding URL:", error);
    throw error;
  }
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
