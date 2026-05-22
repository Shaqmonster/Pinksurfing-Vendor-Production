import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export async function getIdentityStatus(token: string, context?: string) {
  const response = await axios.get(`${BASE_URL}/identity/status/`, {
    headers: authHeader(token),
    params: context ? { context } : undefined,
  });
  return { success: true, data: response.data };
}

export async function createIdentitySession(
  token: string,
  context: string,
  callbackUrl: string
) {
  const response = await axios.post(
    `${BASE_URL}/identity/session/`,
    { context, callback_url: callbackUrl },
    {
      headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
      },
    }
  );
  return { success: true, data: response.data };
}

export function identityVerifyPath(context = "vendor", returnUrl = "/dashboard") {
  const params = new URLSearchParams({ context, returnUrl });
  return `/identity/verify?${params.toString()}`;
}
