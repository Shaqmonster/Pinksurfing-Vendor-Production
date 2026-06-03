import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { setCookie } from "@/utils/cookies";

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

export async function logout(token: string) {
  try {
    const response = await axios.post(
      `https://auth.pinksurfing.com/api/logout/`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error during logout:", error);
    return { success: false, error };
  }
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
      `https://auth.pinksurfing.com/api/token/refresh`,
      {
        refresh,
      },
      {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', "")}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching onboarding URL:", error);
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

export async function signIn(payload: any) {
  try {
    const response = await axios.post(
      `https://auth.pinksurfing.com/api/token/`,
      payload,
      { withCredentials: true }
    );

    if (response.status < 205 && response.data.access) {
      const { access, refresh } = response.data;

      try {
        const checkVendorResponse = await axios.post(
          `${BASE_URL}/vendor/check-vendor/`,
          null,
          {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          }
        );

        if (checkVendorResponse.status === 409) {
          return {
            status: 409,
            message: "Vendor needs to register",
          };
        }
      } catch (checkVendorError) {
        if (checkVendorError?.response?.status === 409) {
          return {
            status: 409,
            message: "Vendor needs to register",
            token: access,
          };
        } else {
          throw checkVendorError;
        }
      }

      const vendorProfile = await axios.get(`${BASE_URL}/vendor/profile/`, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      const profile = vendorProfile.data;
      if (typeof window !== "undefined" && profile?.id) {
        persistAuthTokens(access, refresh, profile.id);
      }

      return { ...profile, token: access, refresh };
    } else {
      return response.data;
    }
  } catch (err) {
    console.error(err);
    return err.response ? err.response.data : { error: "An error occurred" };
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

  try {
    const vendorCheck = await axios.get(`${BASE_URL}/vendor/is-vendor/`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });

    if (!vendorCheck.data?.is_vendor) {
      return { ok: true, isVendor: false, unauthorized: false, profile: null };
    }

    const profileRes = await axios.get(`${BASE_URL}/vendor/profile/`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });

    if (profileRes.data?.id && typeof window !== "undefined") {
      localStorage.setItem("vendor_id", String(profileRes.data.id));
      localStorage.setItem("access", bearer);
    }

    return {
      ok: true,
      isVendor: true,
      unauthorized: false,
      profile: profileRes.data,
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
    if (status === 404 || status === 409) {
      return {
        ok: true,
        isVendor: false,
        unauthorized: false,
        profile: null,
        error: error?.response?.data,
      };
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

  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
  if (vendorId != null) localStorage.setItem("vendor_id", String(vendorId));

  const domain = window.location.hostname.includes("localhost")
    ? undefined
    : ".pinksurfing.com";

  setCookie("access_token", access, 7, domain);
  if (refresh) setCookie("refresh_token", refresh, 7, domain);
  const cookieUserId = userId ?? vendorId;
  if (cookieUserId != null) setCookie("user_id", String(cookieUserId), 7, domain);
}
