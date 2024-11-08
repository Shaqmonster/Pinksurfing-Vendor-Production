import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

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
      if (response.status < 205 && response.data.vendor_id) {
        const { email, password } = payload;
        const tokenResponse = await axios.post(
          `https://auth.pinksurfing.com/api/token/`,
          { email, password }
        );
        const token = tokenResponse.data;
        data = { ...token, vendor_id: response.data.vendor_id };
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
      { email }
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
      payload
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
