import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

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
        data = { ...token, vendor_id: response.data.vendor_id };
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

      return { ...vendorProfile.data, token: access, refresh };
    } else {
      return response.data;
    }
  } catch (err) {
    console.error(err);
    return err.response ? err.response.data : { error: "An error occurred" };
  }
}

export async function getProfile(token: string | null) {
  let res = await axios
    .get(`${BASE_URL}/vendor/profile/`, {
      headers: {
        Authorization: `Bearer ${token?.replaceAll('"', "")}`,
      },
    })
    .then((response) => response)
    .catch((error) => error);
  return res;
}

export async function isVendor(token: string) {
  try {
    const response = await axios.get(`${BASE_URL}/vendor/is-vendor/`, {
      headers: {
        Authorization: `Bearer ${token.replaceAll('"', "")}`,
      },
    });
    return { success: response.data.is_vendor };
  } catch (error: any) {
    // If 404 or 403, user is not a vendor
    if (error?.response?.status === 404 || error?.response?.status === 403 || error?.response?.status === 409) {
      return { success: true, isVendor: false, error: error.response?.data };
    }
    // Other errors
    console.error("Error checking vendor status:", error);
    return { success: false, isVendor: false, error };
  }
}
