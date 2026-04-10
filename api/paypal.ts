import axios, { AxiosError } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

function authHeader(token: string) {
  return {
    Authorization: `Bearer ${token.replaceAll('"', "")}`,
    "Content-Type": "application/json",
  };
}

/**
 * POST /api/payments/paypal/onboarding-link/{vendor_id}/
 * Returns { action_url } for PayPal Partner Referral (vendor connects account).
 */
export async function postPayPalOnboardingLink(token: string, vendorId: string) {
  const res = await axios.post(
    `${BASE_URL}/payments/paypal/onboarding-link/${vendorId}/`,
    {},
    { headers: authHeader(token) }
  );
  return res.data as { action_url?: string; error?: string };
}

export function getPayPalErrorMessage(err: unknown): string {
  const ax = err as AxiosError<{ error?: string }>;
  const d = ax.response?.data;
  if (typeof d === "object" && d && "error" in d && typeof (d as { error: string }).error === "string") {
    return (d as { error: string }).error;
  }
  return ax.message || "Something went wrong";
}
