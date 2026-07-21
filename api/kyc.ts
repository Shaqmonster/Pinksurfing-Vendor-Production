import axios from "axios";

const SSO_URL =
  process.env.NEXT_PUBLIC_AUTH_URL || "https://auth.pinksurfing.com";

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

/** GET /api/kyc/status/ */
export async function getKycStatus(token: string) {
  const response = await axios.get(`${SSO_URL}/api/kyc/status/`, {
    headers: authHeader(token),
  });
  return { success: true, data: response.data };
}

/** GET /api/user/ */
export async function getSsoUser(token: string) {
  const response = await axios.get(`${SSO_URL}/api/user/`, {
    headers: authHeader(token),
  });
  return { success: true, data: response.data };
}

/** POST /api/kyc/launch/ */
export async function launchKyc(token: string, returnUrl: string) {
  const response = await axios.post(
    `${SSO_URL}/api/kyc/launch/`,
    { return_url: returnUrl },
    {
      headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
      },
    }
  );
  return { success: true, data: response.data };
}

export function identityVerifyPath(returnUrl = "/dashboard") {
  const params = new URLSearchParams({ returnUrl });
  return `/identity/verify?${params.toString()}`;
}
