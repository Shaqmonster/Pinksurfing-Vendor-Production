import axios from "axios";
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
    if (key === 'shop_image' || key === 'profile_pic') {
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
      console.error('Error during sign up:', err);
      return err;
    });

  console.log(res);
  return res;
}

export async function sendOtp(email: any) {
  try {
    const response = await axios.post(
      "https://auth.pinksurfing.com/api/send-otp/",
      { email }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
}

export async function signIn(payload: any) {
  let res = await axios
    .post(`https://auth.pinksurfing.com/api/token/`, payload)
    .then(async (response: any) => {
      let data = {};
      if (response.status < 205 && response.data.access) {
        let { access, refresh } = response.data;
        let vendor = await axios.get(`${BASE_URL}/vendor/profile/`, {
          headers: {
            Authorization: "Bearer " + access,
          },
        });
        data = { ...vendor, token: access, refresh };
      } else {
        data = response;
      }
      return data;
    })
    .catch((err) => err);
  console.log(res);
  return res;
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
