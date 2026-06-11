import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { getAccessToken } from "@/utils/cookies";
import {
  ensureSession,
  persistAuthSession,
  signOut,
} from "@/utils/ssoSession";
import { resolveVendorApiToken, vendorAuthHeaders, getVendorId } from "@/utils/vendorAuth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export {
  ensureSession,
  signOut,
  getAccessToken,
  persistAuthSession,
  resolveVendorApiToken,
  vendorAuthHeaders,
  getVendorId,
};
/** @deprecated Use ensureSession() */
export const resolveSharedSession = ensureSession;

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
          { email, password },
          { withCredentials: true }
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

async function resolveVendorLoginAfterSso(access: string, refresh?: string) {
  const headers = { Authorization: `Bearer ${access}` };

  try {
    const checkVendorResponse = await axios.post(
      `${BASE_URL}/vendor/check-vendor/`,
      {},
      { headers }
    );
    if (checkVendorResponse.status === 409) {
      return { status: 409, message: "Vendor needs to register", token: access, refresh };
    }
  } catch (checkVendorError: any) {
    if (checkVendorError?.response?.status === 409) {
      return {
        status: 409,
        message: "Vendor needs to register",
        token: access,
        refresh,
      };
    }
    if (checkVendorError?.response?.status === 401 || checkVendorError?.response?.status === 403) {
      const detail =
        checkVendorError?.response?.data?.detail ||
        "Marketplace API rejected your login token.";
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

  persistAuthTokens(access, refresh, vendorId);
  return { ...profile, id: vendorId, token: access, refresh };
}

export async function signInWithSsoTokens(access: string, refresh?: string) {
  try {
    return await resolveVendorLoginAfterSso(access, refresh);
  } catch (err: any) {
    console.error("signInWithSsoTokens failed:", err?.response?.data || err);
    return err?.response?.data ?? { error: "An error occurred" };
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
    return await resolveVendorLoginAfterSso(access, refresh);
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
  persistAuthSession(access, refresh, vendorId, userId);
}
