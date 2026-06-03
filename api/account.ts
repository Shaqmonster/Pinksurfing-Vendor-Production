import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import {
  getAccessToken,
  getRefreshToken,
  getCookie,
  getAuthCookieDomain,
  setCookie,
  clearAuthStorage,
  markVendorLoggedOut,
  clearVendorLogoutGuard,
  shouldSkipSsoBootstrap,
} from "@/utils/cookies";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function isCustomer(email: string) {
  try {
    const response = await axios.post(`${BASE_URL}/customer/is-customer/`, {
      email,
    });
    console.log("Customer Status Response:", response);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error checking customer status:", error);
    return { success: false, error };
  }
}

export async function customerLogin(email: string, password: string) {
  try {
    const response = await axios.post(
      `https://auth.pinksurfing.com/api/token/`,
      {
        email,
        password,
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error during customer login:", error);
    return { success: false, error };
  }
}

export async function customerVendorRegistration(token: string, payload: any) {
  const formData = new FormData();
  Object.keys(payload).forEach((key) => {
    if (key === "shop_image" && payload[key]) {
      formData.append(key, payload[key]);
    } else if (payload[key]) {
      formData.append(key, payload[key]);
    }
  });

  try {
    const response = await axios.post(
      `${BASE_URL}/vendor/customer-vendor-registration/`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error during customer-vendor registration:", error);
    return { success: false, error };
  }
}

/** @deprecated Use signOut() */
export async function logout(token: string) {
  return signOut(token);
}

/** Ends vendor session locally and on auth (clears shared HttpOnly SSO cookies). */
export async function signOut(explicitToken?: string | null) {
  const access = explicitToken ?? getAccessToken();
  const refresh = getRefreshToken();

  markVendorLoggedOut();

  try {
    await axios.post(
      "https://auth.pinksurfing.com/api/logout/",
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

  clearAuthStorage();
}

export async function getOnboardingUrl(token: string) {
  try {
    const response = await axios.get(`${BASE_URL}/vendor/get-onboarding-url/`, {
      headers: {
        Authorization: `Bearer ${token.replaceAll('"', "")}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching onboarding URL:", error);
    throw error;
  }
}

export async function refreshToken(token: string, refresh: string) {
  try {
    const response = await axios.post(
      `https://auth.pinksurfing.com/api/token/refresh/`,
      { refresh },
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}

/**
 * When the user signed in on pinksurfing.com, auth sets HttpOnly cookies on
 * .pinksurfing.com. JS cannot read them — exchange the refresh cookie for tokens.
 */
export function getJwtUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(
      atob(part.replace(/-/g, "+").replace(/_/g, "/"))
    );
    const id = (json as { user_id?: string; sub?: string }).user_id ?? (json as { sub?: string }).sub;
    return id != null ? String(id) : null;
  } catch {
    return null;
  }
}

export async function bootstrapAccessFromSsoCookies(): Promise<{
  access: string;
  refresh?: string;
} | null> {
  if (shouldSkipSsoBootstrap()) return null;
  try {
    const response = await axios.post(
      "https://auth.pinksurfing.com/api/token/refresh/",
      {},
      { withCredentials: true }
    );
    const access = response.data?.access;
    if (!access) return null;
    return { access, refresh: response.data?.refresh };
  } catch {
    return null;
  }
}

/** SSO cookies first — avoids stale vendor-only localStorage showing another user. */
export async function resolveSharedSession(): Promise<{
  access: string;
  refresh?: string;
} | null> {
  if (shouldSkipSsoBootstrap()) return null;

  const previous = getAccessToken();
  const boot = await bootstrapAccessFromSsoCookies();

  if (boot?.access) {
    const prevUid = getJwtUserId(previous);
    const bootUid = getJwtUserId(boot.access);
    if (previous && prevUid && bootUid && prevUid !== bootUid) {
      clearAuthStorage();
    }
    persistAuthTokens(boot.access, boot.refresh);
    return boot;
  }

  const cookieAccess = getCookie("access_token");
  if (cookieAccess) {
    return {
      access: cookieAccess.replaceAll('"', ""),
      refresh: getRefreshToken() ?? undefined,
    };
  }

  const stored =
    localStorage.getItem("access") ?? localStorage.getItem("access_token");
  if (stored) {
    return {
      access: stored.replaceAll('"', ""),
      refresh: getRefreshToken() ?? undefined,
    };
  }

  return null;
}

export async function signUp(payload: any) {
  const formData = new FormData();
  Object.keys(payload).forEach((key) => {
    if (key === "shop_image" || key === "profile_pic") {
      formData.append(key, payload[key]);
    } else {
      formData.append(key, payload[key]);
    }
  });

  let res = await axios
    .post(`${BASE_URL}/vendor/create-account/`, formData)
    .then(async (response: any) => {
      let data: any = {};
      console.log("Sign Up Response:", response);
      if (response.status < 205 && response.data.vendor_id) {
        const { email, password } = payload;
        const tokenResponse = await axios.post(
          `https://auth.pinksurfing.com/api/token/`,
          { email, password }
        );
        const token = tokenResponse.data;
        data = {
          ...token,
          vendor_id: response.data.vendor_id,
          kyc_required: response.data.kyc_required,
          kyc: response.data.kyc,
        };
        console.log("Token fetched after sign up:", data);
      } else {
        data = response.data;
      }
      return data;
    })
    .catch((err) => {
      console.error("Error during sign up:", err);
      return err;
    });

  console.log(res);
  return res;
}

export async function createVendorFromSSO(payload: any) {
  const formData = new FormData();
  Object.keys(payload).forEach((key) => {
    formData.append(key, payload[key]);
  });

  try {
    const response = await axios.post(
      `${BASE_URL}/vendor/create-vendor-from-sso/`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${payload.token}`,
        },
      }
    );

    const result = {
      ...response.data,
      token: payload.token
    };

    return result;
  } catch (err) {
    console.error("Error during vendor creation from SSO:", err);
    return err.response ? err.response.data : { error: "An error occurred" };
  }
}

export async function sendOtp(email: any) {
  try {
    const response = await axios.post(
      "https://auth.pinksurfing.com/api/send-otp/",
      { email ,
        new_register: "yes"
      }
    );
    return { success: true, message: response.data.message };
  } catch (error : any) {
    console.log(error)
    if (error.response) {
      return {
        success: false,
        message: error.response?.data?.Error || error.response?.data?.message || "An error occurred",
      };
    }
    return { success: false, message: "Failed to send OTP due to network error" };
  }
}

export async function signIn(payload: { email: string; password: string }) {
  try {
    const response = await axios.post(
      `https://auth.pinksurfing.com/api/token/`,
      payload,
      { withCredentials: true }
    );

    if (response.status >= 205 || !response.data?.access) {
      return response.data;
    }

    const { access, refresh } = response.data;
    const headers = { Authorization: `Bearer ${access}` };

    try {
      const checkVendorResponse = await axios.post(
        `${BASE_URL}/vendor/check-vendor/`,
        {},
        { headers }
      );
      if (checkVendorResponse.status === 409) {
        return { status: 409, message: "Vendor needs to register", token: access };
      }
    } catch (checkVendorError: any) {
      if (checkVendorError?.response?.status === 409) {
        return {
          status: 409,
          message: "Vendor needs to register",
          token: access,
        };
      }
      if (checkVendorError?.response?.status === 401 || checkVendorError?.response?.status === 403) {
        const detail = checkVendorError?.response?.data?.detail || "Marketplace API rejected your login token.";
        return { error: true, message: detail, detail };
      }
      throw checkVendorError;
    }

    const vendorProfile = await axios.get(`${BASE_URL}/vendor/profile/`, { headers });
    const profile = vendorProfile.data;
    const vendorId = profile?.id ?? profile?.pk;

    if (!vendorId) {
      return {
        error: true,
        message: "Vendor profile could not be loaded. Please try again or contact support.",
      };
    }

    clearVendorLogoutGuard();
    persistAuthTokens(access, refresh, vendorId);
    return { ...profile, id: vendorId, token: access, refresh };
  } catch (err: any) {
    console.error("signIn failed:", err?.response?.data || err);
    if (err?.response?.status === 401) {
      return { message: "Invalid email or password" };
    }
    return err?.response?.data ?? { error: "An error occurred" };
  }
}

export async function getProfile(token: string | null) {
  if (!token) {
    return { ok: false as const, data: null, status: 0 };
  }
  try {
    const response = await axios.get(`${BASE_URL}/vendor/profile/`, {
      headers: {
        Authorization: `Bearer ${token.replaceAll('"', "")}`,
      },
    });
    return { ok: true as const, data: response.data, status: response.status };
  } catch (error: any) {
    return {
      ok: false as const,
      data: null,
      status: error?.response?.status ?? 0,
      error: error?.response?.data,
    };
  }
}

/** @deprecated Use resolveVendorSession — kept for callers expecting Axios-shaped errors */
export async function isVendor(token: string) {
  const session = await resolveVendorSession(token);
  return {
    success: session.isVendor,
    isVendor: session.isVendor,
    unauthorized: session.unauthorized,
    error: session.error,
  };
}

/**
 * Validates SSO token, confirms vendor record, loads profile, persists vendor_id.
 */
export async function resolveVendorSession(token: string | null) {
  if (!token) {
    return { ok: false, isVendor: false, unauthorized: false, profile: null as any };
  }

  const bearer = token.replaceAll('"', "");
  const headers = { Authorization: `Bearer ${bearer}` };

  try {
    const profileRes = await axios.get(`${BASE_URL}/vendor/profile/`, { headers });
    const profile = profileRes.data;
    const vendorId = profile?.id ?? profile?.pk;

    if (vendorId && typeof window !== "undefined") {
      localStorage.setItem("vendor_id", String(vendorId));
      localStorage.setItem("access", bearer);
    }

    return {
      ok: true,
      isVendor: Boolean(vendorId),
      unauthorized: false,
      profile: vendorId ? { ...profile, id: vendorId } : null,
    };
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      return {
        ok: false,
        isVendor: false,
        unauthorized: true,
        profile: null,
        error: error?.response?.data,
      };
    }
    if (status === 404) {
      return { ok: true, isVendor: false, unauthorized: false, profile: null };
    }

    try {
      const check = await axios.post(`${BASE_URL}/vendor/check-vendor/`, {}, { headers });
      if (check.status === 200) {
        const profileRes = await axios.get(`${BASE_URL}/vendor/profile/`, { headers });
        const profile = profileRes.data;
        const vendorId = profile?.id ?? profile?.pk;
        if (vendorId && typeof window !== "undefined") {
          localStorage.setItem("vendor_id", String(vendorId));
          localStorage.setItem("access", bearer);
        }
        return {
          ok: true,
          isVendor: Boolean(vendorId),
          unauthorized: false,
          profile: vendorId ? { ...profile, id: vendorId } : null,
        };
      }
    } catch {
      /* fall through */
    }

    console.error("Error resolving vendor session:", error);
    return {
      ok: false,
      isVendor: false,
      unauthorized: false,
      profile: null,
      error,
    };
  }
}

export function persistAuthTokens(
  access: string,
  refresh?: string,
  vendorId?: string | number | null,
  userId?: string | number | null
) {
  if (typeof window === "undefined") return;

  clearVendorLogoutGuard();
  localStorage.setItem("access", access);
  localStorage.setItem("access_token", access);
  if (refresh) {
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("refresh_token", refresh);
  }
  if (vendorId != null) localStorage.setItem("vendor_id", String(vendorId));

  // Host-only cookie always works on the current vendor origin.
  setCookie("access_token", access, 7);
  if (refresh) setCookie("refresh_token", refresh, 7);

  const sharedDomain = getAuthCookieDomain();
  if (sharedDomain) {
    setCookie("access_token", access, 7, sharedDomain);
    if (refresh) setCookie("refresh_token", refresh, 7, sharedDomain);
    const cookieUserId = userId ?? vendorId;
    if (cookieUserId != null) {
      setCookie("user_id", String(cookieUserId), 7, sharedDomain);
    }
  }
}

export { getAccessToken };
